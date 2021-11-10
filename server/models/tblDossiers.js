"use strict";
module.exports = (sequelize, DataTypes) => {
  const tblDossier = sequelize.define(
    "tblDossier",
    {
      NumeroDossier: {
        type: DataTypes.STRING,
        primaryKey: true,
        _searchable: true,
        allowNull: false,
      },
      RecuPar: DataTypes.STRING,
      Responsable: DataTypes.STRING,
      Bureau: DataTypes.STRING,
      Repertoire: DataTypes.STRING,
      TelephonerPourRDV: DataTypes.BOOLEAN,
      DateRDV: DataTypes.DATE,
      DateMandat: DataTypes.DATE,
      HeureMandat: DataTypes.STRING,
      DateLivraison: DataTypes.DATE,
      Budget: DataTypes.FLOAT,
      TempsEstime: DataTypes.INTEGER,
      DatePerte: DataTypes.DATE,
      HeurePerte: DataTypes.DATE,
      MontantPerte: DataTypes.FLOAT,
      TypeDePerte: DataTypes.STRING,
      NomAssure: DataTypes.STRING,
      Reference: DataTypes.STRING,
      AdresseAssure: DataTypes.STRING,
      VilleAssure: DataTypes.STRING,
      CodePostalAssure: DataTypes.STRING,
      TypeAssure: DataTypes.STRING,
      TypeBatiment: DataTypes.STRING,
      PersonneContactAssure: DataTypes.STRING,
      CourrielContactAssure: DataTypes.STRING,
      TelBureauContactAssure: DataTypes.STRING,
      TelFaxContactAssure: DataTypes.STRING,
      TelCellulaireContactAssure: DataTypes.STRING,
      TelDomicileContactAssure: DataTypes.STRING,
      TelAutreContactAssure: DataTypes.STRING,
      CommentaireContactAssure: DataTypes.STRING,
      AdressePerte: DataTypes.STRING,
      VillePerte: DataTypes.STRING,
      CodePostalPerte: DataTypes.STRING,
      DescriptionMandat: DataTypes.STRING,
      AutresDirectives: DataTypes.STRING,
      DateFerme: DataTypes.DATE,
      MarqueVE: DataTypes.STRING,
      ModeleVE: DataTypes.STRING,
      AnneeVE: DataTypes.INTEGER,
      NIVVE: DataTypes.STRING,
      LieuEntreposageVE: DataTypes.STRING,
      PersonneContactVE: DataTypes.STRING,
      TelPersonneContactVE: DataTypes.STRING,
      NoStockVE: DataTypes.STRING,
      AdresseVE: DataTypes.STRING,
      VilleVE: DataTypes.STRING,
      CodePostalVE: DataTypes.STRING,
      NotesVE: DataTypes.STRING,
      LieuEntreposage: DataTypes.STRING,
      Etagere: DataTypes.STRING,
      FraisEntreposage: DataTypes.FLOAT,
      FraisDestruction: DataTypes.FLOAT,
      DimensionTotaleSpecimenH: DataTypes.INTEGER,
      DimensionTotaleSpecimenL: DataTypes.INTEGER,
      DimensionTotaleSpecimenP: DataTypes.INTEGER,
      PeriodeEntreposageDu: DataTypes.DATE,
      PeriodeEntreposageAu: DataTypes.DATE,
      DateDestruction: DataTypes.DATE,
      DateFraisCharge: DataTypes.DATE,
      DateFraisDestructionCharge: DataTypes.DATE,
      FraisChargePar: DataTypes.STRING,
      FraisDestructionChargePar: DataTypes.STRING,
      CauseSinistre: DataTypes.STRING,
      EquipementEnCause: DataTypes.STRING,
      Manufacturier: DataTypes.STRING,
      Modele: DataTypes.STRING,
      NumeroSerie: DataTypes.STRING,
      Entrepreneur: DataTypes.STRING,
      TypeAnalyse: DataTypes.STRING,
      FournisseurAnalyse: DataTypes.STRING,
      AncienDossier: DataTypes.STRING,
      Concurrent: DataTypes.STRING,
      Proces: DataTypes.BOOLEAN,
      ResultatProces: DataTypes.STRING,
      NoteProces: DataTypes.STRING,
      NumeroJugement: DataTypes.STRING,
      DateProchaineActivite: DataTypes.DATE,
      Responsable_Ajd_ID_Emp: DataTypes.INTEGER,
      Forfait: DataTypes.INTEGER,
    },
    {
      tableName: "tblDossier",
    }
  );

  // gQL naming
  tblDossier.gqlName = "Folders";

  // Relation
  tblDossier.associate = (models) => {
    tblDossier.belongsToMany(models.tblClient, {
      as: "clients",
      through: models.tblDossierAClient,
      foreignKey: "NumeroDossier",
    });
    tblDossier.belongsToMany(models.tblClient, {
      as: "insurers",
      through: models.tblDossierAClientAAssureur,
      foreignKey: "NumeroDossier",
    });
    tblDossier.hasMany(models.tblFacture, {
      as: "factures",
      foreignKey: "NumeroDossier",
    });
    tblDossier.hasMany(models.tblActivites, {
      as: "Activites",
      foreignKey: "NumeroDossier",
    });

    tblDossier.hasOne(models.BillingProjectSettings, {
      as: "settings",
      targetKey: "id",
      foreignKey: "project_id",
    });
  };

  return tblDossier;
};
