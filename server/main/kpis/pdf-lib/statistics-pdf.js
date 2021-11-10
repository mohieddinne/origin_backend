const HTML5ToPDF = require("html5-to-pdf");
const path = require("path");
const Handlebars = require("handlebars");
const fs = require("fs");
const logoBase64 = require("./logo");
const { CanvasRenderService } = require("chartjs-node-canvas");
const { statisticsColors } = require("./colors.js");

const chartCallback = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.defaultFontFamily = "Arial";
  //ChartJS.defaults.global.defaultFontColor = "#000";
  ChartJS.defaults.global.defaultFontSize = 16;
  // ChartJS.defaults.global.defaultWidth = 16;
  ChartJS.plugins.register({
    beforeDraw: function (chartInstance) {
      var ctx = chartInstance.chart.ctx;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    },
  });
};

const height = 700;

const canvasRenderService = new CanvasRenderService(
  height,
  height,
  chartCallback
);

module.exports = async (_data, filters) => {
  const hbsTemplate = fs.readFileSync(
    path.join(
      process.cwd(),
      "assets/hbs-templates/pdfs",
      "statistics.handlebars"
    ),
    "utf8"
  );
  const widgets = [];
  for (const data in _data) {
    let total = 0;
    _data[data].data.forEach((el) => {
      total += el.count;
    });
    const formattedData = _data[data].data
      .filter((el) => el.count !== 0)
      .map((el) => {
        return {
          name: el.name,
          purentage: ((el.count / total) * 100).toFixed(2),
          count: el.count,
        };
      });

    const widgetData = {
      labels: formattedData.map((el) => el.name),
      datasets: [
        {
          data: formattedData.map((el) => el.purentage),
          backgroundColor: statisticsColors,
        },
      ],
    };

    const configuration = {
      tooltips: {
        enabled: true,
      },
      type: "pie",
      data: widgetData,
      options: {
        cutoutPercentage: 75,
        spanGaps: false,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: "right",
        },
      },
    };
    const widget = await canvasRenderService.renderToDataURL(configuration);
    widgets.push({
      formattedData,
      widget,
      title: _data[data].title,
    });
  }
  // widgets.map((widget) => console.log({ ww: widget.formattedData }));
  const template = Handlebars.compile(hbsTemplate);
  const inputBody = template({
    logo: logoBase64,
    data: { widgets },
    filters,
  });
  if (!inputBody) return false;
  // Generate the PDF
  const html5ToPDF = new HTML5ToPDF({
    inputBody,
    pdf: {
      scale: 1,
      format: "A4",
      printBackground: true,
    },
    launchOptions: {
      executablePath: process.env.CHROME_BIN,
      args: ["--no-sandbox", "--headless", "--disable-gpu"],
    },
  });
  await html5ToPDF.start();
  const buffer = await html5ToPDF.build();
  if (!buffer) return false;
  await html5ToPDF.close();
  return buffer.toString("base64");
};
