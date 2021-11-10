const { ApolloError } = require("apollo-server-express");
const helpers = require("./helpers");
const { requestedFields } = require("../../../helpers/graphql.helper");
const { tblEmployes } = require("../../../models");
const dataToExel = require("../../../libs/exel-generator");

const resolvers = {
  Query: {
    async activities(_, args, { user, privilege }, information) {
      const { ids, folderId, pagination, search } = args;
      const attributes = requestedFields(information);
      // Privilege
      let filters = args.filters || [];
      if (privilege === "can_view_own") {
        filters = filters.filter((e) => e.name !== "responsible");
        filters.push({ name: "responsible", value: [user.NomEmploye] });
      }
      return await helpers.getData(ids, folderId, {
        pagination,
        search,
        filters,
        attributes,
      });
    },
    async checkMyActivities(_, args, { user }, information) {
      const attributes = requestedFields(information);
      return await helpers.getDataForCheck(user, { attributes });
    },

    async checkActivities(
      _,
      { id, search, filters, widget },
      { user },
      information
    ) {
      const attributes = requestedFields(information);

      return await helpers.getDataForCheck(
        user,
        { search, filters, attributes },
        id,
        widget
      );
    },
    /*async billableHoursDetails(_, { responsible }, { user }, information) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      const attributes = requestedFields(information);

      return await helpers.getBillableHoursDetails(sUser, { attributes });
    },*/
    async checkBillableHoursDetails(_, { responsible }, { user }) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      return await helpers.checkBillableHoursDetails(sUser);
    },

    async checkBillableHours(_, { responsible, folder }, { user }) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      return await helpers.checkBillableHours(sUser, folder);
    },
    async checkBillableHoursActiveDetails(
      _,
      { responsible, year, type },
      { user }
    ) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      return await helpers.checkBillableHoursActiveDetails(sUser, year, type);
    },
    async checkForNotBilledBillableHoursDetails(_, { responsible }, { user }) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      return await helpers.checkForNotBilledBillableHoursDetails(sUser);
    },
    async activityToFile(_, { search, filters }, { user }, info) {
      // const data = await helpers.getData(user, { search, filters });
      const data = await helpers.getData([], null, {
        pagination: null,
        search,
        filters,
        attributes: [],
      });
      const buffer = await dataToExel(data?.nodes || [], labels);
      const base64 = buffer.toString("base64");
      if (!base64) {
        const error = "Error generating file";
        throw new ApolloError(error, "FILE_ERROR");
      }
      return base64;
    },
    async filtersActivity(_, args, { privilege, user }) {
      const options = {
        ...args,
        ownOnly: privilege === "can_view_own",
        user,
      };
      return await helpers.filters(options);
    },
    async ActivityIncome(_, { slugs, filters }, { user, privilege }) {
      const admin = await tblEmployes.findOne({
        where: { id_Emp: user?.id_Emp },
        attributes: [
          ["Niveau", "level"],
          ["id_Emp", "id"],
        ],
      });

      if (privilege === "can_view_own") userFullName = user.NomEmploye;
      return await helpers.getActivityIncome(slugs, admin?.dataValues, filters);
    },
    async activitiesCatagories(_, args, ctx, info) {
      return await helpers.getActivitiesCatagories(args);
    },
    async activitiesTypes(_, args, ctx, information) {
      const attributes = requestedFields(information);
      return await helpers.getActivitiesTypes({ args, attributes });
    },
    async activitiesEmployee(_, args, ctx, info) {
      return await helpers.getActivitiesEmployee(args);
    },
    async activitiesEmployeeExpert(_, { folderId, invoiceId }, ctx, info) {
      return await helpers.getactivitiesEmployeeExpert(folderId, invoiceId);
    },
  },
  Mutation: {
    // async mutateActivity(_, { data }, ctx, info) {
    //   // data validation
    //   // check permessions
    //   return await helpers.mutate(data);
    // },
    async activityAction(_, args, { user }, information) {
      const data = args.data || null;
      const ids = data.map((e) => e.id);
      if (!data) {
        const message = "Data is required.";
        throw new ApolloError(message, `INPUT_ERROR`);
      }

      const attributes = requestedFields(information);

      const operation = args.operation;
      const execution = await helpers[operation](data, ids, attributes, user);
      if (!execution) {
        throw new ApolloError(
          "Error on hanlding the requested operation.",
          `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
        );
      }

      return execution;
    },

    async confirmProjectInvoice(
      _,
      { invoiceId, users, closeFolder },
      { user }
    ) {
      return await helpers.confirmProjectInvoice(invoiceId, user.id_Emp, {
        users,
        closeFolder,
      });
    },
  },
};

module.exports = resolvers;

function labels(item) {
  let label;
  switch (item) {
    case "id":
      label = "Numéro de l’activité";
      break;
    case "responsible":
      label = "Responsable";
      break;
    case "employeeName":
      label = "Nom de l'employé";
      break;
    case "folderId":
      label = "Numéro du dossier";
      break;
    case "activiteType":
      label = "Activité";
      break;
    case "category":
      label = "Catégorie";
      break;
    case "hours":
      label = "Heures";
      break;
    case "date":
      label = "Date de l'activité";
      break;
    case "hourlyRate":
      label = "Heures facturées";
      break;
    case "invoiceId":
      label = "Facture affectée	";
      break;
    case "invoiceDate":
      label = "Date de facturation";
      break;
    case "projectInvoice":
      label = "Facture affectée";
      break;
    case "billableHours":
      label = "Heures facturables";
      break;
    default:
      label = item.split(/(?=[A-Z-_])/).join(" de ");
      break;
  }
  return label;
}
