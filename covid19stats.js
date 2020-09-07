const charts = {
  'state': null,
  'county': null,
  'country': null,
}

const chartInits = {
  'state': null,
  'county': null,
  'country': null,
}

const tables = {
  'state': null,
  'county': null,
  'country': null,
}

const tableInits = {
  'state': null,
  'county': null,
  'country': null,
}

const countyFilter = new Map(
  [
    [
      'state', new Map(
        [
          ['California', true],
          ['New York', true],
        ]
      )
    ]
  ]
);

// init state checkboxes for county chart

const checks = document.getElementById('county-state-checks');

Object.entries(stateAbbreviations).sort((a, b) => {
  if (a[1] < b[1]) {
    return -1;
  }
  if (a[1] > b[1]) {
    return 1;
  }
  return 0;
}).forEach(s => {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = s[0];
  input.name = s[0];
  input.value = s[0];

  const label = document.createElement('label');
  label.htmlFor = s[0];
  label.appendChild(document.createTextNode(s[1]));

  const li = document.createElement('li');
  li.appendChild(input);
  li.appendChild(label);

  checks.appendChild(li);

  if (countyFilter.get('state').has(s[0])) {
    input.checked = true;
  }

  li.onclick = _ => {
    if (input.checked) {
      countyFilter.get('state').set(s[0], true);
    } else {
      countyFilter.get('state').delete(s[0]);
    }
    charts['county'].setFilter(countyFilter);
  }
});

// limit number of countries in chart
// this must match the defaults set in the "dropdown-button" HTML elements
const chartLimit = 10;

