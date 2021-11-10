const hlprs = require("./helpers");
const userHelpers = require("../../user/helpers");
const i18nHelper = require("../../../helpers/i18n.helper");
const { ApolloError } = require("apollo-server-express");
const { requestedFields } = require("../../../helpers/graphql.helper");
const { createActivityLog } = require("../activity-logs/helpers");

const hA = userHelpers.hasAccess.bind(userHelpers);

const resolvers = {
  Query: {
    async menuItems(_, args, { user }, information) {
      // Get the data
      const attributes = requestedFields(information);
      return await hlprs.get(user.id_Emp, attributes);
    },
    async menuItemsAdmin(_, args, { user }, information) {
      // Get the data
      const attributes = requestedFields(information);
      return await hlprs.getForAdmin(attributes);
    },
  },

  Mutation: {
    async menuItems(_, { items, deletedItems }, { user }) {
      const operation = await hlprs.handle(items, deletedItems, user.id_Emp);
      if (!operation) {
        createActivityLog("Error updating the Dynamic menu", user);
        const error = "Error updating the Dynamic menu";
        throw new ApolloError(error, "SERVER_ERROR_UPDATING_MENU_ITEM");
      }
      createActivityLog("The dynamic menu is updated", user);

      return [];
    },
  },
};

module.exports = resolvers;
