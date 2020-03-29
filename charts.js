function makeChart(statesToDates, allDates, field, chartId) {
  columns = [
    ['x'].concat(Array.from(allDates))
  ];

  const statesToDatesSorted = new Map([...statesToDates.entries()].sort());
  statesToDatesSorted.forEach((dates, state) => {
    column = [state];

    allDates.forEach((date) => {
      cases = (dates.has(date)) ?
        dates.get(date)[field] :
        null
      column.push(cases);
    })

    columns.push(column);
  });

  const chart = c3.generate({
    bindto: '#' + chartId,
    axis: {
      x: {
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
      columns: columns,
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
