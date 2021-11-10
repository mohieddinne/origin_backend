"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "EmailTemplate",
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
      categoryId: {
        field: "category_id",
        type: DataTypes.INTEGER(2).UNSIGNED,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "tbl_email_templates",
    }
  );

  // gQL naming
  Model.gqlName = "EmailTemplate";

  Model.associate = (models) => {
    Model.belongsTo(models.EmailTemplateCategory, {
      as: "category",
      foreignKey: "categoryId",
    });
    Model.hasMany(models.EmailTemplateContent, {
      as: "contents",
      foreignKey: "emailTemplateId",
    });
    Model.hasMany(models.EmailTemplateVariables, {
      as: "variables",
      foreignKey: "emailTemplateId",
    });
  };

  return Model;
};