// retrieve all remote data

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
  fetch('https://api.covidtracking.com/v1/states/daily.json')
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
  // https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv
  const countyCasesResponse = responses[0].split('\n');
  // https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv
  const stateCasesResponse = responses[1].split('\n');
  // pops-us-states-counties.csv
  const usPopsResponse = responses[2].split('\n');
  // https://api.covidtracking.com/v1/states/daily.json
  const testsResponse = responses[3];
  // https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv
  const jhuGlobalCasesResponse = responses[4].split('\n');
  // https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv
  const jhuGlobalDeathsResponse = responses[5].split('\n');
  // pops-countries.csv
  const globalPopsResponse = responses[6].split('\n');

  usPopsResponse.shift();

  const popsByFips = new Map();
  usPopsResponse.forEach(pop => {
    const p = pop.split(',');
    popsByFips.set(p[0], parseInt(p[3]));
  });

  const statesTestsToDates = new Map();
  testsResponse.forEach(test => {
    if (!statesTestsToDates.has(test.fips)) {
      statesTestsToDates.set(test.fips, new Map());
    }
    statesTestsToDates.get(test.fips).set(test.date, test);
  });

  const popsByCountry = new Map();
  globalPopsResponse.forEach(pop => {
    const split = pop.lastIndexOf('"');
    const name = pop.substring(1, split);
    const value = pop.substring(split+2, pop.length);
    popsByCountry.set(name, parseInt(value));
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
  stateHeaders.push('cases');      // avg new cases
  stateHeaders.push('deaths');     // avg new deaths
  stateHeaders.push('population');
  stateHeaders.push('cases');      // cases/1M
  stateHeaders.push('deaths');     // deaths/1M
  stateHeaders.push('cases');      // new cases/1M
  stateHeaders.push('deaths');     // new deaths/1M
  stateHeaders.push('cases');      // avg new cases/1M
  stateHeaders.push('deaths');     // avg new deaths/1M
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
      cases: parseInt(row[3]),
      deaths: parseInt(row[4]),

      // placeholders
      avgNewCases: 0,
      avgNewCasesPer1M: 0,
      avgNewDeaths: 0,
      avgNewDeathsPer1M: 0,
      avgNewPositiveTestPercent: 0,
      avgNewTests: 0,
      avgNewTestsPer1M: 0,
      casesPer1M: 0,
      deathsPer1M: 0,
      newCases: 0,
      newCasesPer1M: 0,
      newDeaths: 0,
      newDeathsPer1M: 0,
      pending: 0,
      population: 0,
      positiveTestPercent: 0,
      tests: 0,
      testsPer1M: 0,
      testsPerDeath: 0,
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

    let lastCaseCount = 0;
    let lastDeathCount = 0;

    const movingAverageDays = 7;
    const prevCases = new Array(movingAverageDays);
    const prevDeaths = new Array(movingAverageDays);
    const prevTestsIncrease = new Array(movingAverageDays);
    const prevTestsPositiveIncrease = new Array(movingAverageDays);

    dateMap.forEach((row, _) => {
      const cases = row.cases;
      const deaths = row.deaths;

      row.newCases = Math.max(cases - lastCaseCount, 0);
      row.newDeaths = Math.max(deaths - lastDeathCount, 0);

      lastCaseCount = cases;
      lastDeathCount = deaths;

      prevCases.push(row.newCases);
      prevDeaths.push(row.newDeaths);
      prevCases.shift();
      prevDeaths.shift();
      row.avgNewCases = avg(prevCases);
      row.avgNewDeaths = avg(prevDeaths);

      row.newCasesPer1M = Math.round(row.newCases / popPer1M);
      row.newDeathsPer1M = Math.round(row.newDeaths / popPer1M);

      row.avgNewCasesPer1M =  Math.round(row.avgNewCases / popPer1M);
      row.avgNewDeathsPer1M =  Math.round(row.avgNewDeaths / popPer1M);

      row.population = pop;
      row.casesPer1M = Math.round(cases / popPer1M);
      row.deathsPer1M = Math.round(deaths / popPer1M);

      const dateForTests = parseInt(row.date.replace(/-/g, ''));
      if (statesTestsToDates.has(fips) && statesTestsToDates.get(fips).has(dateForTests)) {
        const tests = statesTestsToDates.get(fips).get(dateForTests);

        const totalTests = tests.positive + tests.negative;

        row.tests = totalTests;
        row.positiveTestPercent = Math.min(100 * tests.positive / totalTests, 100);
        row.pending = tests.pending;

        row.testsPer1M = Math.round(row.tests / popPer1M);

        prevTestsIncrease.push(Math.max(tests.positiveIncrease, 0) + Math.max(tests.negativeIncrease, 0));
        prevTestsPositiveIncrease.push(Math.max(tests.positiveIncrease, 0));

        prevTestsIncrease.shift();
        prevTestsPositiveIncrease.shift();

        const sumPrevTestsIncrease = sum(prevTestsIncrease);
        const sumPrevTestsPositiveIncrease = sum(prevTestsPositiveIncrease);

        row.avgNewTests = avg(prevTestsIncrease);
        row.avgNewPositiveTestPercent = (sumPrevTestsIncrease !== sumPrevTestsPositiveIncrease) ?
          100 * sumPrevTestsPositiveIncrease / sumPrevTestsIncrease :
          0;
        row.avgNewTestsPer1M = Math.round(row.avgNewTests / popPer1M);

        row.testsPerDeath = (deaths !== '0') ?
          Math.round(totalTests / deaths) :
          0;
      } else {
        prevTestsIncrease.push(0);
        prevTestsPositiveIncrease.push(0);

        prevTestsIncrease.shift();
        prevTestsPositiveIncrease.shift();
      }
    });
  });

  //
  // process counties
  //

  const countyHeaders = countyCasesResponse.shift().split(',');

  // TODO: must match nestedHeaders in tables.js
  countyHeaders.push('cases');      // new cases
  countyHeaders.push('deaths');     // new deaths
  countyHeaders.push('cases');      // avg new cases
  countyHeaders.push('deaths');     // avg new deaths
  countyHeaders.push('population');
  countyHeaders.push('cases');      // cases/1M
  countyHeaders.push('deaths');     // deaths/1M
  countyHeaders.push('cases');      // new cases/1M
  countyHeaders.push('deaths');     // new deaths/1M
  countyHeaders.push('cases');      // avg new cases/1M
  countyHeaders.push('deaths');     // avg new deaths/1M

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
      cases: parseInt(row[4]),
      deaths: parseInt(row[5]),
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
    } else if (latestDay.name === 'Joplin') {
      // https://github.com/nytimes/covid-19-data#geographic-exceptions
      pop = 50150;
    } else {
      console.warn('county fips not found: ' + JSON.stringify(latestDay));
      return;
    }
    const popPer1M = pop / 1000000;

    let lastCaseCount = 0;
    let lastDeathCount = 0;

    const movingAverageDays = 7;
    const prevCases = new Array(movingAverageDays);
    const prevDeaths = new Array(movingAverageDays);

    dateMap.forEach((row, _) => {
      const cases = row.cases;
      const deaths = row.deaths;

      row.newCases = Math.max(cases - lastCaseCount, 0);
      row.newDeaths = Math.max(deaths - lastDeathCount, 0);

      lastCaseCount = cases;
      lastDeathCount = deaths;

      prevCases.push(row.newCases);
      prevDeaths.push(row.newDeaths);
      prevCases.shift();
      prevDeaths.shift();
      row.avgNewCases = avg(prevCases);
      row.avgNewDeaths = avg(prevDeaths);

      row.newCasesPer1M = Math.round(row.newCases / popPer1M);
      row.newDeathsPer1M = Math.round(row.newDeaths / popPer1M);

      row.avgNewCasesPer1M =  Math.round(row.avgNewCases / popPer1M);
      row.avgNewDeathsPer1M =  Math.round(row.avgNewDeaths / popPer1M);

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

    const movingAverageDays = 7;
    const prevCases = new Array(movingAverageDays);
    const prevDeaths = new Array(movingAverageDays);

    countryHeaders.forEach((header, j) => {
      if (j < 4) {
        // first 4 columns are: province/state, country/region, lat, long
        return;
      }

      const cases = parseInt(caseRow[j]);
      const deaths = parseInt(deathRow[j]);

      const country = {
        date: formatDate(header),
        name: name,
        cases: cases,
        deaths: deaths,
        newCases: Math.max(cases - lastCaseCount, 0),
        newDeaths: Math.max(deaths - lastDeathCount, 0),
        population: pop !== undefined ? pop : "",
        casesPer1M: pop !== undefined ? Math.round(cases / popPer1M) : "",
        deathsPer1M: pop !== undefined ? Math.round(deaths / popPer1M) : "",
      };

      country.newCasesPer1M  = pop !== undefined ? Math.round(country.newCases / popPer1M) : "";
      country.newDeathsPer1M = pop !== undefined ? Math.round(country.newDeaths / popPer1M) : "";

      lastCaseCount = cases;
      lastDeathCount = deaths;

      prevCases.push(country.newCases);
      prevDeaths.push(country.newDeaths);
      prevCases.shift();
      prevDeaths.shift();
      country.avgNewCases = avg(prevCases);
      country.avgNewDeaths = avg(prevDeaths);

      country.avgNewCasesPer1M  = pop !== undefined ? Math.round(country.avgNewCases / popPer1M) : "";
      country.avgNewDeathsPer1M = pop !== undefined ? Math.round(country.avgNewDeaths / popPer1M) : "";

      allCountryDates.add(country.date);

      if (countriesToDates.get(country.name).has(country.date)) {
        console.warn('duplicate date found for country: ' + country.name + ' => ' + country.date);
      }
      countriesToDates.get(country.name).set(country.date, country);
    });
  });

  const countriesLatestDay = [];
  const countriesLastWeek = [];
  countriesToDates.forEach((dateMap, _) => {
    const latestDay = Array.from(dateMap)[dateMap.size-1][1];
    countriesLatestDay.push(latestDay);

    const daysAgo = Math.min(7, dateMap.size-1);
    const lastWeek = Array.from(dateMap)[dateMap.size-1-daysAgo][1];
    countriesLastWeek.push(lastWeek);
  });

  //
  // big numbers
  //

  lastWeek = {
    avgNewCases: 0,
    avgNewDeaths: 0,
  };
  countriesLastWeek.forEach((country) => {
    lastWeek.avgNewCases += country.avgNewCases;
    lastWeek.avgNewDeaths += country.avgNewDeaths;
  });
  latestDay = {
    cases: 0,
    newCases: 0,
    deaths: 0,
    newDeaths: 0,
    avgNewCases: 0,
    avgNewDeaths: 0,
  };
  countriesLatestDay.forEach((country) => {
    latestDay.cases += country.cases;
    latestDay.newCases += country.newCases;
    latestDay.deaths += country.deaths;
    latestDay.newDeaths += country.newDeaths;
    latestDay.avgNewCases += country.avgNewCases;
    latestDay.avgNewDeaths += country.avgNewDeaths;
  });
  const globalInnerMap = new Map();
  globalInnerMap.set('fake-date-last-week', lastWeek);
  globalInnerMap.set('fake-date-latest-day', latestDay);
  const globalMap = new Map();
  globalMap.set('global', globalInnerMap);

  initBigNumbers(countiesToDates, 'San Francisco, CA', 'big-county');
  initBigNumbers(statesToDates, 'California', 'big-state');
  initBigNumbers(countriesToDates, 'US', 'big-country');
  initBigNumbers(globalMap, 'global', 'big-global');

  // do all chart and table initialization asynchronously to ensure things get
  // rendered asap

  //
  // initialize charts
  //
  // the limit parameters must match the defaults set in the "dropdown-button" HTML elements
  //

  chartInits['state'] = () => {
    if (charts['state'] !== null) {
      return;
    }

    charts['state'] = initChart({
      dataMap: statesToDates,
      xAxisDates: allStateDates,
      chartId: 'state-chart',
      filter: null,
      field: 'avgNewCases',
      limit: chartLimit,
      normalized: true,
      yAxis: 'linear',
    });

    tableInits['state'] = () => {
      if (tables['state'] !== null) {
        return tables['state'];
      }
      tables['state'] = makeStateTable(statesLatestDay, stateHeaders);
      return tables['state'];
    }
    initCollapsible('state');
  }

  chartInits['county'] = () => {
    if (charts['county'] !== null) {
      return;
    }

    charts['county'] = initChart({
      dataMap: countiesToDates,
      xAxisDates: allCountyDates,
      chartId: 'county-chart',
      filter: countyFilter,
      field: 'avgNewCases',
      limit: chartLimit,
      normalized: false,
      yAxis: 'log',
    });

    tableInits['county'] = () => {
      if (tables['county'] !== null) {
        return tables['county'];
      }
      tables['county'] = makeCountyTable(countiesLatestDay, countyHeaders);
      return tables['county'];
    }
    initCollapsible('county');
  }

  chartInits['country'] = () => {
    if (charts['country'] !== null) {
      return;
    }

    charts['country'] = initChart({
      dataMap: countriesToDates,
      xAxisDates: allCountryDates,
      chartId: 'country-chart',
      filter: null,
      field: 'avgNewCases',
      limit: chartLimit,
      normalized: false,
      yAxis: 'log',
    });

    tableInits['country'] = () => {
      if (tables['country'] !== null) {
        return tables['country'];
      }
      tables['country'] = makeCountryTable(countriesLatestDay);
      return tables['country'];
    }
    initCollapsible('country');
  }

  // open default tab
  document.getElementsByClassName("tablink")[0].click();

  // loading done, hide loader
  document.getElementsByClassName("load-container")[0].style.visibility = 'hidden';
});

