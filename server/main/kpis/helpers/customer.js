const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");
const db = require("-/models");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (count, options, limit = 10) {
  // Prepare the filters
  const isIncome = count === "income";
  const sqlze = db.sequelize;
  // Build the query
  const query = () => {
    const filters = genFilters(count, options).join(" AND ");
    const query = tSQL(`
      SELECT
        [C].[NomClient],
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
        INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
        INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DC].[NumeroClient]
        
        LEFT JOIN [tblDossierAAssures] AS [DA] ON [D].[NumeroDossier] = [DA].[NumeroDossier]
        LEFT JOIN [tblDossier_Liaison_Client] AS [DLC] ON [DA].[id] = [DLC].[ID_tblDossiersAAssures]
        LEFT JOIN [tblDossierAClient] AS [TDC] ON [DLC].[ID_tblDossiersAClient] = [TDC].[ID]
        LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [TDC].[ID]
        LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
        LEFT JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
      ${
        filters !== ""
          ? `WHERE 
        ${filters}`
          : ""
      }
      GROUP BY
        [C].[NomClient]
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
  const others = {
    name: "others",
    value: 0,
  };

  const data = [];
  let k = 0;
  for (const item of items) {
    const value = item[isIncome ? "income" : "number"];
    if (k + 1 <= limit)
      data.push({
        name: item.NomClient,
        value,
      });
    else others.value = others.value + value;
    k++;
  }

  if (others.value > 0) data.push(others);

  return data;
};
