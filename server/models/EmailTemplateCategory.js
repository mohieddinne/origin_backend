"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "EmailTemplateCategory",
    {
      id: {
        type: DataTypes.INTEGER(3).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "tbl_email_templates_categories",
    }
  );

  Model.associate = (models) => {
    Model.hasMany(models.EmailTemplate, {
      as: "templates",
      foreignKey: "categoryId",
    });
  };
  return Model;
};