//
// big numbers
//

const initBigNumbers = (statMap, location, id) => {
  const stats = statMap.get(location);
  const stat = Array.from(stats)[stats.size-1][1];

  const daysAgo = Math.min(7, stats.size-1)
  const statLastWeek = Array.from(stats)[stats.size-1-daysAgo][1];

  const elm = document.getElementById(id);

  const cases = elm.getElementsByClassName("cases")[0];
  cases.getElementsByClassName("total")[0].innerHTML = numberWithCommas(stat.cases);
  cases.getElementsByClassName("new")[0].innerHTML = "New: +" + numberWithCommas(stat.newCases);
  cases.getElementsByClassName("percent")[0].innerHTML = (100 * (stat.avgNewCases - statLastWeek.avgNewCases) / statLastWeek.avgNewCases).toFixed(1) + '%';

  const deaths = elm.getElementsByClassName("deaths")[0];
  deaths.getElementsByClassName("total")[0].innerHTML = numberWithCommas(stat.deaths);
  deaths.getElementsByClassName("new")[0].innerHTML = "New: +" + numberWithCommas(stat.newDeaths);
  deaths.getElementsByClassName("percent")[0].innerHTML = (100 * (stat.avgNewDeaths - statLastWeek.avgNewDeaths) / statLastWeek.avgNewDeaths).toFixed(1) + '%';
}

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//
// tabs
//

