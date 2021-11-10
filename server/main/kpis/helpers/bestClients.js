const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");
const db = require("-/models");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (options, limit = 10, order = "number") {
  // Prepare the filters
  const isIncome = order === "income";
  const l = parseInt(limit) || 10;
  const sqlze = db.sequelize;

  // Build the query
  const query = () => {
    const filters = genFilters(order, options).join(" AND ");
    const query = tSQL(`
      SELECT TOP(${l})
        [C].[NomClient],
        [C].[TypeClient],
        [C].[NumeroClient],
        SUM([F].MontantFacture) as [income2],
        COUNT([D].[NumeroDossier]) as [folders],
        SUM([F].MontantFacture * ISNULL([DAC].[pourcentageRisque] , 0)) as [income]
        FROM
        [tblFactures] as F
        INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
        INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
        INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
        INNER JOIN [tblDossierAClientAAssureur] as [DAC] ON [D].[NumeroDossier] = [DAC].[NumeroDossier] AND [C].NumeroClient = [DAC].[NumeroAssureur]
      ${
        filters !== ""
          ? `WHERE 
        ${filters}`
          : ""
      }
      GROUP BY
        [C].[NomClient],
        [C].[TypeClient],
        [C].[NumeroClient]
      ORDER BY
        ${
          isIncome
            ? "SUM([F].MontantFacture * ISNULL([DAC].[pourcentageRisque] , 0)) DESC"
            : "COUNT([D].[NumeroDossier]) DESC"
        }
    `);
    return query;
  };

  // Execute the query
  return await sqlze.query(query(), {
    type: sqlze.QueryTypes.SELECT,
  });
};
