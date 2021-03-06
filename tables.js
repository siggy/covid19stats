const makeStateTable = (statesLatestDay, stateHeaders) => {
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
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeathsPer1M', type: 'numeric'},
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 3},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: 'new (7d avg)', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
        {label: 'new/1M', colspan: 2},
        {label: 'new/1M (7d avg)', colspan: 2},
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

  return makeTable(tableOptions, 'state');
}

const makeCountyTable = (countiesLatestDay, countyHeaders) => {
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
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeathsPer1M', type: 'numeric'},
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 1},
        {label: '', colspan: 1},
        {label: '', colspan: 1},
        {label: '', colspan: 1},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: 'new (7d avg)', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
        {label: 'new/1M', colspan: 2},
        {label: 'new/1M (7d avg)', colspan: 2},
      ],
      countyHeaders,
    ],
    hiddenColumns: {
      columns: [0, 3], // date, fips
    },
    fixedColumnsLeft: 4,
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 4, // cases
        sortOrder: 'desc',
      }
    },
  }

  return makeTable(tableOptions, 'county');
}

const makeCountryTable = (countriesLatestDay) => {
  const tableOptions = {
    data: countriesLatestDay,
    columns: [
      { data: 'name', type: 'text'},
      { numericFormat: {pattern: '0,000'}, data: 'cases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCases', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeaths', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'population', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'casesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'deathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'newDeathsPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewCasesPer1M', type: 'numeric'},
      { numericFormat: {pattern: '0,000'}, data: 'avgNewDeathsPer1M', type: 'numeric'},
    ],
    nestedHeaders: [
      [
        {label: '', colspan: 1},
        {label: 'total', colspan: 2},
        {label: 'new', colspan: 2},
        {label: 'new (7d avg)', colspan: 2},
        {label: '', colspan: 1},
        {label: '/1M', colspan: 2},
        {label: 'new/1M', colspan: 2},
        {label: 'new/1M (7d avg)', colspan: 2},
      ],
      [
        'province/country',
        'cases', 'deaths', // total
        'cases', 'deaths', // new
        'cases', 'deaths', // new (7d)
        'population',
        'cases', 'deaths', // total/1M
        'cases', 'deaths', // new/1M
        'cases', 'deaths', // new/1M (7d)
      ],
    ],
    columnSorting: {
      sortEmptyCells: true,
      initialConfig: {
        column: 1, // cases
        sortOrder: 'desc',
      }
    },
  }

  return makeTable(tableOptions, 'country');
}

const makeTable = (options, name) => {
  const defaultTableOptions = {
    // TODO: this exports column headers as "A","B","C"...
    // https://forum.handsontable.com/t/how-to-export-nested-header-table/1690
    colHeaders: true,
    dropdownMenu: true,
    filters: true,
    fixedColumnsLeft: 3,
    height: '90vh',
    width: '95vw',
    stretchH: 'all',
    licenseKey: 'non-commercial-and-evaluation',
  }

  const hot = new Handsontable(
    document.getElementById(name+'-table'),
    {...defaultTableOptions, ...options},
  );

  const exportBtn = document.getElementById(name+'-export');
  const exportPlugin = hot.getPlugin('exportFile');
  exportBtn.addEventListener('click', _ => {
    exportPlugin.downloadFile('csv', {
      columnHeaders: true,
      exportHiddenColumns: true,
      exportHiddenRows: true,
      filename: 'covid19stats-'+ name + '-[YYYY]-[MM]-[DD]',
    });
  });

  return hot;
}
