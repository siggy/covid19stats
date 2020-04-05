let yAxisTickValues = [100, 1000, 10000];

// columns and yAxisType are optional
function updateYAxisTickValues(chart, columns, yAxisType) {
  let yMax = 0;

  if (columns === null) {
    chart.data.shown().forEach((row, _) => {
      row.values.forEach((value, _) => {
        if (value.value > yMax) {
          yMax = value.value;
        }
      });
    });
  } else {
    const shownMap = new Set();
    chart.data.shown().forEach((row, _) => {
      shownMap.add(row.id);
    });

    columns.slice(1).forEach((column, _) => {
      if (!shownMap.has(column[0])) {
        return;
      }
      column.slice(1).forEach((value, _) => {
        const i = parseInt(value);
        if (i > yMax) {
          yMax = i;
        }
      });
    });
  }

  if (yAxisType === null) {
    yAxisType = chart.axis.types().y;
  }

  const values = [];
  if (yAxisType === 'log') {
    let mag = 1;
    let done = false;
    while (true) {
      [1,2,5].forEach((i=> {
        if (done) {
          return;
        }
        const yVal = i*mag;
        values.push(yVal);
        if (yVal > yMax) {
          done = true
          return;
        }
      }));
      if (done) {
        break;
      }
      mag *= 10;
    }
    yAxisTickValues = values.slice(Math.max(values.length - 10, 0));
  } else if (yAxisType === 'linear') {
    // start with the exact interval: (max / 10) = i
    // find intervalMultiplier bucket: i => 5 or 50 or 500...
    // select an interval within that bucket: 50 => 50 or 100 or 150...
    // 0   <= i < 5    // 1,   2,    3,    4...
    // 5   <= i < 50   // 5,   10,   15,   20,   25,   30,   35,   40,   45...
    // 50  <= i < 500  // 50,  100,  150,  200,  250,  300,  350,  400,  450...
    // 500 <= i < 5000 // 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500...
    const exactInterval = yMax/10;
    const intervalMultiplier = 10**Math.floor(Math.log10(exactInterval * 2)) / 2;
    const interval = intervalMultiplier*Math.ceil(exactInterval/intervalMultiplier);
    for (let i = interval; i < yMax+interval; i += interval) {
      values.push(i);
    }
    yAxisTickValues = values;
  } else {
    console.warn('Unknown yAxis type: ' + yAxisType);
  }

  // force re-render
  if (columns !== null) {
    chart.load({
      columns: columns,
    });
  } else {
    chart.axis.types({
      y: yAxisType,
    });
  }
}

// TODO: also render initial dataset?
function initChart(statesToDates, xAxisDates, chartId) {
  const chart = c3.generate({
    padding: {
      top: 10,
    },
    bindto: '#' + chartId,
    axis: {
      x: {
        // TODO: control start date dynamically, don't process earlier data
        // min: '2020-03-01',
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d',
        }
      },
      y: {
        inner: true,
        type: 'log',
        padding: 0,
        tick: {
          format: d3.format(",d"),
          values: function () {
            return yAxisTickValues;
          }
        }
      },
    },
    data: {
      selection: {
        enabled: true
      },
      x: 'x',
      columns: [
        ['x'],
      ],
    },
    grid: {
      y: {
        show: true,
      }
    },
    point: {
      r: 2,
      focus: {
        expand: {
          r: 4,
        }
      },
    },
    tooltip: {
      grouped: false,
    },
    transition: {
      duration: 0,
    },
    zoom: {
      enabled: true,
      rescale: true,
    },
    legend: {
      item: {
        onclick: function (id) {
          chart.toggle(id);
          updateYAxisTickValues(chart, null, null);
        }
      }
    },
  });

  return {
    setField: function(field) {
      columns = [
        ['x'].concat(Array.from(xAxisDates))
      ];

      const statesToDatesSorted = new Map([...statesToDates.entries()].sort());
      statesToDatesSorted.forEach((dates, state) => {
        const column = [state];

        xAxisDates.forEach((date) => {
          cases = (dates.has(date)) ?
            dates.get(date)[field] :
            null
          column.push(cases);
        })

        columns.push(column);
      });

      updateYAxisTickValues(chart, columns, null);
    },

    setAxis: function(yAxis) {
      updateYAxisTickValues(chart, null, yAxis);
    }
  };
}
