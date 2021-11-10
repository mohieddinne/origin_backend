const db = require("-/models");
const sqlHelpers = require("-/helpers/sql.helpers");
const { genFilters } = require("../helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports = async function (options) {
  // Build the query
  const sqlze = db.sequelize;

  const query = () => {
    const filters = genFilters(null, options).join(" AND ");
    const query = tSQL(`
      SELECT
        COUNT([DD].[NumeroDossier]) as [count],
        AVG([DD].[Delai_Mandat_Examen]) as delais_examain,
        AVG([DD].[Delai_Examen_Redaction]) as delais_redaction,
        AVG([DD].[Delai_Redaction_Facturation]) as delais_facturation
      FROM
        [tblDossierDelais] as [DD]
      RIGHT JOIN [tblDossier] as [D] ON [DD].[NumeroDossier] = [D].[NumeroDossier]
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
  const items = await sqlze.query(query(), {
    type: sqlze.QueryTypes.SELECT,
  });

  if (!items || !items.length) return null;

  const data = [];
  for (let item in items[0]) {
    data.push({
      name: item,
      description: `${item}_info`,
      value: items[0][item],
    });
  }

  return data;
};
