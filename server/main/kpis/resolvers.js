const { ApolloError } = require("apollo-server-express");
const i18nHelper = require("../../helpers/i18n.helper");
const helper = require("./helpers");
const userHelpers = require("../user/helpers");
const folderHelper = require("../portal/folders/helpers");
const charts = require("./pdf-lib/charts.render");
const pdfGenerator = require("./pdf-lib/pdf-generator");
const exelGen = require("./exel-lib/exel-generator");
const { createActivityLog } = require("../core/activity-logs/helpers");

const hA = userHelpers.hasAccess.bind(userHelpers);

const resolvers = {
  Query: {
    // Resolver for kpi_pdf query, pleack check the schema documentation
    async customer_reports(root, { filters }, ctx, info) {
      return helper.customer_reports(filters);
    },

    async customer_reports_details(root, { filters }, ctx, info) {
      const options = renderQueryOptions(filters);
      return helper.customer_reports_details(options);
    },

    async kpis_statistics(root, { filters }, ctx, info) {
      const options = renderQueryOptions(filters);
      return helper.statistics(options);
    },

    async kpis_statistics_pdf(root, { filters, widget }, ctx, info) {
      const options = renderQueryOptions(filters);
      const data = {};
      const office = options?.offices || null;
      const _options = { ...options, offices: undefined };
      delete _options.offices;
      if (!widget)
        data.all = {
          title: await helper.pdfTitle(options),
          data: await helper.statistics(_options),
        };
      if (office) {
        for (const item of office)
          data[item] = {
            title: await helper.pdfTitle(options, item),
            data: await helper.statistics({
              ...options,
              offices: [item],
            }),
          };
      }

      return await helper.kpis_statistics_pdf(data, options);
    },

    async kpi_pdf(_, args, { user }) {
      const { filters, math } = args;
      const { id_Emp } = user;
      // Check access
      const [isAdmin, isUser] = await Promise.all([
        hA("kpis", "can_view", id_Emp),
        hA("kpis", "can_view_own", id_Emp),
      ]);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      // Get options and configuration
      const options = renderQueryOptions(filters);
      const count = math === "income" ? "income" : "number";
      const limit = 10;
      options.math = count;

      // Get PDF widgets
      const selectedWidgets = (args.options || [])
        .filter((widget) => widget.value)
        .map((widget) => widget.name);

      /* Prepare the content for the PDF*/
      // Create the promises for data

      const widgetsNames = [
        "lossesAndOffices",
        "customerGroups",
        "customer",
        "foldersTypes",
        "offices",
      ].filter((widget) => selectedWidgets.includes(widget));
      const promises = widgetsNames.map((widget) => {
        const helper = require(`./helpers/${widget}`);
        return new Promise(async (resolve) => {
          const data = await helper(count, options);
          const base64 = await charts[widget](count, data);

          resolve({
            [widget]: base64,
            data,
          });
        });
      });
      // Promise.all for better performance then a multiple await
      const widgets = await Promise.all(promises).then((data) =>
        Object.assign({}, ...data)
      );
      // Getting best clients data

      if (selectedWidgets.includes("bestClients")) {
        const helper = require(`./helpers/bestClients`);

        widgets.bestClients = await helper(
          options,
          limit,
          count,
          isUser ? id_Emp : null
        );
      }

      if (selectedWidgets.includes("appendix")) {
        const attributes = {
          NumeroDossier: null,
          Reference: null,
          Bureau: null,
          Responsable: null,
          DateMandat: null,
          TypeDePerte: null,
          clients: {
            NomClient: null,
            group: {
              id: null,
              name: null,
            },
          },
          factures: { MontantFacture: null },
        };
        widgets.appendix = await folderHelper.getData(null, {
          attributes,
          filters,
        });
      }
      try {
        const file = await pdfGenerator(widgets, options, id_Emp);
        createActivityLog("A KPIs PDF reported is generated", user);
        return file;
      } catch (error) {
        throw new ApolloError("server_error");
      }
    },

    // Get Widgets Data
    async kpi_xls(_, args, { user }) {
      // TODO DATA PROTECTION
      const { widget, math, filters } = args;
      const options = renderQueryOptions(filters);
      const data = await helper.data(widget, math, options);

      if (!Array.isArray(data))
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${widget.toUpperCase()}_DATA_CALC`
        );

      const buffer = await exelGen(data);
      const base64 = buffer.toString("base64");

      if (!buffer || !base64) {
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${widget.toUpperCase()}_CONTENT`
        );
      }

      createActivityLog("A KPIs Excel reported is generated", user);

      return base64;
    },

    // Get Widgets Data
    async kpi_widgets_data(_, args) {
      const { widget, math, filters } = args;
      const options = renderQueryOptions(filters);
      if (args.rowFilter) {
        const options = renderQueryOptions(args.rowFilter);
        const moreDetails = await helper.data(
          widget,
          math,
          options,
          args.rowFilter
        );
        return moreDetails;
      }
      const data = await helper.data(widget, math, options);

      if (!Array.isArray(data))
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${widget.toUpperCase()}_DATA_CALC`
        );
      return data;
    },

    async kpi_losses_and_offices(_, args, { user }) {
      const { id_Emp } = user;

      // Check access
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }
      const options = renderQueryOptions(args.filters);
      const count = args.math === "income" ? "income" : "number";

      // Get the data and return it
      const helper = require("./helpers/lossesAndOffices");
      const data = await helper(count, options);
      return data;
    },

    async kpi_customer_groups(_, args, { user }) {
      if (!user || !user.id_Emp) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);
      const count = args.math === "income" ? "income" : "number";

      // Get the data and return it
      const helper = require("./helpers/customerGroups");
      return await helper(count, options);
    },

    async kpi_customers(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);
      const count = args.math === "income" ? "income" : "number";

      // Get the data and return it
      const helper = require("./helpers/customer");

      return await helper(count, options, args.limit);
    },

    async kpi_folders_types(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);
      const count = args.math === "income" ? "income" : "number";

      // Get the data and return it
      const helper = require("./helpers/foldersTypes");
      return await helper(count, options);
    },

    async kpi_offices(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);
      const count = args.math === "income" ? "income" : "number";

      // Get the data and return it
      const helper = require("./helpers/offices");
      return await helper(count, options);
    },

    async kpi_best_clients(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);

      // Get the data and return it
      const helper = require("./helpers/bestClients");
      return await helper(options, args.limit, args.order);
    },

    async widgetAvrgDelais(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      const options = renderQueryOptions(args.filters);

      // Get the data and return it
      const helper = require("./helpers/widgetAvrgDelais");
      return await helper(options);
    },

    async kpis_filters(_, args, { user }) {
      // Check access
      const { id_Emp } = user;
      const isAdmin = await hA("kpis", "can_view", id_Emp);
      const isUser = await hA("kpis", "can_view_own", id_Emp);
      if (!isAdmin && !isUser) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      // Get the data and return it
      return await helper.filters(isAdmin);
    },

    async customer_reports_total(_, { office }, { user }) {
      if (["Montréal", "QC", "RDL", "Quebéc", null, "all"].includes(office)) {
        let formattedOffice = office;
        if (office === "Quebéc") {
          formattedOffice = "QC";
        }
        if (office === "all") {
          formattedOffice = null;
        }
        return await helper.customer_reports_total(formattedOffice);
      } else {
        throw new ApolloError("INPUT_ERROR");
      }
    },
  },
};

function renderQueryOptions(optionsArray) {
  if (!Array.isArray(optionsArray)) {
    return {};
  }
  const options = {};
  optionsArray.map((option) => {
    options[option.name] = option.value;
  });
  return options;
}

module.exports = resolvers;
