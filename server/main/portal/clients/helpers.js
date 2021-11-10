const Sequelize = require("sequelize");
const db = require("../../../models");
const gQlHelpers = require("../../../helpers/graphql.helper");
const sqlHelpers = require("../../../helpers/sql.helpers");

// Aliases
const {
  tblClient,
  ClientGroups,
  tblDossier,
  CustomerContact,
  tblDossierAClientAAssureur,
  BillingProjectSettings,
} = db;
const { Op } = Sequelize;
const sqlze = db.sequelize;
const tSQL = sqlHelpers.trimSQLString;

/**
 * This function is a leagcy and no more used
 * Please see the function getSuperData
 * @param array ids
 * @param object options
 */
module.exports.getData = async function (ids, options) {
  // Verify and clean data
  let where = {},
    searchWhere = {};

  if (Array.isArray(ids) && ids.length > 0) {
    where.NumeroClient = ids;
  }

  let { search, filters } = options;

  // Handle main attributes
  const attributes = [];
  for (const field in options.attributes) {
    if (Object.keys(tblClient.rawAttributes).includes(field)) {
      attributes.push(field);
    }
  }

  // Handle includes
  const include = gQlHelpers.getIncludesFields(options.attributes);

  // Search
  const tblAttrs = tblClient.rawAttributes;
  if (search) {
    for (const attribute of Object.keys(tblAttrs)) {
      const attrType = tblAttrs[attribute].type;
      const isDate =
        attrType instanceof Sequelize.DATE ||
        attrType instanceof Sequelize.DATEONLY;
      if (!isDate && tblAttrs[attribute]._searchable !== false) {
        searchWhere[attribute] = { [Op.like]: `%${search}%` };
      }
    }
    if (include.length > 0)
      for (const model of include)
        if (model.as === "group") {
          const modelAttrs = model.model.rawAttributes;
          const as = model.as ? model.as : model.model;
          for (const attribute of Object.keys(modelAttrs)) {
            const attrType = modelAttrs[attribute].type;
            const isDate =
              attrType instanceof Sequelize.DATE ||
              attrType instanceof Sequelize.DATEONLY;
            if (!isDate && modelAttrs[attribute]._searchable !== false) {
              searchWhere[`$${as}.${attribute}$`] = {
                [Op.like]: `%${search}%`,
              };
            }
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
          case "Inactif":
            if (filter.value.length === 1) {
              name = "Inactif";
              value = filter.value == "1" ? false : true;
            }
            break;
          case "group":
            name = filter.name;
            value = filter.value;
            const group = await ClientGroups.findOne({
              where: { fallback: true },
              attribute: ["id"],
            });
            value = value.map((item) => {
              if (item == group.name) {
                return { [Op.or]: [group.id, { [Op.is]: null }] };
              }
              return parseInt(item);
            });
            value = { [Op.or]: value };
            break;
          case "assureur_group":
            name = filter.name;
            value = filter.value;
            const group_assur = await tblDossierAClientAAssureur.findOne({
              where: { fallback: true },
              attribute: ["id"],
            });
            value = value.map((item) => {
              if (item == group_assur.name) {
                return { [Op.or]: [group_assur.id, { [Op.is]: null }] };
              }
              return parseInt(item);
            });
            value = { [Op.or]: value };
            break;
          case "TypeClient":
            name = "TypeClient";
            value = filter.value;
            break;
          case "groupId":

          default:
            name = filter.name;
            value = filter.value;
            break;
        }
      if (name && value) where[name] = value;
    }
  }
  // Render the where
  where = {
    [Op.and]: where,
  };
  if (Object.keys(searchWhere).length > 0) {
    where[Op.or] = searchWhere;
  }
  // Get data

  const data = await tblClient.findAll({
    where,
    attributes,
    include,
    order: [["NomClient", "ASC"]],
  });
  return data;
};

