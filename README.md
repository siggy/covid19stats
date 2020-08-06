# COVID-19 Stats

Display daily stats for COVID-19 across all US counties.

Data courtesy of:
- https://github.com/nytimes/covid-19-data
- https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/counties/totals
- https://covidtracking.com
- https://systems.jhu.edu/research/public-health/ncov
- https://data.worldbank.org
- https://open.canada.ca
- http://www.population.net.au/states

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
    echo '69,Northern Mariana Islands,Northern Mariana Islands,55144' &&
    echo '60,American Samoa,American Samoa,55465'
) > pops-us-states-counties.csv
```

```bash
(
  curl http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv |
    bsdtar --to-stdout -xvf - API_SP.POP.TOTL_DS2_en_csv_v2_*.csv |
    tail -n +6 |
    grep -v "Not classified" |
    sed -e $'s/\r$//' |
    sed -e 's/\("[^"]*",\).*"\(.*[0-9]\)","",/\1\2/' |
    sed -e 's/"",//g' |
    sed -e 's/St. Kitts and Nevis/Saint Kitts and Nevis/g' |
    sed -e 's/Myanmar/Burma/g' |
    sed -e 's/Kyrgyz Republic/Kyrgyzstan/g' |
    sed -e 's/St. Vincent and the Grenadines/Saint Vincent and the Grenadines/g' |
    sed -e 's/Bahamas, The/Bahamas/g' |
    sed -e 's/Lao PDR/Laos/g' |
    sed -e 's/Congo, Dem. Rep./Congo (Kinshasa)/g' |
    sed -e 's/Congo, Rep./Congo (Brazzaville)/g' |
    sed -e 's/Czech Republic/Czechia/g' |
    sed -e 's/Syrian Arab Republic/Syria/g' |
    sed -e 's/Venezuela, RB/Venezuela/g' |
    sed -e 's/United States/US/g' |
    sed -e 's/Slovak Republic/Slovakia/g' |
    sed -e 's/Russian Federation/Russia/g' |
    sed -e 's/Iran, Islamic Rep./Iran/g' |
    sed -e 's/Brunei Darussalam/Brunei/g' |
    sed -e 's/Faroe Islands/Faroe Islands, Denmark/g' |
    sed -e 's/Greenland/Greenland, Denmark/g' |
    sed -e 's/Gambia, The/Gambia/g' |
    sed -e 's/Korea, Rep./Korea, South/g' |
    sed -e 's/Aruba/Aruba, Netherlands/g' |
    sed -e 's/Curacao/Curacao, Netherlands/g' |
    sed -e 's/Sint Maarten (Dutch part)/Sint Maarten, Netherlands/g' |
    sed -e 's/St. Lucia/Saint Lucia/g' |
    sed -e 's/Egypt, Arab Rep./Egypt/g' |
    sed -e 's/Yemen, Rep./Yemen/g' &&
  echo '"Guangdong, China",111690000' &&
  echo '"Shandong, China",100060000' &&
  echo '"Henan, China",95590000' &&
  echo '"Sichuan, China",83020000' &&
  echo '"Jiangsu, China",80290000' &&
  echo '"Hebei, China",75200000' &&
  echo '"Hunan, China",68600000' &&
  echo '"Anhui, China",62550000' &&
  echo '"Hubei, China",59020000' &&
  echo '"Zhejiang, China",56570000' &&
  echo '"Guangxi, China",48850000' &&
  echo '"Yunnan, China",48010000' &&
  echo '"Jiangxi, China",46220000' &&
  echo '"Liaoning, China",43690000' &&
  echo '"Fujian, China",39110000' &&
  echo '"Shaanxi, China",38350000' &&
  echo '"Heilongjiang, China",37890000' &&
  echo '"Shanxi, China",36820000' &&
  echo '"Guizhou, China",35550000' &&
  echo '"Chongqing, China",30750000' &&
  echo '"Jilin, China",27170000' &&
  echo '"Gansu, China",26260000' &&
  echo '"Inner Mongolia, China",25290000' &&
  echo '"Xinjiang, China",24450000' &&
  echo '"Shanghai, China",24180000' &&
  echo '"Beijing, China",21710000' &&
  echo '"Tianjin, China",15570000' &&
  echo '"Hainan, China",9170000' &&
  echo '"Hong Kong, China",7335384' &&
  echo '"Ningxia, China",6820000' &&
  echo '"Qinghai, China",5980000' &&
  echo '"Tibet, China",3370000' &&
  echo '"Macau, China",644900' &&
  echo '"Taiwan*",23562318' &&
  echo '"Western Australia, Australia",2720000' &&
  echo '"New South Wales, Australia",7992000' &&
  echo '"Victoria, Australia",6280000' &&
  echo '"Queensland, Australia",5046000' &&
  echo '"Australian Capital Territory, Australia",412576' &&
  echo '"Northern Territory, Australia",247940' &&
  echo '"South Australia, Australia",1731000' &&
  echo '"Tasmania, Australia",522327' &&
  echo '"French Guiana, France",290691' &&
  echo '"Guadeloupe, France",395700' &&
  echo '"Mayotte, France",270372' &&
  echo '"Reunion, France",859959' &&
  echo '"Saint Barthelemy, France",9793' &&
  echo '"St Martin, France",77741' &&
  echo '"Martinique, France",376480' &&
  echo '"Holy See",618' &&
  echo '"Montserrat, United Kingdom",4649' &&
  echo '"Anguilla, United Kingdom",14731' &&
  echo '"Falkland Islands (Malvinas), United Kingdom",2840' &&
  echo '"Saint Pierre and Miquelon, France",5888' &&
  echo '"Western Sahara",567402' &&
  curl https://www150.statcan.gc.ca/n1/en/tbl/csv/17100009-eng.zip?st=BvQiI4lH |
    bsdtar  --to-stdout -xvf - 17100009.csv |
    tail -n13 |
    sed -e 's/"[^"]*","\([^"]*\).*"\(.*[0-9]\)","","","","0"/"\1, Canada",\2/' \
) > pops-countries.csv
```

## TODO

- init tables only when opened
- show spinner when initing charts/tables
- limit country chart to `startDate`
- bigger text on charts
- make `setField` dropdown fixed width
- pos test %
- fix multiple drop-downs being open at once
- fix tab wrapping on mobile
- make county selector on top
- tests in state chart
  - covidtracking historical tests
- a11y
- new case change week-over-week
- large numbers at top
  - autotoggles (unified?) charts?
  - with map?
  - animate increase
    - https://stackoverflow.com/questions/16994662/count-animation-from-number-a-to-b
- unified chart
- fix political province names
- toggle states in chart by lockdown date / policy
- toggle countries + states
- user-editable start date
- vary start date by 10th/100th case+death
- better handling scrolling over chart without stealing focus and zooming
- hospitals+beds / 1M
- design
