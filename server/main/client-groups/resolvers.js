const { ApolloError } = require("apollo-server-express");
const helpers = require("./helpers");
const { requestedFields } = require("-/helpers/graphql.helper");
const { createActivityLog } = require("../core/activity-logs/helpers");

const resolvers = {
  Query: {
    async clientGroups(_, { ids }, { user }, information) {
      const attributes = requestedFields(information);
      return await helpers.getData(ids, { attributes });
    },
  },

  Mutation: {
    async clientGroup(_, args, { user }, information) {
      const data = args.data || null;

      if (!data) {
        const message = "Data is required.";
        throw new ApolloError(message, `INPUT_ERROR`);
      }

      const attributes = requestedFields(information);

      let operation = "create",
        verb = "Creating";
      if (data.id) {
        if (args.operation !== "delete") {
          operation = "update";
          verb = "Updating";
        } else {
          operation = "delete";
          verb = "Deleting";
        }
      }

      const execution = await helpers[operation](data, attributes);

      if (!execution) {
        throw new ApolloError(
          "Error on hanlding the requested operation.",
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }

      createActivityLog(`${operation} client's group (id: ${data.id}).`, user);

      return execution;
    },
  },
};

module.exports = resolvers;
