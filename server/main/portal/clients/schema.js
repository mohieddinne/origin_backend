const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type ClientInfo {
    NumeroClient: ID
    NomClient: String
    Inactif: Boolean
    TypeClient: String
    Adresse: String
    Ville: String
    CodePostal: String
    Courriel: String
    TelBureau: String
    TelFax: String
    TelCellulaire: String
    TelDomicile: String
    TelAutre: String
    SiteWeb: String
    Langue: String
    Commentaires: String
    Directives: String
    createdAt: String
    updatedAt: String
    groupId: Int
    folders: [Folder]
    group: Group
    contacts: [CustomerContact]
  }

  type CustomerContact {
    id: ID
    clientId: String
    name: String
    title: String
    position: String
    jobTitle: String
    address: String
    city: String
    zip: String
    email: String
    phone: String
    fax: String
    mobile: String
    homeTel: String
    otherTel: String
    comments: String
    inactive: Boolean
    client: ClientInfo
  }

  type Group {
    id: ID
    name: String
    color: String
  }

  input ClientInput {
    NumeroClient: ID
    NomClient: String
    Inactif: Boolean
    TypeClient: String
    Adresse: String
    Ville: String
    CodePostal: String
    Courriel: String
    TelBureau: String
    TelFax: String
    TelCellulaire: String
    TelDomicile: String
    TelAutre: String
    SiteWeb: String
    Langue: String
    Commentaires: String
    Directives: String
    groupId: Int
  }

  input GroupInput {
    id: ID
    name: String
    color: String
  }

  extend type Query {
    groupClient(ids: [ID]): [Group] @isAuthenticated

    clients(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
    ): [ClientInfo] @hasAccess(slug: "clients", scope: "view", own: true)

    clientContacts(
      clientIds: [ID]
      search: String
      filters: [ArrayFilterInput]
    ): [CustomerContact] @hasAccess(slug: "clients", scope: "view", own: true)

    clientContact(id: ID!): CustomerContact
      @hasAccess(slug: "clients", scope: "view", own: true)

    clientsToFile(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
      format: String
    ): String @hasAccess(slug: "clients", scope: "view", own: true)
    filtersclient(slugs: [String]): [kipsFilters] @isAuthenticated
    customerProjectSetting(customerId: ID): ProjectSettings
    # @hasAccess(slug: "invoice-client-setting", scope: "view", own: true)
  }

  extend type Mutation {
    # groupClientInput(data: GroupInput):[Group]
    client(data: ClientInput!, operation: String): ClientInfo!
      @access(slug: "clients")
      @isAuthenticated
    customerProjectSetting(data: ProjectSettingsInput): ProjectSettings
    # @hasAccess(slug: "invoice-client-setting", scope: "edit", own: true)
  }
`;

module.exports = schema;
