// TODO: init at startup?
let chart;

// TODO: also render initial dataset?
function initChart(chartId) {
  chart = c3.generate({
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
          values: [
            1, 2, 5,
            10, 20, 50,
            100, 200, 500,
            1000, 2000, 5000,
            10000, 20000, 50000,
            100000, 200000, 500000,
          ]
        }
      },
    },
    data: {
      x: 'x',
      columns:  [
        ['x'],
      ],
    },
    grid: {
      y: {
        show: true,
      }
    },
    tooltip: {
      grouped: false,
    },
    transition: {
      duration: 0,
    },
    // TODO: https://github.com/c3js/c3/issues/2501#issuecomment-506654992
    // zoom: {
    //   enabled: true,
    //   rescale: true,
    //   type: 'drag',
    // }
  });
}

function updateChart(statesToDates, xAxisDates, field) {
  // TODO: make this not possible
  if (chart === undefined) {
    return;
  }

  columns = [
    ['x'].concat(Array.from(xAxisDates))
  ];

  const statesToDatesSorted = new Map([...statesToDates.entries()].sort());
  statesToDatesSorted.forEach((dates, state) => {
    column = [state];

    xAxisDates.forEach((date) => {
      cases = (dates.has(date)) ?
        dates.get(date)[field] :
        null
      column.push(cases);
    })

    columns.push(column);
  });

  chart.load({
    columns: columns,
  });
}
