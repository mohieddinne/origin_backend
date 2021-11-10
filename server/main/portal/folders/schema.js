const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type Folder {
    NumeroDossier: ID
    RecuPar: String
    Responsable: String
    Bureau: String
    Repertoire: String
    TelephonerPourRDV: Boolean
    Budget: Float
    TempsEstime: Int
    MontantPerte: Float
    TypeDePerte: String
    NomAssure: String
    Reference: String
    AdresseAssure: String
    VilleAssure: String
    CodePostalAssure: String
    TypeAssure: String
    TypeBatiment: String
    PersonneContactAssure: String
    CourrielContactAssure: String
    TelBureauContactAssure: String
    TelFaxContactAssure: String
    TelCellulaireContactAssure: String
    TelDomicileContactAssure: String
    TelAutreContactAssure: String
    CommentaireContactAssure: String
    AdressePerte: String
    VillePerte: String
    CodePostalPerte: String
    DescriptionMandat: String
    AutresDirectives: String
    DateFerme: String
    MarqueVE: String
    ModeleVE: String
    AnneeVE: Int
    NIVVE: String
    LieuEntreposageVE: String
    PersonneContactVE: String
    TelPersonneContactVE: String
    NoStockVE: String
    AdresseVE: String
    VilleVE: String
    CodePostalVE: String
    NotesVE: String
    LieuEntreposage: String
    Etagereids: String
    FraisEntreposage: Float
    FraisDestruction: Float
    DimensionTotaleSpecimenH: Int
    DimensionTotaleSpecimenL: Int
    DimensionTotaleSpecimenP: Int
    FraisChargePar: String
    FraisDestructionChargePar: String
    CauseSinistre: String
    EquipementEnCause: String
    Manufacturier: String
    Modele: String
    ResultatProces: String
    NoteProces: String
    NumeroJugement: String
    DateProchaineActivite: String
    Responsable_Ajd_ID_Emp: Int
    Forfait: Int
    DatePerte: String
    HeurePerte: Date
    DateMandat: String
    HeureMandat: Date
    DateLivraison: String
    DateRDV: String
    factures: [Invoice]
    clients: [ClientInfo]
    insurers: [ClientInfo]
    folders: [Folder]
    group_id: String
    name: String
    NumeroClient: String
    NomClient: String
    TypeClient: String
    TypeAssureur: String
    NomAssureur: String
    Commentaire: String
    NomContact: String
    settings: ProjectSettings
  }

  type ProjectSettings {
    id: Int
    daysWithoutActivity: Boolean
    nbrDaysWithoutActivity: Int
    budgetBeforeFirstInvoice: Boolean
    minBudgetBeforeFirstInvoice: Float
    budgetVsTec: Int
    maxPourcentagesOfBudget: String
    maxOfTecAmount: Float
    submissionProcess: Int
    isMentor: Boolean
    mentor: Int
    project: Folder
    NumeroDossier: String
    customerId: String
    Budget: String
    Responsable: Float
    isDefault: Boolean
    createdAt: String
  }

  input ProjectSettingsInput {
    id: Int
    daysWithoutActivity: Boolean!
    nbrDaysWithoutActivity: Int
    budgetBeforeFirstInvoice: Boolean!
    minBudgetBeforeFirstInvoice: Float
    budgetVsTec: Int!
    maxPourcentagesOfBudget: String
    maxOfTecAmount: Float
    submissionProcess: Int!
    isMentor: Boolean
    mentor: Int
    projectId: String
    customerId: String
    isDefault: Boolean
  }

  input FolderInput {
    NumeroDossier: ID
    RecuPar: String
    Responsable: String
    Bureau: String
    Repertoire: String
    TelephonerPourRDV: Boolean
    Budget: Float
    TempsEstime: Int
    MontantPerte: Float
    TypeDePerte: String
    NomAssure: String
    Reference: String
    AdresseAssure: String
    VilleAssure: String
    CodePostalAssure: String
    TypeAssure: String
    TypeBatiment: String
    PersonneContactAssure: String
    CourrielContactAssure: String
    TelBureauContactAssure: String
    TelFaxContactAssure: String
    TelCellulaireContactAssure: String
    TelDomicileContactAssure: String
    TelAutreContactAssure: String
    CommentaireContactAssure: String
    AdressePerte: String
    VillePerte: String
    CodePostalPerte: String
    DescriptionMandat: String
    AutresDirectives: String
    DateFerme: String
    MarqueVE: String
    ModeleVE: String
    AnneeVE: Int
    NIVVE: String
    LieuEntreposageVE: String
    PersonneContactVE: String
    TelPersonneContactVE: String
    NoStockVE: String
    AdresseVE: String
    VilleVE: String
    CodePostalVE: String
    NotesVE: String
    LieuEntreposage: String
    Etagereids: String
    FraisEntreposage: Float
    FraisDestruction: Float
    DimensionTotaleSpecimenH: Int
    DimensionTotaleSpecimenL: Int
    DimensionTotaleSpecimenP: Int
    FraisChargePar: String
    FraisDestructionChargePar: String
    CauseSinistre: String
    EquipementEnCause: String
    Manufacturier: String
    Modele: String
    ResultatProces: String
    NoteProces: String
    NumeroJugement: String
    DateProchaineActivite: String
    Responsable_Ajd_ID_Emp: Int
    Forfait: Int
    DateRDV: String
  }

  type OfficeData {
    Bureau: String
  }

  type FolderClientAndInsurers {
    NumeroDossier: ID
    insured: [FolderClientAndInsurers_Insured]
  }

  type FolderClientAndInsurers_Insured {
    Nom_Assure: String
    clients: [FolderClientAndInsurers_Clients]
  }

  type FolderClientAndInsurers_Clients {
    NumeroClient: String
    NomClient: String
    Courriel: String
    Commentaire: String
    DossierConfie: Boolean
    insurers: [FolderClientAndInsurers_Insurer]
  }

  type FolderClientAndInsurers_Insurer {
    NumeroAssureur: String
    NomAssureur: String
    NumeroPolice: String
    PourcentageRisque: Float
    Reviseur: String
    No_Dossier: String
  }

  extend type Query {
    folders(ids: [ID], search: String, filters: [ArrayFilterInput]): [Folder]
      @hasAccess(slug: "folders", scope: "view", own: true)
    foldersClient(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
    ): [Folder] @hasAccess(slug: "folders", scope: "view", own: true)
    """
    Get the folder's insurers and clients
    """
    foldersClientsAndInsurers(id: ID!): [FolderClientAndInsurers_Insured]
      @hasAccess(slug: "folders", scope: "view", own: true)
    offices(ids: [ID]): [String]
      @hasAccess(slug: "folders", scope: "view", own: true)
    filters(slugs: [String]): [kipsFilters]
    # @hasAccess(slug: "folders", scope: "view", own: true)
    Asyncfilters(slugs: [String], limit: Int): [kipsFilters]

    ExporttoExcelfolder(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
    ): String @hasAccess(slug: "folders", scope: "view", own: true)
    billingProjectSettings(
      projectId: ID
      customerId: ID
      isDefault: Boolean
    ): ProjectSettings @hasAccess(slug: "folders", scope: "view", own: true)
  }

  extend type Mutation {
    folder(data: FolderInput): Folder @isAuthenticated
    billingProjectSettings(data: ProjectSettingsInput): ProjectSettings
      @isAuthenticated
  }
`;

module.exports = schema;
