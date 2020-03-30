# COVID-19 Stats

Display daily stats for COVID-19 across all US counties.

Data courtesy of:
- https://github.com/nytimes/covid-19-data
- https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals/
- https://covidtracking.com/

## Local dev

```bash
python3 -m http.server
```

Browse to: http://0.0.0.0:8000/

### Pull Census data

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
    echo '78,Virgin Islands,Virgin Islands,107268'
) > co-est2019-alldata-min.csv
```

## TODO

- user-editable start date
- vary start date by 10th/100th case+death
- better handling scrolling over chart without stealing focus and zooming
- include countries
- new cases / day chart
- move js/css into separate files
- filter out very small counties (or low case counts) for /1M stats
- hospitals+beds / 1M
- design
