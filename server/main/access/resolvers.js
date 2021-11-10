const hlprs = require("./helpers");
const userHelpers = require("../user/helpers");
const i18nHelper = require("../../helpers/i18n.helper");
const { ApolloError } = require("apollo-server-express");
const { createActivityLog } = require("../core/activity-logs/helpers");

const resolvers = {
  Query: {
    async roles(_, args) {
      return await hlprs.getRoles(args.ids);
    },
    async accesses(_, args) {
      return await hlprs.getAccesses(args.ids);
    },
  },

  Mutation: {
    async privilege(_, { role, slug, privilege }, user) {
      // Execute the operation
      try {
        await hlprs.toggleAccess(role, slug, privilege);
      } catch (e) {
        console.log(e);
        const error = "Error updating the privilege.";
        throw new ApolloError(error, "SERVER_ERROR");
      }
      createActivityLog(
        `Privilege (roleID: ${role}, slug: ${slug}, privilege: ${privilege}) has been toggled.`,
        user
      );
      return true;
    },
    async role(_, { item }, { user }) {
      // Execute the operation
      try {
        const role = await hlprs.createRole(item);
        createActivityLog(
          `A new role (roleID: ${role.niveau}, name: ${role.description}) is created.`,
          user
        );
        return {
          id: role.niveau,
          name: role.description,
        };
      } catch (error) {
        console.log(error);
        const message = "Error creating role";
        throw new ApolloError(message, "SERVER_ERROR");
      }
    },
  },
};

module.exports = resolvers;
