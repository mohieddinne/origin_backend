const db = require("../../../models");
const Sequelize = require("sequelize");
const gQlHelpers = require("../../../helpers/graphql.helper");
const sqlHelpers = require("../../../helpers/sql.helpers");
const invoicesHelper = require("../invoices/helpers");
const { trimSQLString } = require("../../../helpers/sql.helpers");
const moment = require("moment");
const { ApolloError } = require("apollo-server-express");

// Aliases
const { tblDossier, tblClient, BillingProjectSettings } = db;
const tSQL = sqlHelpers.trimSQLString;
const sqlze = db.sequelize;
const { Op } = Sequelize;

const helpers = {
  /**
   * Get data
   * @param array ids
   * @param object options
   */
  //module.exports.getData = async function

  /**
   * Add item
   * @param ID
   */
  async create(data, attributes_) {
    // TODO add an Folder number algorythm
    data.NumeroDossier = Math.floor(1000000 + Math.random() * 9000);
    let errors = [],
      item;
    const attributes = !attributes_ ? ["VilleAssure"] : attributes_;
    await tblDossier
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
  },

  async createSetting(rawData) {
    const data = rawData;
    if (!data.daysWithoutActivity) {
      data.nbrDaysWithoutActivity = null;
    }
    if (!data.budgetBeforeFirstInvoice) {
      data.minBudgetBeforeFirstInvoice = null;
    }
    if (data.budgetVsTec === 2) {
      data.maxPourcentagesOfBudget = null;
    } else {
      data.maxOfTecAmount = null;
    }
    if (!data.isMentor) {
      data.mentor = null;
    }
    let errors = [],
      response;
    await BillingProjectSettings.create(data)
      .then((result) => {
        response = result;
      })
      .catch(function (err) {
        console.error(err);
        errors.push(err);
      });
    if (errors.length > 0) {
      throw new ApolloError(
        "Error on hanlding the requested operation.",
        `SERVER_ERROR_${operation.toUpperCase()}_CONTENT`
      );
    }
    return response;
  },

  /**
   * Update item
   * @param data
   */
  async update(data, attributes_) {
    if (!data.NumeroDossier) {
      return false;
    }

    const NumeroDossier = data.NumeroDossier;
    delete data.NumeroDossier;

    const operation = await tblDossier.update(data, {
      where: {
        NumeroDossier,
      },
    });
    if (operation) {
      const attributes = new Set(["VilleAssure"]);
      if (attributes_) {
        const keys = Object.keys(tblDossier.rawAttributes);
        for (const field in attributes_)
          if (keys.includes(field)) attributes.add(field);
      }
      return await tblDossier.findByPk(NumeroDossier, {
        attributes: Array.from(attributes),
      });
    }

    return false;
  },

  async updateSetting(rawData, id) {
    const data = rawData;
    if (!data.daysWithoutActivity) {
      data.nbrDaysWithoutActivity = null;
    }
    if (!data.budgetBeforeFirstInvoice) {
      data.minBudgetBeforeFirstInvoice = null;
    }
    if (data.budgetVsTec === 2) {
      data.maxPourcentagesOfBudget = null;
    } else {
      data.maxOfTecAmount = null;
    }
    if (!data.isMentor) {
      data.mentor = null;
    }
    const updatedElement = await BillingProjectSettings.update(data, {
      where: { id },
    });
    if (!updatedElement) {
      throw new Error("Operation Failed!");
    }
    return { ...data, id };
  },

  /**
   * Delete item
   * @param object data
   */
  async delete(data) {
    const operation = await tblDossier.destroy({
      where: { NumeroDossier: data.NumeroDossier },
    });
    if (operation) {
      return { NumeroDossier: data.NumeroDossier };
    }
    return false;
  },
};

