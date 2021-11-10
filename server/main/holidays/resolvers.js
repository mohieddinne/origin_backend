const { ApolloError } = require("apollo-server-express");
const helpers = require("./helpers");
const { requestedFields } = require("-/helpers/graphql.helper");
const { createActivityLog } = require("../core/activity-logs/helpers");

const resolvers = {
  Query: {
    async holiday(_, { id }, ctx, information) {
      if (!id) return null;
      const attributes = requestedFields(information);
      const items = await helpers.getData({ id, attributes });
      if (items && items[0]) return items[0];
      return null;
    },
    async holidays(_, { year }, ctx, information) {
      const attributes = requestedFields(information);
      return await helpers.getData({ year, attributes });
    },
  },

  Mutation: {
    async deleteHoliday(_, attrs, { user }, information) {
      const id = parseInt(attrs.id);
      const execution = await helpers.delete(id);
      if (!execution) {
        throw new ApolloError(
          "Error deleting the holiday",
          "SERVER_ERROR_DELETING_HOLIDAY"
        );
      }
      createActivityLog(`A holiday (ID: ${id}) has been deleted`, user);
      return true;
    },
    async holiday(_, { data }, { user }, information) {
      const attributes = requestedFields(information);
      const operation = data.id ? "update" : "create";
      const execution = await helpers[operation](data, attributes);
      if (!execution) {
        throw new ApolloError(
          `Error ${operation.toUpperCase()}ing the holiday`,
          `SERVER_ERROR_${operation.toUpperCase()}_HOLIDAY`
        );
      }

      if (operation === "update")
        createActivityLog(`A Holiday (id: ${data.id}) has been updated`, user);
      else
        createActivityLog(
          `A new holiday is created (name: ${data.name}).`,
          user
        );

      return execution;
    },
  },
};

module.exports = resolvers;
