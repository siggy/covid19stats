// dataMap: Name => Date => {date,state,fips,cases,deaths}
// TODO: also render initial dataset?
function initChart(dataMap, xAxisDates, chartId) {
  let yAxisTickValues = [100, 1000, 10000];

  // dataMap, field, limit, and yAxisType are optional
  // field required if dataMap provided
  const updateChart = function(chart, dataMap, field, limit, yAxisType) {
    let yMax = 0;

    // TODO: push columns population down into `if (dataMap !== null) { ... chart.load`
    // TODO calculate yMax while populating `columns`
    const columns = [
      ['x'].concat(Array.from(xAxisDates))
    ];
    const toUnload = [];

    if (dataMap !== null) {
      // updating data
      const dataMapSorted = (limit !== 0) ?
        new Map(
          [...dataMap.entries()].sort(
            (a, b) =>
              Array.from(a[1])[a[1].size-1][1][field] - Array.from(b[1])[b[1].size-1][1][field]
          ).slice(Math.max(dataMap.size - limit, 0)).sort()
        ) :
        new Map([...dataMap.entries()].sort());

      dataMapSorted.forEach((dates, row) => {
        const column = [row];

        xAxisDates.forEach((date) => {
          const cases = (dates.has(date)) ?
            dates.get(date)[field] :
            null
          column.push(cases);
        })

        columns.push(column);
      });

      const loadedSet = new Set();
      chart.data().forEach((row, _) => {
        loadedSet.add(row.id);
        if (limit !== 0 && !dataMapSorted.has(row.id)) {
          toUnload.push(row.id);
        }
      });

      const shownSet = new Set();
      chart.data.shown().forEach((row, _) => {
        shownSet.add(row.id);
      });

      columns.slice(1).forEach((column, _) => {
        if (limit !== 0) {
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
          (!loadedSet.has(column[0]) && chart.internal.hiddenTargetIds.indexOf(column[0]) !== -1)
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
    } else {
      // updating axis
      chart.data.shown().forEach((row, _) => {
        row.values.forEach((value, _) => {
          if (value.value > yMax) {
            yMax = value.value;
          }
        });
      });
    }

    if (yAxisType === null) {
      yAxisType = chart.axis.types().y;
    }

    yAxisTickValues = calculateYAxisLabels(yMax, yAxisType);

    // force re-render
    if (dataMap !== null) {
      chart.load({
        columns: columns,
        unload: toUnload,
      });
    } else {
      chart.axis.types({
        y: yAxisType,
      });
    }
  }

  const chart = c3.generate({
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
          values: function () {
            return yAxisTickValues;
          }
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
        onclick: function (id) {
          chart.toggle(id);
          updateChart(chart, null, null, 0, null);
        }
      }
    },
  });

  return {
    setField: function(field, limit) {
      updateChart(chart, dataMap, field, limit, null);
    },

    setAxis: function(yAxis) {
      updateChart(chart, null, null, 0, yAxis);
    }
  };
}

function calculateYAxisLabels(yMax, yAxisType) {
  const values = [];
  if (yAxisType === 'log') {
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
  } else if (yAxisType === 'linear') {
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

  console.warn('Unknown yAxis type: ' + yAxisType);
  return [];
}
