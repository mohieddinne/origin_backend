const { ApolloError } = require("apollo-server-express");
const { requestedFields } = require("../../../helpers/graphql.helper");
const helpers = require("./helpers");

const resolvers = {
  Query: {
    async emailTemplates(_, { ids, categoryId }, user, information) {
      // Get asked attributes

      const attributes = requestedFields(information);
      // Get the data and sent it back
      return await helpers.getData({ ids, categoryId, attributes });
    },

    async emailTemplatesCategories(_, { ids = [] }, user, information) {
      // Get asked attributes
      const attributes = requestedFields(information);
      // Get the data and sent it back
      return await helpers.getGategoryData({ ids, attributes });
    },
  },

  Mutation: {
    async activeEmailTemplate(_, { id }, { user }) {
      const execution = await helpers.activeEmailTemplate(id);
      if (!execution) {
        throw new ApolloError(error, "ERROR_UPDATING_EMAIL_TEMPLATE");
      }
      createActivityLog("The email template is activated/disactivated.", user);
      return true;
    },
    async emailTemplateContent(_, { data }, ctx) {
      // Handle data
      const execution = await helpers.update(data);
      if (!execution) {
        throw new ApolloError("SERVER_ERROR", `SERVER_ERROR_Update_CONTENT`);
      }
      createActivityLog(
        `The email template (id: ${data.id}) is updated.`,
        user
      );
      return true;
    },
  },
};

module.exports = resolvers;
