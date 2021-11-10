const { ApolloError } = require("apollo-server-express");
const helpers = require("./helpers");
const uHlprs = require("../user/helpers");
const { tblEmployes, tblDossier } = require("../../models");
const db = require("../../models");
const sqlHelpers = require("../../helpers/sql.helpers");
const tSQL = sqlHelpers.trimSQLString;

const i18nHelper = require("../../helpers/i18n.helper");
const sqlze = db.sequelize;

const hA = uHlprs.hasAccess.bind(uHlprs);

const resolvers = {
  Query: {
    async report_TEC(_, args, { user }) {
      const permissions = [
        hA("reports-tec", "can_view", user.id_Emp),
        hA("reports-tec", "can_view_own", user.id_Emp),
      ];
      const [canView, canViewOwn] = await Promise.all(permissions);
      if (!canView && !canViewOwn) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      let { employees } = args;
      if (!canView) {
        const employee = await tblEmployes.findOne({
          where: { id_Emp: user.id_Emp },
          attributes: ["NomEmploye"],
        });
        employees = [employee.NomEmploye];
      }
      const projectNumber = args.projectNumber;
      // const folderExist = tblDossier.findOne({
      //   where: { NumeroDossier: projectNumber },
      // });
      // if (!folderExist) throw new ApolloError("Folder Number dose not exist !");

      return await helpers.report_TEC({ employees, projectNumber });
    },
    async filterReport(_, {}, {}, info) {
      let data = [];
      const req =
        "SELECT  [E].[NomEmploye] as [value], [NomFamille], [Prenom], [Actif] FROM [tblEmployes] as [E] WHERE [E].[Expert] = 1 ORDER BY [value];";
      const items = await sqlze.query(tSQL(req), {
        type: sqlze.QueryTypes.SELECT,
      });

      data.push({
        name: "staff",
        data: items
          .filter((item) => item.value)
          .map(({ value, NomFamille, Prenom, Actif }) => ({
            name: `${Prenom} ${NomFamille}`,
            value,
            actif: Actif,
          })),
      });
      return data;
    },
  },
};

module.exports = resolvers;