module.exports = helpers;
module.exports.getData = async function (ids, options, appendix = false) {
  // Verify and clean data
  const where = {};
  if (Array.isArray(ids) && ids.length > 0) {
    where.NumeroDossier = ids;
  }

  const { search, filters } = options;

  // Handle main attributes
  const attributes = [];
  if (options.attributes)
    for (const field in options.attributes) {
      if (Object.keys(tblDossier.rawAttributes).includes(field)) {
        attributes.push(field);
      }
    }

  // Handle includes
  const include = gQlHelpers.getIncludesFields({
    ...options.attributes,
    clients: {
      ...(options.attributes.clients || {}),
      NumeroClient: null,
      group: {
        id: null,
        name: null,
        color: null,
      },
    },
  });

  // Search
  let searchWhere = {};
  const tblAttrs = tblDossier.rawAttributes;
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
    if (include.length > 0) {
      const wheres = getSearchWhere(include, search);
      searchWhere = { ...searchWhere, ...wheres };
    }
  }

  // Filters
  if (Array.isArray(filters) && filters.length > 0)
    for (const filter of filters) {
      let name, value;
      // special traitments
      if (Array.isArray(filter.value) && filter.value.length)
        switch (filter.name) {
          case "active":
            if (filter.value.length == 1) {
              const op_ = filter.value[0] === "1" ? "IS" : "IS NOT";
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(`[DateFerme] ${op_} NULL`),
              ];
            }
            break;
          case "date_start":
          case "date_end":
            const date_ = filter.value[0];
            if (date_) {
              const op_ = filter.name === "date_start" ? ">=" : "<=";
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `CAST([DateMandat] as DATE) ${op_} CAST(N'${date_}' as DATE)`
                ),
              ];
            }
            break;
          case "date_start_ferme":
          case "date_end_ferme":
            const date_ferme = filter.value[0];
            if (date_ferme) {
              const op_ = filter.name === "date_start_ferme" ? ">=" : "<=";
              where[Op.and] = [
                ...(where[Op.and] || []),
                Sequelize.literal(
                  `CAST([DateFerme] as DATE) ${op_} CAST(N'${date_ferme}' as DATE)`
                ),
              ];
            }
            break;
          case "NumeroClient":
          case "groupId":
          case "customers":
            // Naming schem
            let filterName = filter.name;
            if (filterName === "customers") filterName = "NumeroClient";
            // Get the value
            value = filter.value;
            // Checking if a relation is already demanded
            const clientRelation = include.find(
              (item) => item.model === tblClient
            );
            if (clientRelation) {
              clientRelation.where = {
                ...(clientRelation.where || {}),
                [filterName]: value,
              };
            } else {
              include.push({
                model: tblClient,
                as: "clients",
                attributes: ["NumeroClient", filterName],
                where: {
                  [filterName]: value,
                },
              });
            }
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

  // Render the where
  if (Object.keys(searchWhere).length > 0) {
    where[Op.or] = searchWhere;
  }

  // For PDF use, ask for a raw object
  const folderOptions = {};
  if (appendix) {
    folderOptions.raw = true;
    folderOptions.nest = true;
  }

  const data = await tblDossier.findAll({
    where: {
      [Op.and]: where,
    },
    attributes,
    include,
    order: [["DateMandat", "DESC"]],
    ...folderOptions,
  });

  const folders = data.map(async (folder) => {
    if (folder.factures) {
      folder.factures = await invoicesHelper.toOriginInvoices(
        folder.factures,
        folder.NumeroDossier
      );
    }
    return folder;
  });

  return data;
};

