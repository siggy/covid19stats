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
          format: function (d) { return d.toFixed(0); }
        }
      },
    },
    data: {
      x: 'x',
      columns:  [
        ['x'],
      ],
    },
    grid: {
      y: {
        show: true,
      }
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
  });

  return {
    setField: function(field) {
      columns = [
        ['x'].concat(Array.from(xAxisDates))
      ];

      const statesToDatesSorted = new Map([...statesToDates.entries()].sort());
      statesToDatesSorted.forEach((dates, state) => {
        column = [state];

        xAxisDates.forEach((date) => {
          cases = (dates.has(date)) ?
            dates.get(date)[field] :
            null
          column.push(cases);
        })

        columns.push(column);
      });

      chart.load({
        columns: columns,
      });
    },
    setAxis: function(yAxis) {
      chart.axis.types({
        y: yAxis,
      });
    }
  };
}