module.exports.getSuperData = async function (ids, options) {
  const where = [];
  const replacements = {};

  // Adding the KEY testing
  if (Array.isArray(ids) && ids.length > 0) {
    replacements.ids = ids;
    where.push("[C].[NumeroClient] IN (:ids)");
  }

  // Handle main attributes
  const attributes = [`[C].[NumeroClient]`];
  const tblRawAttrs = tblClient.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      const attr = tblRawAttrs[field];
      if (attr) attributes.push(`[C].[${attr.field}] as [${field}]`);
    }
  }

  // Handle sub-object attributes
  const foldersAttr = [];
  if (options.attributes.folders) {
    for (const field in options.attributes.folders) {
      const attr = tblDossier.rawAttributes[field];
      if (attr) foldersAttr.push(`[D].[${attr.field}] as [folders.${field}]`);
    }
  }

  // Handle sub-object attributes
  const groupAttr = [];
  if (options.attributes.group) {
    for (const field in options.attributes.group) {
      const attr = ClientGroups.rawAttributes[field];
      if (attr) foldersAttr.push(`[CG].[${attr.field}] as [group.${field}]`);
    }
  }

  // Search
  const search = options.search || "";
  let searchWhere = "";
  if (search) {
    const searchAttrs = [
      "[C].[NumeroClient]",
      "[C].[NomClient] COLLATE Latin1_General_CI_AI",
      "[C].[TypeClient] COLLATE Latin1_General_CI_AI",
      "[C].[Adresse] COLLATE Latin1_General_CI_AI",
      "[C].[Ville] COLLATE Latin1_General_CI_AI",
      "[C].[CodePostal]",
      "[C].[Courriel]",
      "[C].[TelBureau]",
      "[C].[TelFax]",
      "[C].[TelCellulaire]",
      "[C].[TelDomicile]",
      "[C].[TelAutre]",
      "[C].[TelDomicile]",
      "[C].[SiteWeb]",
      "[C].[SiteWeb]",
      "[C].[SiteWeb]",
      "[C].[Langue] COLLATE Latin1_General_CI_AI",
      "[C].[Commentaires]",
      "[C].[Directives]",
      "[CC].[NomContact]",
      "[CC].[Courriel]",
      "[CG].[name]",
    ];

    replacements.search = `%${search}%`;
    searchWhere = searchAttrs
      .map((attr) => `${attr} LIKE :search`)
      .join(" OR ");
  }

  // Filters
  const filters = options.filters || [];
  for (const filter of filters)
    if (Array.isArray(filter.value) && filter.value.length)
      switch (filter.name) {
        case "Inactif":
          if (filter.value.length === 1) {
            replacements["f_inactive"] = filter.value[0];
            where.push(`[C].[Inactif] = :f_inactive`);
          }
          break;
        case "statut":
          if (filter.value.length === 1) {
            const op_ = filter.value[0] === "Active" ? 1 : 0;
            where.push(`[C].[Inactif] = ${op_} `);
          }
          break;
        case "employees":
          replacements["f_employee"] = filter.value;
          where.push(`[D].[Responsable] IN (:f_employee)`);
          break;
        case "staff":
          replacements["f_employee"] = filter.value;
          where.push(`[D].[Responsable] IN (:f_employee)`);
          break;
        case "groups":
          replacements[`fg_groups`] = filter.value;
          where.push(`[C].[group_id] IN (:fg_groups)`);
          break;
        case "group":
          replacements[`fg_groups_`] = filter.value;
          where.push(`[C].[group_id] IN (:fg_groups_)`);
          break;
        case "groupId":
          replacements[`fg_groups_ids`] = filter.value;
          where.push(`[C].[group_id] IN (:fg_groups_ids)`);
          break;
        case "NumeroClient":
        case "customers":
        case "postal_code":
        case "courriel":
        case "address":
        case "city":
        case "customer_type":
        case "tel_office":
        case "tel_fax":
        case "cellular":
        case "tel_home":
        case "language":
        case "color":
          // Naming scheme
          let filterName = filter.name;
          if (filterName === "customers") filterName = "NumeroClient";
          if (filterName === "postal_code") filterName = "CodePostal";
          if (filterName === "courriel") filterName = "Courriel";
          if (filterName === "address") filterName = "Adresse";
          if (filterName === "city") filterName = "Ville";
          if (filterName === "customer_type") filterName = "TypeClient";
          if (filterName === "tel_office") filterName = "TelBureau";
          if (filterName === "tel_fax") filterName = "TelFax";
          if (filterName === "cellular") filterName = "TelCellulaire";
          if (filterName === "tel_home") filterName = "TelDomicile";
          if (filterName === "tel_other") filterName = "TelAutre";
          if (filterName === "website") filterName = "SiteWeb";
          if (filterName === "language") filterName = "Langue";
          if (filterName === "comments") filterName = "Commentaires";
          if (filterName === "guidelines") filterName = "Directives";
          if (filterName === "color") filterName = "group_id";
          replacements[`fc_${filterName}`] = filter.value;
          where.push(`([C].[${filterName}] IN (:fc_${filterName}))`);
          break;
        default:
          const { name, value } = filter;
          if (tblRawAttrs[name] && tblRawAttrs[name]._filtrable !== false) {
            replacements[`fs_${name}`] = value;
            where.push(`[C].[${name}] IN (:fs_${name})`);
          }
          break;
      }

  // Render the where
  const wFrags = [];
  if (where.length > 0) wFrags.push(" ( " + where.join(" AND ") + " ) ");
  if (searchWhere) wFrags.push(" ( " + searchWhere + " ) ");
  let wSQL = "";
  if (wFrags.length > 0) wSQL = " WHERE " + wFrags.join(" AND ");

  const qAttrs = [...attributes, ...foldersAttr, ...groupAttr];
  const query = `
    SELECT
      ${qAttrs.join(", ")}
    FROM
      [tblClient] AS [C]
      LEFT JOIN [tblClientGroupes] AS [CG] ON [C].[group_id] = [CG].[id]

      ${
        searchWhere
          ? "LEFT JOIN [tblClientContact] AS [CC] ON [C].[NumeroClient] = [CC].[NumeroClient]"
          : ""
      }
      LEFT JOIN [tblDossierAClient] AS [DAC] ON [DAC].[NumeroClient] = [C].[NumeroClient]
      LEFT JOIN [tblDossier] AS [D] ON [D].[NumeroDossier] = [DAC].[NumeroDossier]
      ${wSQL}
    ORDER BY
      [C].[NomClient] ASC;
  `;

  const data = await db.sequelize.query(tSQL(query), {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });

  const includes = [
    { table: "[CG]", as: "group", type: "item" },
    { table: "[D]", as: "folders", type: "array" },
    { table: "[CC]", as: "contacts", type: "array" },
    { table: "[DCA]", as: "folders-", type: "array" },
  ];

  const clients = data.reduce((memo, client) => {
    const cIndex = memo.findIndex((item) => {
      return item.NumeroClient === client.NumeroClient;
    });
    // Get the item
    let item = {};
    if (cIndex >= 0) item = memo[cIndex];
    else item = Object.assign({}, client);
    // Add includes
    const attributes = Object.keys(client);
    for (const inld of includes) {
      const subItem = attributes.reduce((result, attr) => {
        if (attr.indexOf(inld.as) === 0) {
          if (!result) result = {};
          result[attr.replace(`${inld.as}.`, "")] = client[attr];
          delete client[attr];
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
    if (cIndex >= 0) {
      memo[cIndex] = item;
      return memo;
    } else return [...memo, item];
  }, []);

  if (options.attributes.contacts) {
    return clients.map(async (client) => {
      const contacts = await this.getClientContacts([client.NumeroClient], {
        attributes: options.attributes.contacts,
        filters: [],
      });
      return {
        ...client,
        contacts,
      };
    });
  }

  return clients;
};

/**
 * Add item
 * @param ID
 */
module.exports.create = async function (data, attributes_) {
  // TODO add an client number algorithm
  data.NumeroClient = Math.floor(1000 + Math.random() * 9000);

  let errors = [],
    item;

  await tblClient
    .create(data, {
      fields: Object.keys(data), // Force the ORM to not add the [id] column
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

  // Handle main attributes
  const attributes = [];
  for (const field in attributes_) {
    if (Object.keys(tblClient.rawAttributes).includes(field)) {
      attributes.push(field);
    }
  }

  fullItem = await tblClient.findOne({
    where: {
      NumeroClient: item.NumeroClient,
    },
    attributes,
    include: gQlHelpers.getIncludesFields(attributes_),
  });

  return fullItem;
};

/**
 * Update item
 * @param data
 */
module.exports.update = async function (data, attributes_) {
  if (!data.NumeroClient) {
    return false;
  }

  const NumeroClient = data.NumeroClient;
  delete data.NumeroClient;

  const operation = await tblClient.update(data, {
    where: {
      NumeroClient,
    },
  });

  if (operation) {
    // Handle main attributes
    const attributes = [];
    for (const field in attributes_) {
      if (Object.keys(tblClient.rawAttributes).includes(field)) {
        attributes.push(field);
      }
    }
    return await tblClient.findByPk(NumeroClient, {
      attributes,
      include: gQlHelpers.getIncludesFields(attributes_),
    });
  }

  return false;
};

/**
 * Delete item
 * @param object data
 */
module.exports.delete = async function (data) {
  const operation = await tblClient.destroy({
    where: { NumeroClient: data.NumeroClient },
  });
  if (operation) {
    return { NumeroClient: data.NumeroClient };
  }
  return false;
};

/**
 * Get customers groups
 * @param [] ids
 */
module.exports.group = async function (ids) {
  const where = {};
  if (Array.isArray(ids) && ids.length > 0) {
    where.id = ids;
  }
  return await ClientGroups.findAll({
    where,
  });
};

module.exports.filters = async function (slugs) {
  const data = [];
  // Build the query
  const q = (sql) => {
    return sqlze.query(tSQL(sql), {
      type: sqlze.QueryTypes.SELECT,
    });
  };
  // Groups
  if (slugs.includes("groups")) {
    const items = await q(
      "SELECT [G].[id] as [value], [G].[name], [G].[favorite] FROM [tblClientGroupes] as G ORDER BY [G].[favorite] DESC, [G].[name]"
    );
    data.push({
      name: "groups",
      data: items
        .filter((item) => item.value)
        .map(({ value, name, favorite }) => ({
          name,
          value,
          favorite,
        })),
    });
  }
  //  actif
  if (slugs.includes("Inactif")) {
    const items = await q(
      "SELECT DISTINCT [C].[Inactif] as [value] FROM [tblClient] as  C ORDER BY [value]"
    );
    data.push({
      name: "Inactif",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }

  // TypeClient
  if (slugs.includes("TypeClient")) {
    const items = await q(
      "SELECT DISTINCT [C].[TypeClient] as [value] FROM [tblClient] as  C ORDER BY [value]"
    );
    data.push({
      name: "TypeClient",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }

  return data;
};

// Get client contacts
module.exports.getClientContacts = async function (clientIds, options) {
  const where = [];
  const replacements = {};
  let leftJoins = false;

  // Adding the KEY testing
  if (Array.isArray(clientIds) && clientIds.length > 0) {
    replacements.clientIds = clientIds;
    where.push("[CC].[NumeroClient] IN (:clientIds)");
  }

  // Handle main attributes
  let hasID = false;
  const attributes = [];
  const tblRawAttrs = CustomerContact.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      const attr = tblRawAttrs[field];
      if (attr) {
        if (attr.field === "ID") hasID = true;
        attributes.push(`[CC].[${attr.field}] as [${field}]`);
      }
    }
  }

  if (!hasID) attributes.push(`[CC].[ID] as [id]`);

  // Handle sub-object attributes
  const customerAttr = [];
  if (options.attributes.client) {
    for (const field in options.attributes.client) {
      const attr = tblClient.rawAttributes[field];
      if (attr) {
        leftJoins = true;
        customerAttr.push(`[C].[${attr.field}] as [client.${field}]`);
      }
    }
  }

  // Search
  const search = options.search || "";
  let searchWhere = "";
  if (search) {
    const searchAttrs = [
      "[CC].[NumeroClient]",
      "[CC].NomContact]",
      "[CC].AppellationContact]",
      "[CC].FonctionContact]",
      "[CC].TitreContact]",
      "[CC].Adresse]",
      "[CC].Ville]",
      "[CC].CodePostal]",
      "[CC].Courriel]",
      "[CC].TelBureau]",
      "[CC].TelFax]",
      "[CC].TelCellulaire]",
      "[CC].TelDomicile]",
      "[CC].TelAutre]",
      "[CC].Commentaires]",
      "[CC].Prenom]",
      "[CC].Nom]",
    ];
    replacements.search = `%${search}%`;
    searchWhere = searchAttrs
      .map((attr) => `${attr} LIKE :search`)
      .join(" OR ");
  }

  const filters = options.filters || [];
  if (Array.isArray(filters) && filters.length > 0) {
    for (const filter of filters) {
      // special traitments
      if (Array.isArray(filter.value) && filter.value.length)
        switch (filter.name) {
          case "employees":
            leftJoins = true;
            replacements["f_employee"] = filter.value;
            where.push(`[D].[Responsable] IN (:f_employee)`);
            break;
          case "folders":
            leftJoins = true;
            replacements["f_folders_ids"] = filter.value;
            where.push(`[D].[NumeroDossier] IN (:f_folders_ids)`);
            break;
          default:
            const { name, value } = filter;
            if (tblRawAttrs[name] && tblRawAttrs[name]._filtrable !== false) {
              replacements[`fs_${name}`] = value;
              where.push(`[CC].[${name}] IN (:fs_${name})`);
            }
            break;
        }
    }
  }

  // Render the where
  const wFrags = [];
  if (where.length > 0) wFrags.push(" ( " + where.join(" AND ") + " ) ");
  if (searchWhere) wFrags.push(" ( " + searchWhere + " ) ");
  let wSQL = "";
  if (wFrags.length > 0) wSQL = " WHERE " + wFrags.join(" AND ");

  const qAttrs = [...attributes, ...customerAttr];

  const query = `
    SELECT
      ${qAttrs.join(", ")}
    FROM
      [tblDossier] AS [D]
      INNER JOIN [tblDossierAClient] AS [DAC] ON [D].[NumeroDossier] = [DAC].[NumeroDossier]
      INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DAC].[NumeroClient]
      INNER JOIN [tblClientContact] AS [CC] ON CONCAT([CC].Prenom, ' ', [CC].Nom) = [DAC].[NomContact]
      ${wSQL}
    ORDER BY
      [CC].[NomContact] ASC;
  `;

  const data = await db.sequelize.query(tSQL(query), {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });

  const includes = [
    { table: "[C]", as: "client", type: "item" },
    { table: "[D]", as: "folders", type: "array" },
  ];

  const contacts = data.reduce((memo, singleItem) => {
    const iIndex = memo.findIndex((item) => {
      return item.id === singleItem.id;
    });
    // Get the item
    let item = {};
    if (iIndex >= 0) item = memo[iIndex];
    else item = Object.assign({}, singleItem);
    // Add includes
    const attributes = Object.keys(singleItem);
    for (const inld of includes) {
      const subItem = attributes.reduce((result, attr) => {
        if (attr.indexOf(inld.as) === 0) {
          if (!result) result = {};
          result[attr.replace(`${inld.as}.`, "")] = singleItem[attr];
          delete singleItem[attr];
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
    if (iIndex >= 0) {
      memo[iIndex] = item;
      return memo;
    } else return [...memo, item];
  }, []);

  return contacts;
};

module.exports.updateCustomerSetting = async function (data) {
  // Check if Setting exist
  const _customerSetting = await BillingProjectSettings.findOne({
    where: { id: data.id },
  });
  if (!_customerSetting) throw new Error("Setting does not exist");
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  if (!data.budgetBeforeFirstInvoice) data.minBudgetBeforeFirstInvoice = null;
  if (!data.budgetVsTec) data.maxPourcentagesOfBudget = null;
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  else data.maxOfTecAmount = null;
  if (!data.isMentor) data.mentor = null;
  const customerSetting = await _customerSetting.update(data, {
    where: { id: data.id },
  });
  if (!customerSetting)
    throw new Error("Somthing went wrrong when creating setting");
  return customerSetting;
};
module.exports.createCustomerProjectSetting = async function (data) {
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  if (!data.budgetBeforeFirstInvoice) data.minBudgetBeforeFirstInvoice = null;
  if (!data.budgetVsTec) data.maxPourcentagesOfBudget = null;
  if (!data.daysWithoutActivity) data.nbrDaysWithoutActivity = null;
  else data.maxOfTecAmount = null;
  if (!data.isMentor) data.mentor = null;
  const customerSetting = await BillingProjectSettings.build(data).save();
  if (!customerSetting)
    throw new Error("Somthing went wrrong when creating setting");
  return customerSetting;
};
module.exports.getCustomerProjectSettings = async function (customerId) {
  if (!customerId) return null;
  let where = { customerId };
  const customerSettings = await BillingProjectSettings.findOne({
    where,
  });
  return customerSettings;
};
