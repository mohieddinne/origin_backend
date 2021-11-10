"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "tblActivites",
    {
      id: {
        field: "ID",
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      employeeName: {
        field: "NomEmploye",
        type: DataTypes.STRING,
      },
      date: {
        field: "DateActivite",
        type: DataTypes.STRING,
      },
      category: {
        field: "Categorie",
        type: DataTypes.STRING,
      },
      activiteType: {
        field: "Activite",
        type: DataTypes.STRING,
      },
      folderId: {
        field: "NumeroDossier",
        type: DataTypes.STRING,
        allowNull: true,
      },
      hours: {
        field: "Heures",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      hourlyRate: {
        field: "TauxHoraire",
        type: DataTypes.FLOAT,
      },
      comment: {
        field: "Commentaire",
        type: DataTypes.STRING,
        allowNull: true,
      },
      billableHours: {
        field: "HeuresFacture",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      invoiceId: {
        field: "FactureAffecte",
        type: DataTypes.STRING,
        allowNull: true,
      },
      order: {
        field: "Ordre",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      commentId: {
        field: "Commentaire_ID",
        type: DataTypes.STRING,
        allowNull: true,
      },
      commentSupp: {
        field: "Commentaire_Supp",
        type: DataTypes.STRING,
        allowNull: true,
      },
      language: {
        field: "Langue",
        type: DataTypes.STRING,
        allowNull: true,
      },
      excludeCalc: {
        field: "Exclure_Calcul",
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      categoryId: {
        field: "IdTypesActivitesCategories",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      typeId: {
        field: "IdTypesActivites",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        field: "Id_Emp",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );

  Model.associate = (models) => {
    Model.belongsTo(models.tblDossier, {
      as: "folders",
      foreignKey: "folderId",
    });
    Model.belongsTo(models.tblFacture, {
      as: "invoice",
      foreignKey: "invoiceId",
    });
  };

  return Model;
};
