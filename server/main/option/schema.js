const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type OptionData {
    name: String!
    value: String
    access: String
  }

  input OptionInput {
    name: String!
    value: String!
  }

  extend type Query {
    options(slugs: [String]): [OptionData]
  }

  extend type Mutation {
    updateOptions(options: [OptionInput]): Boolean
      @hasAccess(slug: "config", scope: "edit")
    updateHomeBackgroundImageOption(file: Upload!): String
      @hasAccess(slug: "config", scope: "edit")
    uploadImage(file: Upload!, attachedTo: String!): String @isAuthenticated
  }
`;

module.exports = schema;
