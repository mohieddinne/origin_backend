const { gql } = require("apollo-server-express");

const schema = gql`
  type Activity implements AsyncDataNode {
    id: ID
    employeeName: String
    responsable: String
    date: String
    category: String
    activiteType: String
    folderId: String
    folder: Folder
    hours: Float
    hourlyRate: Float
    comment: String
    billableHours: Float
    billableHoursSpecial: Float
    invoiceId: String
    invoiceDate: String
    order: Int
    commentId: String
    commentSupp: String
    language: String
    excludeCalc: Boolean
    categoryId: Int
    typeId: Int
    userId: Int
    nbrOfBillableHours: Float
    projectInvoice: String
    responsible: String
    yearAct: String
    NombreHeuresFacturees: Float
    assignedInvoice: String
    totalInvoice: Float
    amountFees: Float
    _type: ActivityType
    _category: ActivityCatagory
  }

  type ActivityCatagory {
    id: ID!
    name: String
  }

  type ActivityType {
    id: ID!
    categoryName: String
    categoryId: Int
    name: String
    englishName: String
    activityArea: String
    activityNature: String
    explanation: String
    mandatoryComment: Boolean
    active: Boolean
    indications: String
    nonBillable: Boolean
    usedOnFolder: Boolean
    """
    To be explained
    """
    Exclure_Hono_Modifie: Boolean
  }

  type UserConfirmedProject {
    user: User
    confirmed: Boolean
    createdAt: String
    updatedAt: String
  }

  input ActivityInput {
    id: ID
    user: String
    comment: String
    recordingType: String
    time: String
    rate: String
    activity: String
    category: String
    project: String
    date: String
  }

  type ActivityFilter {
    name: String
    data: [ActivityFilterData]
  }

  interface ActivityFilterData {
    id: ID
    value: String
  }

  type ActivityFilterEmployee implements ActivityFilterData {
    id: ID
    value: String
    active: Boolean
  }

  type ActivityFilterFolder implements ActivityFilterData {
    id: ID
    value: String
    budget: Float
    consummated: Float
  }

  type ActivityFilterComment implements ActivityFilterData {
    id: ID
    value: String
    value_en: String
    category: String
    activityType: String
    active: Boolean
  }

  type ActivityFilterCustomer implements ActivityFilterData {
    id: ID
    value: String
    name: String
  }

  type ActivityFilterCategory implements ActivityFilterData {
    id: ID
    value: String
    name: String
  }

  type ActivityFilterType implements ActivityFilterData {
    id: ID
    value: String
    name: String
  }

  type ActivityFilterInsurer implements ActivityFilterData {
    id: ID
    value: String
    name: String
  }

  enum ActivityFilterSlugs {
    CUSTOMERS
    EMPLOYEES
    CATEGORIES
    TYPES
    FOLDERS
    INSURERS
    INCOME
    COMMENTS
    HOURLY_RATES
    HOURS
    BILLABLED_HOURS
    ALL_EMPLOYEES
  }

  extend type Query {
    activities(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
      pagination: PagingOptions
    ): AsyncData @hasAccess(slug: "activities", scope: "view", own: true)

    checkMyActivities: [Activity] @isAuthenticated
    checkActivities(
      id: ID
      search: String
      filters: [ArrayFilterInput]
      widget: String
    ): [Activity] @isAuthenticated
    "billableHoursDetails(responsible: String): [Activity] @isAuthenticated"
    checkBillableHoursDetails(responsible: String): [Activity] @isAuthenticated
    checkBillableHours(responsible: String!, folder: String!): [Activity]
      @isAuthenticated
    checkBillableHoursActiveDetails(
      responsible: String
      year: String
      type: Int
    ): [Activity] @isAuthenticated
    checkForNotBilledBillableHoursDetails(responsible: String): [Activity]
      @isAuthenticated

    activityToFile(
      ids: [ID]
      search: String
      filters: [ArrayFilterInput]
      format: String
    ): String @hasAccess(slug: "activities", scope: "view", own: true)

    filtersActivity(
      slugs: [ActivityFilterSlugs]
      search: String
      limit: Int
      filters: [ArrayFilterInput]
    ): [ActivityFilter]

    ActivityIncome(slugs: [String], filters: [ArrayFilterInput]): [kipsFilters]

    activitiesCatagories: [ActivityCatagory]
      @hasAccess(slug: "activities", scope: "view", own: true)

    activitiesTypes(filters: [ArrayFilterInput]): [ActivityType]
      @hasAccess(slug: "activities", scope: "view", own: true)

    "To be remplaced one day"
    activitiesEmployee: [User]
      @hasAccess(slug: "activities", scope: "view", own: true)

    activitiesEmployeeExpert(
      folderId: ID!
      invoiceId: ID
    ): [UserConfirmedProject]
      @hasAccess(slug: "activities", scope: "view", own: true)
  }

  extend type Mutation {
    activityAction(data: [ActivityInput], operation: String): Boolean
    mutateActivity(data: ActivityInput): Boolean
    confirmProjectInvoice(
      invoiceId: ID
      users: [ID]
      closeFolder: Boolean
    ): Boolean @isAuthenticated
  }
`;

module.exports = schema;
