"use strict";

module.exports = (sequelize, DataTypes) => {
  const CustomerContact = sequelize.define(
    "CustomerContact",
    {
      clientId: {
        field: "NumeroClient",
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      id: {
        field: "ID",
        type: DataTypes.INTEGER(4).UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        field: "NomContact",
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(50),
        field: "AppellationContact",
        allowNull: true,
      },
      position: {
        type: DataTypes.STRING(150),
        field: "FonctionContact",
        allowNull: true,
      },
      jobTitle: {
        type: DataTypes.STRING(150),
        field: "TitreContact",
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        field: "Adresse",
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(150),
        field: "Ville",
        allowNull: true,
      },
      zip: {
        type: DataTypes.STRING(10),
        field: "CodePostal",
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        field: "Courriel",
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        field: "TelBureau",
        allowNull: true,
      },
      fax: {
        type: DataTypes.STRING(30),
        field: "TelFax",
        allowNull: true,
      },
      mobile: {
        type: DataTypes.STRING(30),
        field: "TelCellulaire",
        allowNull: true,
      },
      homeTel: {
        type: DataTypes.STRING(30),
        field: "TelDomicile",
        allowNull: true,
      },
      otherTel: {
        type: DataTypes.STRING(30),
        field: "TelAutre",
        allowNull: true,
      },
      comments: {
        type: DataTypes.TEXT,
        field: "Commentaires",
        allowNull: true,
      },
      inactive: {
        type: DataTypes.BOOLEAN,
        field: "Inactif",
        allowNull: true,
      },
      synced_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tblClientContact",
      timestamps: false,
      underscored: true,
    }
  );

  return CustomerContact;
};
