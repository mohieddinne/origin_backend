const db = require("../../../models");
const Sequelize = require("sequelize");
const SqlString = require("sequelize/lib/sql-string");
const sqlHelpers = require("../../../helpers/sql.helpers");
const gqlHlpers = require("../../../helpers/graphql.helper");

// Aliases
const {
  tblFacture,
  tblDossier,
  tblClient,
  tblActivites,
  BillingProjectSettings,
  ProjectInvoiceConfirmation,
} = db;
const tSQL = sqlHelpers.trimSQLString;
const sqlze = db.sequelize;
const { Op } = Sequelize;

/**
 * Get data
 * @param array ids
 * @param object options
 */
module.exports.getData = async function (ids, options) {
  // Verify and clean data
  let where = {};
  if (Array.isArray(ids) && ids.length > 0) {
    where.NumeroFacture = ids;
  }

  const { search, filters, requestedFields, splited, employeeName } = options;
  let searchWhere = {};

  // Handle main attributes
  const attributes = new Set();
  attributes.add("NumeroDossier");
  const keys = Object.keys(tblFacture.rawAttributes);
  for (const field in requestedFields) {
    if (keys.includes(field)) attributes.add(field);
  }

  const whereFolder = {};
  const whereClient = {};

  // Search
  const tblAttrs = tblFacture.rawAttributes;
  if (search) {
    for (const attribute of Object.keys(tblAttrs)) {
      const attrType = tblAttrs[attribute].type;
      const isDate =
        attrType instanceof Sequelize.DATE ||
        attrType instanceof Sequelize.DATEONLY;
      if (!isDate && tblAttrs[attribute]._searchable !== false) {
        searchWhere[attribute] = { [Op.like]: `${search}%` };
      }
    }
    // Folders
    let modelAttrs = tblDossier.rawAttributes;
    for (const attribute of Object.keys(modelAttrs)) {
      const attrType = modelAttrs[attribute].type;
      const isDate =
        attrType instanceof Sequelize.DATE ||
        attrType instanceof Sequelize.DATEONLY;
      if (!isDate && modelAttrs[attribute]._searchable !== false) {
        searchWhere[`$folders.${attribute}$`] = { [Op.like]: `%${search}%` };
      }
    }
    // Customers
    modelAttrs = tblClient.rawAttributes;
    for (const attribute of Object.keys(modelAttrs)) {
      const attrType = modelAttrs[attribute].type;
      const isDate =
        attrType instanceof Sequelize.DATE ||
        attrType instanceof Sequelize.DATEONLY;
      if (!isDate && modelAttrs[attribute]._searchable !== false) {
        searchWhere[`$folders->clients.${modelAttrs[attribute].field}$`] = {
          [Op.like]: `%${search}%`,
        };
        // whereClient[Op.or][attribute] = { [Op.like]: `%${search}%` };
      }
    }
  }

  // Filters
  if (Array.isArray(filters) && filters.length > 0) {
    for (const filter of filters) {
      let name, value;
      // special traitments
      if (Array.isArray(filter.value) && filter.value.length)
        switch (filter.name) {
          case "active":
            if (filter.value.length === "1") {
              const op_ = filter.value[0] === "1" ? "IS" : "IS NOT";
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(`[folders].[DateFerme] ${op_} NULL`),
              ];
            }
            break;
          case "project":
            if (filter.value[0] === "true") {
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `[tblFacture].[NumeroFacture] LIKE 'Projet%'`
                ),
              ];
            }
            break;
          case "mine":
            if (filter.value[0] === "true") {
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `[activities].[NomEmploye] = '${employeeName}'`
                ),
              ];
            }
            break;
          case "date_start":
          case "date_end":
            const date_ = filter.value[0];
            const op_ = filter.name === "date_start" ? ">=" : "<=";
            where[Op.and] = [
              ...(where[Op.and] || []),
              Sequelize.literal(
                `CAST([DateFacturation] as DATE) ${op_} CAST(N'${date_}' as DATE)`
              ),
            ];
            break;
          case "billing_date":
            // DB filter name
            const dbFieldsIndex = {
              billing_date: "DateFacturation",
            };
            // Generate SQL
            const operator = filter.value[0];
            const fieldName = `[${dbFieldsIndex[filter.name]}]`;
            const fieldNameCasted = `CAST(${fieldName} AS DATE)`;

            if (operator === "IS_BETWEEN") {
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `${fieldNameCasted} >= CAST(N'${filter.value[1]}' as DATE) 
                  AND
                  ${fieldNameCasted} <= CAST(N'${filter.value[2]}' as DATE) 
                  `
                ),
              ];
            } else if (operator === "IS_SET") {
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(`${fieldName} IS NOT NULL`),
              ];
            } else if (operator === "IS_NOT_SET") {
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(`${fieldName} IS NULL`),
              ];
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
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `(${fieldNameCasted} ${op} CAST(N'${filter.value[1]}' as DATE))`
                ),
              ];
            }
            break;
          case "amount":
            const [a, b] = filter.value;
            const min = parseInt(a);
            const max = parseInt(b);
            where[Op.and] = [
              ...(where[Op.and] || []),
              Sequelize.literal(
                `([tblFacture].[MontantFacture] >= ${min} AND [tblFacture].[MontantFacture] <= ${max})`
              ),
            ];
            break;
          case "fees_amount":
            const [fees_a, fees_b] = filter.value;
            const min_fees = parseInt(fees_a);
            const max_fees = parseInt(fees_b);
            where[Op.and] = [
              ...(where[Op.and] || []),
              Sequelize.literal(
                `([tblFacture].[MontantHonoraires] >= ${min_fees} AND [tblFacture].[MontantHonoraires] <= ${max_fees})`
              ),
            ];
            break;
          case "amount_expenses":
            const [expenses_a, expenses_b] = filter.value;
            const min_expenses = parseInt(expenses_a);
            const max_expenses = parseInt(expenses_b);
            where[Op.and] = [
              ...(where[Op.and] || []),
              Sequelize.literal(
                `([tblFacture].[MontantDepenses] >= ${min_expenses} AND [tblFacture].[MontantDepenses] <= ${max_expenses})`
              ),
            ];
            break;

          case "offices":
            whereFolder.Bureau = filter.value;
            break;
          case "responsible":
            whereFolder.Responsable = filter.value;
            break;
          case "customers":
            whereClient.NumeroClient = filter.value;
            break;
          case "folders":
            where.NumeroDossier = filter.value;
            break;
          case "hours_expert":
            where.HeuresExpert = filter.value;
            break;
          case "invoice_number":
            where.NumeroFacture = filter.value;
            break;
          default:
            if (
              tblAttrs[filter.name] &&
              tblAttrs[filter.name]._filtrable !== false
            ) {
              name = filter.name;
              value = filter.value;
            }
            break;
        }
      if (name && value) where[name] = value;
    }
  }

  // Render the where
  if (Object.keys(searchWhere).length > 0) {
    where[Op.or] = searchWhere;
  }

  const mine = filters.find((el) => el.name === "mine")?.value[0] === "true";

  const include = [
    {
      model: tblDossier,
      as: "folders",
      attributes: ["Bureau"],
      where: whereFolder,
      include: [
        {
          model: tblClient,
          as: "clients",
          where: whereClient,
          attributes: ["NumeroClient", "NomClient"],
        },
      ],
    },
  ];

  if (mine) {
    include.push({
      model: tblActivites,
      as: "activities",
      attributes: ["id", "employeeName"],
      where: { NomEmploye: employeeName },
    });
  }
  // Get data
  const data = await tblFacture.findAll({
    where,
    include,
    attributes: Array.from(attributes),
    order: [["DateFacturation", "DESC"]],
  });

  // special traitment
  if (splited) return await this.splitInvoices(data);
  return data;
};

