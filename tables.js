const defaultTableOptions = {
  // TODO: this exports column headers as "A","B","C"...
  // https://forum.handsontable.com/t/how-to-export-nested-header-table/1690
  colHeaders: true,
  dropdownMenu: true,
  filters: true,
  height: '90vh',
  width: '90vw',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
}

function makeStateTable(statesLatestDay, stateHeaders) {
  const tableOptions = {
    data: statesLatestDay,
    // TODO: must match stateHeaders
    columns: [
      { data: 'date', type: 'date'},
      { data: 'name', type: 'text'},
      { data: 'fips', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'cases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'tests', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'pending', type: 'numeric'},
      {
        data: 'positiveTestPercent',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00%'
        }
      },
      { numericFormat: {pattern: '0,000'}, data: 'testsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'testsPerDeath', type: 'numeric'},
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
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 3, // cases
        sortOrder: 'desc',
      }
    },
  }

  const hot = new Handsontable(
    document.getElementById('states-table'),
    {...tableOptions, ...defaultTableOptions}
  );

  addExportButton(hot, 'states');
}

function makeCountyTable(countyCases, popsByFips) {
  const countyHeaders = countyCases.shift().split(',');
  countyHeaders.push('cases');      // new cases
  countyHeaders.push('deaths');     // new deaths
  countyHeaders.push('population');
  countyHeaders.push('cases');      // cases/1M
  countyHeaders.push('deaths');     // deaths/1M

  const countiesToDates = new Map();
  countyCases.forEach((line) => {
    // date,county,state,fips,cases,deaths
    const row = line.split(',');
    const county = {
      date: row[0],
      county: row[1],
      state: row[2],
      fips: row[3],
      cases: row[4],
      deaths: row[5],
    }

    if (county.county === 'Unknown')  {
      return;
    }

    const key = county.county + "-" + county.state;

    if (!countiesToDates.has(key)) {
      countiesToDates.set(key, new Map());
    }
    if (countiesToDates.get(key).has(county.date)) {
      console.warn('duplicate date found for county: ' + key + ' => ' + county.date);
    }
    countiesToDates.get(key).set(county.date, county);
  });

  const countiesLatestDay = [];
  countiesToDates.forEach((dateMap, _) => {
    const latestDay = Array.from(dateMap)[dateMap.size-1][1];
    countiesLatestDay.push(latestDay);

    const fips = latestDay.fips;
    let pop = 0;

    if (fips !== '' && popsByFips.has(fips)) {
      pop = popsByFips.get(fips);
    } else if (latestDay.county === 'New York City') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      pop =
        popsByFips.get('36005') + // Bronx
        popsByFips.get('36047') + // Kings
        popsByFips.get('36061') + // New York
        popsByFips.get('36081') + // Queens
        popsByFips.get('36085');  // Richmond
    } else if (latestDay.county === 'Kansas City') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      pop = 488943;
    } else {
      console.warn('county fips not found: ' + JSON.stringify(latestDay));
      return;
    }

    const popPer1M = pop / 1000000;

    let lastCaseCount = 0;
    let lastDeathCount = 0;
    dateMap.forEach((row, _) => {
      const cases = row.cases;
      const deaths = row.deaths;

      // TODO: ordering of object keys must match countyHeaders
      row.newCases = cases - lastCaseCount;
      lastCaseCount = cases;

      row.newDeaths = deaths - lastDeathCount;
      lastDeathCount = deaths;

      row.population = pop;
      row.casesPer1M = Math.round(cases / popPer1M);
      row.deathsPer1M = Math.round(deaths / popPer1M);
    });
  });

  const tableOptions = {
    data: countiesLatestDay,
    // TODO: must match countyHeaders
    columns: [
      { data: 'date', type: 'date'},
      { data: 'county', type: 'text'},
      { data: 'state', type: 'text'},
      { numericFormat: {pattern: '0,000'}, data: 'fips', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'cases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 4},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
      ],
      countyHeaders,
    ],
    hiddenColumns: {
      columns: [0, 3], // date, fips
    },
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 4, // cases
        sortOrder: 'desc',
      }
    },
  }

  const hot = new Handsontable(
    document.getElementById('counties-table'),
    {...tableOptions, ...defaultTableOptions}
  );

  addExportButton(hot, 'counties');
}

function makeCountryTable(countriesLatestDay) {
  const tableOptions = {
    data: countriesLatestDay,
    columns: [
      { data: 'name', type: 'text'},
      { numericFormat: {pattern: '0,000'}, data: 'cases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
    ],

    nestedHeaders: [
      [
        {label: '', colspan: 1},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
      ],
      ['province/country', 'cases', 'deaths', 'newCases', 'newDeaths', 'population', 'casesPer1M', 'deathsPer1M'],
    ],
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 1, // cases
        sortOrder: 'desc',
      }
    },
  }

  const hot = new Handsontable(
    document.getElementById('country-table'),
    {...tableOptions, ...defaultTableOptions}
  );

  addExportButton(hot, 'country');
}

function addExportButton(table, name) {
  const countiesExportBtn = document.getElementById(name+'-export');
  const countiesExportPlugin = table.getPlugin('exportFile');
  countiesExportBtn.addEventListener('click', function() {
    countiesExportPlugin.downloadFile('csv', {
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      filename: 'covid19stats-'+ name + '-[YYYY]-[MM]-[DD]',
    });
  });
}
