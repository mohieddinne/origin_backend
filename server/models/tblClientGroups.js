"use strict";

module.exports = function (sequelize, DataTypes) {
  const ClientGroups = sequelize.define(
    "ClientGroups",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defautlValue: null,
      },
      favorite: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defautlValue: false,
      },
      fallback: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: "tblClientGroupes",
    }
  );

  // gQL naming
  ClientGroups.gqlName = "Group";

  ClientGroups.associate = function (models) {
    // A group has many customers
    ClientGroups.hasMany(models.tblClient, {
      as: "customers",
      foreignKey: "group_id",
    });
  };

  /*ClientGroups.sync()
    .then(async (model) => {
      // If no records on the model, then insert defaut data
      if (!(await model.count()))
        model.bulkCreate([
          { name: "Aucun", color: "#039be5", fallback: true },
          { name: "Promutuel", color: "#fbbc08", fallback: false },
          { name: "Desjardins", color: "#7fcc28", fallback: false },
          { name: "La personnelle", color: "#37599a", fallback: false },
          { name: "Belair", color: "#e62b3b", fallback: false },
        ]);
    })
    .catch((error) => {
      console.error({ error });
    });*/

  return ClientGroups;
};
