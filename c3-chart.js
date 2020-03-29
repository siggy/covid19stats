function makeChart(stateCases) {
  // complete, unique set of dates
  const allDates = new Set();

  // State => Date => "date,state,fips,cases,deaths"
  const statesToDates = new Map();

  // handle some states not having today's data in github.com/nytimes/covid-19-data
  stateCases.forEach((line) => {
    const row = line.split(',');
    const date = row[0];
    const name = row[1];
    const fips = row[2];
    const cases = row[3];
    const deaths = row[4];

    allDates.add(date);

    if (!statesToDates.has(name)) {
      statesToDates.set(name, new Map());
    }
    if (statesToDates.get(name).has(date)) {
      console.warn('duplicate date found for state: ' + name + ' => ' + date);
    }
    statesToDates.get(name).set(date, row);
  });

  columns = [
    ['x'].concat(Array.from(allDates))
  ];

  const statesToDatesSorted = new Map([...statesToDates.entries()].sort());
  statesToDatesSorted.forEach((dates, state) => {
    column = [state];

    allDates.forEach((date) => {
      cases = (dates.has(date)) ?
        dates.get(date)[3] : // TODO: switch this out for other fields
        null
      column.push(cases);
    })

    columns.push(column);
  });

  const chart = c3.generate({
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
    bindto: '#c3-chart',
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
