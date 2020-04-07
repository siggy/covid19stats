// dataMap: Name => Date => {date,state,fips,cases,deaths}
function initChart(dataMap, xAxisDates, chartId, filter, field, limit) {
  let yAxisTickValues = [100, 1000, 10000];

  // side effecting
  const updateYAxisLabels = function(yMax, yAxis) {
    yAxisTickValues = calculateYAxisLabels(yMax, yAxis);
  }

  const filterData = function(dataMap, filter) {
    if (filter === null) {
      return dataMap;
    }
    return new Map(
      [...dataMap].filter(([k,v]) => {
        return [...filter.entries()].some((filter) =>{
          if (filter[1].indexOf(v.values().next().value[filter[0]]) !== -1) {
            return true;
          }
        })
      })
    );
  }

  const sortData = function(dataMap, field) {
    return new Map(
      [...dataMap.entries()].sort(
        (a, b) =>
          Array.from(a[1])[a[1].size-1][1][field] - Array.from(b[1])[b[1].size-1][1][field]
      )
    );
  }

  const limitData = function(dataMap, limit) {
    if (limit === 0) {
      return new Map(
        [...dataMap.entries()].sort()
      );
    }
    return new Map(
      [...dataMap.entries()].slice(Math.max(dataMap.size - limit, 0)).sort()
    );
  }

  // dataMap should be filtered, sorted, and limited
  const updateChart = function(dataMap, field, limited) {
    // convert to columns
    const columns = [
      ['x'].concat(Array.from(xAxisDates))
    ];

    dataMap.forEach((dates, row) => {
      const column = [row];

      xAxisDates.forEach((date) => {
        const values = (dates.has(date)) ?
          dates.get(date)[field] :
          null
        column.push(values);
      })

      columns.push(column);
    });

    // figure out what's changing, in service to chart.load and yMax
    const toUnload = [];

    const loadedSet = new Set();
    c3Chart.data().forEach((row, _) => {
      loadedSet.add(row.id);
      if (limited && !dataMap.has(row.id)) {
        toUnload.push(row.id);
      }
    });

    const shownSet = new Set();
    c3Chart.data.shown().forEach((row, _) => {
      shownSet.add(row.id);
    });

    let yMax = 0;

    columns.slice(1).forEach((column, _) => {
      if (limited) {
        // TODO: we force-unload all data when we're limiting the number of
        // rows. this is a workaround to ensure the legend stays sorted.
        // figure out how to avoid this
        toUnload.push(column[0]);
      }
      // skip items that are:
      // loaded but hidden OR
      // not loaded but previously hidden
      if (
        (loadedSet.has(column[0]) && !shownSet.has(column[0])) ||
        (!loadedSet.has(column[0]) && c3Chart.internal.hiddenTargetIds.indexOf(column[0]) !== -1)
      ) {
        return;
      }

      column.slice(1).forEach((value, _) => {
        const i = parseInt(value);
        if (i > yMax) {
          yMax = i;
        }
      });
    });

    updateYAxisLabels(yMax, c3Chart.axis.types().y);

    c3Chart.load({
      columns: columns,
      unload: toUnload,
    });
  }

  const c3Chart = c3.generate({
    padding: {
      top: 10,
    },
    bindto: '#' + chartId,
    axis: {
      x: {
        // TODO: control start date dynamically, don't process earlier data
        // min: '2020-03-01',
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d',
        }
      },
      y: {
        inner: true,
        type: 'log',
        padding: 0,
        tick: {
          format: d3.format(",d"),
          values: () => yAxisTickValues,
        }
      },
    },
    data: {
      selection: {
        enabled: true
      },
      x: 'x',
      columns: [
        ['x'],
      ],
    },
    grid: {
      y: {
        show: true,
      }
    },
    point: {
      r: 2,
      focus: {
        expand: {
          r: 4,
        }
      },
    },
    tooltip: {
      grouped: false,
    },
    transition: {
      duration: 0,
    },
    zoom: {
      enabled: true,
      rescale: true,
    },
    legend: {
      item: {
        onclick: function(id) {
          c3Chart.toggle(id);
          updateYAxisLabels(getYMax(c3Chart), c3Chart.axis.types().y);
          c3Chart.flush();
        }
      }
    },
  });

  const chart = {
    field: field,
    limit: limit,
    dataMap: dataMap,
    dataMapFiltered: null,
    dataMapSorted: null,
    dataMapLimited: null,

    setFilter: function(filter) {
      this.dataMapFiltered = filterData(this.dataMap, filter);
      this.setField(this.field);
    },

    setField: function(field) {
      this.field = field;
      this.dataMapSorted = sortData(this.dataMapFiltered, this.field);
      this.setLimit(this.limit);
    },

    setLimit: function(limit) {
      this.limit = limit;
      this.dataMapLimited = limitData(this.dataMapSorted, this.limit);
      updateChart(this.dataMapLimited, this.field, this.limit !== 0);
    },

    setAxis: function(yAxis) {
      updateYAxisLabels(getYMax(c3Chart), yAxis);
      c3Chart.axis.types({
        y: yAxis,
      });
    },
  };

  // initial render
  chart.setFilter(filter);

  return chart;
}

function calculateYAxisLabels(yMax, yAxis) {
  const values = [];
  if (yAxis === 'log') {
    let mag = 1;
    let done = false;
    while (true) {
      [1,2,5].forEach((i=> {
        if (done) {
          return;
        }
        const yVal = i*mag;
        values.push(yVal);
        if (yVal > yMax) {
          done = true;
        }
      }));
      if (done) {
        break;
      }
      mag *= 10;
    }
    return values.slice(Math.max(values.length - 10, 0));
  } else if (yAxis === 'linear') {
    // start with the exact interval: (max / 10) = i
    // find intervalMultiplier bucket: i => 5 or 50 or 500...
    // select an interval within that bucket: 50 => 50 or 100 or 150...
    // 0   <= i < 5    // 1,   2,    3,    4...
    // 5   <= i < 50   // 5,   10,   15,   20,   25,   30,   35,   40,   45...
    // 50  <= i < 500  // 50,  100,  150,  200,  250,  300,  350,  400,  450...
    // 500 <= i < 5000 // 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500...
    const exactInterval = yMax/10;
    const intervalMultiplier = 10**Math.floor(Math.log10(exactInterval * 2)) / 2;
    const interval = intervalMultiplier*Math.ceil(exactInterval/intervalMultiplier);
    for (let i = interval; i < yMax+interval; i += interval) {
      values.push(i);
    }
    return values;
  }

  console.warn('Unknown yAxis type: ' + yAxis);
  return [];
}

function getYMax(c3Chart) {
  let yMax = 0;
  c3Chart.data.shown().forEach((row, _) => {
    row.values.forEach((value, _) => {
      if (value.value > yMax) {
        yMax = value.value;
      }
    });
  });
  return yMax;
}