function openTab(evt, tab) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].className = tabcontent[i].className.replace(" active", "");
  }

  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  evt.currentTarget.className += " active";
  document.getElementById(tab).className += " active";

  chartInits[tab]();
}

//
// dropdowns
//

// Based on: https://www.w3schools.com/howto/howto_css_dropdown_navbar.asp
const dropDownToggle = evt => {
  evt
    .currentTarget
    .closest(".dropdown")
    .getElementsByClassName("dropdown-content")[0]
    .classList
    .toggle("show");
}

window.onclick = e => {
  if (!e.target.matches('.dropdown-button')) {
    const dropDowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropDowns.length; i++) {
      dropDowns[i].classList.remove('show');
    }
  }
}

//
// charts
//

// Based on: https://codepen.io/markcaron/pen/MvGRYV

const dropDownSelect = evt => {
  evt.currentTarget.closest(".dropdown").firstElementChild.innerHTML =
    evt.currentTarget.textContent + " <span class='dropdown-chevron'>&#9660;</span>";
}

const setField = (evt, chart, field) => {
  // re-enabled "normalized" drop-down in case it was disabled
  const normalized = evt.currentTarget.closest(".dropdown-row")
    .getElementsByClassName('normalized');
  if (normalized.length > 0) {
    normalized[0].firstElementChild.disabled = false;
  }

  dropDownSelect(evt);
  charts[chart].setField(field, false);
}