module.exports.getSuperData = async function (ids, options) {
  const where = [];
  const replacements = {};

  // Adding the KEY testing
  if (Array.isArray(ids) && ids.length > 0) {
    replacements.ids = ids;
    where.push("[D].[NumeroDossier] IN (:ids)");
  }

  // Handle main attributes
  const attributes = [];
  let hasID = false;
  const datesToFormat = ["DatePerte", "DateMandat", "DateLivraison"];
  const tblRawAttrs = tblDossier.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      const attr = tblRawAttrs[field];
      if (attr) {
        if (field === "NumeroDossier") hasID = true;
        if (datesToFormat.includes(field)) {
          attributes.push(
            `[D].[${attr.field}] AT TIME ZONE 'Eastern Standard Time'  as [${field}]`
          );
        } else {
          attributes.push(`[D].[${attr.field}] as [${field}]`);
        }
      }
    }
  }
  if (!hasID) attributes.push("[D].[NumeroDossier]");

  const settingAttributes = [];
  if (options?.attributes?.settings) {
    for (const field in options.attributes.settings) {
      const attr = BillingProjectSettings.rawAttributes[field];
      if (attr) {
        settingAttributes.push(`[BPS].[${attr.field}] as [${field}]`);
      }
    }
  }

  const settingAttributesSQL =
    settingAttributes.length > 0 ? `${settingAttributes.join(", ")},` : "";

  const settingsJoin =
    settingAttributes.length > 0
      ? "LEFT JOIN [tbl_billing_project_settings] AS [BPS] ON [D].[NumeroDossier] = [BPS].[project_id]"
      : "";

  // Search
  let search = options.search || "";

  let searchWhere = "";
  if (search) {
    const searchAttrs = [
      "[D].[NumeroDossier]",
      "[D].[TypeDePerte]",
      "[D].[Reference]",
      "[D].[Bureau]",
      "[D].[Responsable]",
      "[D].[VillePerte]",
      "[D].[AdressePerte]",
      "[D].[AutresDirectives]",
      "[D].[DescriptionMandat]",
      "[C].[NumeroClient]",
      "[C].[NomClient]",
      "[A].[NomClient]",
      "[A].[NumeroClient]",
      "[DCA].[NumeroDossier]",
      "[DCA].[NumeroAssureur]",
      "[DCA].[NumeroPolice]",
      "[DCA].[Reviseur]",
      "[DCA].[No_Dossier]",
      "[DC].[NomContact]",
      "[DC].[Courriel]",
      "[DC].[Commentaire]",
      "[DA].[No_Civique]",
      "[DA].[Ville]",
      "[DA].[Province]",
      "[DA].[Code_Postal]",
      "[DA].[Téléphone]",
      "[DA].[Nom_Assure]",
      "[F].[NumeroFacture]",
    ];
    replacements.search = `%${search}%`;
    searchWhere = searchAttrs
      .map((attr) => `${attr} LIKE :search`)
      .join(" OR ");
  }

  // Filters
  const filters = options.filters || [];
  for (const filter of filters) {
    if (Array.isArray(filter.value) && filter.value.length) {
      switch (filter.name) {
        case "default_filter":
          where.push(`[D].[NumeroDossier] NOT LIKE '00%'`);
          break;
        case "active":
          if (filter.value.length === 1) {
            const op_ = filter.value[0] === "1" ? "IS" : "IS NOT";
            where.push(`[DateFerme] ${op_} NULL`);
          }
          break;
        case "statut":
          if (filter.value.length === 1) {
            const op_ = filter.value[0] === "Active" ? "IS" : "IS NOT";
            where.push(`[DateFerme] ${op_} NULL`);
          }
          break;
        case "forfait":
          if (filter.value.length === 1) {
            const op_ = filter.value[0] === "Avec Forfait" ? 1 : 0;
            where.push(`[Forfait] = ${op_} `);
          }
          break;

        case "date_start":
        case "date_end":
          const date_ = filter.value[0];
          if (date_) {
            const op = filter.name === "date_start" ? ">=" : "<=";
            replacements.f_date = filter.value[0];
            where.push(
              `CAST([DateMandat] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "date_start_ferme":
        case "date_end_ferme":
          const date_ferme = filter.value[0];
          if (date_ferme) {
            const op = filter.name === "date_start_ferme" ? ">=" : "<=";
            replacements.f_date = filter.value[0];
            where.push(
              `CAST([DateFerme] as DATE) ${op} CAST(N'${date_ferme}' as DATE)`
            );
          }
          break;
        case "date_start_loss":
          const date_start_loss = filter.value[0];
          if (date_start_loss) {
            replacements.f_date = filter.value[0];
            where.push(
              `CAST([DatePerte] as DATE) >= CAST(N'${date_start_loss}' as DATE)`
            );
          }
          break;
        case "date_end_loss":
          const date_end_loss = filter.value[0];
          if (date_end_loss) {
            replacements.f_date = filter.value[0];
            where.push(
              `CAST([DatePerte] as DATE) <= CAST(N'${date_end_loss}' as DATE)`
            );
          }
          break;
        case "NumeroClient":
        case "groupId":
        case "customers":
        case "groups":
        case "postal_code":
        case "phone_number":
        case "courriel":
          // Naming scheme

          let filterName = filter.name;
          if (filterName === "customers") filterName = "NumeroClient";
          if (filterName === "groupId") filterName = "group_id";
          if (filterName === "groups") filterName = "group_id";
          if (filterName === "phone_number") filterName = "TelBureau";
          if (filterName === "courriel") filterName = "Courriel";
          replacements[`fc_${filterName}`] = filter.value;
          where.push(`([C].[${filterName}] IN (:fc_${filterName}))`);
          break;
        case "offices":
          const filter_offices = filter.name;
          replacements[`fc_${filter_offices}`] = filter.value;
          where.push(`([D].[Bureau] IN (:fc_${filter_offices}))`);
          break;
        case "responsible":
          const filter_staff = filter.name;
          replacements[`fc_${filter_staff}`] = filter.value;
          where.push(`([D].[Responsable] IN (:fc_${filter_staff}))`);
          break;
        case "reference":
          const filter_ref = filter.name;
          replacements[`fc_${filter_ref}`] = filter.value;
          where.push(`([D].[Reference] IN (:fc_${filter_ref}))`);
          break;
        case "losses":
          const filter_losses = filter.name;
          replacements[`fc_${filter_losses}`] = filter.value;
          where.push(`([D].[TypeDePerte] IN (:fc_${filter_losses}))`);
          break;
        case "type_of_building":
          const filter_TypeOfBuilding = filter.name;
          replacements[`fc_${filter_TypeOfBuilding}`] = filter.value;
          where.push(`([D].[TypeBatiment] IN (:fc_${filter_TypeOfBuilding}))`);
          break;
        case "province_loss":
          const filter_Provinceperte = filter.name;
          replacements[`fc_${filter_Provinceperte}`] = filter.value;
          where.push(`([D].[Provinceperte] IN (:fc_${filter_Provinceperte}))`);
          break;
        case "contractor":
          const filter_contractor = filter.name;
          replacements[`fc_${filter_contractor}`] = filter.value;
          where.push(`([D].[Entrepreneur] IN (:fc_${filter_contractor}))`);
          break;
        case "ville_perte":
          const filter_ville_perte = filter.name;
          replacements[`fc_${filter_ville_perte}`] = filter.value;
          where.push(`([D].[VillePerte] IN (:fc_${filter_ville_perte}))`);
          break;
        case "marque_ve":
          const filter_marque_ve = filter.name;
          replacements[`fc_${filter_marque_ve}`] = filter.value;
          where.push(`([D].[MarqueVE] IN (:fc_${filter_marque_ve}))`);
          break;
        case "no_stock_ve":
          const filter_no_stock_ve = filter.name;
          replacements[`fc_${filter_no_stock_ve}`] = filter.value;
          where.push(`([D].[NoStockVE] IN (:fc_${filter_no_stock_ve}))`);
          break;
        case "insurerId":
        case "insurerGroupId":
        case "insurers":
          // Naming scheme
          let fnInsurer = filter.name;
          if (fnInsurer === "insurers") fnInsurer = "NumeroClient";
          else if (fnInsurer === "insurerGroupId" || fnInsurer === "insurerId")
            fnInsurer = "group_id";
          replacements[`fa_${fnInsurer}`] = filter.value;
          where.push(`([A].[${fnInsurer}] IN (:fa_${fnInsurer}))`);
          break;
        case "budget":
          const [a, b] = filter.value;
          const min = parseInt(a);
          const max = parseInt(b);
          console.log({ min, max });
          where.push(`([D].[Budget] >= ${min} AND [D].[Budget] <= ${max})`);

          break;
        case "judgment_number":
          const filter_judgment_number = filter.name;
          replacements[`fc_${filter_judgment_number}`] = filter.value;
          where.push(
            `([D].[NumeroJugement] IN (:fc_${filter_judgment_number}))`
          );
          break;
        case "recu_par":
          const filter_recu_par = filter.name;
          replacements[`fc_${filter_recu_par}`] = filter.value;
          where.push(`([D].[RecuPar] IN (:fc_${filter_recu_par}))`);
          break;
        // Date generic filters
        case "mandate_date":
        case "loss_date":
        case "appointment_date":
        case "delivery_date":
        case "closure_date":
          // DB filter name
          const dbFieldsIndex = {
            mandate_date: "DateMandat",
            loss_date: "DatePerte",
            appointment_date: "DateRDV",
            delivery_date: "DateLivraison",
            closure_date: "DateFerme",
          };
          // Generate SQL
          const operator = filter.value[0];
          replacements[`fd_${filter.name}_start`] = filter.value[1];

          const fieldName = `[D].[${dbFieldsIndex[filter.name]}]`;
          const fieldNameCasted = `CAST(${fieldName} AS DATE)`;

          if (operator === "IS_BETWEEN") {
            replacements[`fd_${filter.name}_end`] = filter.value[2];
            where.push(`
              (${fieldNameCasted} >= CAST(:fd_${filter.name}_start as DATE)
              AND
              ${fieldNameCasted} <= CAST(:fd_${filter.name}_end as DATE) )
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
              `(${fieldNameCasted} ${op} CAST(:fd_${filter.name}_start as DATE))`
            );
          }
          break;

        default:
          const { name, value } = filter;
          if (tblRawAttrs[name] && tblRawAttrs[name]._filtrable !== false) {
            replacements[`fs_${name}`] = value;
            where.push(`[D].[${name}] IN (:fs_${name})`);
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

  const query = `
    SELECT
      ${attributes.join(", ")},
      ${settingAttributesSQL}
      [DCA].[NumeroDossier] as [DCA_NumeroDossier],
      [DCA].[NumeroClient],
      [DCA].[NumeroAssureur],
      [DCA].[NumeroPolice],
      [DCA].[Reviseur],
      [DCA].[Langue],
      [DCA].[Copies],
      [DCA].[PourcentageRisque],
      [DCA].[No_Dossier],
      [DCA].[ID_tblDossierAAssures],
      [C].[NomClient],
      [C].[TypeClient],
      [A].[NomClient] AS [NomAssureur],
      [A].[TypeClient] AS [TypeAssureur],
      [DC].[Commentaire],
      [DC].[NomContact],
      [PS].[id] AS [settingsId]

    FROM
      [tblDossier] AS [D]
      LEFT JOIN [tblDossierAAssures] AS [DA] ON [D].[NumeroDossier] = [DA].[NumeroDossier]
      ${settingsJoin}
      LEFT JOIN [tblDossier_Liaison_Client] AS [dlc] ON [DA].[id] = [dlc].[ID_tblDossiersAAssures]
      LEFT JOIN [tblDossierAClient] AS [DC] ON [dlc].[ID_tblDossiersAClient] = [DC].[ID]
      LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
      LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
      LEFT JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DC].[NumeroClient]
      LEFT JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
      LEFT JOIN [tblFactures] AS [F] ON [D].[NumeroDossier] = [F].[NumeroDossier]
      LEFT JOIN [tbl_billing_project_settings] AS [PS] ON [D].[NumeroDossier] = [PS].[project_id]
      ${wSQL}
    ORDER BY
      [D].[DateMandat] DESC;
  `;
  const data = await db.sequelize.query(trimSQLString(query), {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
  });
  const includes = [
    // { table: "[CG]", as: "factures", type: "array" },
    { table: "[C]", as: "clients", type: "array" },
    { table: "[DCA]", as: "insurers", type: "array" },
  ];
  const folders = [...data].reduce((memo, iResult) => {
    const iIndex = memo.findIndex((item) => {
      return item.NumeroDossier === iResult.NumeroDossier;
    });
    // Get the item
    let item = {};
    if (iIndex >= 0) item = memo[iIndex];
    else item = Object.assign({}, iResult);

    // Add includes
    const attributes = Object.keys(item);
    for (const inld of includes) {
      const subItem = attributes.reduce((result, attr) => {
        if (attr.indexOf(inld.as) === 0) {
          if (!result) result = {};
          result[attr.replace(`${inld.as}.`, "")] = iResult[attr];
          delete iResult[attr];
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
  let formattedFolders = folders;
  if (options?.attributes?.settings) {
    formattedFolders = folders.map((el) => {
      const settings = {
        id: el.id,
        daysWithoutActivity: el.daysWithoutActivity,
        nbrDaysWithoutActivity: el.nbrDaysWithoutActivity,
        budgetBeforeFirstInvoice: el.budgetBeforeFirstInvoice,
        minBudgetBeforeFirstInvoice: el.minBudgetBeforeFirstInvoice,
        budgetVsTec: el.budgetVsTec,
        maxPourcentagesOfBudget: el.maxPourcentagesOfBudget,
        maxOfTecAmount: el.maxOfTecAmount,
        isMentor: el.isMentor,
        submissionProcess: el.submissionProcess,
        mentor: el.mentor,
      };
      const element = {};
      for (const [key, value] of Object.entries(el)) {
        if (!Object.keys(BillingProjectSettings.rawAttributes).includes(key)) {
          element[key] = value;
        }
      }
      return { ...element, settings };
    });
  }
  if (options.attributes.factures) {
    const promises = formattedFolders.map(async (folder) => {
      if (folder.factures) {
        folder.factures = await invoicesHelper.toOriginInvoices(
          folder.factures,
          folder.NumeroDossier
        );
      }
      return folder;
    });
    return Promise.all(promises);
  }

  return formattedFolders;
};

module.exports.Asyncfilters = async function (slugs, limit, user) {
  const data = [];
  // Build the query
  const q = (sql) => {
    return sqlze.query(tSQL(sql), {
      type: sqlze.QueryTypes.SELECT,
    });
  };
  // Reference

  if (slugs.includes("reference")) {
    const items = await q(
      "SELECT DISTINCT [D].[Reference] as [value], [D].[Reference] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "Reference",
      data: items
        .filter((item) => item.value)
        .slice(0, limit)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  if (slugs.includes("customers")) {
    const items = await q(
      "SELECT DISTINCT [C].[NumeroClient] as [value], [C].[NomClient] as [name] FROM [tblClient] as C ORDER BY [name];"
    );
    data.push({
      name: "customers",
      data: items
        .filter((item) => item.value)
        .slice(0, limit)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  if (slugs.includes("Courriel")) {
    const items = await q(
      "SELECT DISTINCT [CC].[Courriel] as [value], [CC].[Courriel] as [name] FROM [tblClient]  as [CC]  ORDER BY [name];"
    );
    data.push({
      name: "Courriel",
      data: items
        .filter((item) => item.value)
        .slice(0, limit)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //Numéro de téléphone phoneNumber
  if (slugs.includes("phoneNumber")) {
    const TelBureau = await q(
      "SELECT DISTINCT [CC].[TelBureau] as [value], [CC].[TelBureau] as [name] FROM [tblClient]  as [CC]  ORDER BY [name];"
    );
    const TelCellulaire = await q(
      "SELECT DISTINCT [CC].[TelCellulaire] as [value], [CC].[TelCellulaire] as [name] FROM [tblClient]  as [CC]  ORDER BY [name];"
    );
    const TelDomicile = await q(
      "SELECT DISTINCT [CC].[TelDomicile] as [value], [CC].[TelDomicile] as [name] FROM [tblClient]  as [CC]  ORDER BY [name];"
    );
    const TelAutre = await q(
      "SELECT DISTINCT [CC].[TelAutre] as [value], [CC].[TelAutre] as [name] FROM [tblClient]  as [CC]  ORDER BY [name];"
    );
    const items = TelBureau.concat(TelCellulaire, TelDomicile, TelAutre);
    data.push({
      name: "phoneNumber",
      data: items
        .filter((item) => item.value)
        .slice(0, limit)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  return data;
};

module.exports.filters = async function (slugs, user) {
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
      "SELECT DISTINCT [D].[TypeDePerte] as [value] FROM [tblDossier] as [D] " +
        (user ? "WHERE [D].[Responsable] = N'" + user + "' " : "") +
        "ORDER BY [value];"
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
      "SELECT DISTINCT [C].[NumeroClient] as [value], [C].[NomClient] as [name] FROM [tblClient] as C ORDER BY [name];"
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
  if (slugs.includes("customers")) {
    const items = await q(
      "SELECT DISTINCT [C].[NumeroClient] as [value], [C].[NomClient] as [name] FROM [tblClient] as C ORDER BY [name];"
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
      "SELECT DISTINCT [E].[NomEmploye] as [value], [NomFamille], [Prenom], [Actif], [id_Emp] FROM [tblEmployes] as [E] WHERE [E].[Individu] = 1 AND [E].[Expert] = 1 " +
        (user ? " AND [E].[NomEmploye] = N'" + user + "' " : "") +
        "ORDER BY [value];"
    );
    data.push({
      name: "staff",
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
  // Mentors
  if (slugs.includes("mentors")) {
    const items = await q(
      "SELECT DISTINCT [E].[NomEmploye] as [value], [NomFamille], [Prenom], [Actif], [id_Emp] FROM [tblEmployes] as [E] WHERE [E].[Individu] = 1 AND [E].[Expert] = 1 AND [E].[IsMentor] = 1" +
        (user ? " AND [E].[NomEmploye] = N'" + user + "' " : "") +
        "ORDER BY [value];"
    );
    data.push({
      name: "mentors",
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
  //RecuPar
  if (slugs.includes("RecuPar")) {
    const items = await q(
      "SELECT DISTINCT [D].[RecuPar] as [value], [D].[RecuPar] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "RecuPar",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //TypeOfBuilding
  if (slugs.includes("TypeOfBuilding")) {
    const items = await q(
      "SELECT DISTINCT [TB].[ID] as [value], [TB].[TypeBatiment] as [name] FROM [tblTypesBatiments]  as [TB]  ORDER BY [name];"
    );
    data.push({
      name: "TypeOfBuilding",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value: name,
        })),
    });
  }
  //Reference
  if (slugs.includes("reference")) {
    const items = await q(
      "SELECT DISTINCT [D].[Reference] as [value], [D].[Reference] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "Reference",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //NumeroJugement
  if (slugs.includes("NumeroJugement")) {
    const items = await q(
      "SELECT DISTINCT [D].[NumeroJugement] as [value], [D].[NumeroJugement] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "NumeroJugement",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //CodePostal
  if (slugs.includes("CodePostal")) {
    const items = await q(
      "SELECT DISTINCT [CC].[CodePostal] as [value], [CC].[CodePostal] as [name] FROM [tblClientContact]  as [CC]  ORDER BY [name];"
    );
    data.push({
      name: "CodePostal",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }

  //Entrepreneur
  if (slugs.includes("Entrepreneur")) {
    const items = await q(
      "SELECT DISTINCT [D].[Entrepreneur] as [value], [D].[Entrepreneur] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "Entrepreneur",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //VillePerte
  if (slugs.includes("VillePerte")) {
    const items = await q(
      "SELECT DISTINCT [D].[VillePerte] as [value], [D].[VillePerte] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "VillePerte",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //Provinceperte
  if (slugs.includes("Provinceperte")) {
    const items = await q(
      "SELECT DISTINCT [D].[Provinceperte] as [value], [D].[Provinceperte] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "Provinceperte",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //Courriel

  //MarqueVE
  if (slugs.includes("MarqueVE")) {
    const items = await q(
      "SELECT DISTINCT [D].[MarqueVE] as [value], [D].[MarqueVE] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "MarqueVE",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  //NoStockVE
  if (slugs.includes("NoStockVE")) {
    const items = await q(
      "SELECT DISTINCT [D].[NoStockVE] as [value], [D].[NoStockVE] as [name] FROM [tblDossier]  as [D]  ORDER BY [name];"
    );
    data.push({
      name: "NoStockVE",
      data: items
        .filter((item) => item.value)
        .map(({ value, name }) => ({
          name,
          value,
        })),
    });
  }
  if (slugs.includes("Budget")) {
    let query =
      "SELECT ROUND(MAX([D].[Budget]), -2) as [max], ROUND(MIN([D].[Budget]), -2, 1) as [min] FROM [tblDossier] as [D] ";
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
      name: "Budget",
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

/**
 * Get Offices
 * @param [] ids! required when using directive
 */
module.exports.getOffices = async function (ids, user) {
  // Get a user if sent
  const where = {};
  if (user) {
    where.Responsable = user;
  }

  return await tblDossier
    .aggregate("Bureau", "DISTINCT", { where, plain: false })
    .then((items) => items.map((item) => item.DISTINCT));
};

module.exports.getbillingProjectSettings = async function (
  { projectId, customerId },
  isDefault,
  requestedFields
) {
  // Handle main attributes
  const attributes = [];
  const keys = Object.keys(BillingProjectSettings.rawAttributes);
  for (const field in requestedFields) {
    if (keys.includes(field)) attributes.push(field);
  }
  const where = {};
  if (projectId) {
    where.projectId = projectId;
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (isDefault) {
    where.isDefault = true;
  }
  const ProjectSettings = await BillingProjectSettings.findOne({
    where,
    attributes,
  });
  return ProjectSettings;
};

module.exports.isOwner = async function (folderId, userId) {
  const folder = await tblDossier.findOne({
    where: {
      NumeroDossier: folderId,
      Responsable: userId,
    },
    attribute: ["NumeroDossier"],
  });

  if (folder && folder.NumeroDossier) return true;

  return false;
};

module.exports.foldersClientsAndInsurers = async function (id, user) {
  if (!id) return null;

  // Get a user if sent
  let userWhere = "";
  if (user) {
    userWhere = ` AND [D].[Responsable] = N'${user}' `;
  }

  /*const query = `
    SELECT
      [DCA].*,
      [C].[NomClient],
      [C].[TypeClient],
      [A].[NomClient] AS [NomAssureur],
      [A].[TypeClient] AS [TypeAssureur]
    FROM
      [tblDossierAClientAAssureur] AS [DCA]
      INNER JOIN [tblDossier] AS [D] ON [D].[NumeroDossier] = [DCA].[NumeroDossier]
      INNER JOIN [tblClient] AS c ON [C].[NumeroClient] = [DCA].[NumeroClient]
      INNER JOIN [tblClient] AS a ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
    WHERE
      [DCA].[NumeroDossier] = '${id}'
      ${userWhere}
    ORDER BY
      [DCA].[NumeroDossier] DESC,
      [DCA].[NumeroClient],
      [DCA].[NumeroAssureur]
  `;*/

  const query = `
    SELECT
      [D].[NumeroDossier],
      [DA].[Nom_Assure],
      [DC].[NumeroClient],
      [C].[NomClient],
      [DCA].[NumeroAssureur],
      [A].[NomClient] AS [NomAssureur],
      [DCA].[NumeroPolice],
      [DCA].[PourcentageRisque],
      [DCA].[Reviseur],
      [DC].[DossierConfie],
      [DC].[Courriel],
      [DC].[Commentaire]
    FROM
      [tblDossier] AS [D]
      INNER JOIN [tblDossierAAssures] AS [DA] ON [D].[NumeroDossier] = [DA].[NumeroDossier]
      INNER JOIN [tblDossier_Liaison_Client] AS [DLC] ON [DA].[id] = [DLC].[ID_tblDossiersAAssures]
      INNER JOIN [tblDossierAClient] AS [DC] ON [DLC].[ID_tblDossiersAClient] = [DC].[ID]
      INNER JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
      INNER JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
      INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [DC].[NumeroClient]
      LEFT JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
    WHERE
      [DCA].[NumeroDossier] = '${id}'
      ${userWhere}
    ORDER BY
      [D].[NumeroDossier] DESC,
      [DA].[Nom_Assure],
      [C].[NomClient],
      [DCA].[NumeroAssureur];`;

  const items = await db.sequelize.query(trimSQLString(query), {
    type: db.sequelize.QueryTypes.SELECT,
  });

  const data = [];
  const insured = {};
  const insurers = {};
  const clients = {};
  for (const item of items) {
    insured[item.Nom_Assure] = {
      Nom_Assure: item.Nom_Assure,
    };
    clients[item.NumeroClient] = {
      Nom_Assure: item.Nom_Assure,
      NumeroClient: item.NumeroClient,
      NomClient: item.NomClient,
      Courriel: item.Courriel,
      Commentaire: item.Commentaire,
      DossierConfie: item.DossierConfie,
      insurers: item.insurers,
    };
    insurers[item.NumeroAssureur] = {
      NumeroClient: item.NumeroClient,
      NumeroAssureur: item.NumeroAssureur,
      NomAssureur: item.NomAssureur,
      NumeroPolice: item.NumeroPolice,
      PourcentageRisque: item.PourcentageRisque,
      Reviseur: item.Reviseur,
    };
  }

  for (const key in insurers) {
    const insurer = Object.assign({}, insurers[key]);
    const clientId = insurers[key].NumeroClient;
    delete insurer.NumeroClient;
    if (Array.isArray(clients[clientId].insurers)) {
      clients[clientId].insurers.push(insurer);
    } else {
      clients[clientId].insurers = [insurer];
    }
  }

  for (const key in clients) {
    const client = Object.assign({}, clients[key]);
    const insuredId = clients[key].Nom_Assure;
    delete client.Nom_Assure;
    if (Array.isArray(insured[insuredId].clients)) {
      insured[insuredId].clients.push(client);
    } else {
      insured[insuredId].clients = [client];
    }
  }

  for (const key in insured) {
    data.push(insured[key]);
  }

  return data;
};

function list_to_tree(list) {
  var map = {},
    node,
    roots = [],
    i;

  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parentId !== "0") {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node.parentId]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function getSearchWhere(models, search) {
  if (!Array.isArray(models) || models.length <= 0) return [];
  const searchWhere = {};
  for (const model of models) {
    const modelAttrs = model.model.rawAttributes;
    const as = model.as ? model.as : model.model;
    for (const attribute of Object.keys(modelAttrs)) {
      const attrType = modelAttrs[attribute].type;
      const name = modelAttrs[attribute].field || attribute;
      const isDate =
        attrType instanceof Sequelize.DATE ||
        attrType instanceof Sequelize.DATEONLY;
      if (!isDate && modelAttrs[attribute]._searchable !== false) {
        searchWhere[`$${as}.${name}$`] = {
          [Op.like]: `%${search}%`,
        };
      }
    }
  }
  return searchWhere;
}
