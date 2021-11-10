"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "EmailTemplateVariables",
    {
      id: {
        type: DataTypes.INTEGER(4).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailTemplateId: {
        field: "email_template_id",
        type: DataTypes.INTEGER(3).UNSIGNED,
        allowNull: false,
      },
    },
    {
      tableName: "tbl_email_templates_variables",
    }
  );

  // gQL naming
  Model.gqlName = "EmailTemplateVariable";

  Model.associate = (models) => {
    Model.belongsTo(models.EmailTemplate, {
      as: "variables",
      foreignKey: "emailTemplateId",
    });
  };

  return Model;
};
