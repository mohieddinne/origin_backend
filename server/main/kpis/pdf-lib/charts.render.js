const { CanvasRenderService } = require("chartjs-node-canvas");
const { colors, officesColors } = require("./colors.js");

const height = 800;

const chartCallback = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.defaultFontFamily = "Arial";
  //ChartJS.defaults.global.defaultFontColor = "#000";
  ChartJS.defaults.global.defaultFontSize = 30;
  ChartJS.plugins.register({
    beforeDraw: function (chartInstance) {
      var ctx = chartInstance.chart.ctx;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    },
  });
};
const chartCallback23 = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.defaultFontFamily = "Arial";
  //ChartJS.defaults.global.defaultFontColor = "#000";
  ChartJS.defaults.global.defaultFontSize = 20;
  ChartJS.plugins.register({
    beforeDraw: function (chartInstance) {
      var ctx = chartInstance.chart.ctx;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    },
  });
};
const canvasRenderService23 = new CanvasRenderService(
  height,
  height / 2,
  chartCallback23
);
const canvasRenderService = new CanvasRenderService(
  height,
  height,
  chartCallback
);

// Offices Chart
module.exports.offices = async function (m, data) {
  const d = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };
  for (let { name, value } of data) {
    d.labels.push(name);
    d.datasets[0].data.push(value || 0);
    d.datasets[0].backgroundColor.push(colors[d.labels.length * 2]);
  }

  const configuration = {
    type: "doughnut",
    data: d,
    options: {
      cutoutPercentage: 75,
      spanGaps: false,
      maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
    },
  };
  return await canvasRenderService.renderToDataURL(configuration);
};

// FoldersTypes Chart
module.exports.foldersTypes = async function (m, data) {
  const d = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };
  for (let { name, value } of data) {
    d.labels.push(name);
    d.datasets[0].data.push(value || 0);
    d.datasets[0].backgroundColor.push(colors[d.labels.length]);
  }

  const configuration = {
    type: "doughnut",
    data: d,
    options: {
      cutoutPercentage: 75,
      spanGaps: false,
      maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
    },
  };

  return await canvasRenderService.renderToDataURL(configuration);
};

// Customers Chart
module.exports.customer = async function (m, data) {
  const d = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };
  for (let { name, value } of data) {
    d.labels.push(name);
    d.datasets[0].data.push(value || 0);
    d.datasets[0].backgroundColor.push(colors[d.labels.length]);
  }

  const configuration = {
    type: "doughnut",
    data: d,
    options: {
      cutoutPercentage: 75,
      spanGaps: false,
      maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
    },
  };

  return await canvasRenderService.renderToDataURL(configuration);
};

// CustomerGroups Chart
module.exports.customerGroups = async function (m, data) {
  const d = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  };
  for (let { name, value, options } of data) {
    d.labels.push(name);
    d.datasets[0].data.push(value || 0);
    -d.datasets[0].backgroundColor.push(
      (
        options.find((e) => e.name === "color") || {
          value: "#039be5",
        }
      ).value
    );
  }

  const configuration = {
    type: "doughnut",
    data: d,
    options: {
      cutoutPercentage: 75,
      spanGaps: false,
      maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
    },
  };

  return await canvasRenderService.renderToDataURL(configuration);
};

// CategoriesAndOffices Chart
module.exports.lossesAndOffices = async (m, data) => {
  const d = {
    labels: [],
    datasets: [],
  };

  const offices = [];
  for (const item of data) {
    // Get labels
    if (!d.labels.includes(item.name)) d.labels.push(item.name);
    const lossIndex = d.labels.indexOf(item.name);
    for (const office of item.data) {
      const name = office.name || "Non spécifié";
      const dsIndex = offices.indexOf(name);

      if (dsIndex < 0) {
        const dataSet = {
          label: name,
          backgroundColor: officesColors[offices.length],
          data: [],
        };
        if (lossIndex === 0) {
          dataSet.data = [office.value];
        } else {
          // Fill the table with zeros (see ChartJS docs)
          dataSet.data = new Array(lossIndex);
          for (let i = 0; i < lossIndex; ++i) dataSet.data[i] = 0;
          // Set the correct data in the loss Index
          dataSet.data[lossIndex] = office.value;
        }
        d.datasets.push(dataSet);
        offices.push(name);
      } else {
        d.datasets[dsIndex].data[lossIndex] = office.value;
      }
    }
  }

  const configuration = {
    type: "bar",
    data: d,
    options: {
      cutoutPercentage: 75,
      spanGaps: false,
      maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
    },
  };

  return await canvasRenderService23.renderToDataURL(configuration);
};
