"use strict";

module.exports = (sequelize, DataTypes) => {
  const tblFacture = sequelize.define(
    "tblFacture",
    {
      NumeroFacture: {
        type: DataTypes.STRING,
        primaryKey: true,
        _searchable: true,
        _filtrable: false,
      },
      NumeroDossier: {
        type: DataTypes.STRING,
      },
      HeuresExpert: DataTypes.FLOAT,
      MontantFacture: DataTypes.FLOAT,
      MontantHonoraires: DataTypes.FLOAT,
      PctAdm: DataTypes.FLOAT,
      HeuresAdm: DataTypes.FLOAT,
      TauxAdm: DataTypes.FLOAT,
      MontantDepenses: DataTypes.FLOAT,
      MontantAdm: DataTypes.FLOAT,
      FF_Montant_Tot: DataTypes.FLOAT,
      FF_Montant: DataTypes.FLOAT,
      FF_Pct: DataTypes.FLOAT,
      Id_Emp2: DataTypes.INTEGER,
      DateFacturation: DataTypes.DATE,
      FF_Depenses_Type: DataTypes.INTEGER,
      Commentaires: DataTypes.STRING,

      LastModifiedBy: DataTypes.STRING,
      Log1: DataTypes.STRING,
      Log2: DataTypes.STRING,
      NomEmploye2: DataTypes.STRING,
      NomEmploye1: DataTypes.STRING,
      Statut: DataTypes.STRING,
      Specimen: DataTypes.STRING,
      CC1: DataTypes.BOOLEAN,
      CC2: DataTypes.BOOLEAN,
      Ferme: DataTypes.BOOLEAN,
      Adj1: DataTypes.BOOLEAN,
      Adj2: DataTypes.BOOLEAN,
      DepensesAdm: DataTypes.BOOLEAN,
      AvecDepenses: DataTypes.BOOLEAN,
      AdmEnPct: DataTypes.BOOLEAN,
      triggerRule: {
        field: "trigger_rule",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );
  // gQL naming
  tblFacture.gqlName = "Factures";
  tblFacture.gqlNames = ["Factures"];

  tblFacture.associate = (models) => {
    tblFacture.belongsTo(models.tblDossier, {
      as: "folders",
      foreignKey: "NumeroDossier",
    });
    tblFacture.hasMany(models.tblActivites, {
      as: "activities",
      foreignKey: "invoiceId",
    });
    tblFacture.belongsToMany(models.tblEmployes, {
      through: {
        model: models.ProjectInvoiceConfirmation,
        as: "projectConfirmations",
        unique: false,
      },
      foreignKey: "invoice_id",
      as: "users",
    });
  };
  return tblFacture;
};
