// dataMap: Name => Date => {date,name,fips,cases,deaths}
const initChart = (options) => {
  const dataMap    = options.dataMap;
  const xAxisDates = options.xAxisDates;
  const chartId    = options.chartId;
  const filter     = options.filter;
  const field      = options.field;
  const limit      = options.limit;
  const normalized = options.normalized;
  const yAxis      = options.yAxis;

  // cycle through 3 states on legend click:
  // 1) focused
  // 2) hidden
  // 3) default
  let focusedIds = new Set();
  let mousedOverId = '';

  // side effecting
  const updateFocus = _ => {
    const tmpFocusedIds = new Set(focusedIds);
    if (mousedOverId !== '') {
      tmpFocusedIds.add(mousedOverId);
    }
    const focusedArr = Array.from(tmpFocusedIds);
    if (focusedArr.length === 0) {
      c3Chart.revert();
    } else {
      c3Chart.focus(focusedArr);
    }
  }

  let yAxisTickValues = [100, 1000, 10000];

  // side effecting
  const updateYAxisLabels = (yMax, yAxis) => {
    yAxisTickValues = calculateYAxisLabels(yMax, yAxis);
  }

  const focusLabel = (_, id, i, j) => {
    if (j === undefined || j.length-1 !== i) {
      return;
    }
    return id.padEnd(id.length*3, '\u00A0');
  }

  // side effecting
  const updateFocusedLabels = _ => {
    if (focusedIds.length === 0) {
      c3Chart.internal.config.data_labels = undefined;
      return;
    }

    const focusedLabels = {format: {}};
    focusedIds.forEach((focusedId) => {
      focusedLabels.format[focusedId] = focusLabel;
    });

    c3Chart.internal.config.data_labels = focusedLabels;
  }

  const filterData = (dataMap, filter) =>
    (filter === null) ?
      dataMap :
      new Map(
        [...dataMap].filter(([_,v]) =>
          [...filter.entries()].some(filter =>
            filter[1].has(v.values().next().value[filter[0]])
          )
        )
      );

  // sortData sorts items by most recent field value, secondary sort by name
  const sortData = (dataMap, field) =>
    new Map(
      [...dataMap.entries()].sort(
        (a, b) => {
          const aLast = Array.from(a[1])[a[1].size-1][1];
          const bLast = Array.from(b[1])[b[1].size-1][1];
          const aVal = aLast[field];
          const bVal = bLast[field];
          if (aVal !== bVal) {
            return aVal - bVal;
          }
          return aLast.name < bLast.name;
        }
      )
    );

  // limitData truncates items and then sorts by name
  const limitData = (dataMap, limit) =>
    (limit === 0) ?
      new Map([...dataMap.entries()].sort()) :
      new Map([...dataMap.entries()].slice(Math.max(dataMap.size - limit, 0)).sort());

  // dataMap should be filtered, sorted, and limited
  const updateChart = (dataMap, field, unload) => {
    // convert to columns
    const columns = [
      ['x'].concat(Array.from(xAxisDates))
    ];

    dataMap.forEach((dates, row) => {
      const column = [row];

      xAxisDates.forEach(date => {
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
      if (unload && !dataMap.has(row.id)) {
        toUnload.push(row.id);
      }
    });

    const shownSet = new Set();
    c3Chart.data.shown().forEach((row, _) => {
      shownSet.add(row.id);
    });

    let yMax = 0;

    columns.slice(1).forEach((column, _) => {
      if (unload) {
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
        type: yAxis,
        padding: 0,
        tick: {
          format: d3.format(",d"),
          values: _ => yAxisTickValues,
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
      labels: undefined, // dynamically populate in updateFocusedLabels()
    },
    grid: {
      y: {
        show: true,
      }
    },
    point: {
      r: 1,
      focus: {
        expand: {
          r: 3,
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
        onclick: id => {
          // focus => hide => show => focus
          if (focusedIds.has(id)) {
            // focus => hide
            focusedIds.delete(id);
            c3Chart.revert(id);
            c3Chart.toggle(id);
            updateYAxisLabels(getYMax(c3Chart), c3Chart.axis.types().y);

            updateFocusedLabels();
          } else if (c3Chart.internal.hiddenTargetIds.indexOf(id) !== -1) {
            // hide => show
            c3Chart.toggle(id);
            updateYAxisLabels(getYMax(c3Chart), c3Chart.axis.types().y);
          } else {
            // show => focus
            focusedIds.add(id);
            updateFocusedLabels();
          }
          updateFocus();
          c3Chart.flush();
          return false;
        },
        onmouseover: id => {
          mousedOverId = id;
          updateFocus();
          return false;
        },
        onmouseout: _ => {
          mousedOverId = '';
          updateFocus();
          return false;
        }
      }
    },
  });

  const chart = {
    normalized: normalized,
    field: field,
    limit: limit,
    dataMap: dataMap,
    dataMapFiltered: null,
    dataMapSorted: null,
    dataMapLimited: null,

    getNormalizedField() {
      return this.normalized ? this.field + "Per1M" : this.field;
    },

    // setFilter => setNormalized => setField => setLimit

    setFilter(filter) {
      this.dataMapFiltered = filterData(this.dataMap, filter);
      this.setNormalized(this.normalized, true);
    },

    setNormalized(normalized, unload) {
      this.normalized = normalized;
      this.setField(this.field, unload);
    },

    setNonNormalizedField(field) {
      this.normalized = false;
      this.setField(field, false);
    },

    setField(field, unload) {
      this.field = field;
      this.dataMapSorted = sortData(this.dataMapFiltered, this.getNormalizedField());
      this.setLimit(this.limit, unload);
    },

    setLimit(limit, unload) {
      // unload if:
      // limit !== 0 OR
      // limit is changing OR
      // filter is changing
      const forceUnload = (
        limit !== 0 ||
        limit !== this.limit ||
        unload
      )

      this.limit = limit;
      this.dataMapLimited = limitData(this.dataMapSorted, this.limit);
      updateChart(this.dataMapLimited, this.getNormalizedField(), forceUnload);
    },

    setAxis(yAxis) {
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

const calculateYAxisLabels = (yMax, yAxis) => {
  const values = [];
  if (yAxis === 'log') {
    let mag = 1;
    let done = false;
    while (true) {
      [1,2,5].forEach(i => {
        if (done) {
          return;
        }
        const yVal = i*mag;
        values.push(yVal);
        if (yVal > yMax) {
          done = true;
        }
      });
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

const getYMax = c3Chart => {
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
