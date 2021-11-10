"use strict";

module.exports = (sequelize, DataTypes) => {
  const tblEmployes = sequelize.define(
    "tblEmployes",
    {
      code: DataTypes.INTEGER,
      userName: DataTypes.STRING,
      courriel: DataTypes.STRING,
      NomEmploye: DataTypes.STRING,
      nomFamille: DataTypes.STRING,
      prenom: DataTypes.STRING,
      Expert: DataTypes.BOOLEAN,
      actif: DataTypes.BOOLEAN,
      sexe: DataTypes.STRING,
      fonction: DataTypes.STRING,
      id_Emp: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      person: {
        field: "Individu",
        type: DataTypes.BOOLEAN,
      },
      pswd: DataTypes.STRING,
      cpwd: DataTypes.STRING,
      picture: DataTypes.STRING,
      niveau: DataTypes.INTEGER,
      codePostal: DataTypes.STRING,
      telBureau: DataTypes.STRING,
      telFax: DataTypes.STRING,
      telCellulaire: DataTypes.STRING,
      telDomicile: DataTypes.STRING,
      telAutre: DataTypes.STRING,
      TauxHoraire: DataTypes.FLOAT,
      usesAdvancedFilters: {
        field: "uses_avanced_filters",
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
    },
    {}
  );

  // gQL naming
  tblEmployes.gqlNames = ["User", "Users"];

  tblEmployes.associate = function (models) {
    models.tblEmployes.belongsTo(models.tblEmployes_Niveaux, {
      foreignKey: "niveau",
    });
    tblEmployes.hasMany(models.ChatMessages, {
      as: "messages",
      foreignKey: "user_id",
    });
    tblEmployes.belongsToMany(models.ChatRoom, {
      through: {
        unique: false,
        as: "chatRoomUsers",
        model: models.ChatRoomUsers,
      },
      as: "rooms",
      foreignKey: "user_id",
    });
    tblEmployes.hasMany(models.ChatRoomUsersLastReadMessage, {
      as: "unread_messages",
      foreignKey: "user_id",
    });
    tblEmployes.hasMany(models.SavedFilters, {
      as: "saved_filters",
      foreignKey: "user_id",
    });
    tblEmployes.hasMany(models.UnreadArticle, {
      as: "unread_articles",
      foreignKey: "user_id",
    });
    tblEmployes.belongsToMany(models.tblFacture, {
      through: {
        model: models.ProjectInvoiceConfirmation,
        as: "projectConfirmations",
        unique: false,
      },
      foreignKey: "employee_id",
      as: "invoices",
    });
  };
  return tblEmployes;
};
