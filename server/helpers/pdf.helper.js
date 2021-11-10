const HTML5ToPDF = require("html5-to-pdf");
const path = require("path");
const Handlebars = require("handlebars");
const fs = require("fs");
const logoBase64 = require("./logo");

const formatters = {
  moneyFrmtr: new Intl.NumberFormat("CAD", {
    style: "currency",
    currency: "CAD",
  }),

  numberFrmtr: new Intl.NumberFormat("CAD"),
  dateFmtr: new Intl.DateTimeFormat("CAD"),
};
const isMoney = (item) => /^\d+(?:\.\d{0,2})$/.test(item);
const isDate = (item) => {
  if (Object.prototype.toString.call(item) === "[object Date]") {
    if (isNaN(item.getTime())) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};
module.exports = async function (templatePath, data) {
  const hbsTemplate = fs.readFileSync(
    path.join(process.cwd(), "assets/hbs-templates/pdfs", templatePath),
    "utf8"
  );
  // Check if the file exist
  if (!hbsTemplate) return false;
  const formattedData = { ...data };

  for (const value in data) {
    const item = formattedData[value];
    // Check is money
    if (isMoney(item))
      formattedData[value] = formatters.moneyFrmtr.format(item);
    if (isDate(item)) formattedData[value] = formatters.dateFmtr.format(item);
  }
  const template = Handlebars.compile(hbsTemplate);
  const inputBody = template({ ...formattedData, logo: logoBase64 });

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
