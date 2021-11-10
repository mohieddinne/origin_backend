"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "EmailTemplateContent",
    {
      id: {
        type: DataTypes.INTEGER(4).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      emailTemplateId: {
        field: "email_template_id",
        type: DataTypes.INTEGER(3).UNSIGNED,
        allowNull: false,
      },
      language: {
        field: "language",
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fromName: {
        field: "from_name",
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      plaintext: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_email_templates_contents",
    }
  );

  // gQL naming
  Model.gqlName = ["templateContents", "EmailTemplateContents"];

  Model.associate = (models) => {
    Model.belongsTo(models.EmailTemplate, {
      foreignKey: "emailTemplateId",
    });
  };

  return Model;
};
