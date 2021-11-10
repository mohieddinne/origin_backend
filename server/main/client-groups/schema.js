const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type ClientGroups {
    id: ID
    name: String
    color: String
    clientCount: Int
    fallback: Boolean
    favorite: Boolean
  }

  input ClientGroupsInput {
    id: ID
    name: String
    color: String
    fallback: Boolean
    clientCount: Int
    favorite: Boolean
  }

  extend type Query {
    clientGroups(ids: [ID]): [ClientGroups]
      @hasAccess(slug: "clients_group", scope: "view")
  }

  extend type Mutation {
    clientGroup(data: ClientGroupsInput, operation: String): ClientGroups
      @isAuthenticated
  }
`;

module.exports = schema;
