const helper = require("./helpers");
const { ApolloError } = require("apollo-server-express");
const graphqlFields = require("graphql-fields");

const resolvers = {
  Query: {
    async ActivityLogs(_, { date }, ctx, information) {
      const fields = Object.keys(graphqlFields(information));
      return helper.getAll(fields, date);
    },
  },
};

module.exports = resolvers;
