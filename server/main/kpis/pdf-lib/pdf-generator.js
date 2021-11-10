const HTML5ToPDF = require("html5-to-pdf");
const path = require("path");
const Handlebars = require("handlebars");
const fs = require("fs");
const logoBase64 = require("./logo");
const { tblClient, ClientGroups, tblEmployes } = require("../../../models");

module.exports = async (widgets, options, id_Emp) => {
  console.log("#######");
  const moneyFrmtr = new Intl.NumberFormat("CAD", {
    style: "currency",
    currency: "CAD",
  });

  const numberFrmtr = new Intl.NumberFormat("CAD");
  const dateFmtr = new Intl.DateTimeFormat("CAD");

  // Customers group name
  if (!!options.customers_groups) {
    options.customers_groups = await ClientGroups.findAll({
      where: { id: options.customers_groups },
      raw: true,
      nest: true,
      attributes: ["name"],
    });
  }

  // Customers  name
  if (!!options.customers) {
    options.customers = await tblClient.findAll({
      where: { NumeroClient: options.customers },
      raw: true,
      nest: true,
      attributes: ["NomClient"],
    });
  }

  // Get the employee name
  const { NomEmploye } = await tblEmployes.findOne({
    where: {
      id_Emp,
    },
    nest: true,
    raw: true,
    attributes: ["NomEmploye"],
  });

  let appendix = null;
  let rate = null;

  if (widgets && Array.isArray(widgets.appendix)) {
    appendix = widgets.appendix.map((folder) => {
      // Get the total amount of the folder invoices
      const sumInvoices = folder.factures.reduce((accumulator, invoice) => {
        const amount = invoice.MontantFacture || 0;
        return accumulator + amount;
      }, 0);
      // Get the concatinated names of the customers
      const customers = folder.clients
        .reduce((accumulator, customer) => {
          const name = customer.NomClient;
          return [...accumulator, name];
        }, [])
        .join(", ");
      // Get the concatinated names of the groups
      const groups = folder.clients
        .reduce((accumulator, customer) => {
          const { group } = customer;
          if (!group) return accumulator;
          return [...accumulator, group.name];
        }, [])
        .join(", ");
      return {
        ...folder.dataValues,
        sumInvoices,
        customers,
        groups,
      };
    });
    // Calc the total amount of bills
    rate = appendix.reduce(
      (accumulator, { sumInvoices }) => accumulator + sumInvoices,
      0
    );
  }

  const data = {
    ...(widgets || {}),
    ...options,
    appendix: appendix ? appendix : null,
    officesWidget: widgets && widgets.offices,
    customersWidget: widgets && widgets.customer,
    date_start: (options.date_start && options.date_start[0]) || null,
    date_end: (options.date_end && options.date_end[0]) || null,
    me: NomEmploye,
    income: Boolean(options.math && options.math == "income"),
    rate,
  };

  if (Array.isArray(data.bestClients))
    data.bestClients = data.bestClients.map((item, key) => ({
      rank: key + 1,
      ...item,
      income: moneyFrmtr.format(item.income),
      folders: numberFrmtr.format(item.folders),
      color: "blue",
    }));

  if (Array.isArray(data.appendix))
    data.appendix = data.appendix.map((item) => ({
      ...item,
      DateMandat: dateFmtr.format(item.DateMandat),
    }));

  // Get timestamp
  data.timestamp = getTimestamp();

  // Adding the logo
  data.logo = logoBase64.default;

  // Generate the HTML
  let inputBody;
  try {
    const hbsTemplate = fs.readFileSync(
      path.join(process.cwd(), "assets/hbs-templates/pdfs", "kpis.handlebars"),
      "utf8"
    );

    // Functions
    Handlebars.registerHelper("wordBreaker", (string, size = 32) => {
      const regex = new RegExp(`.{1,${size}}`, "g");
      return (
        string && new Handlebars.SafeString(string.match(regex).join("<br/>"))
      );
    });
    Handlebars.registerHelper("dateFormatter", (string) => {
      if (!string) return "";
      try {
        const date = new Date(string);
        return dateFmtr.format(date);
      } catch (error) {
        return string;
      }
    });

    Handlebars.registerHelper("moneyFrmtr", (floatNumber) => {
      if (!floatNumber) return 0;
      try {
        return moneyFrmtr.format(floatNumber);
      } catch (error) {
        return floatNumber;
      }
    });

    Handlebars.registerHelper("math", (math) => {
      if (math === options.math) return "active";
    });
    Handlebars.registerHelper("ifany", (...args) => {
      const data = args.filter((item) => typeof item !== "object");
      return Boolean(data.find((item) => item));
    });
    Handlebars.registerHelper("join", function (array, selector, sep) {
      if (!Array.isArray(array)) return "Non spécifié";
      return array.map((item) => (selector ? item[selector] : item)).join(sep);
    });
    Handlebars.registerHelper("calRender", (math) => {
      if (options.math === "income") return "Chiffre d'affaire ";
      else return "Nombre de dossier";
    });
    Handlebars.registerHelper("ifEquals", function (arg2, option) {
      return options.math == arg2 ? option.fn(this) : option.inverse(this);
    });

    const template = Handlebars.compile(hbsTemplate);
    inputBody = template(data);
  } catch (error) {
    console.log({ error });
    throw error;
  }
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
function getTimestamp() {
  const today = new Date();
  return (
    today.getFullYear() +
    "/" +
    today.getMonth() +
    "/" +
    today.getDate() +
    " " +
    today.getHours() +
    ":" +
    today.getMinutes()
  );
}
