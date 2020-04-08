let stateChart;
let countyChart;
let countryChart;

let stateTable;
let countyTable;
let countryTable;

// limit number of countries in chart
const chartLimit = 50;

Promise.all([
  fetch('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
  fetch('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
  fetch('pops-us-states-counties.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
  fetch('https://covidtracking.com/api/states')
    .then(response =>
      response.ok ? response.json() : Promise.reject(response.status)
    ),
  fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
  fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
  fetch('pops-countries.csv')
    .then(response =>
      response.ok ? response.text() : Promise.reject(response.status)
    ),
])
.then(responses => {
  const countyCasesResponse = responses[0].split('\n');
  const stateCasesResponse = responses[1].split('\n');
  const usPopsResponse = responses[2].split('\n');
  const testsResponse = responses[3];
  const jhuGlobalCasesResponse = responses[4].split('\n');
  const jhuGlobalDeathsResponse = responses[5].split('\n');
  const globalPopsResponse = responses[6].split('\n');

  usPopsResponse.shift();

  const popsByFips = new Map();
  usPopsResponse.forEach(pop => {
    const p = pop.split(',');
    popsByFips.set(p[0], parseInt(p[3]));
  });

  const testsByFips = new Map();
  testsResponse.forEach(test => {
    testsByFips.set(test.fips, test);
  });

  const popsByCountry = new Map();
  globalPopsResponse.forEach(pop => {
    const split = pop.lastIndexOf('"');
    const name = pop.substring(1, split);
    const value = pop.substring(split+2, pop.length);
    popsByCountry.set(name, value);
  });

  // process and display data starting here
  const startDate = '2020-03-01';

  //
  // process states
  //

  // TODO: refactor this with county data processing
  const stateHeaders = stateCasesResponse.shift().split(',');

  // TODO: must match nestedHeaders in tables.js
  stateHeaders.push('cases');      // new cases
  stateHeaders.push('deaths');     // new deaths
  stateHeaders.push('population');
  stateHeaders.push('cases');      // cases/1M
  stateHeaders.push('deaths');     // deaths/1M
  stateHeaders.push('total');      // total tests
  stateHeaders.push('pending');    // pending tests
  stateHeaders.push('positive');   // positive test %
  stateHeaders.push('/1M');        // tests/1M
  stateHeaders.push('/death');     // tests/death

  // complete, unique set of dates
  const allStateDates = new Set();

  // State => Date => {date,state,fips,cases,deaths}
  const statesToDates = new Map();

  stateCasesResponse.forEach(line => {
    const row = line.split(',');
    const state = {
      date: row[0],
      name: row[1],
      fips: row[2],
      cases: row[3],
      deaths: row[4],
    };

    if (state.date < startDate) {
      return;
    }
    allStateDates.add(state.date);

    if (!statesToDates.has(state.name)) {
      statesToDates.set(state.name, new Map());
    }
    if (statesToDates.get(state.name).has(state.date)) {
      console.warn('duplicate date found for state: ' + state.name + ' => ' + state.date);
    }
    statesToDates.get(state.name).set(state.date, state);
  });

  const statesLatestDay = [];
  statesToDates.forEach((dateMap, _) => {
    const latestDay = Array.from(dateMap)[dateMap.size-1][1];
    statesLatestDay.push(latestDay);

    const fips = latestDay.fips;
    if (fips === '' || !popsByFips.has(fips)) {
      console.warn('state fips not found: ' + JSON.stringify(latestDay));
      return;
    }
    const pop = popsByFips.get(fips);
    const popPer1M = pop / 1000000;

    if (!testsByFips.has(fips)) {
      console.warn('state fips not found in test data: ' + state);
      return;
    }
    const tests = testsByFips.get(fips);

    let lastCaseCount = 0;
    let lastDeathCount = 0;
    dateMap.forEach((row, _) => {
      const cases = row.cases;
      const deaths = row.deaths;

      row.newCases = cases - lastCaseCount;
      lastCaseCount = cases;

      row.newDeaths = deaths - lastDeathCount;
      lastDeathCount = deaths;

      row.population = pop;
      row.casesPer1M = Math.round(cases / popPer1M);
      row.deathsPer1M = Math.round(deaths / popPer1M);

      const positiveTests = tests.positive;
      const totalTests = tests.totalTestResults;
      const pending = tests.pending;

      row.tests = totalTests;
      row.pending = pending;
      row.positiveTestPercent = positiveTests / totalTests;
      row.testsPer1M = Math.round(totalTests / popPer1M);
      row.testsPerDeath = (deaths !== 0) ?
        Math.round(totalTests / deaths) :
        0;
    });
  });

  //
  // process counties
  //

  const countyHeaders = countyCasesResponse.shift().split(',');

  // TODO: must match nestedHeaders in tables.js
  countyHeaders.push('cases');      // new cases
  countyHeaders.push('deaths');     // new deaths
  countyHeaders.push('population');
  countyHeaders.push('cases');      // cases/1M
  countyHeaders.push('deaths');     // deaths/1M

  // complete, unique set of dates
  const allCountyDates = new Set();

  // "County, State" => Date => {date,county,state,fips,cases,deaths}
  const countiesToDates = new Map();

  countyCasesResponse.forEach(line => {
    const row = line.split(',');
    if (row[1] === 'Unknown') {
      return;
    }

    const county = {
      date: row[0],
      name: row[1],
      state: row[2],
      fullName: row[1] + ', ' + stateAbbreviations[row[2]],
      fips: row[3],
      cases: row[4],
      deaths: row[5],
    };

    if (county.date < startDate) {
      return;
    }
    allCountyDates.add(county.date);

    if (!countiesToDates.has(county.fullName)) {
      countiesToDates.set(county.fullName, new Map());
    }
    if (countiesToDates.get(county.fullName).has(county.date)) {
      console.warn('duplicate date found for county: ' + county.fullName + ' => ' + county.date);
    }
    countiesToDates.get(county.fullName).set(county.date, county);
  });

  const countiesLatestDay = [];
  countiesToDates.forEach((dateMap, _) => {
    const latestDay = Array.from(dateMap)[dateMap.size-1][1];
    countiesLatestDay.push(latestDay);

    const fips = latestDay.fips;
    let pop = 0;

    if (fips !== '' && popsByFips.has(fips)) {
      pop = popsByFips.get(fips);
    } else if (latestDay.name === 'New York City') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      pop =
        popsByFips.get('36005') + // Bronx
        popsByFips.get('36047') + // Kings
        popsByFips.get('36061') + // New York
        popsByFips.get('36081') + // Queens
        popsByFips.get('36085');  // Richmond
    } else if (latestDay.name === 'Kansas City') {
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

      row.newCases = cases - lastCaseCount;
      lastCaseCount = cases;

      row.newDeaths = deaths - lastDeathCount;
      lastDeathCount = deaths;

      row.population = pop;
      row.casesPer1M = Math.round(cases / popPer1M);
      row.deathsPer1M = Math.round(deaths / popPer1M);
    });
  });

  //
  // process countries
  //

  if (jhuGlobalCasesResponse.length !== jhuGlobalDeathsResponse.length) {
    console.warn('country cases ('+ jhuGlobalCasesResponse.length + ') does not equal country deaths ('+ jhuGlobalDeathsResponse.length + ')');
  }

  const countryHeaders = jhuGlobalCasesResponse.shift().split(',');
  jhuGlobalDeathsResponse.shift();

  // complete, unique set of dates
  const allCountryDates = new Set();

  // Country => Date => {date,country,fips,cases,deaths}
  const countriesToDates = new Map();

  jhuGlobalCasesResponse.forEach((caseLine, i) => {
    if (caseLine === "") {
      // last line
      return;
    }

    const caseRow = caseLine.split(',');
    const deathRow = jhuGlobalDeathsResponse[i].split(',');
    if (
      caseRow.length !== deathRow.length ||
      caseRow[0] !== deathRow[0] ||
      caseRow[1] !== deathRow[1]
    ) {
      console.warn('case row does not equal death row');
      console.warn(caseRow);
      console.warn(deathRow);
      return;
    }

    if (caseRow[1] === "\"Korea") {
      // special case for:
      // ,"Korea, South",36.0,128.0,
      caseRow.shift();
      deathRow.shift();

      caseRow[0] = "";
      deathRow[0] = "";

      caseRow[1] = "Korea, South";
      deathRow[1] = "Korea, South";
    }

    const name = caseRow[0] !== '' ? caseRow[0] + ', ' + caseRow[1] : caseRow[1];

    let popsName = name;
    if (!popsByCountry.has(name)) {
      if (caseRow[0] !== '' && popsByCountry.has(caseRow[0])) {
        popsName = caseRow[0];
      } else {
        console.warn("name not found in population map: " + popsName);
      }
    }
    const pop = popsByCountry.get(popsName);
    const popPer1M = pop / 1000000;

    if (!countriesToDates.has(name)) {
      countriesToDates.set(name, new Map());
    }

    let lastCaseCount = 0;
    let lastDeathCount = 0;
    countryHeaders.forEach((header, j) => {
      if (j < 4) {
        // first 4 columns are: province/state, country/region, lat, long
        return;
      }

      const cases = caseRow[j];
      const deaths = deathRow[j];

      const country = {
        date: formatDate(header),
        name: name,
        cases: cases,
        deaths: deaths,
        newCases: cases - lastCaseCount,
        newDeaths: deaths - lastDeathCount,
        population: pop !== undefined ? pop : "",
        casesPer1M: pop !== undefined ? Math.round(cases / popPer1M) : "",
        deathsPer1M: pop !== undefined ? Math.round(deaths / popPer1M) : "",
      };

      lastCaseCount = cases;
      lastDeathCount = deaths;

      allCountryDates.add(country.date);

      if (countriesToDates.get(country.name).has(country.date)) {
        console.warn('duplicate date found for country: ' + country.name + ' => ' + country.date);
      }
      countriesToDates.get(country.name).set(country.date, country);
    });
  });

  const countriesLatestDay = [];
  countriesToDates.forEach((dateMap, _) => {
    const latestDay = Array.from(dateMap)[dateMap.size-1][1];
    countriesLatestDay.push(latestDay);
  });

  //
  // initialize tables
  //

  stateTable = makeStateTable(statesLatestDay, stateHeaders);
  countyTable = makeCountyTable(countiesLatestDay, countyHeaders);
  countryTable = makeCountryTable(countriesLatestDay);

  initCollapsible('state-collapsible', stateTable);
  initCollapsible('county-collapsible', countyTable);
  initCollapsible('country-collapsible', countryTable);

  //
  // initialize charts
  //

  stateChart = initChart(statesToDates, allStateDates, 'state-chart', null, 'cases', 0);

  countyChart = initChart(countiesToDates, allCountyDates, 'county-chart',
    new Map([['state', ['California', 'New York']]]), 'cases', chartLimit,
  );

  countryChart = initChart(countriesToDates, allCountryDates, 'country-chart', null, 'cases', chartLimit);
});

const activateTab = (evt, className) => {
  const tabs = document.getElementsByClassName(className);
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].className = tabs[i].className.replace(" active", "");
  }
  evt.currentTarget.className += " active";
}

