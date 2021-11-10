// Resplvers
const userResolvers = require("./user/resolvers");
const accessResolvers = require("./access/resolvers");
const configResolvers = require("./option/resolvers");
const contentsResolvers = require("./contents/resolvers");
const dashboardResolvers = require("./dashboard/resolvers");
const kpisResolvers = require("./kpis/resolvers");
const clientGroupsResolver = require("./client-groups/resolvers");
const reportsResolvers = require("./reports/resolvers");

const holidaysResolvers = require("./holidays/resolvers");
// Schema
const userSchema = require("./user/schema");
const accessSchema = require("./access/schema");
const configSchema = require("./option/schema");
const contentsSchema = require("./contents/schema");
const dashboardSchema = require("./dashboard/schema");
const kpisSchema = require("./kpis/schema");
const clientGroupsSchema = require("./client-groups/schema");
const reportsSchema = require("./reports/schema");
const holidaysSchema = require("./holidays/schema");

const Core = require("./core");
const Portal = require("./portal");
const rootSchema = require("./root");

module.exports.resolvers = [
  userResolvers,
  accessResolvers,
  configResolvers,
  contentsResolvers,
  dashboardResolvers,
  kpisResolvers,
  clientGroupsResolver,
  reportsResolvers,
  holidaysResolvers,
  ...Core.resolvers,
  ...Portal.resolvers,
];

module.exports.typeDefs = [
  rootSchema,
  userSchema,
  accessSchema,
  configSchema,
  contentsSchema,
  dashboardSchema,
  kpisSchema,
  clientGroupsSchema,
  reportsSchema,
  holidaysSchema,
  ...Core.schemas,
  ...Portal.schemas,
];
