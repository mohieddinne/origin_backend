const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type AccessValue {
    id: Int
    aid: Int
    value: Boolean
    slug: String
    name: String
    allow_view: Boolean
    allow_view_own: Boolean
    allow_edit: Boolean
    allow_create: Boolean
    allow_delete: Boolean
    can_view: Boolean
    can_view_own: Boolean
    can_edit: Boolean
    can_create: Boolean
    can_delete: Boolean
  }

  type Role {
    id: Int!
    name: String!
    accesses: [AccessValue]
  }

  input RoleInput {
    id: Int
    name: String
  }

  extend type Query {
    roles(ids: [Int]): [Role]
      @hasAccess(slug: "permissions", scope: "view")
    accesses(ids: [Int]): [AccessValue]
      @hasAccess(slug: "permissions", scope: "view")
  }

  extend type Mutation {
    privilege(role: Int!, slug: String!, privilege: String!): Boolean
      @hasAccess(slug: "permissions", scope: "edit")
    role(item: RoleInput!): Role
      @hasAccess(slug: "permissions", scope: "create")
  }
`;

module.exports = schema;
