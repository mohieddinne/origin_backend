const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type Invoice {
    NumeroFacture: ID
    customer: ClientInfo
    NumeroDossier: String
    DateFacturation: String
    HeuresExpert: Float
    MontantHonoraires: Float
    AdmEnPct: Boolean
    PctAdm: Float
    Ferme: Boolean
    AvecDepenses: Boolean
    FF_Depenses: Boolean
    CC1: Boolean
    CC2: Boolean
    Adj1: Boolean
    Adj2: Boolean
    DepensesAdm: Boolean
    HeuresAdm: Float
    TauxAdm: Float
    MontantAdm: Float
    MontantDepenses: Float
    MontantFacture: Float
    FF_Montant: Float
    FF_Pct: Float
    FF_Montant_Tot: Float
    FF_Depenses_Type: Int
    Commentaires: String
    LastModifiedBy: String
    Log1: String
    Log2: String
    NomEmploye1: String
    Id_Emp1: Int
    NomEmploye2: String
    Id_Emp2: Int
    Specimen: String
    Statut: String
    folders: Folder
    ratio: Float
    reviser: String
  }

  input FactureInput {
    NumeroFacture: ID
    NumeroDossier: String
    DateFacturation: String
    HeuresExpert: Float
    MontantHonoraires: Float
    AdmEnPct: Boolean
    PctAdm: Float
    Ferme: Boolean
    AvecDepenses: Boolean
    FF_Depenses: Boolean
    CC1: Boolean
    CC2: Boolean
    Adj1: Boolean
    Adj2: Boolean
    DepensesAdm: Boolean
    HeuresAdm: Float
    TauxAdm: Float
    MontantAdm: Float
    MontantDepenses: Float
    MontantFacture: Float
    Commentaires: String
    LastModifiedBy: String
    FF_Depenses_Type: Int
    FF_Montant: Float
    FF_Pct: Float
    FF_Montant_Tot: Float
    Log1: String
    Log2: String
    NomEmploye1: String
    Id_Emp1: Int
    NomEmploye2: String
    Id_Emp2: Int
    Specimen: String
    Statut: String
  }

  extend type Query {
    # delete this just for testing
    testCron: Boolean

    factures(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
      splited: Boolean
    ): [Invoice] @hasAccess(slug: "invoices", scope: "view", own: true)

    clientInvoices(clientID: ID): [Invoice]
      @hasAccess(slug: "invoices", scope: "view", own: true)

    filtersinvoice(slugs: [String]): [kipsFilters]
      @hasAccess(slug: "invoices", scope: "view", own: true)

    ExporttoExcelInvoice(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
    ): String @hasAccess(slug: "invoices", scope: "view", own: true)
    projectSettings(id: String): [ProjectSettings]
      @hasAccess(slug: "folders", scope: "view", own: true)
    unconfirmedProjectInvoice: [Invoice] @isAuthenticated
    hasAccessToProjectInvoice(folderId: ID!, invoiceId: ID!): Boolean
      @isAuthenticated
  }

  extend type Mutation {
    facture(data: FactureInput, operation: String): Invoice! @isAuthenticated
    defaultProjectSettings(data: ProjectSettingsInput): ProjectSettings
      @hasAccess(slug: "folders", scope: "edit", own: true)
    setDefaultSetting(id: Int): [ProjectSettings]
  }
`;

module.exports = schema;
