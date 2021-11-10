"use strict";

module.exports = function (sequelize, DataTypes) {
  const table = sequelize.define(
    "tblDossiersDelais",
    {
      number: {
        field: "NumeroDossier",
        primaryKey: true,
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      mandateExamDelai: {
        field: "Delai_Mandat_Examen",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      examReportDelai: {
        field: "Delai_Examen_Redaction",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      reportInvoiceDelai: {
        field: "Delai_Redaction_Facturation",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      mandateDate: {
        field: "Date_Mandat",
        type: DataTypes.DATE,
        allowNull: true,
      },
      examDate: {
        field: "Date_Examen",
        type: DataTypes.DATE,
        allowNull: true,
      },
      redactionDate: {
        field: "Date_Redaction",
        type: DataTypes.DATE,
        allowNull: true,
      },
      facturationDate: {
        field: "Date_Facturation",
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tblDossierDelais",
    }
  );

  // gQL naming
  table.gqlName = "Delais";

  table.associate = function (models) {
    // A group has many customers
    table.belongsTo(models.tblDossier, {
      as: "delais",
      foreignKey: "folderNumber",
    });
  };

  return table;
};
