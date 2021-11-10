const isAuthenticated = require("./auth/isAuthenticated");
const hasAccess = require("./auth/hasAccess");
const AccessDirective = require("./accessDirective/Access");

module.exports = {
  isAuthenticated,
  hasAccess,
  access: AccessDirective,
};
