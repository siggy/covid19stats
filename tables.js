function makeTables(statesLatestDay, stateHeaders, popsByFips, countyCases) {
  // states

  const hotStates = new Handsontable(document.getElementById('states'), {
    data: statesLatestDay,
    colHeaders: stateHeaders,
    autoColumnSize: {
      samplingRatio: 23
    },
    multiColumnSorting: {
      indicator: true
    },
    licenseKey: 'non-commercial-and-evaluation'
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

  const hotCounties = new Handsontable(document.getElementById('counties'), {
    data: latestDay,
    colHeaders: colHeaders,
    autoColumnSize: {
      samplingRatio: 23
    },
    multiColumnSorting: {
      indicator: true
    },
    licenseKey: 'non-commercial-and-evaluation'
  });
}
