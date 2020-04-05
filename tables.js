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

  makeTable(tableOptions, 'state');
}

function makeCountyTable(countiesLatestDay, countyHeaders) {
  const tableOptions = {
    data: countiesLatestDay,
    // TODO: must match countyHeaders
    columns: [
      { data: 'date', type: 'date'},
      { data: 'name', type: 'text'},
      { data: 'state', type: 'text'},
      { data: 'fips', type: 'numeric'},
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

  makeTable(tableOptions, 'county');
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
      ['province/country', 'cases', 'deaths', 'cases', 'deaths', 'population', 'cases', 'deaths'],
    ],
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 1, // cases
        sortOrder: 'desc',
      }
    },
  }

  makeTable(tableOptions, 'country');
}

function makeTable(options, name) {
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

  const hot = new Handsontable(
    document.getElementById(name+'-table'),
    {...options, ...defaultTableOptions}
  );

  const countiesExportBtn = document.getElementById(name+'-export');
  const countiesExportPlugin = hot.getPlugin('exportFile');
  countiesExportBtn.addEventListener('click', function() {
    countiesExportPlugin.downloadFile('csv', {
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      filename: 'covid19stats-'+ name + '-[YYYY]-[MM]-[DD]',
    });
  });
}
