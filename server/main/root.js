const { gql } = require("apollo-server-express");

// Handel diffrent Apollo Schemas and Resolvers
const rootSchema = gql`
  directive @isAuthenticated on OBJECT | FIELD_DEFINITION
  directive @hasAccess(
    slug: String
    scope: String
    own: Boolean
  ) on OBJECT | FIELD_DEFINITION
  """
  Deprecated
  """
  directive @access(slug: String) on FIELD_DEFINITION

  enum Languages {
    fr_CA
  }

  scalar Date

  input PagingOptions {
    """
    The numbers of requested items
    """
    first: Int!
    """
    The page pointer (number)
    """
    pointer: Int
    """
    The offset rows to skip
    """
    offset: Int
  }

  input FilterInput {
    name: String
    value: String
  }

  input ArrayFilterInput {
    name: String
    value: [String]
  }

  type AsyncData {
    totalCount: Int
    pageInfo: AsyncDataPageInfo
    nodes: [AsyncDataNode]
    edges: [AsyncDataEdges]
  }

  type AsyncDataPageInfo {
    endCursor: String
    hasNextPage: Boolean
  }

  type AsyncDataEdges {
    node: AsyncDataNode
    cursor: String
  }

  interface AsyncDataNode {
    id: ID
  }

  type Query {
    root: String
  }

  type Mutation {
    root: String
  }

  type Subscription {
    root: String
  }
`;

module.exports = rootSchema;
