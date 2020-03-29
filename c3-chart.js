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

  statesToDates.forEach((dates, state) => {
    column = [state];

    allDates.forEach((date) => {
      cases = (dates.has(date)) ?
        dates.get(date)[3] :
        null
      column.push(cases);
    })

    columns.push(column);
  });

  const chart = c3.generate({
    bindto: '#c3-chart',
    data: {
      x: 'x',
      columns: columns,
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y/%m/%d'
        }
      },
      y: {
        type: 'log',
        padding: 0,
        tick: {
          format: function (d) { return Math.round(d); }
        }
      },
    },
    interaction: {
      enabled: true
    },
    legend: {
      hide: true
    },
    transition: {
      duration: 0
    },
    tooltip: {
      grouped: false
    },
  });
}
