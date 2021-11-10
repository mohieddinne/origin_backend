const { ApolloError } = require("apollo-server-express");
const factureHelpers = require("./helpers");
const i18nHelper = require("../../../helpers/i18n.helper");
const graphFields = require("graphql-fields");
const { requestedFields } = require("../../../helpers/graphql.helper");
const dataToExel = require("../../../libs/exel-generator");
const { formatLongDate } = require("../../../helpers/dates.helper");
const uHlprs = require("../../user/helpers");
const { createActivityLog } = require("../../core/activity-logs/helpers");

const { generateProjectOfInvoice } = require("./crons");

const hA = uHlprs.hasAccess.bind(uHlprs);

const resolvers = {
  Query: {
    async hasAccessToProjectInvoice(_, { invoiceId, folderId }, { user }) {
      return await factureHelpers.hasAccessToProjectInvoice(
        user.id_Emp,
        invoiceId,
        folderId
      );
    },
    async projectSettings(root, { id }, ctx, info) {
      return await factureHelpers.getProjectSettings(id);
    },
    async testCron(_) {
      return await generateProjectOfInvoice();
    },
    async factures(_, args, { privilege, user }, information) {
      const { ids, search } = args;

      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "staff",
          value: [user.NomEmploye],
        });
      }

      // Execute the operation
      const options = {
        requestedFields: requestedFields(information),
        search,
        filters,
        splited: args.splited || false,
        employeeName: user.NomEmploye,
      };

      return await factureHelpers.getData(ids, options);
    },
    async unconfirmedProjectInvoice(_, args, { user }, info) {
      return await factureHelpers.unconfirmedProjectInvoice(user.id_Emp);
    },
    async clientInvoices(_, { clientID }, { user, privilege }, information) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;

      // Execute the operation
      const requestedAttrs = requestedFields(information);
      return await factureHelpers.getClientInvoices(
        clientID,
        requestedAttrs,
        userFullName
      );
    },

    async filtersinvoice(_, { slugs }, { user, privilege }, information) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;

      return await factureHelpers.filters(slugs, userFullName);
    },

    async ExporttoExcelInvoice(_, args, { user, privilege }) {
      const attributes = {
        NumeroFacture: null,
        customer: {
          NomClient: null,
          NumeroClient: null,
        },
        folders: {
          Bureau: null,
        },
        customer: {
          NomClient: null,
          NumeroClient: null,
        },
        DateFacturation: null,
        MontantHonoraires: null,
        MontantDepenses: null,
        ratio: null,
        MontantFacture: null,
        reviser: null,
      };

      const { ids, search } = args;

      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "staff",
          value: [user.NomEmploye],
        });
      }

      const options = {
        requestedFields: attributes,
        search,
        filters,
        splited: true,
      };

      const data = await factureHelpers.getData(ids, options).then((items) => {
        return items.map((item) => {
          let row = {};
          row.NumeroFactureClear = item.NumeroFactureClear;
          row.NumeroFacture = item.NumeroFacture;
          row.customer = null;
          row = { ...row, ...item };

          if (item.customer) row.customer = item.customer.NomClient;
          if (item.folders) row.folders = item.folders.Bureau;
          if (item.DateFacturation)
            row.DateFacturation = formatLongDate(item.DateFacturation);
          return row;
        });
      });

      function labels(item) {
        let label;
        switch (item) {
          case "NumeroFactureClear":
            label = "N° facture";
            break;
          case "NumeroFacture":
            label = "N° facture client";
            break;
          case "DateFacturation":
            label = "Date de facturation";
            break;
          case "MontantHonoraires":
            label = "Montant Honoraires";
            break;
          case "income":
            label = "Chiffre d'affaire";
          case "MontantAdm":
            label = " Montant Adm";
            break;
          case "NumeroDossier":
            label = "N° de dossier ";
            break;
          case "customer":
            label = "Client";
            break;
          case "folders":
            label = "Bureau";
            break;
          case "ratio":
            label = "Pourcentage ";
            break;
          case "reviser":
            label = "Reviseur";
            break;
          default:
            label = item.split(/(?=[A-Z-_])/).join(" de ");
        }
        return label;
      }

      if (!Array.isArray(data))
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_DATA_CALC`
        );

      const buffer = await dataToExel(data, labels);
      const base64 = buffer.toString("base64");
      if (!buffer || !base64)
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR__CONTENT`
        );

      createActivityLog(
        `Invoices Excel report generated with ${data.length} invoices data.`,
        user
      );

      return base64;
    },
  },

  Mutation: {
    async facture(_, args, { user }, information) {
      // Get the operation name
      const data = args.data;
      let operation = args.operation;
      if (!operation) operation = data.NumeroFacture ? "update" : "create";

      // Verify the operation
      const allowedOps = ["update", "create", "delete"];
      const opKey = allowedOps.indexOf(operation);
      if (opKey < 0) {
        const error = "Operation unkown.";
        throw new ApolloError(error, "REQUEST_ERROR");
      }

      // Check for privilege
      const privileges = ["edit", "create", "delete"];
      const privilege = privileges[opKey];
      const canOp = await hA("invoices", `can_${privilege}`, user.id_Emp);
      if (!canOp) {
        const error = `You are not authorized to ${operation}.`;
        throw new ApolloError(error, "NOT_AUTHORIZED");
      }
      const canView = await hA("invoices", "can_view", user.id_Emp);
      if (!canView) {
        const canViewOwn = await hA("invoices", "can_view_own", user.id_Emp);
        if (!canViewOwn) {
          const error = "You are not authorized for this resource.";
          throw new ApolloError(error, "NOT_AUTHORIZED");
        }
        const isOwner = await factureHelpers.isOwner(
          data.NumeroFacture,
          user.NomEmploye
        );
        if (!isOwner) {
          const error = "You are not authorized for this resource.";
          throw new ApolloError(error, "NOT_AUTHORIZED");
        }
      }

      const attributes = Object.keys(graphFields(information) || {});
      const execution = await factureHelpers[operation](data, attributes);
      if (!execution) {
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      createActivityLog("Invoice mutated.", user);

      return execution;
    },
    async defaultProjectSettings(_, { data }, { user }, information) {
      if (!data) {
        const message = "Data is required.";
        throw new ApolloError(message, `INPUT_ERROR`);
      }
      const id = data.id;
      let operation = "createDefaultSetting";
      if (id) operation = "updateDefaultSetting";
      const execution = await factureHelpers[operation](data, id);
      if (!execution) {
        throw new ApolloError(
          "Error on hanlding the requested operation.",
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      return execution;
    },
    async setDefaultSetting(root, { id }, ctx, info) {
      if (!id) throw new Error("id is required");
      return await factureHelpers.toggleInvoiceSetting(id);
    },
  },
};

module.exports = resolvers;
