const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type MenunNotifications {
    name: String
    value: Int
    url: String
    data: [Int]
  }

  type User {
    code: Int
    userName: String
    courriel: String
    nomFamille: String
    prenom: String
    NomEmploye: String
    actif: Boolean
    sexe: String
    fonction: String
    id_Emp: Int
    picture: String
    role: Role
    accesses: [AccessValue]
    Expert: Boolean
    menunNotifications: [MenunNotifications]
    usesAdvancedFilters: Boolean
  }

  input UserInput {
    id_Emp: ID!
    usesAdvancedFilters: Boolean
  }

  type LoginData {
    token: String
    user: User
  }

  extend type Query {
    me: User @isAuthenticated
  }

  extend type Mutation {
    updateMyUser(data: UserInput): User @isAuthenticated
    signup(userName: String!, courriel: String!, pswd: String!): String
    login(courriel: String!, pswd: String!): LoginData
    token: LoginData
    forgetpassword(courriel: String!): Boolean
    setForgotPassword(token: String!, newpassword: String!): String
    setProfilePicture(file: Upload!): String
    setNewPassword(
      oldpassword: String!
      newpassword: String!
      newpassword2: String!
    ): String
    setUserGroup(groupId: Int!): String
    activateDeactivateUser: Boolean
    userHasAccess(accessSlug: Int!): Boolean
    abulkActivateDeactivateUser(ids: [Int]!, state: Boolean!): Boolean
  }
`;

module.exports = schema;
