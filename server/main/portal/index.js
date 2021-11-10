// Resplvers
const Folders = require("./folders/");
const Invoices = require("./invoices/");
const Clients = require("./clients/");
const Chat = require("./chat/");
const Activities = require("./activities");
const SharedFilters = require("./shared-filters");

module.exports = {
  schemas: [
    Folders.schema,
    Invoices.schema,
    Clients.schema,
    Chat.schema,
    Activities.schema,
    SharedFilters.schema,
  ],
  resolvers: [
    Folders.resolvers,
    Invoices.resolvers,
    Clients.resolvers,
    Chat.resolvers,
    Activities.resolvers,
    SharedFilters.resolvers,
  ],
};
