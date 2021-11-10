const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type W1_data {
    type: String
    value: Int
    change: Float
  }

  type W2_data {
    name: String
    value: Float
    change: Float
    description: String
    color: String
  }

  type WidgetReceivedFolderData {
    active: Int
    graph: [W2_data]
    data: [W1_data]
  }

  type MultiGraphData {
    name: String
    data: [W2_data]
  }
  type MultiGraphData2 {
    billableHours: BillableHoursData
    goal: Float
    value: Float
    widget: [MultiGraphData]
  }

  type BillableHoursData {
    value: Float
    date: String
  }

  type BilledVsNoneBilledHours {
    count: Int
    table: [BilledVsNoneBilledHoursTable]
  }

  type BilledVsNoneBilledHoursTable {
    folder: String
    customerId: String
    customerType: String
    customerName: String
    billed: Float
    noneBilled: Float
    amountBilled: Float
    amountNoneBilled: Float
    budget: Float
    sumExpenses: Float
  }

  type totalPerYearData {
    numberOfBillableHours: Float
    date: String
  }
  type WidgetBillableHours {
    totalPerYearData: [totalPerYearData]
    graphData: [totalPerYearData]
    totalBillableHours: Float
  }
  input queryOption {
    name: String
    value: String
  }

  extend type Query {
    widgetReceivedFolder(
      responsable: String
      filters: [String]
    ): WidgetReceivedFolderData
      @hasAccess(slug: "dashboard", scope: "view", own: true)
    widgetIncomeVGoals(responsable: String): MultiGraphData2
      @hasAccess(slug: "dashboard", scope: "view", own: true)
    widgetSTEC(options: [queryOption], responsable: String): [MultiGraphData]
      @hasAccess(slug: "dashboard", scope: "view", own: true)
    widgetBudgetAndDelais(options: [queryOption]): [MultiGraphData]
      @hasAccess(slug: "dashboard", scope: "view", own: true)
    widgetBvNbHours(
      options: [queryOption]
      responsable: String
    ): BilledVsNoneBilledHours
      @hasAccess(slug: "dashboard", scope: "view", own: true)
    WidgetBillableHours(responsible: String, type: Int): WidgetBillableHours
  }
`;

module.exports = schema;
