const db = require("-/models");
const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (count, options) {
  // Prepare the filters
  const isIncome = count === "income";
  const filters = genFilters(count, options).join(" AND ");
  // Build the query
  const query = tSQL(`
		SELECT
			[D].[TypeDePerte],
			[D].[Bureau],
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
		GROUP BY
			[D].[TypeDePerte],
			[D].[Bureau]
		ORDER BY
			[D].[TypeDePerte];
	`);
  // Execute the query
  const items = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });

  const data = [];
  const types = [];
  for (const item of items) {
    const i = types.indexOf(item.TypeDePerte);
    const d = {
      name: item.Bureau,
      value: item[isIncome ? "income" : "number"],
    };
    if (i >= 0) {
      // exists
      data[i].data.push(d);
    } else {
      data.push({
        name: item.TypeDePerte,
        data: [d],
      });
      types.push(item.TypeDePerte);
    }
  }

  return data;
};
