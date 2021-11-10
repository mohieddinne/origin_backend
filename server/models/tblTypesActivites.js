"use strict";

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define(
    "tblTypesActivites",
    {
      id: {
        field: "ID",
        type: DataTypes.INTEGER,

        primaryKey: true,
      },
      categoryName: {
        field: "Categorie",
        type: DataTypes.STRING,
      },
      name: {
        field: "Activite",
        type: DataTypes.STRING,
      },
      englishName: {
        field: "DescriptionAnglaise",
        type: DataTypes.STRING,
      },
      categoryId: {
        field: "IdTypesActivitesCategories",
        type: DataTypes.INTEGER,
      },
      activityArea: {
        field: "SecteurActivite",
        type: DataTypes.STRING,
      },
      activityNature: {
        field: "NatureActivite",
        type: DataTypes.STRING,
      },
      explanation: {
        field: "Explication",
        type: DataTypes.STRING,
      },
      mandatoryComment: {
        field: "CommentaireObligatoire",
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      active: {
        field: "Actif",
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      indications: {
        field: "Indications",
        type: DataTypes.STRING,
        allowNull: true,
      },
      nonBillable: {
        field: "NonFacturable",
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      Exclure_Hono_Modifie: {
        field: "Exclure_Hono_Modifie",
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      usedOnFolder: {
        field: "ActiviteDossier",
        type: DataTypes.BOOLEAN,
      },
    },
    {
      timestamps: false,
    }
  );

  return Model;
};
