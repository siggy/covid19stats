# COVID-19 Stats

Display daily stats for COVID-19 across all US counties.

Data courtesy of:
- https://github.com/nytimes/covid-19-data
- https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals
- https://covidtracking.com
- https://systems.jhu.edu/research/public-health/ncov
- https://data.worldbank.org

## Local dev

```bash
python3 -m http.server
```

Browse to: http://0.0.0.0:8000/

### Pull Population data

```bash
(
  curl https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals/co-est2019-alldata.csv |
    cut -d, -f4-7,19 |
    sed -e 's/ County//g' |
    sed 's/,//1' |
    sed 's/STATECOUNTY/FIPS/1' |
    sed 's/000,/,/1' &&
    echo '66,Guam,Guam,164229' &&
    echo '72,Puerto Rico,Puerto Rico,3195000' &&
    echo '78,Virgin Islands,Virgin Islands,107268' &&
    echo '69,Northern Mariana Islands,Northern Mariana Islands,55144'
) > pops-us-states-counties.csv
```

```bash
curl http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv |
  bsdtar  --to-stdout -xvf - API_SP.POP.TOTL_DS2_en_csv_v2_887275.csv |
  tail -n +6 |
  grep -v "Not classified" |
  sed -e 's/\("[^"]*",\).*"\(.*[0-9]\)","",/\1\2/' |
  sed -e 's/"",//g' > pops-countries.csv
```

## TODO

- fix incomplete country populations
- large numbers at top
- default counties/states/counties visible on chart
- refactor 'new' and /1M hydration
- county chart
- country chart
- toggle states in chart by lockdown date / policy
- toggle countries + states
- user-editable start date
- vary start date by 10th/100th case+death
- better handling scrolling over chart without stealing focus and zooming
- hospitals+beds / 1M
- design
