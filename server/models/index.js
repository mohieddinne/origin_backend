"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const serverConfig = require("../config");

const db = {};

let sequelize = new Sequelize(
  serverConfig.db.database,
  serverConfig.db.username,
  serverConfig.db.password,
  serverConfig.db
);

if (serverConfig.db.dialect === "mssql") {
  // Override timezone formatting for MSSQL
  Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
    return this._applyTimezone(date, options).format("YYYY-MM-DD HH:mm:ss.SSS");
  };
}

// Initiating models names if diffrent from schma's
db.gqlNames = { a: [], b: [] };

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    let modelFile = require("./" + file);
    if (modelFile && typeof modelFile.default === "function")
      modelFile = modelFile.default;

    const model = modelFile(sequelize, Sequelize);
    db[model.name] = model;

    // Injecting models names if diffrent from schma's
    if (Array.isArray(model.gqlNames))
      for (const gqlName of model.gqlNames) {
        if (gqlName !== model.name) {
          db.gqlNames.a.push(gqlName);
          db.gqlNames.b.push(model.name);
        }
      }

    // Injecting models names if diffrent from schma's
    if (model.gqlName && model.gqlName !== model.name) {
      db.gqlNames.a.push(model.gqlName);
      db.gqlNames.b.push(model.name);
    }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
