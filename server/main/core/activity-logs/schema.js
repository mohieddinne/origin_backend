const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type ActivityLog {
    id: ID
    description: String
    author: User
    userName: String
    userEmail: String
    createdAt: String
  }

  extend type Query {
    ActivityLogs(date: String): [ActivityLog]
      @hasAccess(slug: "activity-log", scope: "view")
  }
`;

module.exports = schema;
