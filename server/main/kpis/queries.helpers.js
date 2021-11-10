const sqlHelpers = require("../../helpers/sql.helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports.lossesandoffices = function (isIncome, filters) {
  const query = tSQL(`
  SELECT
  ${
    isIncome
      ? "[F].[NumeroFacture],[F].[NumeroDossier], [F].[MontantFacture] "
      : "[D].[NumeroDossier]"
  }
FROM
  ${
    isIncome
      ? "[tblFactures] as F INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier"
      : "[tblDossier] as D"
  }
${
  filters !== ""
    ? `WHERE 
  ${filters}`
    : ""
}`);
  return query;
};

module.exports.offices = function (isIncome, filters) {
  return tSQL(`
    SELECT 
       

      ${
        isIncome
          ? "[F].[NumeroDossier], [D].[Bureau], [F].[NumeroFacture],[F].[DateFacturation],[F].[MontantFacture],[D].[NomAssure]"
          : "[D].[NumeroDossier],[D].[Bureau],[D].[DateMandat],[D].[NomAssure]"
      }
    FROM
      ${
        isIncome
          ? "[tblFactures] as F INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier"
          : "[tblDossier] as D"
      }
    ${
      filters !== ""
        ? `WHERE 
      ${filters}`
        : ""
    }
  `);
};

// TODO
module.exports.customergroupsquery = function (isIncome, filters) {
  const queryNumber = tSQL(`
    SELECT
         [D].[NumeroDossier],
         [D].[Bureau],
         [C].NomClient,
         [C].[NumeroClient],
         [D].[DateMandat],
         [CG].[name]
         ,[D].[NomAssure]
    FROM
         [tblDossier] as D
         INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
         INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
         LEFT JOIN [tblClientGroupes] as [CG] ON [C].[group_id] = [CG].id
    ${filters !== "" ? `WHERE ${filters}` : ""}
        `);

  const queryIncome = tSQL(`
    SELECT
        [F].[NumeroDossier],
        [F].[NumeroFacture],
        [C].[NomClient],
        [C].[NumeroClient],
        [F].[MontantFacture],
        [F].[DateFacturation],
        
        [CG].[name]
        ,[D].[NomAssure]

    FROM
        [tblFactures] as F INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
        INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
        INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
        LEFT JOIN [tblClientGroupes] as [CG] ON [C].[group_id] = [CG].id

    ${filters !== "" ? `WHERE ${filters}` : ""}
      
      `);
  return isIncome ? queryIncome : queryNumber;
};

module.exports.customers = function (isIncome, filters) {
  return tSQL(`
    SELECT
      ${
        isIncome
          ? "[F].[NumeroDossier] ,[F].[MontantFacture],[F].[DateFacturation],[F].[NumeroFacture],[C].[NomClient],[C].[NumeroClient],[D].[NomAssure]"
          : "[D].[NumeroDossier],[D].[DateMandat],[C].[NomClient],[C].[NumeroClient],[D].[NomAssure]"
      }
    FROM
      ${
        isIncome
          ? "[tblFactures] as F INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier"
          : "[tblDossier] as D"
      }
      INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
      INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
    ${
      filters !== ""
        ? `WHERE 
      ${filters}`
        : ""
    }
  `);
};

module.exports.bestClients = function (isIncome, filters) {
  return tSQL(`
    SELECT TOP(50)
      [D].[NumeroDossier],
      [C].[NomClient],
      [C].[TypeClient],
      [C].[NumeroClient],
      [F].MontantFacture
      ,[D].[NomAssure]
      
    FROM
      [tblFactures] as F
      INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
      INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
      INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
    ${
      filters !== ""
        ? `WHERE 
      ${filters}`
        : ""
    }
    ORDER BY
      [C].[NumeroClient]
  `);
};

module.exports.folderstypes = function (isIncome, filters) {
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
