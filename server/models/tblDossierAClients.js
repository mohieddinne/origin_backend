"use strict";

const table = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "tblDossierAClient",
    {
      NumeroClient: {
        type: DataTypes.STRING,
        references: {
          model: "tblClient",
          key: "NumeroClient",
        },
      },
      NumeroDossier: {
        type: DataTypes.STRING,
        references: {
          model: "tblDossier",
          key: "NumeroDossier",
        },
      },
      NomContact: DataTypes.STRING,
      NumeroDossierClient: DataTypes.STRING,
      DossierConfie: DataTypes.BOOLEAN,
      MontantFacture: DataTypes.FLOAT,
      MontantRecu: DataTypes.FLOAT,
      AdresseFacturation: DataTypes.STRING,
      Commentaire: DataTypes.STRING,
    },
    {
      timestamps: false,
      tableName: "tblDossierAClient",
    }
  );

  return Model;
};

module.exports = table;
