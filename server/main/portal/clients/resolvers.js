const { ApolloError } = require("apollo-server-express");
const graphFields = require("graphql-fields");
const i18nHelper = require("../../../helpers/i18n.helper");
const { requestedFields } = require("../../../helpers/graphql.helper");
const dataToExel = require("../../../libs/exel-generator");
const hlprs = require("./helpers");
const { createActivityLog } = require("../../core/activity-logs/helpers");

const resolvers = {
  Query: {
    async customerProjectSetting(root, { customerId }, ctx, info) {
      return await hlprs.getCustomerProjectSettings(customerId);
    },
    async groupClient(_, { ids = [] }) {
      return await hlprs.group(ids);
    },

    async clients(_, args, { user, privilege }, information) {
      const { ids = [], search } = args;
      const attributes = requestedFields(information);
      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "employees",
          value: [user.NomEmploye],
        });
      }
      const clients = await hlprs.getSuperData(ids, {
        attributes,
        search,
        filters,
      });

      return clients;
    },

    async filtersclient(_, { slugs }) {
      return await hlprs.filters(slugs);
    },

    async clientsToFile(_, args, { privilege }) {
      const { ids, search } = args;

      const attributes = {
        NumeroClient: null,
        NomClient: null,
        Inactif: null,
        TypeClient: null,
        Adresse: null,
        Ville: null,
        group: {
          name: null,
        },
      };

      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "employees",
          value: [user.NomEmploye],
        });
      }

      const db_data = await hlprs.getSuperData(ids, {
        attributes,
        search,
        filters,
      });

      if (!Array.isArray(db_data)) {
        const error = "Error getting the raw data.";
        throw new ApolloError(error, "DATA_ERROR");
      }

      function labels(item) {
        if (item === "group") return "Groupe";
        return item.split(/(?=[A-Z-_])/).join(" de ");
      }

      // Flatten the object
      const data = db_data.map((item) => {
        const element = Object.assign({}, item);
        if (item.group) element.group = item.group.name;
        element.Inactif = item.Inactif === 0 ? "Non" : "Oui";
        return element;
      });

      const buffer = await dataToExel(data, labels);
      const base64 = buffer.toString("base64");
      if (!base64) {
        const error = "Error generating file";
        throw new ApolloError(error, "FILE_ERROR");
      }

      createActivityLog(
        `Clients Excel report generated with ${db_data.length} clients data.`
      );

      return base64;
    },

    // Get client contact
    // params [ids]
    // data [contacts]
    async clientContacts(_, args, { user, privilege }, information) {
      const clientIds = args.clientIds || [];
      const attributes = requestedFields(information);

      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "employees",
          value: [user.NomEmploye],
        });
      }

      const contacts = await hlprs.getClientContacts(clientIds, {
        attributes,
        filters,
      });

      return contacts;
    },

    // Get a single contact
    async clientContact(_, { id }, { user, privilege }, information) {
      const attributes = requestedFields(information);

      // Check for the can_view_own
      const filters = [];
      if (id) {
        filters.push({
          name: "id",
          value: [id],
        });
      }
      if (privilege === "can_view_own") {
        filters.push({
          name: "employees",
          value: [user.NomEmploye],
        });
      }

      const contacts = await hlprs.getClientContacts(null, {
        attributes,
        filters,
      });

      if (Array.isArray(contacts) && contacts[0]) return contacts[0];

      return null;
    },
  },

  Mutation: {
    async customerProjectSetting(_, { data }, { user }, information) {
      if (!data) {
        const message = "Data is required.";
        throw new ApolloError(message, `INPUT_ERROR`);
      }
      const id = data.id;
      let operation = "createCustomerProjectSetting";
      if (id) operation = "updateCustomerSetting";
      const execution = await hlprs[operation](data, id);
      if (!execution) {
        throw new ApolloError(
          "Error on hanlding the requested operation.",
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      return execution;
    },
    async client(_, { data, operation }, { user }, information) {
      const attributes = requestedFields(information);

      const execution = await hlprs[operation](data, attributes);
      if (!execution) {
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      createActivityLog(`Client updated/created/deleted.`, user);
      return execution;
    },
  },
};

module.exports = resolvers;
