"use strict";

const model = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "tblDossierAClientAAssureur",
    {
      folder_id: {
        field: "NumeroDossier",
        type: DataTypes.STRING(15),
        references: {
          model: "tblDossier",
          key: "NumeroDossier",
        },
      },
      custumer_id: {
        field: "NumeroClient",
        type: DataTypes.STRING(15),
        references: {
          model: "tblClient",
          key: "NumeroClient",
        },
      },
      insurer_id: {
        field: "NumeroAssureur",
        type: DataTypes.STRING(15),
        references: {
          model: "tblClient",
          key: "NumeroClient",
        },
      },
      police_nmber: {
        field: "NumeroPolice",
        type: DataTypes.STRING(150),
      },
      // TODO transforme to an ID
      reviser: {
        field: "Reviseur",
        type: DataTypes.STRING(150),
      },
      language: {
        field: "Langue",
        type: DataTypes.STRING(50),
      },
      copies: {
        field: "Copies",
        type: DataTypes.INTEGER,
      },
      risk: {
        field: "PourcentageRisque",
        type: DataTypes.FLOAT,
      },
      folder_no: {
        field: "No_Dossier",
        type: DataTypes.STRING(25),
      },
    },
    {
      tableName: "tblDossierAClientAAssureur",
    }
  );

  return Model;
};

module.exports = model;
