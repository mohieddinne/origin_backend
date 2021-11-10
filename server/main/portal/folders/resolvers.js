const folderHelpers = require("./helpers");
const { ApolloError } = require("apollo-server-express");
const i18nHelper = require("../../../helpers/i18n.helper");
const graphFields = require("graphql-fields");
const { requestedFields } = require("../../../helpers/graphql.helper");
const { formatLongDate } = require("../../../helpers/dates.helper");
const dataToExel = require("../../../libs/exel-generator");
const uHlprs = require("../../user/helpers");
const { createActivityLog } = require("../../core/activity-logs/helpers");

const hA = uHlprs.hasAccess.bind(uHlprs);

const resolvers = {
  Query: {
    async folders(_, args, { user, privilege }, information) {
      const { ids, search } = args;
      const attributes = requestedFields(information);
      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "Responsable",
          value: [user.NomEmploye],
        });
      }
      return await folderHelpers.getSuperData(ids, {
        attributes,
        search,
        filters,
      });
    },

    async foldersClient(_, args, { user, privilege }, information) {
      const { ids, search } = args;
      const attributes = requestedFields(information);
      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "Responsable",
          value: [user.NomEmploye],
        });
      }
      return await folderHelpers.getData(ids, {
        attributes,
        search,
        filters,
      });
    },

    async foldersClientsAndInsurers(_, { id }, { user, privilege }) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;

      return await folderHelpers.foldersClientsAndInsurers(id, userFullName);
    },

    async offices(_, { ids }, { user, privilege }) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;
      return await folderHelpers.getOffices(ids, userFullName);
    },

    async billingProjectSettings(
      _,
      { projectId, isDefault, customerId },
      { user, privilege },
      information
    ) {
      const attributes = requestedFields(information);
      return await folderHelpers.getbillingProjectSettings(
        { projectId, customerId },
        isDefault,
        attributes
      );
    },

    async filters(_, { slugs }, { user, privilege }) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;
      return await folderHelpers.filters(slugs, userFullName);
    },

    async Asyncfilters(_, { slugs, limit }, { user, privilege }) {
      let userFullName = null;
      if (privilege === "can_view_own") userFullName = user.NomEmploye;
      return await folderHelpers.Asyncfilters(slugs, limit, userFullName);
    },

    async ExporttoExcelfolder(_, args, { user, privilege }) {
      const attributes = {
        NumeroDossier: null,
        RecuPar: null,
        Responsable: null,
        Bureau: null,
        Repertoire: null,
        TelephonerPourRDV: null,
        DateRDV: null,
        DateMandat: null,
        HeureMandat: null,
        DateLivraison: null,
        Budget: null,
        TempsEstime: null,
        DatePerte: null,
        HeurePerte: null,
        MontantPerte: null,
        TypeDePerte: null,
        NomAssure: null,
        Reference: null,
        AdresseAssure: null,
        VilleAssure: null,
        CodePostalAssure: null,
        TypeAssure: null,
        TypeBatiment: null,
        PersonneContactAssure: null,
        CourrielContactAssure: null,
        TelBureauContactAssure: null,
        TelFaxContactAssure: null,
        TelCellulaireContactAssure: null,
        TelDomicileContactAssure: null,
        TelAutreContactAssure: null,
        CommentaireContactAssure: null,
        AdressePerte: null,
        VillePerte: null,
        CodePostalPerte: null,
        DescriptionMandat: null,
        AutresDirectives: null,
        DateFerme: null,
        MarqueVE: null,
        ModeleVE: null,
        AnneeVE: null,
        NIVVE: null,
        LieuEntreposageVE: null,
        PersonneContactVE: null,
        TelPersonneContactVE: null,
        NoStockVE: null,
        AdresseVE: null,
        VilleVE: null,
        CodePostalVE: null,
        NotesVE: null,
        LieuEntreposage: null,
        Etagere: null,
        FraisEntreposage: null,
        FraisDestruction: null,
        DimensionTotaleSpecimenH: null,
        DimensionTotaleSpecimenL: null,
        DimensionTotaleSpecimenP: null,
        PeriodeEntreposageDu: null,
        PeriodeEntreposageAu: null,
        DateDestruction: null,
        DateFraisCharge: null,
        DateFraisDestructionCharge: null,
        FraisChargePar: null,
        FraisDestructionChargePar: null,
        CauseSinistre: null,
        EquipementEnCause: null,
        Manufacturier: null,
        Modele: null,
        NumeroSerie: null,
        Entrepreneur: null,
        TypeAnalyse: null,
        FournisseurAnalyse: null,
        AncienDossier: null,
        Concurrent: null,
        Proces: null,
        ResultatProces: null,
        NoteProces: null,
        NumeroJugement: null,
        DateProchaineActivite: null,
        Responsable_Ajd_ID_Emp: null,
        Forfait: null,
        Frauduleux: null,
        createdAt: null,
        updatedAt: null,
      };

      const { ids, search } = args;
      // Check for the can_view_own
      const filters = [...(args.filters || [])];
      if (privilege === "can_view_own") {
        filters.push({
          name: "Responsable",
          value: [user.NomEmploye],
        });
      }
      const data = await folderHelpers.getSuperData(ids, {
        attributes,
        search,
        filters,
        raw: true,
        nest: true,
      });

      if (!data || !Array.isArray(data))
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${ids.toUpperCase()}_DATA_CALC`
        );

      const dates = [
        "DateRDV",
        "HeureMandat",
        "DateLivraison",
        "DateFerme",
        "DatePerte",
        "HeurePerte",
        "PeriodeEntreposageDu",
        "PeriodeEntreposageAu",
        "DateProchaineActivite",
        "DateDestruction",
        "DateFraisCharge",
        "DateFraisDestructionCharge",
        "DateMandat",
      ];
      const dataArray = data.map((folder) => {
        for (const col of dates)
          if (folder[col]) folder[col] = formatLongDate(folder[col]);
        return folder;
      });

      const buffer = await dataToExel(dataArray, labels);
      const base64 = buffer.toString("base64");

      if (!buffer || !base64)
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${ids.toUpperCase()}_CONTENT`
        );

      createActivityLog(
        `Folders Excel report generated with ${data.length} folders data.`,
        user
      );

      return base64;
    },
  },

  Mutation: {
    async folder(_, args, { user }, information) {
      // Get the operation name
      const data = args.data;
      let operation = args.operation;
      if (!operation) operation = data.NumeroDossier ? "update" : "create";

      // Verify the operation
      const allowedOps = ["update", "create", "delete"];
      const opKey = allowedOps.indexOf(operation);
      if (opKey < 0) {
        const error = "Operation unkown.";
        throw new ApolloError(error, "REQUEST_ERROR");
      }

      // Check for privilege
      const privileges = ["edit", "create", "delete"];
      const privilege = privileges[opKey];
      const canOp = await hA("folders", `can_${privilege}`, user.id_Emp);
      if (!canOp) {
        const error = `You are not authorized to ${operation}.`;
        throw new ApolloError(error, "NOT_AUTHORIZED");
      }
      const canView = await hA("folders", "can_view", user.id_Emp);
      if (!canView) {
        const canViewOwn = await hA("folders", "can_view_own", user.id_Emp);
        if (!canViewOwn) {
          const error = "You are not authorized for this resource.";
          throw new ApolloError(error, "NOT_AUTHORIZED");
        }
        const isOwner = await folderHelpers.isOwner(
          data.NumeroDossier,
          user.NomEmploye
        );
        if (!isOwner) {
          const error = "You are not authorized for this resource.";
          throw new ApolloError(error, "NOT_AUTHORIZED");
        }
      }

      const attributes = Object.keys(graphFields(information) || {});
      const execution = await folderHelpers[operation](data, attributes);
      if (!execution) {
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      createActivityLog("Folders are mutated", user);

      return execution;
    },
    async billingProjectSettings(_, { data }, { user }, information) {
      if (!data) {
        const message = "Data is required.";
        throw new ApolloError(message, `INPUT_ERROR`);
      }
      const formattedData = data;
      const id = formattedData.id;
      delete formattedData.id;
      let operation = "createSetting";
      if (id) operation = "updateSetting";

      const execution = await folderHelpers[operation](data, id);
      if (!execution) {
        throw new ApolloError(
          "Error on hanlding the requested operation.",
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }
      return execution;
    },
  },
};

module.exports = resolvers;

function labels(item) {
  let label;
  switch (item) {
    case "Reference":
      label = "Référence";
      break;
    case "Responsable":
      label = "Responsable";
      break;
    case "RecuPar":
      label = "Reçu par ";
      break;
    case "DateMandat":
      label = "Date de mandat";
      break;
    case "TypeDePerte":
      label = "Type de perte";
      break;
    case "NumeroDossier":
      label = "Nom de dossier ";
      break;
    case "TypeBatiment":
      label = "Type de batiment";
      break;
    case "Bureau":
      label = "Bureau";
      break;
    case "Ville":
      label = "Ville";
      break;

    default:
      label = item.split(/(?=[A-Z-_])/).join(" ");
  }
  return label;
}
