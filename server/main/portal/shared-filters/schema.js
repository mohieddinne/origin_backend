const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type SharedFiltersData {
    totalCount: Int
    pageInfo: SharedFiltersDataPageInfo
    nodes: [SharedFiltersDataNode]
    edges: [SharedFiltersDataEdges]
  }

  type SharedFiltersDataEdges {
    node: SharedFiltersDataNode
    cursor: String
  }

  type SharedFiltersDataNode {
    name: String
    value: ID
    color: String
    favorite: Boolean
  }

  type SharedFiltersDataPageInfo {
    endCursor: String
    hasNextPage: Boolean
  }

  extend type Query {
    sharedFilter(slug: String!, after: String, limit: Int): SharedFiltersData
      @isAuthenticated
  }
`;

module.exports = schema;