// Based on: https://codepen.io/markcaron/pen/MvGRYV
const setField = (evt, chart, field) => {
  activateTab(evt, chart+"-field-tab");
  if (chart === 'state') {
    stateChart.setField(field, 0);
  } else if (chart === 'county') {
    countyChart.setField(field, chartLimit);
  } else if (chart === 'country') {
    countryChart.setField(field, chartLimit);
  }
}

const setAxis = (evt, chart, yAxis) => {
  activateTab(evt, chart+"-axes-tab");
  if (chart === 'state') {
    stateChart.setAxis(yAxis);
  } else if (chart === 'county') {
    countyChart.setAxis(yAxis);
  } else if (chart === 'country') {
    countryChart.setAxis(yAxis);
  }
}

const formatDate = date => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) {
      month = '0' + month;
  }
  if (day.length < 2) {
      day = '0' + day;
  }

  return [year, month, day].join('-');
}

const initCollapsible = (id, table) => {
  const collapsible = document.getElementById(id);
  const btn = collapsible.querySelector('button');
  const target = collapsible.nextElementSibling;

  btn.onclick = _ => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    target.hidden = expanded;
    if (!expanded) {
      target.style.maxHeight = target.scrollHeight + "px";
      // https://github.com/handsontable/handsontable/issues/5322
      table.render();
    } else {
      target.style.maxHeight = null;
    }
  }
}