/**
 * Add item
 * @param ID
 */
module.exports.create = async function (data, attributes_) {
  // TODO add an invoice number algorythm
  data.NumeroFacture = Math.floor(10000 + Math.random() * 9000);
  let errors = [],
    item;
  const attributes = !attributes_ ? ["NumeroDossier"] : attributes_;

  await tblFacture
    .create(data, {
      fields: Object.keys(data), // Force the ORM to not add the [id] column

      returning: attributes,
    })
    .then((result) => {
      item = result;
    })
    .catch(function (err) {
      console.error(err);
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return item;
};

/**
 * Update item
 * @param data
 */
module.exports.update = async function (data, attributes_) {
  if (!data.NumeroFacture) {
    return false;
  }

  const NumeroFacture = data.NumeroFacture;
  delete data.NumeroFacture;

  const operation = await tblFacture.update(data, {
    where: {
      NumeroFacture,
    },
  });
  if (operation) {
    const attributes = !attributes_ ? ["NumeroDossier"] : attributes_;
    return await tblFacture.findByPk(NumeroFacture, { attributes });
  }

  return false;
};

/**
 * Delete item
 * @param object data
 */
module.exports.delete = async function (data) {
  const operation = await tblFacture.destroy({
    where: { NumeroFacture: data.NumeroFacture },
  });
  if (operation) {
    return { NumeroFacture: data.NumeroFacture };
  }
  return false;
};

module.exports.toOriginInvoices = async function (
  originalInvoices,
  fID,
  byFolderID = false
) {
  const query = tSQL(`
  SELECT
    [F].[NumeroFacture],
    [DCA].[NumeroDossier],
    [DCA].[Reviseur] AS [reviser],
    [DCA].[NumeroClient] AS [number],
    [DCA].[PourcentageRisque] AS [ratio],
    [C].[NomClient] AS [name],
    [C].[TypeClient] AS [type],
    [A].[NomClient] AS [insurer_name],
    [A].[TypeClient] AS [insurer_type]
  FROM [tblFactures] as [F]
    LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [F].[NumeroDossier] = [DCA].[NumeroDossier]
    INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DCA].[NumeroClient]
    INNER JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
  WHERE [DCA].[NumeroClient] = '109' 
  ORDER BY [F].[NumeroDossier] DESC, [DCA].[NumeroDossier] DESC, [number], [DCA].[NumeroAssureur]
  `);

  const type = db.sequelize.QueryTypes.SELECT;
  const projectCustomers = await db.sequelize.query(query, { type });

  const invoices = [];
  for (const invoice of originalInvoices) {
    for (const customer of projectCustomers) {
      if (!customer.ratio) continue;
      const nInvoice = { ...invoice.dataValues };
      // if(!nInvoice.NumeroFacture.includes("projet"))

      nInvoice.NumeroFacture = nInvoice.NumeroFacture + "-" + customer.number;
      nInvoice.MontantFacture = nInvoice.MontantFacture * customer.ratio;
      nInvoice.MontantDepenses = nInvoice.MontantDepenses * customer.ratio;
      nInvoice.MontantHonoraires = nInvoice.MontantHonoraires * customer.ratio;
      nInvoice.ratio = customer.ratio;
      nInvoice.reviser = customer.reviser;
      nInvoice.customer = {
        NumeroClient: customer.number,
        NomClient: customer.name,
        TypeClient: customer.type,
      };

      invoices.push(nInvoice);
    }
  }

  return invoices;
};

module.exports.splitInvoices = async function (invoices) {
  const data = [];
  const folders = {};
  const type = db.sequelize.QueryTypes.SELECT;

  const getFoldersCustomers = async () => {
    const ids = new Set();
    for (const invoice of invoices) ids.add(invoice.NumeroDossier);
    const foldersIDs = "'" + Array.from(ids).join("', '") + "'";
    const query = tSQL(`
      SELECT
        [DCA].[NumeroDossier],
        [DCA].[Reviseur] AS [reviser],
        [DCA].[NumeroClient] AS [number],
        [DCA].[PourcentageRisque] AS [ratio],
        [C].[NomClient] AS [name],
        [C].[TypeClient] AS [type],
        [A].[NomClient] AS [insurer_name],
        [A].[TypeClient] AS [insurer_type]
      FROM [tblDossierAClientAAssureur] AS [DCA]
        INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DCA].[NumeroClient]
        INNER JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
      WHERE
        [DCA].[NumeroDossier] IN (${foldersIDs})
      ORDER BY [DCA].[NumeroDossier] DESC, [number], [DCA].[NumeroAssureur]
    `);
    const data = await db.sequelize.query(query, { type });
    for (const folder of data) {
      if (!Array.isArray(folders[folder.NumeroDossier])) {
        folders[folder.NumeroDossier] = [];
      }
      folders[folder.NumeroDossier].push(folder);
    }
  };

  await getFoldersCustomers();

  for (const invoice of invoices) {
    // Get the project customers
    const customers = folders[invoice.NumeroDossier];
    if (Array.isArray(customers))
      for (const customer of customers) {
        if (customer.ratio) {
          const nInvoice = { ...invoice.dataValues };

          nInvoice.NumeroFactureClear = nInvoice.NumeroFacture;
          nInvoice.NumeroFacture =
            nInvoice.NumeroFacture + "-" + customer.number;
          nInvoice.MontantFacture = nInvoice.MontantFacture * customer.ratio;
          nInvoice.MontantDepenses = nInvoice.MontantDepenses * customer.ratio;
          nInvoice.MontantHonoraires =
            nInvoice.MontantHonoraires * customer.ratio;
          nInvoice.ratio = customer.ratio;
          nInvoice.reviser = customer.reviser;
          nInvoice.customer = {
            NumeroClient: customer.number,
            NomClient: customer.name,
            TypeClient: customer.type,
          };
          data.push(nInvoice);
        }
      }
    else {
      const nInvoice = { ...invoice.dataValues, ratio: 1 };
      // get customer
      data.push(nInvoice);
    }
  }

  return data;
};

module.exports.getClientInvoices = async function (
  clientID,
  requestedFields,
  user
) {
  if (!clientID) return false;

  const attributes = new Set();
  const keys = Object.keys(tblFacture.rawAttributes);
  for (const field in requestedFields) {
    if (keys.includes(field)) attributes.add("[F].[" + field + "]");
  }
  const attrs = Array.from(attributes).join(", ");

  const type = db.sequelize.QueryTypes.SELECT;
  const query = tSQL(`
    SELECT
      [DCA].[PourcentageRisque] as [ratio],
      [F].[MontantFacture] * [DCA].[PourcentageRisque] as [MontantFactureCalc],
      [F].[MontantDepenses] * [DCA].[PourcentageRisque] as [MontantDepensesCalc],
      [F].[MontantHonoraires] * [DCA].[PourcentageRisque] as [MontantHonorairesCalc]
      ${attrs ? ", " + attrs : ""}
    FROM [tblFactures] as [F]
      LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [F].[NumeroDossier] = [DCA].[NumeroDossier]
      LEFT JOIN [tblDossier] AS [D] ON [D].[NumeroDossier] = [F].[NumeroDossier]
    WHERE [DCA].[NumeroClient] = '${clientID}'
      ${user ? " AND [D].[Responsable] = N'" + user + "' " : ""}
    ORDER BY [F].[DateFacturation] DESC
  `);

  const data = await db.sequelize.query(query, { type });

  if (!data) return [];

  return data.map((invoice) => {
    return {
      ...invoice,
      MontantFacture: invoice.MontantFactureCalc,
      MontantDepenses: invoice.MontantDepensesCalc,
      MontantHonoraires: invoice.MontantHonorairesCalc,
      NumeroFacture: invoice.NumeroFacture + "-" + clientID,
    };
  });
};

// Get the filters data (selects, etc...)
module.exports.filters = async function (slugs, user) {
  const data = [];
  // Build the query
  const q = (sql) => {
    return sqlze.query(tSQL(sql), {
      type: sqlze.QueryTypes.SELECT,
    });
  };

  // Amount for MontantFacture
  if (slugs.includes("amount")) {
    let query =
      "SELECT ROUND(MAX([F].[MontantFacture]), -2) as [max], ROUND(MIN([F].[MontantFacture]), -2, 1) as [min] FROM [tblFactures] as [F] ";
    if (user) {
      query =
        query +
        " LEFT JOIN [tblDossier] as [D] on [D].[NumeroDossier] = [F].[NumeroDossier]" +
        " WHERE [D].[Responsable] = N'" +
        user +
        "' ";
    }
    query = query + ";";
    const items = await q(query);
    data.push({
      name: "amount",
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
  if (slugs.includes("amount_expenses")) {
    let query =
      "SELECT ROUND(MAX([F].[MontantDepenses]), -2)*1.1 as [max], ROUND(MIN([F].[MontantDepenses]), -2, 1) as [min] FROM [tblFactures] as [F] ";
    if (user) {
      query =
        query +
        " LEFT JOIN [tblDossier] as [D] on [D].[NumeroDossier] = [F].[NumeroDossier]" +
        " WHERE [D].[Responsable] = N'" +
        user +
        "' ";
    }
    query = query + ";";
    const items = await q(query);
    data.push({
      name: "amount_expenses",
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
  if (slugs.includes("fees_amount")) {
    let query =
      "SELECT ROUND(MAX([F].[MontantHonoraires]), -2)* 1.1 as [max], ROUND(MIN([F].[MontantHonoraires]), -2, 1) as [min] FROM [tblFactures] as [F] ";
    if (user) {
      query =
        query +
        " LEFT JOIN [tblDossier] as [D] on [D].[NumeroDossier] = [F].[NumeroDossier]" +
        " WHERE [D].[Responsable] = N'" +
        user +
        "' ";
    }
    query = query + ";";
    const items = await q(query);
    data.push({
      name: "fees_amount",
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

  // Offices
  if (slugs.includes("offices")) {
    const items = await q(
      "SELECT DISTINCT [D].[Bureau] as [value] FROM [tblDossier] as [D] " +
        (user ? " WHERE [D].[Responsable] = N'" + user + "' " : "") +
        "ORDER BY [value];"
    );
    data.push({
      name: "offices",
      data: items
        .filter((item) => item.value)
        .map(({ value }) => ({
          name: value,
          value,
        })),
    });
  }

  // Types
  if (slugs.includes("losses")) {
    const items = await q(
      "SELECT DISTINCT [D].[TypeDePerte] as [value] FROM [tblDossier] as [D]" +
        (user ? " WHERE [D].[Responsable] = N'" + user + "' " : "") +
        " ORDER BY [value];"
    );
    data.push({
      name: "losses",
      data: items
        .filter((item) => item.value)
        .map(({ value }) => ({
          name: value,
          value,
        })),
    });
  }

  // Customers
  if (slugs.includes("customers")) {
    const items = await q(
      "SELECT DISTINCT [C].[NumeroClient] as [value], [C].[NomClient] as [name] FROM [tblClient] as C ORDER BY [name]"
    );
    data.push({
      name: "customers",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }

  // Staff
  if (slugs.includes("staff")) {
    const items = await q(
      "SELECT DISTINCT [E].[NomEmploye] as [value], [NomFamille], [Prenom] FROM [tblEmployes] as [E] WHERE [E].[Individu] = 1 " +
        (user ? " AND [E].[NomEmploye] = N'" + user + "' " : "") +
        "ORDER BY [value];"
    );
    data.push({
      name: "staff",
      data: items
        .filter((item) => item.value)
        .map(({ value, NomFamille, Prenom }) => ({
          name: `${Prenom} ${NomFamille}`,
          value,
        })),
    });
  }
  return data;
};

module.exports.isOwner = async function (invoiceId, userId) {
  const invoices = await tblFacture.findAll({
    where: {
      NumeroFacture: invoiceId,
    },
    include: [
      {
        model: tblDossier,
        as: "folders",
        attributes: ["NumeroDossier"],
        where: {
          Responsable: userId,
        },
      },
    ],
    attributes: ["NumeroFacture"],
  });

  if (invoices && invoices.length) return true;

  return false;
};

module.exports.createDefaultSetting = async function (data) {
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  if (!data.budgetBeforeFirstInvoice) data.minBudgetBeforeFirstInvoice = null;
  if (!data.budgetVsTec) data.maxPourcentagesOfBudget = null;
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  else data.maxOfTecAmount = null;
  if (!data.isMentor) data.mentor = null;
  const defaultSetting = await BillingProjectSettings.build(data).save();
  if (!defaultSetting)
    throw new Error("Somthing went wrrong when creating setting");
  return defaultSetting;
};
module.exports.updateDefaultSetting = async function (data) {
  // Check if Setting exist
  const _defaultSetting = await BillingProjectSettings.findOne({
    where: { id: data.id, isDefault: true },
  });
  if (!_defaultSetting) throw new Error("Setting does not exist");
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  if (!data.budgetBeforeFirstInvoice) data.minBudgetBeforeFirstInvoice = null;
  if (!data.budgetVsTec) data.maxPourcentagesOfBudget = null;
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  else data.maxOfTecAmount = null;
  if (!data.isMentor) data.mentor = null;
  const defaultSetting = await _defaultSetting.update(data, {
    where: { id: data.id },
  });
  if (!defaultSetting)
    throw new Error("Somthing went wrrong when creating setting");
  return defaultSetting;
};

module.exports.getProjectSettings = async function (id) {
  let where = {};
  if (id == "default") where = { customerId: null, projectId: null };
  else where = { projectId: id };

  const defaultSettings = await BillingProjectSettings.findAll({
    where,
  });
  return defaultSettings;
};
module.exports.toggleInvoiceSetting = async function (defaultSettingId) {
  // check if id exist
  const defaultSetting = await BillingProjectSettings.findOne({
    where: { id: defaultSettingId },
    attributes: ["id"],
  });
  if (!defaultSetting)
    throw new Error("There is no default setting for this id");
  // toggle all default settings to false
  const oldDefaultSetting = await BillingProjectSettings.findOne({
    where: { isDefault: true },
    attributes: ["id"],
  });
  await oldDefaultSetting.update(
    { isDefault: false },
    { where: { id: oldDefaultSetting.id } }
  );
  // update selected setting to be the default setting
  await defaultSetting.update(
    { isDefault: true },
    { where: { id: defaultSettingId } }
  );
  return await BillingProjectSettings.findAll({
    where: { customerId: null, projectId: null },
  });
};
module.exports.unconfirmedProjectInvoice = async function (userId) {
  const include = [
    {
      model: tblFacture,
      as: "invoices",
      attributes: [
        "NumeroFacture",
        "NumeroDossier",
        "NomEmploye1",
        "MontantFacture",
        "DateFacturation",
      ],
    },
  ];
  const unconfirmedInvoices = await ProjectInvoiceConfirmation.findAll({
    where: { employeeId: userId, confirmed: false },
    attributes: ["invoiceId"],
    include,
  });
  const invoices = unconfirmedInvoices.map((project) => {
    const item = { ...project?.invoices?.dataValues };
    return item;
  });
  return invoices;
};
module.exports.hasAccessToProjectInvoice = async function (
  userId,
  invoiceId,
  folderId
) {
  const query = `
  SELECT DISTINCT [A].[NomEmploye] as NomEmploye, [A].[Id_Emp] as id_Emp, CASE WHEN [PIC].[employee_id] IS NOT NULL THEN 1 ELSE 0 END AS [confirmed] FROM [tblActivites] AS [A] LEFT JOIN [tblEmployes] AS [E] ON [A].[Id_Emp] = [E].[Id_Emp] LEFT JOIN [tbl_project_invoice_confirmation] AS [PIC] ON [PIC].[employee_id] = [E].[Id_Emp] AND [PIC].[invoice_id] = '${invoiceId}' WHERE [A].[NumeroDossier] = '${folderId}' AND [E].[expert] = 1 ORDER BY id_Emp`;
  const data = await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
  console.log({ data, userId });
  const user = data.find((item) => item.id_Emp === userId);
  return !user ? false : true;
};
