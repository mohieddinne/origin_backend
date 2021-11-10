const { gql } = require("apollo-server-express");

const schema = gql`
  type SavedFilter {
    id: ID!
    name: String!
    view: String!
    user: User
    data: String
  }

  input SavedFilterInput {
    name: String!
    view: String!
    data: String
  }

  input SavedFilterWhere {
    view: String!
  }

  extend type Query {
    savedFilters(where: SavedFilterWhere): [SavedFilter] @isAuthenticated
    savedFilter(id: ID!): SavedFilter @isAuthenticated
  }

  extend type Mutation {
    createSavedFilter(data: SavedFilterInput): SavedFilter @isAuthenticated
    deleteSavedFilter(id: ID!): SavedFilter @isAuthenticated
  }
`;

module.exports = schema;
