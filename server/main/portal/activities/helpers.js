const db = require("../../../models");
const sqlHlprs = require("../../../helpers/sql.helpers");
const dateHlprs = require("../../../helpers/dates.helper");
const mailHelper = require("../../../helpers/email.helper");
const userHelpers = require("../../user/helpers");
const gQlHelpers = require("../../../helpers/graphql.helper");
const { Console } = require("@sentry/node/dist/integrations");
const { promises } = require("stream");

// Aliases
const { trimSQLString } = sqlHlprs;
const {
  tblActivites,
  tblEmployes,
  tblTypesActivitesCategories,
  tblTypesActivites,
  ProjectInvoiceConfirmation,
  tblDossier,
  tblFacture,
} = db;

/**
 * Get data
 * @param array ids
 * @param object options
 */
module.exports.getData = async function (ids, folderId, options) {
  const where = [];
  const replacements = {};

  if (Array.isArray(ids) && ids.length > 0) {
    replacements.ids = ids;
    where.push("[A].[ID] IN (:ids)");
  }

  if (Array.isArray(folderId) && folderId.length > 0) {
    replacements.folderId = folderId;
    where.push("[A].[NumeroDossier] IN (:folderId)");
  }
  // Search
  const search = options.search || "";
  let searchWhere = "";
  if (search) {
    const searchAttrs = [
      "[A].[NumeroDossier]",
      "[F].[NumeroFacture]",
      "[D].[Responsable]",
      "[A].[NomEmploye]",
      "[A].[Commentaire]",
      "[A].[Commentaire_Supp]",
      "[C].[NomClient]",
      "[AC].[NomClient]",
    ];
    replacements.search = `%${search}%`;
    searchWhere = searchAttrs
      .map((attr) => `${attr} LIKE :search`)
      .join(" OR ");
  }
  const tblRawAttrs = tblActivites.rawAttributes;

  // Filters
  let where2 = [];
  const filters = options.filters || [];
  for (const filter of filters) {
    if (Array.isArray(filter.value) && filter.value.length)
      switch (filter.name) {
        case "date_start":
        case "date_end":
          const date_ = filter.value[0];
          if (date_) {
            const op = filter.name === "date_start" ? ">=" : "<=";
            replacements.f_date = filter.value[0];
            where.push(
              `CAST([A].[DateActivite] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "date_facturation_start":
        case "date_facturation_end":
          const _date = filter.value[0];
          if (_date) {
            const op = filter.name === "date_facturation_start" ? ">=" : "<=";
            replacements.df_date = filter.value[0];
            where.push(
              `CAST([f].[DateFacturation] as DATE) ${op} CAST(N'${_date}' as DATE)`
            );
          }
          break;
        case "date_activite":
          replacements.df_date = filter.value;
          for (const v of filter.value)
            where2.push(`CAST([DateActivite] as DATE) = '${v}'`);
          break;
        case "week_of_date":
          filter.value[0];
          const daysOfAWeek = dateHlprs.daysOfAWeek(filter.value[0]);
          for (const v of daysOfAWeek) {
            where2.push(
              `CAST([DateActivite] as DATE) = CAST('${v.toISOString()}' as DATE)`
            );
          }
          break;
        case "customers":
          replacements[`fc_${filter.name}`] = filter.value;
          where.push(`([DC].[NumeroClient] IN (:fc_${filter.name}) )`);
          break;

        case "employee_id":
          replacements[`af_employee_id`] = filter.value;
          where.push(`([A].[id_Emp] IN (:af_employee_id) )`);
          break;
        case "employee_name":
          replacements[`fc_${filter.name}`] = filter.value;
          where.push(`([A].[NomEmploye] IN (:fc_${filter.name}) )`);
          break;
        case "responsible":
          replacements[`fc_${filter.name}`] = filter.value;
          where.push(`([D].[Responsable] IN (:fc_${filter.name}) )`);
          break;
        case "insurers":
          console.log({ filter });
          replacements[`fi_${filter.name}`] = filter.value;
          where.push(`([DA].[Nom_Assure] IN (:fi_${filter.name}) )`);
          break;
        case "categories":
          replacements[`fac_${filter.name}`] = filter.value;
          where.push(`([A].[Categorie] IN (:fac_${filter.name}) )`);
          break;
        case "activities":
          replacements[`faa_${filter.name}`] = filter.value;
          where.push(`([A].[Activite] IN (:faa_${filter.name}) )`);
          break;
        case "invoice_number":
          replacements[`fc_${filter.name}`] = filter.value;
          where.push(`([A].[FactureAffecte] IN (:fc_${filter.name}) )`);
          break;
        case "folder_id":
          replacements[`fc_${filter.name}`] = filter.value;
          where.push(`([A].[NumeroDossier] IN (:fc_${filter.name}) )`);
          break;
        case "hourly_rates":
          const [a, b] = filter.value;
          const min = parseInt(a);
          const max = parseInt(b);
          where.push(
            `([A].[TauxHoraire] >= ${min} AND [A].[TauxHoraire] <= ${max})`
          );
          break;
        case "billed_hours":
          const [billed_a, billed_b] = filter.value;
          const billed_min = parseInt(billed_a);
          const billed_max = parseInt(billed_b);
          where.push(
            `([A].[HeuresFacture] >= ${billed_min} AND [A].[HeuresFacture] <= ${billed_max})`
          );
          break;
        case "hours":
          const [hours_a, hours_b] = filter.value;
          const hours_min = parseInt(hours_a);
          const hours_max = parseInt(hours_b);
          where.push(
            `([A].[Heures] >= ${hours_min} AND [A].[Heures] <= ${hours_max})`
          );
          break;
        case "activity_date":
          // DB filter name
          const dbFieldsIndex = {
            activity_date: "DateActivite",
          };
          // Generate SQL
          const operator = filter.value[0];
          replacements[`fad_${filter.name}_start`] = filter.value[1];

          const fieldName = `[A].[${dbFieldsIndex[filter.name]}]`;
          const fieldNameCasted = `CAST(${fieldName} AS DATE)`;
          console.log({ fieldNameCasted, fieldName });
          if (operator === "IS_BETWEEN") {
            replacements[`fad_${filter.name}_end`] = filter.value[2];
            where.push(`
              (${fieldNameCasted} >= CAST(:fad_${filter.name}_start as DATE)
              AND
              ${fieldNameCasted} <= CAST(:fad_${filter.name}_end as DATE) )
            `);
          } else if (operator === "IS_SET") {
            where.push(`(${fieldName} IS NOT NULL)`);
          } else if (operator === "IS_NOT_SET") {
            where.push(`(${fieldName} IS NULL)`);
          } else {
            const ops = {
              IS_EQUAL_TO: "=",
              IS_NOT_EQUAL_TO: "<>",
              IS_AFTER: ">",
              IS_BEFORE: "<",
              IS_AFTER_OR_EQUAL_TO: ">=",
              IS_BEFORE_OR_EQUAL_TO: "<=",
            };
            const op = ops[operator] || ops[0];
            where.push(
              `(${fieldNameCasted} ${op} CAST(:fad_${filter.name}_start as DATE))`
            );
          }
          break;

        case "invoice":
          if (filter.value.length === 1) {
            if (filter.value[0] === "1")
              where.push(
                `([A].[FactureAffecte] IS NOT NULL OR [A].[FactureAffecte] NOT LIKE 'Projet%')`
              );
            else
              where.push(
                `([A].[FactureAffecte] IS  NULL OR [A].[FactureAffecte]  LIKE 'Projet%' OR [A].[FactureAffecte] = '')`
              );
          }
        case "statut":
          if (filter.value.length === 1) {
            if (filter.value[0] === "Active")
              where.push(
                `([A].[FactureAffecte] IS NOT NULL OR [A].[FactureAffecte] NOT LIKE 'Projet%')`
              );
            else
              where.push(
                `([A].[FactureAffecte] IS  NULL OR [A].[FactureAffecte]  LIKE 'Projet%' OR [A].[FactureAffecte] = '')`
              );
          }
        default:
          const { name, value } = filter;
          if (tblRawAttrs[name] && tblRawAttrs[name]._filtrable !== false) {
            replacements[`fs_${name}`] = value;
            where.push(`[D].[${name}] IN (:fs_${name})`);
          }
          break;
      }
  }
  // Render the where
  const wFrags = [];
  if (where2.length > 0) wFrags.push(" ( " + where2.join(" OR ") + " ) ");
  if (where.length > 0) {
    wFrags.push(" ( " + where.join(" AND ") + " ) ");
  }
  if (searchWhere) wFrags.push(" ( " + searchWhere + " ) ");
  let wSQL = "";
  if (wFrags.length > 0) wSQL = wFrags.join(" AND ");

  // The paging
  let paging = null;
  if (options.pagination) paging = sqlHlprs.paging(options.pagination);

  const idsQuery = `
    DECLARE @TempIDs TABLE(
      ID int, 
      [NumeroFacture] NVARCHAR(15),
      [DateActivite] DATETIME,
      [Activite] NVARCHAR(50)
    )

    INSERT INTO 
      @TempIDs
    SELECT 
      DISTINCT A.ID,
      [F].[NumeroFacture],
      [A].[DateActivite],
      [A].[Activite]
    FROM
      tblActivites AS A
      LEFT JOIN tblDossier AS D ON [D].NumeroDossier = [A].[NumeroDossier]
      LEFT JOIN tblTypesActivites AS TA ON [TA].[ID] = [A].[IdTypesActivites]
      LEFT JOIN tblEmployes AS E ON [E].[ID_Emp] = [A].[Id_Emp]
      LEFT JOIN tblFactures AS [F] ON [F].NumeroFacture = [A].[FactureAffecte]
      LEFT JOIN [tblDossierAAssures] AS [DA] ON [A].[NumeroDossier] = [DA].[NumeroDossier]
      LEFT JOIN [tblDossierAClient] AS [DC] ON [A].[NumeroDossier] = [DC].[NumeroDossier]
      LEFT JOIN [tblClient] AS [C] ON [DC].[NumeroClient] = [C].[NumeroClient]
      LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
      LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
      LEFT JOIN [tblClient] AS [AC] ON [AC].[NumeroClient] = [DCA].[NumeroAssureur]
      ${wSQL ? "WHERE " + wSQL : ""}
    ORDER BY
      [F].[NumeroFacture] DESC,
      [A].[DateActivite] DESC,
      [A].[Activite],
      [A].[ID] DESC
    ${
      paging
        ? ` OFFSET ${paging.offset} ROWS
            FETCH NEXT ${paging.count} ROWS ONLY`
        : ""
    }

    SELECT
      COUNT(DISTINCT A.ID) AS [totalCount]
    FROM
      tblActivites AS A
      LEFT JOIN tblDossier AS D ON [D].NumeroDossier = [A].[NumeroDossier]
      LEFT JOIN tblTypesActivites AS TA ON [TA].[ID] = [A].[IdTypesActivites]
      LEFT JOIN tblEmployes AS E ON [E].[ID_Emp] = [A].[Id_Emp]
      LEFT JOIN tblFactures AS [F] ON [F].NumeroFacture = [A].[FactureAffecte]
      LEFT JOIN [tblDossierAAssures] AS [DA] ON [A].[NumeroDossier] = [DA].[NumeroDossier]
      LEFT JOIN [tblDossierAClient] AS [DC] ON [A].[NumeroDossier] = [DC].[NumeroDossier]
      LEFT JOIN [tblClient] AS [C] ON [DC].[NumeroClient] = [C].[NumeroClient]
      LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
      LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
      LEFT JOIN [tblClient] AS [AC] ON [AC].[NumeroClient] = [DCA].[NumeroAssureur]
    ${wSQL ? "WHERE " + wSQL : ""}

    SELECT
      [A].[ID] as id,
      [A].[DateActivite] as date,
      [D].[NumeroDossier] as folderId,
      [D].[Responsable] as responsible,
      [E].[NomEmploye] as employeeName,
      [A].[Categorie] as category,
      [A].[Activite] as activiteType,
      [A].[Heures] as hours,
      [A].[HeuresFacture] as billableHours,
      [A].[TauxHoraire] as hourlyRate,
      [A].[FactureAffecte] AS projectInvoice,
      [A].[Commentaire] AS comment,
      [F].[MontantFacture] as totalInvoice,
      [F].[MontantHonoraires] as amountFees ,
      IIF(
        [F].[FF_Montant]=0,
        [A].[HeuresFacture],
        IIF([A].[HeuresFacture] <> 0, [A].[HeuresFacture], [A].[Heures])
      ) AS billableHoursSpecial,
      [F].[DateFacturation] as invoiceDate,
      [F].[NumeroFacture] as invoiceId,
      [A].[Langue] as language
    FROM
      [tblActivites] AS A
      LEFT JOIN tblDossier AS D ON [D].NumeroDossier = [A].[NumeroDossier]
      LEFT JOIN tblTypesActivites AS TA ON [TA].[ID] = [A].[IdTypesActivites]
      LEFT JOIN tblEmployes AS E ON [E].[ID_Emp] = [A].[Id_Emp]
      LEFT JOIN tblFactures AS [F] ON [F].NumeroFacture = [A].[FactureAffecte]
      LEFT JOIN [tblDossierAAssures] AS [DA] ON [A].[NumeroDossier] = [DA].[NumeroDossier]
      LEFT JOIN [tblDossierAClient] AS [DC] ON [A].[NumeroDossier] = [DC].[NumeroDossier]
      LEFT JOIN [tblClient] AS [C] ON [DC].[NumeroClient] = [C].[NumeroClient]
      LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
      LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
      LEFT JOIN [tblClient] AS [AC] ON [AC].[NumeroClient] = [DCA].[NumeroAssureur]
    WHERE
      [A].[ID] IN (SELECT ID FROM @TempIDs)
  `;

  const result = await db.sequelize.query(trimSQLString(idsQuery), {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });

  let totalCount = 0;
  if (result && result[0]) {
    totalCount = parseInt(result[0].totalCount) || 0;
    result.shift();
  }

  const includes = [
    { table: "[D]", as: "folder", type: "item" },
    { table: "[TA]", as: "_type", type: "item" },
    { table: "[E]", as: "_employee", type: "item" },
    { table: "[F]", as: "_invoice", type: "item" },
    { table: "[DA]", as: "_insurers", type: "array" },
    { table: "[DC]", as: "_clients", type: "array" },
    { table: "[C]", as: "clients", type: "array" },
    { table: "[DLA]", as: "_dla", type: "array" },
    { table: "[DCA]", as: "_dca", type: "array" },
    { table: "[AC]", as: "insurers", type: "array" },
  ];

  const nodes = result.reduce((memo, activity) => {
    const index = memo.findIndex((item) => {
      return item.id === activity.id;
    });
    // Get the item
    let item = {};
    if (index >= 0) item = memo[index];
    else item = Object.assign({}, activity);
    // Add includes
    const attributes = Object.keys(activity);
    for (const inld of includes) {
      const subItem = attributes.reduce((result, attr) => {
        if (attr.indexOf(inld.as) === 0) {
          if (!result) result = {};
          result[attr.replace(`${inld.as}.`, "")] = activity[attr];
          delete activity[attr];
        }
        return result;
      }, null);
      if (!subItem) continue;
      if (inld.type === "array" && !Array.isArray(item[inld.as])) {
        item[inld.as] = [];
      }
      if (inld.type === "array") {
        item[inld.as].push(subItem);
      } else {
        item[inld.as] = subItem;
      }
    }
    // Return the memo
    if (index >= 0) {
      memo[index] = item;
      // To be deleted later
      const invoice = item.invoice || null;
      if (invoice) {
        memo[index].invoiceId = invoice.NumeroFacture;
        memo[index].invoiceDate = invoice.DateFacturation;
      }
      return memo;
    } else {
      // Needed for GraphQL
      item.__typename = "Activity";
      return [...memo, item];
    }
  }, []);

  return {
    totalCount,
    pageInfo: {
      hasNextPage: paging ? paging.offset + paging.count < totalCount : false,
      endCursor: null,
    },
    edges: [{ node: nodes[0] }, { node: nodes[nodes.length - 1] }],
    nodes,
  };
};

/**
 * Get the data of activities for a check
 * @param integer user
 * @param object options
 */
module.exports.getDataForCheck = async function (user, options, id, widget) {
  // Get the employee name
  const employee = await tblEmployes.findOne({
    where: {
      id_Emp: user.id_Emp,
    },
    attributes: ["NomEmploye"],
  });

  // Handle main attributes
  const attributes = new Set();
  if (options.attributes) {
    const keys = Object.keys(tblActivites.rawAttributes);
    for (const field in options.attributes)
      if (keys.includes(field)) attributes.add(field);
  }

  // Filters
  const d = new Date();
  const calendar = {};
  calendar.thisMonth = d.getMonth() + 1;
  calendar.thisYear = d.getFullYear();
  if (calendar.thisMonth >= 10) {
    // October
    calendar.firstYear = d.getFullYear();
    calendar.secondYear = d.getFullYear() + 1;
  } else {
    calendar.firstYear = d.getFullYear() - 1;
    calendar.secondYear = d.getFullYear();
  }

  let whereID = user.id_Emp;
  if (id) {
    whereID = id;
  }
  let activities = [];
  if (widget === "WidgetBillableHours")
    activities = await db.sequelize.query(
      trimSQLString(
        require("../dashboard/queries").activityDetailsQuery(whereID)
      ),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
  else
    activities = await db.sequelize.query(
      trimSQLString(`
    DECLARE @dateAu AS DATE
      SET
          @dateAu = GETDATE()
    SELECT
        a.id as id,
        a.DateActivite AT TIME ZONE 'Eastern Standard Time' as date,
        d.NumeroDossier as folderId,
        e.NomEmploye as employeeName,
        CONCAT(a.Categorie, ' - ', a.Activite) AS activiteType,
        IIF(
            f.FF_Montant=0,
            a.HeuresFacture,
            IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
        ) AS billableHours,
        f.DateFacturation as invoiceDate,
        f.NumeroFacture as invoiceId
    FROM
        tblActivites AS a
        INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
        INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
        INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
        INNER JOIN tblFactures AS f ON f.NumeroFacture = a.FactureAffecte
    WHERE
        a.Id_Emp = ${whereID} 
        AND (
            a.FactureAffecte IS NOT NULL
            AND a.FactureAffecte NOT LIKE 'Projet%'
        )
        AND (
            (
                f.FF_Montant=0
                AND a.HeuresFacture <> 0
            )
            OR (
                f.FF_Montant>0
                AND a.Heures <> 0
                AND a.Activite NOT LIKE 'RV%'
            )
            OR (
                f.FF_Montant>0
                AND a.HeuresFacture <> 0
            )
        )
        AND a.NumeroDossier NOT LIKE '00%'
        AND (
            ta.NonFacturable = 0
            OR ta.Activite LIKE 'DV%'
            OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
            OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
        )
        AND CAST(f.DateFacturation AS DATE) >= IIF(
            DATEPART(month, @dateAu) >= 1
            AND DATEPART(month, @dateAu) <= 9,
            /*Entre Janvier et  septembre*/
            CAST(
                CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
            ),
            /*Entre Octobre er Decembre*/
            CAST(
                CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
            )
        )
        AND CAST(f.DateFacturation AS DATE) <= GETDATE()
    ORDER BY
        f.NumeroFacture DESC,
        a.DateActivite DESC,
        a.Activite,
        a.ID DESC;
    `),
      { type: db.sequelize.QueryTypes.SELECT }
    );
  return activities?.map((activity) => {
    const item = { ...activity };
    const invoice = activity.invoice || null;
    if (invoice) {
      item.invoiceId = invoice.NumeroFacture;
      item.invoiceDate = invoice.DateFacturation;
    }
    return item;
  });
};

// Check the folders used for the widget Heures facturées / Objectif in the dashbord
module.exports.checkBillableHoursDetails = async function (user) {
  const query = trimSQLString(`
  DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
  SET
      @dateAu = GETDATE()
  SET
      @Id_Empl = ${user}
  SELECT
  
  d.NumeroDossier  as [folderId] ,
    d.bureau,
    [d].[Responsable] as [responsable],
    e.NomEmploye as [employeeName],
    d.TypeDePerte,
    IIF(d.TypeBatiment IS NULL, '', d.TypeBatiment) AS TypeBatiment,
    ROUND(
        SUM(
            IIF(
                f.FF_Montant = 0
                AND f.FF_Montant_Tot = 0,
                a.HeuresFacture,
                IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
            )
        ),
        2
    ) AS NombreHeuresFacturees

    FROM
    tblActivites AS a
    INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
    INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
    INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
    INNER JOIN tblFactures AS f ON f.NumeroFacture = a.FactureAffecte
WHERE
    a.Id_Emp = @Id_Empl
    AND (
        a.FactureAffecte IS NOT NULL
        AND a.FactureAffecte NOT LIKE 'Projet%'
    )
    AND (
        (
            f.FF_Montant = 0
            AND a.HeuresFacture <> 0
        )
        OR (
            f.FF_Montant > 0
            AND a.Heures <> 0
            AND a.Activite NOT LIKE 'RV%'
        )
        OR (
            f.FF_Montant > 0
            AND a.HeuresFacture <> 0
        )
    )
    AND a.NumeroDossier NOT LIKE '00%'
    AND ta.NonFacturable = 0
    AND CAST(f.DateFacturation AS DATE) >= IIF(
        DATEPART(month, @dateAu) >= 1
        AND DATEPART(month, @dateAu) <= 9,
        /*Entre Janvier et  septembre*/
        CAST(
            CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
        ),
        /*Entre Octobre er Decembre*/
        CAST(
            CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
        )
    )
    AND CAST(f.DateFacturation AS DATE) <= GETDATE()
GROUP BY
    d.NumeroDossier,
    d.Bureau,
    d.Responsable,
    e.NomEmploye,
    d.TypeDePerte,
    d.TypeBatiment
ORDER BY
    d.NumeroDossier,
    d.Bureau,
    d.Responsable,
    e.NomEmploye,
    d.TypeDePerte,
    d.TypeBatiment
      `);

  const data = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
  return data;
};

// Check the activity used for the widget Heures facturées / Objectif in the dashbord
module.exports.checkBillableHours = async function (user, folder) {
  const query = trimSQLString(`
  DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
    SET
        @dateAu = GETDATE()
    SET
        @Id_Empl = ${user}
    select
        ta.id,
        ta.DateActivite as date,
        ta.Activite as activiteType,
        ta.FactureAffecte as invoiceId,
        ROUND(
            IIF(
                tf.FF_Montant = 0
                AND tf.FF_Montant_Tot = 0,
                ta.HeuresFacture,
                IIF(
                    ta.HeuresFacture <> 0,
                    ta.HeuresFacture,
                    ta.Heures
                )
            ),
            2
        ) AS billableHours,
        tf.dateFacturation as invoiceDate
    from
        tblActivites ta
        inner join tblFactures tf on tf.NumeroFacture = ta.FactureAffecte
        INNER JOIN tblTypesActivites AS typeA ON typeA.ID = ta.IdTypesActivites
    where
        ta.NumeroDossier = '${folder}'
        and ta.Id_Emp = @Id_Empl
        AND (
            ta.FactureAffecte IS NOT NULL
            AND ta.FactureAffecte NOT LIKE 'Projet%'
        )
        AND (
            (
                tf.FF_Montant = 0
                AND ta.HeuresFacture <> 0
            )
            OR (
                tf.FF_Montant > 0
                AND ta.Heures <> 0
                AND ta.Activite NOT LIKE 'RV%'
            )
            OR (
                tf.FF_Montant > 0
                AND ta.HeuresFacture <> 0
            )
        )
        AND ta.NumeroDossier NOT LIKE '00%'
        AND typeA.NonFacturable = 0
        AND CAST(tf.DateFacturation AS DATE) >= IIF(
            DATEPART(month, @dateAu) >= 1
            AND DATEPART(month, @dateAu) <= 9,
            /*Entre Janvier et  septembre*/
            CAST(
                CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
            ),
            /*Entre Octobre er Decembre*/
            CAST(
                CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
            )
        )
        AND CAST(tf.DateFacturation AS DATE) <= GETDATE()
  `);

  const data = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
  return data;
};

module.exports.checkBillableHoursActiveDetails = async function (
  user,
  year,
  type
) {
  let whereUser = "d.ID_Emp_Responsable = @Id_Empl";
  if (type === 1) {
    whereUser = "a.ID_Emp = @Id_Empl";
  }
  const query = trimSQLString(`
  DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
  SET
      @dateAu = GETDATE()
  SET
      @Id_Empl = ${user}
  SELECT
      d.NumeroDossier as [folderId],
      d.Responsable as [responsable],
      e.NomEmploye as [employeeName],
      IIF(
          DATEPART(month, CAST(a.DateActivite AS DATE)) >= 1
          AND DATEPART(month, CAST(a.DateActivite AS DATE)) <= 9,
          /*Entre Janvier et  septembre*/
          CONCAT(
              YEAR(DATEADD(YEAR, -1, CAST(a.DateActivite AS DATE))),
              '-',
              YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE)))
          ),
          /*Entre Octobre er Decembre*/
          CONCAT(
              YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE))),
              '-',
              YEAR(DATEADD(YEAR, 1, CAST(a.DateActivite AS DATE)))
          )
      ) AS Annee,
      a.DateActivite AT TIME ZONE 'Eastern Standard Time' as [date],
      CONCAT(a.Categorie, ' - ', a.Activite) AS [activiteType],
      ROUND(
          IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures),
          2
      ) AS NombreHeuresFacturees,
      a.FactureAffecte AS [invoiceId]
  FROM
      tblActivites AS a
      INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
      INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
      INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
  WHERE
      ${whereUser}
      AND (
          a.FactureAffecte IS NULL
          OR a.FactureAffecte LIKE 'Projet%'
          OR a.FactureAffecte = ''
      )
      AND (
          ta.NonFacturable = 0
          OR ta.Activite LIKE 'DV%'
          OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
          OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
      )
      AND a.NumeroDossier NOT LIKE '00%'
      AND CAST(a.DateActivite AS DATE) <= @dateAu
      ${
        year
          ? `AND IIF(
        DATEPART(month, CAST(a.DateActivite AS DATE)) >= 1
        AND DATEPART(month, CAST(a.DateActivite AS DATE)) <= 9,
        /*Entre Janvier et  septembre*/
        CONCAT(
            YEAR(DATEADD(YEAR, -1, CAST(a.DateActivite AS DATE))),
            '-',
            YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE)))
        ),
        /*Entre Octobre er Decembre*/
        CONCAT(
            YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE))),
            '-',
            YEAR(DATEADD(YEAR, 1, CAST(a.DateActivite AS DATE)))
        )
    ) = '${year}'`
          : ""
      }
  ORDER BY
      d.NumeroDossier DESC,
      a.Activite;`);

  return await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
};

// Check for the not yet billed billable hours for the widget Heures facturées / Objectif
module.exports.checkForNotBilledBillableHoursDetails = async function (user) {
  const query = `
  DECLARE @Id_Empl AS INTEGER DECLARE @dateAu AS DATE
      SET
        @Id_Empl =${user}
      SET
        @dateAu = GETDATE()
      SELECT
        [A].[DateActivite] AT TIME ZONE 'Eastern Standard Time' as [date],
        [D].[NumeroDossier] as [folderId],
        [E].[NomEmploye] as [employeeName],
        [A].[Categorie] as [category],
        [A].[Activite] as [activiteType],
        [D].[Responsable] as [responsable],
        [A].[FactureAffecte] as assignedInvoice,
        ROUND(
          IIF(
            [A].[HeuresFacture] <> 0,
            [A].[HeuresFacture],
            [A].[Heures]
          ),
          2
        ) as [billableHours]
      FROM
        [tblActivites] AS [A]
        INNER JOIN [tblDossier] AS [D] ON [D].[NumeroDossier] = [A].[NumeroDossier]
        INNER JOIN [tblTypesActivites] AS [TA] ON [TA].[ID] = [A].[IdTypesActivites]
        INNER JOIN [tblEmployes] AS [E] ON [E].[ID_Emp] = [A].[Id_Emp]
      WHERE
        /* -- (
        --   (
        --     [D].[ID_Emp_Responsable] = @Id_Empl
        --     AND [A].[ID_Emp] = @Id_Empl
        --   )
        --   OR (
        --     [D].[ID_Emp_Responsable] = @Id_Empl
        --     AND [A].[Id_Emp] <> @Id_Empl
        --   )
        -- ) */
        [A].[ID_Emp] = @Id_Empl
        AND (
          [A].[FactureAffecte] IS NULL
          OR [A].[FactureAffecte] LIKE 'Projet%'
          OR [A].[FactureAffecte] LIKE ''
        )
        AND [A].[NumeroDossier] NOT LIKE '00%'
        AND ([TA].[NonFacturable] = 0 OR [A].[Activite] LIKE 'DV%')
        AND CAST([A].[DateActivite] AS DATE) >= IIF(
          DATEPART(MONTH, @dateAu) >= 1
          AND DATEPART(MONTH, @dateAu) <= 9,
          -- Entre Janvier et  septembre
          CAST(
            CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
          ),
          -- Entre Octobre er Decembre
          CAST(
            CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
          )
        )
        AND CAST([A].[DateActivite] AS DATE) <= GETDATE()
      ORDER BY
        d.NumeroDossier DESC,
        a.Activite`;

  return await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
};

/*module.exports.getBillableHoursDetails = async function (user) {
  const query = trimSQLString(`
    DECLARE @dateAu AS DATE
    DECLARE @Id_Empl AS INTEGER
    SET
      @dateAu = GETDATE()
    SET
      @Id_Empl = ${user}
    SELECT
      a.id as id,
      d.NumeroDossier as folderId,
      d.Responsable as responsable,
      e.NomEmploye as employeeName,
      a.DateActivite as date,
      a.Categorie as category,
      a.Activite as activiteType,
      ROUND(
        IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures),
        2
      ) AS billableHours,
      a.FactureAffecte AS invoiceId,
      IIF(
        DATEPART(month, @dateAu) >= 1
        AND DATEPART(month, @dateAu) <= 9,
        CAST(
          CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
        ),
        CAST(
          CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
        )
      ) AS invoiceDate
    FROM
      tblActivites AS a
      INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
      INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
      INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
    WHERE
      (
        (
          d.ID_Emp_Responsable = @Id_Empl
          AND a.ID_Emp = @Id_Empl
        )
        OR (
          d.ID_Emp_Responsable = @Id_Empl
          AND a.Id_Emp <> @Id_Empl
        )
      )
      AND (
        a.FactureAffecte IS NULL
        OR a.FactureAffecte LIKE 'Projet%'
        OR a.FactureAffecte = ''
      )
      AND (
          ta.NonFacturable = 0
          OR ta.Activite LIKE 'DV%'
          OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
          OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
      )
      AND a.NumeroDossier NOT LIKE '00%'
      AND CAST(a.DateActivite AS DATE) >= IIF(
        DATEPART(month, @dateAu) >= 1
        AND DATEPART(month, @dateAu) <= 9,
        CAST(
          CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
        ),
        CAST(
          CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
        )
      )
      AND CAST(a.DateActivite AS DATE) <= @dateAu
    ORDER BY
        a.DateActivite,
        d.NumeroDossier,
        e.NomEmploye,
        a.Categorie,
        a.Activite,
    IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)`);

  const data = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
  return data;
};*/

module.exports.getActivitiesCatagories = async function (args) {
  const category = await tblTypesActivitesCategories.findAll({
    raw: true,
    nest: true,
  });

  category.forEach(function (data) {
    data["name"] = data["Categorie"];
    delete data["Categorie"];
  });

  return category;
};

let category = [];
module.exports.getActivitiesTypes = async function (options) {
  // Handle main attributes
  const attributes = new Set();
  const tblRawAttrs = tblTypesActivites.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
  }

  // Filters
  const where = {};
  if (options.args.filters) {
    for (const filter of options.args.filters)
      switch (filter.name) {
        case "category":
          where.categoryName = filter.value;
          break;
        default:
      }
  }

  const activities = await tblTypesActivites.findAll({
    raw: true,
    nest: true,
    where,
    attributes: Array.from(attributes),
  });
  category = activities;
  return activities;
};

module.exports.getActivitiesEmployee = async function (args) {
  const staff = await tblEmployes.findAll({
    raw: true,
    nest: true,
    attributes: ["NomEmploye", "id_Emp", "actif"],
  });

  return staff;
};

module.exports.getactivitiesEmployeeExpert = async function (
  folderId,
  invoiceId
) {
  const query = `
    SELECT DISTINCT [A].[NomEmploye] as NomEmploye, [A].[Id_Emp] as id_Emp, CASE WHEN [PIC].[employee_id] IS NOT NULL THEN 1 ELSE 0 END AS [confirmed] FROM [tblActivites] AS [A] LEFT JOIN [tblEmployes] AS [E] ON [A].[Id_Emp] = [E].[Id_Emp] LEFT JOIN [tbl_project_invoice_confirmation] AS [PIC] ON [PIC].[employee_id] = [E].[Id_Emp] AND [PIC].[invoice_id] = '${invoiceId}' WHERE [A].[NumeroDossier] = '${folderId}' AND [E].[expert] = 1 ORDER BY id_Emp`;
  const data = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
  return data.map((el) => {
    return {
      user: {
        NomEmploye: el.NomEmploye,
        id_Emp: el.id_Emp,
      },
      confirmed: el.confirmed,
      createdAt: el.createdAt,
      updatedAt: el.updatedAt,
    };
  });
};

const closeFolderFunction = async (invoiceId, employeeId) => {
  const folder = await tblDossier.findOne({
    attributes: ["NumeroDossier", "DateFerme", "ID_Emp_Responsable"],
    include: [
      {
        model: tblFacture,
        as: "factures",
        attributes: ["Id_Emp1", "NumeroDossier", "NumeroFacture"],
        where: {
          NumeroFacture: invoiceId,
        },
      },
    ],
  });
  if (
    parseInt(folder?.dataValues?.ID_Emp_Responsable) === parseInt(employeeId)
  ) {
    folder.DateFerme = new Date();
    await folder.save();
  } else {
    //TODO add error handling
    // console.log("not your folder");
  }
};

const sendNotificationEmail = async (ids, invoiceId) => {
  // Fetching user list
  const users = await tblEmployes.findAll({
    where: {
      id_Emp: ids,
    },
    attributes: ["NomEmploye", "courriel", "sexe", "prenom", "nomFamille"],
  });

  // Verify email server
  const mailTransporter = await mailHelper.createTransport();
  const verifyEmailService = await mailTransporter.verify();
  if (!verifyEmailService) {
    throw new ApolloError("Mail service is OFF", "MAIL_SERVER_ERROR");
  }

  // if (Array.isArray(users)) {
  //   users.map(async (user) => {
  //     // Get the email node modules
  //     const helperOptions = {
  //       from: await mailHelper.getNoReplyEmail(),
  //       // to: user.courriel,
  //       to: "karim.b@tekru.net",
  //       subject: await mailHelper.renderEmailSubject(
  //         "PROJECT_INVOICE_CONFIRMATION_SUBJECT"
  //       ),
  //       template: "projectInoiceConfirmation",
  //       context: {
  //         invoiceId,
  //         name: user.prenom,
  //         lastName: user.nomFamille,
  //         sexe: user.sexe,
  //       },
  //     };

  //     mailTransporter.sendMail(helperOptions, (error, info) => {
  //       if (error) {
  //         // ToDo log the error and send the email later
  //         throw new Error(error);
  //       }
  //       // createActivityLog("Sending confirmation to other users", user);

  //       let nodemailer = require("nodemailer");
  //       console.log(info);
  //       console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
  //       return true;
  //     });
  //   });
  // }
};

module.exports.confirmProjectInvoice = async function (
  invoiceId,
  employeeId,
  { users, closeFolder }
) {
  //TODO send email to users
  if (users.length > 0)
    for (const user of users) {
      if (employeeId != user) {
        const projectInvoice = await ProjectInvoiceConfirmation.findOne({
          where: { employeeId: user, invoiceId },
          attributes: ["confirmed"],
        });
        const isConfirmed = projectInvoice?.confirmed || false;
        const state = {
          invoiceId: invoiceId,
          employeeId: user,
          canConfirm: true,
          confirmed: isConfirmed,
        };
        if (projectInvoice)
          projectInvoice.update(
            { ...state, confirmed: true },
            { where: { employeeId, invoiceId } }
          );
        else await ProjectInvoiceConfirmation.build(state).save();
      }
    }

  // if (Array.isArray(users)) {
  //   sendNotificationEmail(users, invoiceId);
  // }
  if (closeFolder) {
    closeFolderFunction(invoiceId, employeeId);
  }
  const confirmation = await ProjectInvoiceConfirmation.findOne({
    where: {
      invoiceId,
      employeeId,
    },
  });
  if (!confirmation) {
    const data = ProjectInvoiceConfirmation.build({
      invoiceId,
      employeeId,
      canConfirm: true,
      confirmed: true,
    });
    const res = await data.save();
    if (res) {
      return true;
    } else {
      throw new Error("Error creating confirmation");
    }
  } else {
    const res = await confirmation.update(
      { confirmed: true },
      { where: { invoiceId, employeeId } }
    );
    if (res) {
      return true;
    } else {
      throw new Error("Error updating confirmation");
    }
  }
};

module.exports.getActivityIncome = async function (slugs, user, filters) {
  const data = [];
  const replacements = {};

  // Build the query
  const q = (sql) => {
    return db.sequelize.query(trimSQLString(sql), {
      type: db.sequelize.QueryTypes.SELECT,
      replacements,
    });
  };

  if (!filters) {
    if (!filters[0].name === "projectNumber") return [];
  }
  let where = `WHERE [D].NumeroDossier = '${filters[0].value[0]}'`;
  const budget = await q(
    `SELECT [D].[Budget] as value  FROM [tblDossier] as D  ${where}`
  );
  let total_seizure = await q(
    `SELECT SUM(HeuresFacture * TauxHoraire) as total FROM [tblActivites] as D ${where}`
  );

  const items = [
    { name: "budget", value: budget[0].value },
    { name: "totalSeizure", value: total_seizure[0].total },
  ];
  data.push({
    name: "income",
    data: items,
  });
  // total_seizure= total_seizure.reduce((a,b)=>a+b,0) // multiply by hour price

  return data;
};

module.exports.filters = async function (options) {
  const { slugs, ownOnly, filters, search, limit } = options;
  const data = [];
  const replacements = {
    id_Emp: options.user?.id_Emp || "",
  };

  // Build a query
  const q = (sql) => {
    return db.sequelize.query(trimSQLString(sql), {
      type: db.sequelize.QueryTypes.SELECT,
      replacements,
    });
  };

  // Customers
  if (slugs.includes("customers") || slugs.includes("CUSTOMERS")) {
    const items = await q(
      "SELECT DISTINCT [C].[NumeroClient] as [value], [C].[NomClient] as [name], 'ActivityFilterCustomer' as [__typename] FROM [tblClient] as C ORDER BY [name];"
    );
    data.push({
      name: "customers",
      data: items
        .filter((item) => item.value)
        .map(({ value, name, __typename }) => ({
          id: value,
          name,
          value,
          __typename,
        })),
    });
  }

  // All staff
  if (slugs.includes("ALL_EMPLOYEES")) {
    const items = await q(`
      SELECT 
        DISTINCT [E].[NomEmploye] as [value], 
        [NomFamille], 
        [Prenom], 
        [Actif], 
        [id_Emp],
        'ActivityFilterEmployee' as [__typename]
      FROM [tblEmployes] as [E] 
      WHERE [E].[Individu] = 1 
      ORDER BY [value];
    `);
    data.push({
      name: "staff",
      data: items
        .filter((item) => item.value)
        .map(({ value, NomFamille, Prenom, Actif, id_Emp, __typename }) => ({
          name: `${Prenom} ${NomFamille}`,
          value,
          active: Actif,
          id: id_Emp,
          __typename,
        })),
    });
  }

  // Staff
  if (slugs.includes("staff") || slugs.includes("EMPLOYEES")) {
    const items = await q(`
      SELECT 
        DISTINCT [E].[NomEmploye] as [value], 
        [NomFamille], 
        [Prenom], 
        [Actif], 
        [id_Emp],
        'ActivityFilterEmployee' as [__typename]
      FROM [tblEmployes] as [E] 
      WHERE [E].[Individu] = 1 AND [E].[Expert] = 1 
      ORDER BY [value];
    `);
    data.push({
      name: "staff",
      data: items
        .filter((item) => item.value)
        .map(({ value, NomFamille, Prenom, Actif, id_Emp, __typename }) => ({
          name: `${Prenom} ${NomFamille}`,
          value,
          active: Actif,
          id: id_Emp,
          __typename,
        })),
    });
  }

  // User
  if (slugs.includes("users")) {
    let items = [];

    const query = `
      SELECT 
        DISTINCT [E].[NomEmploye] as [value], 
        [NomFamille], 
        [Prenom], 
        [Actif], 
        [id_Emp] 
      FROM [tblEmployes] as [E] 
      WHERE [E].[Individu] = 1  
        ${ownOnly ? " AND [id_Emp] = :id_Emp " : ""}
      ORDER BY [value];`;

    items = await q(query);

    data.push({
      name: "users",
      data: items
        .filter((item) => item.value)
        .map(({ value, NomFamille, Prenom, Actif, id_Emp }) => ({
          name: `${Prenom} ${NomFamille}`,
          value,
          actif: Actif,
          id: id_Emp,
        })),
    });
  }

  // Categories
  if (slugs.includes("categories") || slugs.includes("CATEGORIES")) {
    const items = await q(
      "SELECT DISTINCT [Categorie] as value,'ActivityFilterCategory' as [__typename] FROM [tblActivites] ORDER BY Categorie"
    );
    data.push({
      name: "categories",
      data: items
        .filter((item) => item.value)
        .map(({ value, __typename }) => ({
          id: value,
          name: value,
          value,
          __typename,
        })),
    });
  }

  // Activities
  if (slugs.includes("activities") || slugs.includes("TYPES")) {
    const items = await q(
      "SELECT DISTINCT [Activite] as value, 'ActivityFilterType' as [__typename] FROM [tblActivites] ORDER BY Activite"
    );
    data.push({
      name: "activities",
      data: items
        .filter((item) => item.value)
        .map(({ value, __typename }) => ({
          id: value,
          name: value,
          value,
          __typename,
        })),
    });
  }

  // Projects
  if (slugs.includes("projects") || slugs.includes("FOLDERS")) {
    const name = slugs.includes("FOLDERS") ? "FOLDERS" : "projects";
    let where = "";
    if (search) where = `WHERE [D].[NumeroDossier] Like '%${search}%'`;
    const items = await q(
      `
      SELECT 
        [D].[NumeroDossier] as [id],
        [D].[NumeroDossier] as [value],
        CASE WHEN [D].[DateFerme] IS NULL THEN 1 ELSE 0 END as [active],
        [D].[Budget] as [budget],
        ROUND(SUM([A].[HeuresFacture] * [A].[TauxHoraire]), 3) AS [consummated],
        'ActivityFilterFolder' as [__typename]
      FROM 
        [tblDossier] as [D]
        LEFT JOIN [tblActivites] as [A] ON [A].[NumeroDossier] = [D].[NumeroDossier] 
        ${where}
      GROUP BY [D].[NumeroDossier], [D].[DateFerme], [D].[Budget]
      ORDER BY [D].[NumeroDossier] ASC;`
    );

    data.push({
      name,
      data: items,
    });
  }

  // Insurers
  if (slugs.includes("insurers") || slugs.includes("INSURERS")) {
    const items = await q(
      "SELECT  [NumeroClient]as value, [NomClient]as name, 'ActivityFilterInsurer' as [__typename] FROM [tblClient] WHERE  [NumeroClient] IN (SELECT DISTINCT [NumeroAssureur] FROM [tblDossierAClientAAssureur])"
    );
    data.push({
      name: "insurers",
      data: items
        .filter((item) => item.value)
        .map(({ value, name, __typename }) => ({
          id: value,
          name,
          value,
          __typename,
        })),
    });
  }

  // Income
  if (slugs.includes("income")) {
    if (!filters) return [];
    if (filters[0].name !== "projectNumber") return [];
    let where = `WHERE [D].NumeroDossier = '${filters[0].value[0]}'`;
    const budget = await q(
      `SELECT [D].[Budget]as value  FROM [tblDossier] as D  ${where}`
    );
    let total_seizure = await q(
      `SELECT SUM(HeuresFacture * TauxHoraire)as total FROM [tblActivites] as D ${where}`
    );
    const items = [
      { name: "budget", value: budget[0].value },
      { name: "totalSeizure", value: total_seizure[0].total },
    ];
    data.push({
      name: "income",
      data: items,
    });
    // total_seizure= total_seizure.reduce((a,b)=>a+b,0) // multiply by hour price
  }

  // Comments
  if (slugs.includes("COMMENTS")) {
    let where = [];
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        replacements[`f_${filter.name}`] = filter.value;
        switch (filter.name) {
          case "category":
            where.push(
              `[AC].[Categorie] IN (:f_${filter.name}) AND [AC].[Description] IS NOT NULL`
            );
            break;
          case "activity":
            where.push(
              `[AC].[Activite] IN (:f_${filter.name}) AND [AC].[Description] IS NOT NULL`
            );
            break;
          case "active":
            const active = filter.value === "1" ? 1 : 0;
            where.push(`[AC].[Actif] = ${active}`);
            break;
          default:
            where = [];
        }
      }
    }

    const query = `
      SELECT 
        [AC].[Description] as [value],
        [AC].[Description_anglaise] as [value_en],
        [AC].[NoUnique] as [id],
        [AC].[Actif] as [active],
        [AC].[Categorie] as [category],
        [AC].[Activite] as [activityType],
        'ActivityFilterComment' as [__typename]
      FROM [tblCommentsActivites] as [AC] 
        ${where.length > 0 ? "WHERE " + where.join(" AND ") : ""};
    `;

    data.push({
      name: "COMMENTS",
      data: await q(query),
    });
  }

  if (slugs.includes("hourly_rates")) {
    let query =
      "SELECT ROUND(MAX([A].[TauxHoraire]), -2) as [max], ROUND(MIN([A].[TauxHoraire]), -2, 1) as [min] FROM [tblActivites] as [A] ";

    query = query + ";";
    const items = await q(query);
    data.push({
      name: "hourly_rates",
      data: [
        {
          name: "min",
          value: items[0]["min"],
        },
        {
          name: "max",
          value: items[0]["max"],
        },
      ],
    });
  }

  if (slugs.includes("hours")) {
    let query =
      "SELECT MAX([A].[Heures]) as [max], MIN([A].[Heures]) as [min] FROM [tblActivites] as [A] ";

    query = query + ";";
    const items = await q(query);
    data.push({
      name: "hours",
      data: [
        {
          name: "min",
          value: items[0]["min"],
        },
        {
          name: "max",
          value: items[0]["max"],
        },
      ],
    });
  }

  if (slugs.includes("billed_hours")) {
    let query =
      "SELECT MAX([A].[HeuresFacture]) as [max], MIN([A].[HeuresFacture]) as [min] FROM [tblActivites] as [A] ";

    query = query + ";";
    const items = await q(query);
    data.push({
      name: "billed_hours",
      data: [
        {
          name: "min",
          value: items[0]["min"],
        },
        {
          name: "max",
          value: items[0]["max"],
        },
      ],
    });
  }

  return data;
};

module.exports.delete = async function (data, ids, __, user) {
  const userId = user.id_Emp;
  const { userPrivilege, adminPrivilege } = await checkAccess(
    userId,
    "can_delete"
  );
  console.log({ userPrivilege, adminPrivilege });
  const errors = [];
  for (const item of data) {
    // Check activity exist
    const activity = await tblActivites.findOne({
      where: { id: parseInt(item.id) },
    });
    console.log({ activity });
    if (!activity) continue;
    if (adminPrivilege) {
      await activity
        .destroy({
          where: { id: parseInt(item.id) },
        })
        .then()
        .catch((err) => errors.push(err));
      continue;
    } else if (userPrivilege && !adminPrivilege) {
      console.log("######################");
      const user = await tblEmployes.findOne({
        // The user connected try diffrent than the user hwo trying to insert time
        where: { userName: item.user, id_Emp: userId },
        attributes: ["id_Emp"],
      });
      console.log({ user });
      if (user)
        await activity
          .destroy({
            where: { id: parseInt(item.id) },
          })
          .then()
          .catch((err) => errors.push(err));
      else continue;
    } else
      throw new Error("You aren't allowed to update time for another user.");
  }

  return errors.length > 0 ? false : true;
};

/**
 * Update activities
 * @param [data]
 * @param ids
 * @param attributes,
 * @param user,
 */
// create or update an activity
module.exports.update = async function (data, attributes_, __, user) {
  const userId = user.id_Emp;
  const { userPrivilege, adminPrivilege } = await checkAccess(
    userId,
    "can_edit"
  );
  let errors = [];
  for (const activity of data) {
    // Check activity exist
    const oldActivity = await tblActivites.findOne({
      where: { id: activity.id },
    });
    if (!oldActivity) continue;
    const _data = {
      hours: parseFloat(activity.time),
      hourlyRate: parseFloat(activity.rate),
      activiteType: activity.activity,
      employeeName: activity.user,
      date: new Date(activity.date),
      category: activity.category,
      comment: activity.comment,
      project: activity.project,
    };
    if (adminPrivilege) {
      oldActivity
        .update(_data, {
          where: { id: activity.id },
        })
        .then()
        .catch((err) => errors.push(err));
      continue;
    } else if (userPrivilege && !adminPrivilege) {
      const user = await tblEmployes.findOne({
        where: { userName: activity.user, id_Emp: userId }, // The user connected try diffrent than the user hwo trying to insert time
        attributes: ["id_Emp"],
      });
      if (user)
        oldActivity
          .update(_data, {
            where: { id: activity.id },
          })
          .then()
          .catch((err) => errors.push(err));
      else continue;
    } else
      throw new Error("You aren't allowed to update time for another user.");
  }
  return errors.length > 0 ? false : true;
};

module.exports.create = async function (data, _, __, user) {
  const userId = user.id_Emp;
  const { userPrivilege, adminPrivilege } = await checkAccess(
    userId,
    "can_create"
  );
  const formattedData = [];
  let employees = await tblEmployes.findAll({
    attributes: ["NomEmploye", "id_Emp"],
  });
  employees = employees.map((el) => {
    return el.dataValues;
  });
  for (const activity of data) {
    const id = employees.find((emp) => emp.NomEmploye === activity.user)
      ?.id_Emp;
    const _data = {
      hours: parseFloat(activity.time),
      hourlyRate: parseFloat(activity.rate),
      activiteType: activity.activity,
      employeeName: activity.user,
      userId: id,
      date: new Date(activity.date),
      category: activity.category,
      comment: activity.comment,
      project: activity.project,
    };
    if (adminPrivilege) {
      formattedData.push(_data);
    } else if (userPrivilege && !adminPrivilege) {
      if (id === userId) {
        formattedData.push(_data);
      }
    } else
      throw new Error("You aren't allowed to create time for another user.");
  }
  return await tblActivites
    .bulkCreate(formattedData)
    .then((result) => {
      return true;
    })
    .catch(function (err) {
      console.error(err);
      return false;
    });
};

/**
 * Delete item
 * @param object data
 */
module.exports.mutate = async function (data) {
  console.log({ data });
  const activityId = data.id || null;
  if (!activityId) {
    // create new activity
    const activity = await tblActivites.build({
      employeeName: data.user,
      // id:"TEST-01",
      recordingType: data.recordingType,
      hours: parseFloat(data.time),
      date: "2021-03-05",
      hourlyRate: parseFloat(data.rate),
      NumeroDossier: data.project,
      activiteType: data.activity,
      category: data.category,
      language: "FR",
    });
    const operation = await activity.save(activity);
    return operation;
  }
  const activity = await tblActivites.findOne({ where: { ID: activityId } });
  if (!activity) return false;
  // update activity
  const exec = true;
  return exec;
};

async function checkAccess(userId, scope) {
  const canView = await userHelpers.hasAccess("activities", "can_view", userId);
  const canViewOwn = await userHelpers.hasAccess(
    "activities",
    "can_view_own",
    userId
  );
  const canViewCreate = await userHelpers.hasAccess(
    "activities",
    scope,
    userId
  );
  let adminPrivilege = false;
  let userPrivilege = false;
  if (canView && canViewOwn && canViewCreate) adminPrivilege = true;
  if (!canView && canViewOwn && canViewCreate) userPrivilege = true; // allowed only for proper timer
  return {
    userPrivilege,
    adminPrivilege,
  };
}