const setNonNormalizedField = (evt, chart, field) => {
  // "/1M" not supported for this field, force "Total"
  const normalizedDropdown = evt.currentTarget.closest(".dropdown-row")
    .getElementsByClassName('normalized')[0].firstElementChild;

  normalizedDropdown.disabled = true;
  normalizedDropdown.innerHTML = "Total <span class='dropdown-chevron'>&#9660;</span>";

  dropDownSelect(evt);
  charts[chart].setNonNormalizedField(field);
}

const setAxis = (evt, chart, yAxis) => {
  dropDownSelect(evt);
  charts[chart].setAxis(yAxis);
}

const showTop = (evt, chart, top) => {
  dropDownSelect(evt);
  const topInt = (top !== 'all') ?
    parseInt(top) :
    0;
  charts[chart].setLimit(topInt, true);
}

const showNormalized = (evt, chart, normalized) => {
  dropDownSelect(evt);
  charts[chart].setNormalized(normalized, false);
}

//
// collapsibles
//

const initCollapsible = tab => {
  const id  = tab + "-collapsible";
  const collapsible = document.getElementById(id);
  const btn = collapsible.querySelector('button');
  const target = collapsible.nextElementSibling;

  btn.onclick = _ => {
    const table = tableInits[tab]();

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

//
// misc
//

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

const sum = arr =>
  arr.reduce(function(a, b){
    return a + b;
  }, 0);

const avg = arr =>
  Math.round(
    sum(arr) / arr.length
  );
