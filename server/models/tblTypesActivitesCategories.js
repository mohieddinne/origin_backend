"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "tblTypesActivitesCategories",
    {
      id: {
        field: "ID",
        type: DataTypes.INTEGER,

        primaryKey: true,
      },
      Categorie: {
        field: "Categorie",
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: false,
    }
  );

  return Model;
};
