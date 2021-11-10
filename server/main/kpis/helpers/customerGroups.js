const db = require("-/models");
const { ClientGroups } = require("-/models");
const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (count, options) {
  // Prepare the filters
  const isIncome = count === "income";
  const sqlze = db.sequelize;

  // Build the query
  const query = (group) => {
    const filters = genFilters(count, {
      ...options,
      customer_group: [group],
    }).join(" AND ");
    const query = tSQL(`
        SELECT
          ${
            isIncome
              ? "SUM([F].MontantFacture) as [income]"
              : "COUNT([D].[NumeroDossier]) as [number]"
          }
        FROM
          ${
            isIncome
              ? "[tblFactures] as F INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier"
              : "[tblDossier] as D"
          }
          LEFT JOIN [tblDossierAAssures] AS [DA] ON [D].[NumeroDossier] = [DA].[NumeroDossier]
            LEFT JOIN [tblDossier_Liaison_Client] AS [dlc] ON [DA].[id] = [dlc].[ID_tblDossiersAAssures]
            LEFT JOIN [tblDossierAClient] AS [DC] ON [dlc].[ID_tblDossiersAClient] = [DC].[ID]
            LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
            LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
            LEFT JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
        ${
          filters !== ""
            ? `WHERE 
          ${filters}`
            : ""
        }
      `);
    return query;
  };

  // Execute the query
  const data = [];
  const groups = await ClientGroups.findAll({
    attributes: ["id", "name", "color", "fallback"],
  });

  if (!groups || groups.length === 0) return null;

  for (const group of [{ id: null }, ...groups]) {
    const items = await sqlze.query(query(group.id), {
      type: sqlze.QueryTypes.SELECT,
    });
    data.push({
      name: group.name,
      value: items[0][isIncome ? "income" : "number"],
      fallback: group.fallback,
      options: [
        {
          name: "id",
          value: group.id,
        },
        {
          name: "color",
          value: group.color,
        },
      ],
    });
  }

  const noneGroupped = data.find((e) => !e.name);
  if (noneGroupped) {
    const fallback = data.find((e) => e.fallback);
    if (fallback) {
      return data
        .filter((e) => e.name)
        .map((e) => {
          if (e.name === fallback.name) {
            return {
              ...e,
              value: e.value + noneGroupped.value,
            };
          }
          return e;
        });
    }
  }
  return data;
};
