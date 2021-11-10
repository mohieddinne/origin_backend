const { ApolloError } = require("apollo-server-express");
const { requestedFields } = require("../../../helpers/graphql.helper");
const helpers = require("./helpers");

const resolvers = {
  Query: {
    async savedFilters(_, { where }, { user }, information) {
      const attributes = requestedFields(information);
      let filters;
      try {
        filters = await helpers.getFilters({
          where: { ...where, userId: user.id_Emp },
          attributes,
        });
      } catch (error) {
        console.error(error);
        const message = "Error retrieving the requested filters";
        throw new ApolloError(message, "ERROR_QUERY_FILTERS");
      }
      return filters;
    },
    async savedFilter(_, { id }, { user }, information) {
      const attributes = requestedFields(information);
      let filters;
      try {
        filters = await helpers.getFilters({
          where: { id, userId: user.id_Emp },
          attributes,
        });
      } catch (error) {
        console.error(error);
        const message = "Error retrieving the requested filter";
        throw new ApolloError(message, "ERROR_QUERY_FILTER");
      }
      return filters[0];
    },
  },
  Mutation: {
    async createSavedFilter(_, { data }, { user }, information) {
      const attributes = requestedFields(information);
      let filter;
      try {
        filter = await helpers.create({
          data: { ...data, userId: user.id_Emp },
          attributes,
        });
      } catch (error) {
        const message = "Error creating the filter";
        throw new ApolloError(message, "ERROR_CREATE_FILTER");
      }
      return filter;
    },
    async deleteSavedFilter(_, { id }, { user }, information) {
      const attributes = requestedFields(information);
      let filter;
      try {
        filter = await helpers.delete({
          data: { id, userId: user.id_Emp },
          attributes,
        });
      } catch (error) {
        console.error(error);
        const message = "Error deleting the filter";
        throw new ApolloError(message, "ERROR_DELETE_FILTER");
      }
      return filter;
    },
  },
};

module.exports = resolvers;
