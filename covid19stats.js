let chart;

// complete, unique set of dates
const allDates = new Set();
// process and display data starting here
const startDate = '2020-03-01';

// State => Date => "date,state,fips,cases,deaths"
const statesToDates = new Map();

Promise.all([
  fetch('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
    .then((response) => {
      return response.ok ? response.text() : Promise.reject(response.status);
    }),
  fetch('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')
    .then((response) => {
        return response.ok ? response.text() : Promise.reject(response.status);
    }),
  fetch('co-est2019-alldata-min.csv')
    .then((response) => {
      return response.ok ? response.text() : Promise.reject(response.status);
    }),
  fetch('https://covidtracking.com/api/states')
    .then((response) => {
      return response.ok ? response.json() : Promise.reject(response.status);
    }),
// TODO: countries
//   fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
//     .then((response) => {
//       return response.ok ? response.text() : Promise.reject(response.status);
//     }),
//   fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')
//     .then((response) => {
//       return response.ok ? response.text() : Promise.reject(response.status);
//     }),
])
.then(responses => {
  const countyCasesResponse = responses[0].split('\n');
  const stateCasesResponse = responses[1].split('\n');
  const popsResponse = responses[2].split('\n');
  const testsResponse = responses[3];
  // const jhuGlobalCasesResponse = responses[4].split('\n');
  // const jhuGlobalDeathsResponse = responses[5].split('\n');

  popsResponse.shift();

  const popsByFips = new Map();
  popsResponse.forEach((pop) => {
    const p = pop.split(',');
    popsByFips.set(p[0], parseInt(p[3]));
  });

  const testsByFips = new Map();
  testsResponse.forEach((test) => {
    testsByFips.set(test.fips, test);
  });

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

  stateCasesResponse.forEach((line) => {
    const row = line.split(',');
    const state = {
      date: row[0],
      name: row[1],
      fips: row[2],
      cases: row[3],
      deaths: row[4],
    }

    if (state.date < startDate) {
      return;
    }
    allDates.add(state.date);

    if (!statesToDates.has(state.name)) {
      statesToDates.set(state.name, new Map());
    }
    if (statesToDates.get(state.name).has(state.date)) {
      console.warn('duplicate date found for state: ' + name + ' => ' + state.date);
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

      // TODO: ordering of object keys must match stateHeaders
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
      row.testsPerDeath = (deaths != 0) ?
        Math.round(totalTests / deaths) :
        0;
    });
  });

  makeTables(statesLatestDay, stateHeaders, popsByFips, countyCasesResponse);

  chart = initChart(statesToDates, allDates, 'c3-chart');

  // defaults. these must match the tabs marked as "active".
  chart.setField('cases');
  chart.setAxis('log');
});

function activateTab(evt, className) {
  const tabs = document.getElementsByClassName(className);
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].className = tabs[i].className.replace(" active", "");
  }
  evt.currentTarget.className += " active";
}

// Based on: https://codepen.io/markcaron/pen/MvGRYV
function setField(evt, field) {
  activateTab(evt, "tabfields");
  chart.setField(field);
}

function setAxis(evt, yAxis) {
  activateTab(evt, "tabaxes");
  chart.setAxis(yAxis);
}
