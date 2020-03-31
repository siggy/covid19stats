function makeTables(statesLatestDay, stateHeaders, popsByFips, countyCases) {

  // states

  const hotStates = new Handsontable(document.getElementById('states-table'), {
    data: statesLatestDay,
    // TODO: must match stateHeaders
    columns: [
      { data: 'date', type: 'date'},
      { data: 'name', type: 'text'},
      { data: 'fips', type: 'numeric'},
      { data: 'cases', type: 'numeric'},
      { data: 'deaths', type: 'numeric'},
      { data: 'newCases', type: 'numeric'},
      { data: 'newDeaths', type: 'numeric'},
      { data: 'population', type: 'numeric'},
      { data: 'casesPer1M', type: 'numeric'},
      { data: 'deathsPer1M', type: 'numeric'},
      { data: 'tests', type: 'numeric'},
      { data: 'pending', type: 'numeric'},
      {
        data: 'positiveTestPercent',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00%'
        }
      },
      { data: 'testsPer1M', type: 'numeric'},
      { data: 'testsPerDeath', type: 'numeric'},
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 3},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
        {label: 'tests', colspan: 5},
      ],
      stateHeaders,
    ],
    hiddenColumns: {
      columns: [0, 2], // date, fips
    },
    dropdownMenu: true,
    filters: true,
    height: '90vh',
    width: '90vw',
    licenseKey: 'non-commercial-and-evaluation',
    multiColumnSorting: {
      indicator: true,
    },
  });
  const statesExportBtn = document.getElementById('states-export');
  const statesExportPlugin = hotStates.getPlugin('exportFile');
  statesExportBtn.addEventListener('click', function() {
    statesExportPlugin.downloadFile('csv', {
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      filename: 'covid19stats-states-[YYYY]-[MM]-[DD]',
    });
  });

  // counties

  const colHeaders = countyCases.shift().split(',');
  colHeaders.push('population');
  colHeaders.push('cases/1M');
  colHeaders.push('deaths/1M');

  const rowsByDate = new Map();
  countyCases.forEach((line) => {
    const row = line.split(',');
    if (!rowsByDate.has(row[0])) {
      rowsByDate.set(row[0], [])
    }
    rowsByDate.get(row[0]).push(row);
  });

  const latestDay = [];
  Array.from(rowsByDate)[rowsByDate.size-1][1].forEach((county) => {
    const name = county[1];
    const fips = county[3];
    if (name === 'Unknown')  {
      return;
    }

    if (fips !== '' && popsByFips.has(fips)) {
      const pop = popsByFips.get(fips);
      const popPer1M = pop / 1000000;

      county.push(popsByFips.get(fips));
      county.push(Math.round(county[4] / popPer1M));
      county.push(Math.round(county[5] / popPer1M));

      latestDay.push(county);
    } else if (name === 'New York City') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      const pop =
        popsByFips.get('36005') + // Bronx
        popsByFips.get('36047') + // Kings
        popsByFips.get('36061') + // New York
        popsByFips.get('36081') + // Queens
        popsByFips.get('36085');  // Richmond
      const popPer1M = pop / 1000000;

      county.push(pop);
      county.push(Math.round(county[4] / popPer1M));
      county.push(Math.round(county[5] / popPer1M));

      latestDay.push(county);
    } else if (name === 'Kansas City') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      const pop = 488943;
      const popPer1M = pop / 1000000;

      county.push(pop);
      county.push(Math.round(county[4] / popPer1M));
      county.push(Math.round(county[5] / popPer1M));

      latestDay.push(county);
    } else {
      console.warn('not found: ' + county);
    }
  });

  const hotCounties = new Handsontable(document.getElementById('counties-table'), {
    data: latestDay,
    // TODO: must match colHeaders
    columns: [
      { type: 'date'},    // date
      { type: 'text'},    // county
      { type: 'text'},    // state
      { type: 'numeric'}, // fips
      { type: 'numeric'}, // cases
      { type: 'numeric'}, // deaths
      { type: 'numeric'}, // population
      { type: 'numeric'}, // casesPer1M
      { type: 'numeric'}, // deathsPer1M
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 4},
        {label: 'total', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
      ],
      colHeaders,
    ],
    hiddenColumns: {
      // columns: [0, 3], // date, fips
    },
    dropdownMenu: true,
    filters: true,
    height: '90vh',
    width: '90vw',
    licenseKey: 'non-commercial-and-evaluation',
    multiColumnSorting: {
      indicator: true,
    },
  });
  const countiesExportBtn = document.getElementById('counties-export');
  const countiesExportPlugin = hotCounties.getPlugin('exportFile');
  countiesExportBtn.addEventListener('click', function() {
    countiesExportPlugin.downloadFile('csv', {
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      filename: 'covid19stats-counties-[YYYY]-[MM]-[DD]',
    });
  });
}
