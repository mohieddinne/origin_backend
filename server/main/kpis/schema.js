const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  # TODO remove on merge Client branche
  type ClientData {
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
    income: Float
    folders: Int
    createdAt: String
    updatedAt: String
  }

  type ReportC {
    customer: ClientInfo
    folder: Folder
    invoice: Invoice
    insurer: FolderClientAndInsurers_Insurer
  }

  type kipsFilters {
    name: String
    data: [kipsFilterData]
  }

  type kipsFilterData {
    name: String
    value: String
    favorite: Boolean
    actif: Int
    id: ID
    color: String
  }

  type PieData {
    name: String
    value: Float
    change: Float
    options: [ClassicData]
    count: Int
  }

  type StatData {
    data: [PieData]
    types: [String]
  }

  type ClassicData {
    name: String
    value: String
  }

  input kipsFiltersInput {
    name: String
    value: [String]
  }

  input PdfOptions {
    name: String
    value: Boolean
  }

  type kpiResultData {
    types: String
    offices: String
    data: [String]
    value: String
    name: String
    MontantFacture: Float
    NumeroFacture: ID
    NumeroDossier: String
    NumeroClient: Float
    NomAssure: String
    NomClient: String
    TypeDePerte: String
    Bureau: String
    DateMandat: String
    TypeClient: String
    DateFacturation: String
    options: [ClassicData2]
  }

  type ClassicData2 {
    name: String
    value: Float
  }

  type CustomerReportsTotal {
    turnover: Float
    folders: Int
  }

  extend type Query {
    """
    Generates a PDF file as String in Base64 encoding
    with or without data in table (see appendix),
    count can be "number" or "income"
    """
    kpi_pdf(
      "Filters are set in array same as other calc functions"
      filters: [kipsFiltersInput]
      """
      PDF Options, can select which widgets will be rendered on the PDF
      """
      options: [PdfOptions]
      "The calc method can be 'number' or 'income'"
      math: String
    ): String @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Generates an Excel file as String in Base64 encoding
    count can be "number" or "income"
    """
    kpi_xls(
      widget: String!
      math: String!
      filters: [kipsFiltersInput]
    ): String @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Get the data used to calc Losses and Offices widgets
    """
    kpi_widgets_data(
      widget: String!
      math: String!
      filters: [kipsFiltersInput]
      rowFilter: [kipsFiltersInput]
    ): [kpiResultData] @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Gets the count or income of folders depending on
    the filters passed as filters
    count can be "number" or "income"
    """
    kpi_losses_and_offices(
      math: String
      filters: [kipsFiltersInput]
    ): [MultiGraphData] @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Gets the count or income of folders
    groupped by customer groups
    depending on the filters passed as filters
    count can be "number" or "income"
    """
    kpi_customer_groups(math: String, filters: [kipsFiltersInput]): [PieData]
      @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Gets the count or income of folders
    groupped by customers
    depending on the filters passed as filters
    count can be "number" or "income"
    """
    kpi_customers(
      math: String
      filters: [kipsFiltersInput]
      limit: Int
    ): [W2_data] @hasAccess(slug: "kpis", scope: "view", own: true)
    """
    Gets the count or income of folders
    groupped by folders types
    depending on the filters passed as filters
    count can be "number" or "income"
    """
    kpi_folders_types(math: String, filters: [kipsFiltersInput]): [W2_data]
      @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    Gets the count or income of folders
    groupped by Origin offices (Qub. and Moréal)
    depending on the filters passed as filters
    count can be "number" or "income"
    """
    kpi_offices(math: String, filters: [kipsFiltersInput]): [W2_data]
      @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    List best X clients
    per income or folders count
    depending on the filters passed as filters
    count can be "number" or "income"
    """
    kpi_best_clients(
      limit: Int
      order: String
      filters: [kipsFiltersInput]
    ): [ClientData] @hasAccess(slug: "kpis", scope: "view", own: true)
    """
    Average delais in folders
    """
    widgetAvrgDelais(filters: [kipsFiltersInput]): [W2_data]
      @hasAccess(slug: "kpis", scope: "view", own: true)

    """
    List of availabe filters in frontend for the KPIs module
    """
    kpis_filters: [kipsFilters]
      @hasAccess(slug: "kpis", scope: "view", own: true)
    kpis_statistics(filters: [kipsFiltersInput]): StatData
    kpis_statistics_pdf(filters: [kipsFiltersInput], widget: Boolean): String
    customer_reports(filters: [kipsFiltersInput]): [PieData]
    customer_reports_details(filters: [kipsFiltersInput]): [ReportC]
    customer_reports_total(office: String): CustomerReportsTotal
  }
`;

module.exports = schema;
