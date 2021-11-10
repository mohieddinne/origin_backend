const db = require("-/models");
const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (count, options) {
  // Prepare the filters
  const isIncome = count === "income";
  const sqlze = db.sequelize;

  // Build the query
  const query = () => {
    const filters = genFilters(count, options).join(" AND ");
    const query = tSQL(`
      SELECT
        [D].[TypeDePerte],
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
        [D].[TypeDePerte]
      ORDER BY
        ${
          isIncome
            ? "SUM([F].MontantFacture) DESC"
            : "COUNT([D].[NumeroDossier]) DESC"
        }
    `);
    return query;
  };

  // Execute the query
  const items = await sqlze.query(query(), {
    type: sqlze.QueryTypes.SELECT,
  });

  const data = items.map((item) => {
    const value = item[isIncome ? "income" : "number"];
    return {
      name: item.TypeDePerte,
      value,
    };
  });

  return data;
};
