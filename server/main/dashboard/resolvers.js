const helper = require("./helpers");
const { tblEmployes } = require("../../models");

const resolvers = {
  Query: {
    async WidgetBillableHours(root, { responsible, type }, { user }, info) {
      let sUser = user.id_Emp;
      let u = null;
      if (responsible) {
        u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsible },
        });
      }
      if (u) sUser = u.id_Emp;
      return helper.WidgetBillableHours(sUser, type);
    },
    async widgetReceivedFolder(_, args, { user, privilege }) {
      const { responsable, filters } = args;
      let sUser = user;
      if (privilege === "can_view" && responsable) {
        const u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsable },
        });
        if (u) sUser = { id_Emp: u.id_Emp };
      }
      // Get the data and return it
      return helper.widgetReceivedFolder(sUser, filters);
    },
    async widgetIncomeVGoals(_, args, { user, privilege }) {
      const { responsable } = args;
      let sUser = user;
      if (privilege === "can_view" && responsable) {
        const u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsable },
        });
        if (u) sUser = { id_Emp: u.id_Emp };
      }
      // Get the data and return it
      return helper.widgetIncome(sUser);
    },
    async widgetSTEC(_, args, { user, privilege }) {
      const options = renderQueryOptions(args.options);
      let sUser = user;
      if (privilege === "can_view" && args.responsable) {
        const u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsable },
        });
        if (u) sUser = { id_Emp: u.id_Emp };
      }
      return helper.widgetSTEC(sUser, options);
    },
    async widgetBudgetAndDelais(_, args, { user, privilege }) {
      const options = renderQueryOptions(args.options);
      const { responsable } = options;
      let sUser = user;
      if (privilege === "can_view" && responsable) {
        const u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: responsable },
        });
        if (u) sUser = { id_Emp: u.id_Emp };
      }
      return helper.widgetBudgetAndDelais(sUser, options);
    },
    async widgetBvNbHours(_, args, { user, privilege }) {
      const options = renderQueryOptions(args.options);
      let sUser = user;
      if (privilege === "can_view" && args.responsable) {
        const u = await tblEmployes.findOne({
          attributes: ["id_Emp"],
          where: { NomEmploye: args.responsable },
        });
        if (u) sUser = { id_Emp: u.id_Emp };
      }
      return helper.widgetBvNbHours(sUser, options);
    },
  },
};

function renderQueryOptions(optionsArray) {
  if (!Array.isArray(optionsArray)) return {};
  const options = {};
  optionsArray.map((option) => {
    options[option.name] = option.value;
  });
  return options;
}

module.exports = resolvers;
