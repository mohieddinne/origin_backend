const i18n = require("i18n");
const path = require("path");

// @ToDo detect the local language depending of the user header
i18n.configure({
  locales: ["fr-fr"],
  defaultLocale: "fr-fr",
  directory: path.join(__dirname, "../../public/assets/i18n"),
});

module.exports = i18n;
