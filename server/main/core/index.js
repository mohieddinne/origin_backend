const EmailTemplates = require("./email-template-content/");
const DynamicMenu = require("./dynamic-menu/");
const ActivityLog = require("./activity-logs/");
const SavedFilters = require("./saved-filters/");

module.exports = {
  schemas: [
    EmailTemplates.schema,
    DynamicMenu.schema,
    ActivityLog.schema,
    SavedFilters.schema,
  ],
  resolvers: [
    EmailTemplates.resolvers,
    DynamicMenu.resolvers,
    ActivityLog.resolvers,
    SavedFilters.resolvers,
  ],
};
