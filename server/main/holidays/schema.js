const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type Holiday {
    id: ID
    name: String
    date: String
  }

  input HolidayInput {
    id: ID
    name: String
    date: String
  }

  extend type Query {
    holiday(id: ID): Holiday @hasAccess(slug: "holidays", scope: "view")
    holidays(year: Int): [Holiday] @hasAccess(slug: "holidays", scope: "view")
  }

  extend type Mutation {
    deleteHoliday(id: ID!): Boolean
      @hasAccess(slug: "holidays", scope: "delete")
    holiday(data: HolidayInput): Holiday @isAuthenticated
  }
`;

module.exports = schema;
