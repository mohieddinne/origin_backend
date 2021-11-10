const { gql } = require("apollo-server-express");

const schema = gql`
  type ReportTEC {
    employee: String
    folderId: String
    nextActivityDate: String
    lastActivityDate: String
    mandateDate: String
    deliveryDate: String
    refrence: String
    invoiceAmount: Float
    budget: Float
    specimen: Int
    stats: Boolean
    totalAmount: Float
    toComplete: Float
    toComplete2: Float
    redFlag: Boolean
    totalAdmAmount: Float
    totalExepensesAmount: Float
    totalActivitiesAmount: Float
  }

  extend type Query {
    report_TEC(employees: [String], projectNumber: ID): [ReportTEC]
      @isAuthenticated
    filterReport: [kipsFilters] @isAuthenticated
  }
`;

module.exports = schema;
