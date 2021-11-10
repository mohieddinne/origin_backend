const db = require("../../models");

const { Access, ClientGroups } = require("../../models");
const SqlString = require("sequelize/lib/sql-string");
const sqlHelpers = require("../../helpers/sql.helpers");
const queries = require("./queries");
const queriesDetails = require("./queries.helpers.js");

// Aliases
const tSQL = sqlHelpers.trimSQLString;
const sqlze = db.sequelize;

const helpers = {
  // name of the helper, constant for the server log
  name: "KPIs helper",

  /**
   * Get the data used for a widget calc
   * Returns an array of object
   * @param string count
   * @param object options
   * @returns array
   */
  async data(widget, math, options, rowFilter = false) {
    if (rowFilter && rowFilter.length > 0) {
      // Prepare the filters
      const filters = this.genFilters(math, options).join(" AND ");
      const isIncome = math === "income";

      const query = queriesDetails[widget](isIncome, filters);
      // Execute the query
      const items = await db.sequelize.query(query, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      return items;
    }

    // Prepare the filters
    const filters = this.genFilters(math, options).join(" AND ");
    const isIncome = math === "income";

    // Build the query

    if (typeof queries[widget] !== "function") return false;

    const query = queries[widget](isIncome, filters);
    // Execute the query
    const items = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    if (widget === "lossesandoffices") {
      const data = [];
      for (const item of items) {
        const i = data.findIndex((el) => el.type == item.TypeDePerte);
        if (i >= 0) {
          // exists
          if (data[i].office == item.Bureau)
            data[i] = {
              types: item.TypeDePerte,
              offices: item.Bureau,
              value: data[i].value + item[isIncome ? "income" : "number"],
            };
          else
            data.push({
              types: item.TypeDePerte,
              offices: item.Bureau,
              value: item[isIncome ? "income" : "number"],
            });
        } else {
          data.push({
            types: item.TypeDePerte,
            offices: item.Bureau,
            value: item[isIncome ? "income" : "number"],
          });
        }
      }
      return data;
    }
    if (widget === "customergroupsquery") {
      const data = [];
      const groups = await ClientGroups.findAll({
        attributes: ["id", "name", "color", "fallback"],
      });
      if (!groups || groups.length === 0) return null;
      for (const group of [{ id: null }, ...groups]) {
        const filters = this.genFilters(math, {
          ...options,
          customer_group: [group.id],
        }).join(" AND ");

        const query = queries[widget](isIncome, filters);

        const item = await sqlze.query(query, {
          type: sqlze.QueryTypes.SELECT,
        });
        data.push({
          name: group.name,
          value: item[0][isIncome ? "income" : "number"],
          fallback: group.fallback,
          options: [
            {
              name: "id",
              value: group.id,
            },
            {
              name: "color",
              value: group.color,
            },
          ],
        });
      }

      const noneGroupped = data.find((e) => !e.name);
      if (noneGroupped) {
        const fallback = data.find((e) => e.fallback);
        if (fallback) {
          return data
            .filter((e) => e.name)
            .map((e) => {
              if (e.name === fallback.name) {
                return {
                  ...e,
                  value: e.value + noneGroupped.value,
                };
              }
              return e;
            });
        }
      }
      return data;
    }
    if (widget === "folderstypes") {
      const data = items.map((item) => {
        const value = item[isIncome ? "income" : "number"];
        const option = {
          name: item.TypeDePerte,
          value,
        };
        return option;
      });
      return [{ options: data }];
    }

    if (widget === "offices") {
      const data = items.map((item) => {
        const value = item[isIncome ? "income" : "number"];
        return {
          name: item.Bureau,
          value,
        };
      });
      return data;
    }

    if (widget === "customers") {
      const autre = {
        name: "autre",
        value: 0,
      };
      const limit = 10;
      const data = [];
      let k = 0;
      for (const item of items) {
        const value = item[isIncome ? "income" : "number"];
        if (k + 1 <= limit)
          data.push({
            name: item.NomClient,
            value,
          });
        else autre.value = autre.value + value;
        k++;
      }

      if (autre.value > 0) data.push(autre);
      return data;
    }
    return items;
  },

  // Generates filters data
  async filters(isAdmin) {
    const data = [];
    let items;
    // Build the query
    const q = (sql) => {
      return sqlze.query(tSQL(sql), {
        type: sqlze.QueryTypes.SELECT,
      });
    };
    // Groups
    items = await ClientGroups.findAll({
      attributes: ["id", "name", "favorite"],
      order: [["favorite", "desc"], ["name"]],
    });
    data.push({
      name: "groups",
      data: items.map((item) => ({
        name: item.name,
        value: item.id,
        favorite: item.favorite,
      })),
    });
    // Offices
    items = await q(
      "SELECT DISTINCT [D].[Bureau] as [value] FROM [tblDossier] as D ORDER BY [value]"
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
    //active folder
    items = await q(
      "SELECT DISTINCT [D].[DateFerme] as [value] FROM [tblDossier] as D ORDER BY [value]"
    );
    data.push({
      name: "active",
      data: items
        .filter((item) => item.value)
        .map(({ value }) => ({
          name: value,
          value,
        })),
    });

    // Types
    items = await q(
      "SELECT DISTINCT [D].[TypeDePerte] as [value] FROM [tblDossier] as D ORDER BY [value]"
    );
    data.push({
      name: "types",
      data: items
        .filter((item) => item.value)
        .map(({ value }) => ({
          name: value,
          value,
        })),
    });
    // Customers
    items = await q(
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
    if (isAdmin) {
      // Staff
      items = await q(
        "SELECT DISTINCT [E].[NomEmploye] as [value], [NomFamille], [Prenom], [Actif] FROM [tblEmployes] as E WHERE [E].[Individu] = 1 AND [E].[Expert] = 1 ORDER BY [value]"
      );
      data.push({
        name: "Responsable",
        data: items
          .filter((item) => item.value)
          .map(({ value, NomFamille, Prenom, Actif }) => ({
            name: `${Prenom} ${NomFamille}`,
            value,
            actif: Actif,
          })),
      });
    }

    return data;
  },

  // Renders an SQL arrays of WHERE conditions
  genFilters(count, options) {
    const dateAttr =
      count === "income" ? "[F].[DateFacturation]" : "[D].[DateMandat]";
    const filters = [];
    for (const f in options) {
      if (Array.isArray(options[f]) && options[f].length)
        switch (f) {
          case "date_start":
            if (options[f][0])
              filters.push(
                `CAST(${dateAttr} as DATE) >= '${options[f][0]} 00:00:00.000'`
              );
            break;

          case "date_end":
            if (options[f][0] == "1970-01-01") {
              options[f][0] = new Date().toISOString().slice(0, 10);
            }
            if (options[f][0])
              filters.push(
                `CAST(${dateAttr} as DATE) <= '${options[f][0]} 23:59:59.999'`
              );
            break;
          case "date_start_ferme":
            if (options[f][0])
              filters.push(
                `CAST([D].[DateFerme] as DATE) >=  CAST(N'${options[f][0]}' as DATE)`
                //00:00:00.000'`
              );
            break;

          case "date_end_ferme":
            if (options[f][0] == "1970-01-01") {
              options[f][0] = new Date().toISOString().slice(0, 10);
            }
            if (options[f][0])
              filters.push(
                `CAST([D].[DateFerme] as DATE) <= CAST(N'${options[f][0]}' as DATE)`
                // 23: 59: 59.999'`
              );
            break;
          case "active":
            if (options[f].length === 1) {
              const grp = options[f][0];
              if (grp === "1") {
                filters.push(`[D].[DateFerme] IS NULL`);
              }
              if (grp === "0") {
                filters.push(`[D].[DateFerme] IS NOT NULL`);
              }
            }

            break;

          case "customers_groups": // Send from the front
          case "customer_group": // used by the function groups
          case "customers":
            const cFltr = [];
            if (f === "customers_groups") {
              const grp = options[f].filter((e) => !!e && e !== "null");
              const a = [];
              if (grp.length) a.push(`[C].[group_id] IN (${grp.join(", ")})`);
              if (options[f].includes(null) || options[f].includes("null"))
                a.push(`[C].[group_id] IS NULL`);
              cFltr.push(a.join(" OR "));
            }

            if (f === "customer_group") {
              const grp = options[f][0];
              if (!grp) {
                cFltr.push(`[C].[group_id] IS NULL`);
              } else {
                cFltr.push(`[C].[group_id] = '${grp}'`);
              }
            }

            if (f === "customers" && options[f].length > 0)
              cFltr.push(`[C].[NumeroClient] IN (${options[f].join(", ")})`);

            if (cFltr.length) {
              let s =
                "[D].[NumeroDossier] IN (SELECT DISTINCT [DC].[NumeroDossier] FROM " +
                "[tblDossierAClient] AS DC INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]";
              s += " WHERE " + cFltr.join(" AND ") + ")";
              filters.push(s);
            }
            break;
          case "types":
            filters.push(
              `[D].[TypeDePerte] IN (${options[f]
                .map((item) => SqlString.escape(item, null, "mssql"))
                .join()})`
            );
            break;
          case "offices":
            if (!options[f][0]) {
              filters.push(`[D].[Bureau] IS NULL `);
            } else
              filters.push(
                `[D].[Bureau] IN (${options[f]
                  .map((item) => SqlString.escape(item, null, "mssql"))
                  .join()})`
              );
            break;
          case "Responsable":
            filters.push(
              `[D].[Responsable] IN (${options[f]
                .map((item) => SqlString.escape(item, null, "mssql"))
                .join()})`
            );
            break;
          case "insurers":
            let s = `[A].[NumeroClient] in (${options[f].join(", ")})`;
            filters.push(s);
          case "insurers_groups":
            filters.push(`[A].[group_id] in (${options[f].join(", ")})`);
          default:
            break;
        }
    }
    // if (user_id)
    //   filters.push(
    //     `[D].[Responsable] IN (SELECT [E].[NomEmploye] FROM [tblEmployes] as E WHERE [E].[ID_Emp] = ${SqlString.escape(
    //       user_id,
    //       null,
    //       "mssql"
    //     )})`
    //   );
    filters.push(`[D].[NumeroDossier] NOT LIKE '00%'`);

    return filters;
  },

  // Check if the module access exists
  async cleanOnServerStart() {
    // Get the access
    const access = await Access.findOne({
      where: {
        slug: "kpis",
      },
    });
    // Add the access if not found
    if (!access) {
      return await Access.create({
        accessName: "Indicateurs de performances",
        slug: "kpis",
        pageFlag: false,
      });
    }
    return false;
  },

  async statistics(filters) {
    const where = [];
    let types = null;
    const typesQuery =
      "SELECT ttdp.TypeDePerte as name from tblTypesDePerte ttdp";
    types = await sqlze.query(typesQuery, {
      type: sqlze.QueryTypes.SELECT,
    });
    for (const filter in filters) {
      switch (filter) {
        case "date_start":
        case "date_end":
          const date_ = filters[filter][0];
          if (date_) {
            const op = filter === "date_start" ? ">=" : "<=";
            where.push(
              `CAST([DateMandat] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "offices":
          const value = filters[filter].map((item) => " '" + item + " '");
          where.push(`[D].[Bureau] IN (${value.join(",")})`);
          break;
        case "insurers_groups":
          where.push(`[A].[${"group_id"}] IN (${filters[filter].join(", ")})`);
          break;
        case "insurers":
          where.push(
            `[A].[${"NumeroClient"}] IN (${filters[filter].join(", ")})`
          );
          break;
        // Customers group
        case "customers_groups":
          where.push(`[C].[${"group_id"}] IN (${filters[filter].join(", ")})`);
          break;
        case "customers":
          where.push(
            `[C].[${"NumeroClient"}] IN (${filters[filter].join(", ")})`
          );
          break;
        default:
          break;
      }
    }
    let wFrags = "";
    if (where.length > 0) wFrags = " ( " + where.join(" AND ") + ")";
    const wSql = wFrags ? "WHERE " + wFrags : "";
    const query = `
SELECT
     [D].[TypeDePerte],
     [D].[ID_TypeDePerte],
     COUNT([D].[ID_TypeDePerte]) AS [Nbr_dossiers]
FROM
    [tblDossier] AS [D]
    INNER JOIN [tblDossierAAssures] AS [DA] ON [D].[NumeroDossier] = [DA].[NumeroDossier]
    INNER JOIN [tblDossierAClient] AS [DC] ON [D].[NumeroDossier] = [DC].[NumeroDossier]
    INNER JOIN [tblClient] AS [C] ON [DC].[NumeroClient] = [C].[NumeroClient]
    INNER JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON [DLA].[ID_tblDossierAClient] = [DC].[ID]
    INNER JOIN [tblDossierAClientAAssureur] AS [DCA] ON [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
    INNER JOIN [tblClient] AS [A] ON [A].[NumeroClient] = [DCA].[NumeroAssureur]
    ${wSql}
GROUP BY
    [D].[ID_TypeDePerte],
    [D].[TypeDePerte]
ORDER BY
    [D].[TypeDePerte]
    `;
    // Execute the query
    const items = await sqlze.query(query, {
      type: sqlze.QueryTypes.SELECT,
    });
    const data = items.map((item) => {
      const _data = {
        name: item.TypeDePerte,
        value: item.ID_TypeDePerte,
        count: item.Nbr_dossiers,
      };
      return _data;
    });
    //console.log({ data });
    return { data, types: types?.map((el) => el.name.toLowerCase()) };
  },

  kpis_statistics_pdf: async (data, options) => {
    return await require("./pdf-lib/statistics-pdf")(data, options);
  },

  customer_reports: async (filters) => {
    const where = [];
    for (const filter of filters) {
      switch (filter.name) {
        case "date_start":
        case "date_end":
          const date_ = filter.value[0];
          if (date_) {
            const op = filter.name === "date_start" ? ">=" : "<=";
            where.push(
              `CAST([DateMandat] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "offices":
          const value = filter.value.map((item) => " '" + item + " '");
          where.push(`[D].[Bureau] IN (${value.join(",")})`);
          break;
        case "groups":
          where.push(`[C].[${"group_id"}] IN (${filter.value.join(", ")})`);
          break;
        default:
          break;
      }
    }

    let wFrags = "";
    if (where.length > 0) wFrags = " ( " + where.join(" AND ") + ")";
    const wSql = wFrags ? "WHERE " + wFrags : "";
    const query = `
SELECT
     [D].[TypeDePerte],
    COUNT([D].[ID_TypeDePerte]) AS [Nbr_dossiers]
FROM
    [tblDossier] AS [D]
    INNER JOIN tblDossierAClientAAssureur AS [DCA] ON [DCA].[NumeroDossier] = [D].[NumeroDossier]
    INNER JOIN tblClient AS [C] ON [C].[NumeroClient] = [DCA].[NumeroAssureur]
     ${wSql}
GROUP BY
    [D].[ID_TypeDePerte],
    [D].[TypeDePerte]
ORDER BY
    [D].[TypeDePerte]
`;
    // Execute the query
    const items = await sqlze.query(query, {
      type: sqlze.QueryTypes.SELECT,
    });
    const data = items?.map((item) => {
      const _data = {
        name: item.TypeDePerte,
        value: item.Nbr_dossiers,
      };
      return _data;
    });
    return data;
  },

  customer_reports_details: async function (filters) {
    const where = [];
    for (const filter in filters) {
      switch (filter) {
        case "date_start":
        case "date_end":
          const date_ = filters[filter][0];
          if (date_) {
            const op = filter === "date_start" ? ">=" : "<=";
            where.push(
              `CAST([F].[DateFacturation] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "offices":
          const value = filters[filter].map((item) => " '" + item + " '");
          where.push(`[D].[Bureau] IN (${value.join(",")})`);
          break;
        case "insurers_groups":
          where.push(`[A].[${"group_id"}] IN (${filters[filter].join(", ")})`);
          break;
        case "insurers":
          where.push(
            `[A].[${"NumeroClient"}] IN (${filters[filter].join(", ")})`
          );
          break;
        // Customers group
        case "customers_groups":
          where.push(`[C].[${"group_id"}] IN (${filters[filter].join(", ")})`);
          break;
        case "customers":
          where.push(
            `[C].[${"NumeroClient"}] IN (${filters[filter].join(", ")})`
          );
          break;
        default:
          break;
      }
    }

    let wFrags = "";
    if (where.length > 0) wFrags = " ( " + where.join(" AND ") + ")";

    const query = `
    SELECT
      [C].[NomClient],
      a.NomClient AS NomAssureur,
      [D].[Bureau],
      [D].[NumeroDossier],
      [D].[TypeDePerte],
      CONCAT(f.NumeroFacture, '-', dca.NumeroAssureur) AS NumeroFacture,
      [F].[DateFacturation],
      ([F].[MontantFacture] * dca.PourcentageRisque) AS MontantFacture,
      CONCAT(dca.PourcentageRisque * 100, '%') AS PourcentageRisk
    FROM
      [tblFactures] AS [F]
    INNER JOIN [tblDossier] AS [D] ON
      d.NumeroDossier = f.NumeroDossier
    LEFT JOIN [tblDossierAAssures] AS [DA] ON
      [D].[NumeroDossier] = [DA].[NumeroDossier]
    LEFT JOIN [tblDossier_Liaison_Client] AS [dlc] ON
      [DA].[id] = [dlc].[ID_tblDossiersAAssures]
    LEFT JOIN [tblDossierAClient] AS [DC] ON
      [dlc].[ID_tblDossiersAClient] = [DC].[ID]
    LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON
      [DLA].[ID_tblDossierAClient] = [DC].[ID]
    LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON
      [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
    LEFT JOIN [tblClient] AS [C] ON
      [C].[NumeroClient] = [DC].[NumeroClient]
    LEFT JOIN [tblClient] AS [A] ON
      [A].[NumeroClient] = [DCA].[NumeroAssureur]
    WHERE
      [F].[NumeroFacture] NOT LIKE '%Projet%'
      AND [DCA].[PourcentageRisque] > 0
      ${wFrags ? " AND " + wFrags : ""}
    ORDER BY
      [F].[DateFacturation],
      [A].[NomClient],
      [D].[NumeroDossier],
      ([F].[MontantFacture] * dca.PourcentageRisque)
    `;
    // Execute the query
    const items = await sqlze.query(query, {
      type: sqlze.QueryTypes.SELECT,
    });
    const data = items?.map((item) => {
      const _data = {
        customer: {
          NomClient: item.NomClient,
        },
        folder: {
          NumeroDossier: item.NumeroDossier,
          Bureau: item.Bureau,
          DateMandat: item.DateMandat,
          TypeDePerte: item.TypeDePerte,
          Forfait: item.Forfait,
        },
        invoice: {
          DateFacturation: item.DateFacturation,
          NumeroFacture: item.NumeroFacture,
          MontantHonoraires: item.MontantHonoraires,
          MontantFacture: item.MontantFacture,
          // Montant payé selon pct:item.TypeDePerte,
        },
      };
      return _data;
    });
    return data;
  },

  customer_reports_statistics: async function (filters) {
    const where = [];
    for (const filter of filters) {
      switch (filter.name) {
        case "date_start":
        case "date_end":
          const date_ = filter.value[0];
          if (date_) {
            const op = filter.name === "date_start" ? ">=" : "<=";
            where.push(
              `CAST([DateMandat] as DATE) ${op} CAST(N'${date_}' as DATE)`
            );
          }
          break;
        case "groups":
          where.push(`[C].[${"group_id"}] IN (${filter.value.join(", ")})`);
          break;
        default:
          break;
      }
    }

    let wFrags = "";
    if (where.length > 0) wFrags = " ( " + where.join(" AND ") + ")";
    const wSql = wFrags ? " " + wFrags : "";
    const query = `
  SELECT
    [C].[NomClient],
    SUM(ROUND([F].[MontantFacture], 2)) AS [Montant_Facture],
    SUM(ROUND([F].[MontantFacture] * [DCA].[PourcentageRisque], 2)) AS [Pourcentage_Risque_Facturation]
  FROM
    [tblFactures] AS [F]
    INNER JOIN [tblDossier] AS [D] ON [D].[NumeroDossier] = [F].[NumeroDossier]
    INNER JOIN tblDossierAClientAAssureur AS [DCA] ON [DCA].[NumeroDossier] = [D].[NumeroDossier]
    INNER JOIN tblClient AS [C] ON [C].[NumeroClient] = [DCA].[NumeroAssureur]
  WHERE
      [DCA].[PourcentageRisque] > 0
      ${wFrags ? " AND " + wFrags : ""}
  AND
    [F].[NumeroFacture] NOT LIKE '%Projet%'
  GROUP BY
      [C].[NomClient]
    `;
    // Execute the query
    const items = await sqlze.query(query, {
      type: sqlze.QueryTypes.SELECT,
    });

    return null;
  },

  pdfTitle: async function (options, office) {
    let title = "Dossiers reçus ";
    for (const option in options) {
      switch (option) {
        case "customers_groups":
          // Get Group name by groupID
          const _groups = await ClientGroups.findAll({
            where: { id: options[option] },
          });
          const groups = _groups.map((group) => group.name);
          title = title + groups.join(" , ") + " ";
          break;
        case "offices":
          if (office) title = title + " " + office;
          else title = title + options[option].join(",");
          break;
        case "date_start":
        case "date_end":
          if (option === "date_start") title = title + options[option][0] + " ";
          if (option === "date_end") title = title + options[option][0] + " ";
          break;

        default:
          break;
      }
    }

    return title;
  },

  customer_reports_total: async function (office) {
    const query = `
    SELECT
      ROUND(SUM(([F].[MontantFacture]*dca.PourcentageRisque)),2) AS turnover,
      COUNT(d.NumeroDossier) as folders
    FROM
      [tblFactures] AS [F]
    INNER JOIN [tblDossier] AS [D] ON
      d.NumeroDossier=f.NumeroDossier
    LEFT JOIN [tblDossierAAssures] AS [DA] ON
      [D].[NumeroDossier] = [DA].[NumeroDossier]
    LEFT JOIN [tblDossier_Liaison_Client] AS [dlc] ON
      [DA].[id] = [dlc].[ID_tblDossiersAAssures]
    LEFT JOIN [tblDossierAClient] AS [DC] ON
      [dlc].[ID_tblDossiersAClient] = [DC].[ID]
    LEFT JOIN [tblDossier_Liaison_Assureur] AS [DLA] ON
      [DLA].[ID_tblDossierAClient] = [DC].[ID]
    LEFT JOIN [tblDossierAClientAAssureur] AS [DCA] ON
      [DLA].[ID_tblDossierAclientAAssureur] = [DCA].[ID]
    LEFT JOIN [tblClient] AS [C] ON
      [C].[NumeroClient] = [DC].[NumeroClient]
    LEFT JOIN [tblClient] AS [A] ON
      [A].[NumeroClient] = [DCA].[NumeroAssureur]
    WHERE
      [F].[NumeroFacture] NOT LIKE '%Projet%'
      AND [DCA].[PourcentageRisque] > 0
      AND( CAST(f.DateFacturation AS DATE) >= CAST(N'2019-10-01T11:59:44.051Z' AS DATE)
      AND CAST(f.DateFacturation AS DATE) <= CAST(N'2020-09-30T11:59:44.051Z' AS DATE))
      ${office ? `AND [D].[Bureau] = '${office}'` : ""}
  `;

    const data = await db.sequelize.query(tSQL(query), {
      type: db.sequelize.QueryTypes.SELECT,
    });
    return data[0];
  },
};

module.exports = helpers;
