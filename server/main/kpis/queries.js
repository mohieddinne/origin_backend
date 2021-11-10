const sqlHelpers = require("../../helpers/sql.helpers");

const tSQL = sqlHelpers.trimSQLString;

module.exports.lossesandoffices = function (isIncome, filters) {
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

  return query;
};

module.exports.offices = function (isIncome, filters) {
  const query = tSQL(`
  SELECT
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
  ${
    filters !== ""
      ? `WHERE 
    ${filters}`
      : ""
  }
  GROUP BY
    [D].[Bureau]
  ORDER BY
    ${
      isIncome
        ? "SUM([F].MontantFacture) DESC"
        : "COUNT([D].[NumeroDossier]) DESC"
    }
`);
  return query;
};

// TODO
module.exports.customergroupsquery = function (isIncome, filters) {
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
  ${
    filters !== ""
      ? `WHERE 
    ${filters}`
      : ""
  }
`);
  return query;
};

module.exports.customers = function (isIncome, filters) {
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
    INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
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
