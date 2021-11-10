"use strict";

const table = function (sequelize, DataTypes) {
  const Model = sequelize.define(
    "tblClient",
    {
      NumeroClient: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        _searchable: true,
        _filtrable: false,
      },
      Inactif: DataTypes.BOOLEAN,
      NomClient: DataTypes.STRING,
      TypeClient: DataTypes.STRING,
      Adresse: DataTypes.STRING,
      Ville: DataTypes.STRING,
      CodePostal: DataTypes.STRING,
      Courriel: DataTypes.STRING,
      TelBureau: DataTypes.STRING,
      TelFax: DataTypes.STRING,
      TelCellulaire: DataTypes.STRING,
      TelDomicile: DataTypes.STRING,
      TelAutre: DataTypes.STRING,
      SiteWeb: DataTypes.STRING,
      Langue: DataTypes.STRING,
      Commentaires: DataTypes.STRING,
      Directives: DataTypes.STRING,
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: null,
      },
      groupId: {
        field: "group_id",
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "tblClient",
    }
  );

  // gQL naming
  Model.gqlNames = ["Clients", "Customer", "Insurer", "Insurers"];

  Model.associate = function (models) {
    Model.belongsToMany(models.tblDossier, {
      as: "folders",
      through: {
        model: models.tblDossierAClient,
      },
      foreignKey: "NumeroClient",
    });
    Model.belongsToMany(models.tblDossier, {
      as: "folders-",
      through: {
        model: models.tblDossierAClientAAssureur,
      },
      foreignKey: "NumeroClient",
    });
    // A client can belongs to a group
    Model.belongsTo(models.ClientGroups, {
      as: "group",
      targetKey: "id",
      foreignKey: "groupId",
    });
    Model.hasOne(models.BillingProjectSettings, {
      as: "settings",
      targetKey: "NumeroClient",
      foreignKey: "customer_id",
    });
  };

  return Model;
};

module.exports = table;
