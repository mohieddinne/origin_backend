const db = require("../../../models");
const sqlHelpers = require("../../../helpers/sql.helpers");

const DEFAULT_PAGE_SIZE = 30;

module.exports.staffAccessSlugs = [
  "folders",
  "invoices",
  "clients",
  "activities",
];

module.exports.responsible = (options) =>
  new Promise(async (resolve) => {
    const { ownOnly, user, cursor, countPerPage, i } = options;
    const items = await __q(
      `
			SELECT
				DISTINCT [E].[NomEmploye] as [value], [NomFamille], [Prenom], [id_Emp],
				COUNT(*) OVER() as [totalCount]
			FROM [tblEmployes] as [E]
			WHERE
				[E].[Individu] = 1
				AND [E].[Expert] = 1
				${ownOnly && user ? " AND [E].[id_Emp] = '" + user.id_Emp + "' " : ""}
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );

    const nodes = items
      .filter((item) => item.value)
      .map(({ value, NomFamille, Prenom }) => ({
        name: `${Prenom} ${NomFamille}`,
        value,
      }));

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.reference = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `
      SELECT
        DISTINCT [D].[Reference] as [value],
        [D].[Reference] as [name],
				COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );

    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });
module.exports.statut = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;

    const nodes = [
      { value: "Active", name: "Active" },
      { value: "Inactive", name: "Inactive" },
    ];

    resolve({ nodes, totalCount: 2 || 0 });
  });

module.exports.forfait = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;

    const nodes = [
      { value: "Avec Forfait", name: "Avec Forfait" },
      { value: "Sans Forfait", name: "Sans Forfait" },
    ];

    resolve({ nodes, totalCount: 2 || 0 });
  });

module.exports.customers = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[NumeroClient] as [value] , 
      [C].[NomClient] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);
    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.courriel = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[Courriel] as [value], [C].[Courriel] as [name],
      COUNT(*) OVER() as [totalCount]
       FROM [tblClient]  as [C]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.phone_number = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [CC].[TelBureau] as [value],[CC].[TelBureau] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClientContact]  as [CC]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.groups = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT [G].[id] as [value], [G].[name], [G].[favorite],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClientGroupes] as G
			ORDER BY [favorite] DESC, [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY
		`
    );
    const nodes = items
      .filter((item) => item.value)
      .map(({ value, name, favorite }) => ({
        name,
        value,
        favorite,
      }));

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.offices = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[Bureau] as [value], 
      [D].[Bureau] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier] as [D]  
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.losses = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[TypeDePerte] as [value],
      [D].[TypeDePerte] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier] as [D] 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.recu_par = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[RecuPar] as [value], [D].[RecuPar] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.type_of_building = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [TB].[ID] as [value], [TB].[TypeBatiment] as [name],
    COUNT(*) OVER() as [totalCount]
    FROM [tblTypesBatiments]  as [TB]
		ORDER BY [${cursor?.sortBy || "value"}]
		OFFSET ${countPerPage * i} ROWS
		FETCH NEXT ${countPerPage} ROWS ONLY;
	`
    );
    const nodes = items.map((item) => {
      return {
        name: item?.name,
        value: item?.name,
      };
    });

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.judgment_number = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[NumeroJugement] as [value], [D].[NumeroJugement] as [name], 		COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.postal_code = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [CC].[CodePostal] as [value],[CC].[CodePostal] as [name], 
      COUNT(*) OVER() as [totalCount]
      FROM [tblClientContact]  as [CC]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.contractor = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[Entrepreneur] as [value], [D].[Entrepreneur] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.ville_perte = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[VillePerte] as [value],[D].[VillePerte] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.province_loss = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[Provinceperte] as [value], [D].[Provinceperte] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });
module.exports.marque_ve = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[MarqueVE] as [value], [D].[MarqueVE] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.no_stock_ve = (options) =>
  new Promise(async (resolve) => {
    const { user, cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [D].[NoStockVE] as [value], [D].[NoStockVE] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblDossier]  as [D]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.tel_office = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[TelBureau] as [value] , 
      [C].[TelBureau] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.address = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[Adresse] as [value] , 
      [C].[Adresse] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.city = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[Ville] as [value] , 
      [C].[Ville] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.customer_type = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[TypeClient] as [value] , 
      [C].[TypeClient] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.tel_fax = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[TelFax] as [value] , 
      [C].[TelFax] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.cellular = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[TelCellulaire] as [value] , 
      [C].[TelCellulaire] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.tel_home = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[TelDomicile] as [value] , 
      [C].[TelDomicile] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.tel_other = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[SiteWeb] as [value] , 
      [C].[SiteWeb] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.language = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [C].[Langue] as [value] , 
      [C].[Langue] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblClient] as C 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.color = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [CG].[id] as [value], [CG].[color] as [color], [CG].[name] as name,
      COUNT(*) OVER() as [totalCount]
       FROM [tblClientGroupes]  as [CG]
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.value);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.invoice_number = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [F].[NumeroFacture] as [value] , 
      [F].[NumeroFacture] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblFactures] as [F] 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.folders = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [F].[NumeroDossier] as [value] , 
      [F].[NumeroDossier] as [name],
      COUNT(*) OVER() as [totalCount]
      FROM [tblFactures] as [F] 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.categories = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [Categorie] as value, 
      [Categorie] as [name],
       COUNT(*) OVER() as [totalCount]
      FROM [tblActivites] 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.activities = (options) =>
  new Promise(async (resolve) => {
    const { cursor, countPerPage, i } = options;
    const items = await __q(
      `SELECT DISTINCT [Activite] as value, 
      [Activite] as [name],
       COUNT(*) OVER() as [totalCount]
      FROM [tblActivites] 
			ORDER BY [${cursor?.sortBy || "value"}]
			OFFSET ${countPerPage * i} ROWS
			FETCH NEXT ${countPerPage} ROWS ONLY;
		`
    );
    const nodes = items.filter((item) => item.name);

    resolve({ nodes, totalCount: parseInt(items[0]?.totalCount) || 0 });
  });

module.exports.resolve = async function (promise, options) {
  const { after, limit, user, ownOnly } = options;

  const countPerPage = limit || DEFAULT_PAGE_SIZE;
  const cursor = __decodeCursor(after);
  const i = cursor?.i || 0;

  // Get the data
  const { nodes, totalCount } = await module.exports[promise]({
    i,
    countPerPage,
    cursor,
    user,
    ownOnly,
  });

  const first = nodes[0] || null;
  const last = nodes[nodes.length - 1] || null;
  const endCursor = __encodeCursor({ ...(cursor || {}), i: i + 1 });

  const data = {
    totalCount,
    pageInfo: {
      endCursor,
      hasNextPage: countPerPage * (i + 1) < totalCount,
    },
    edges: [
      { node: first, cursor: __encodeCursor({ ...(cursor || {}), i }) },
      { node: last, cursor: endCursor },
    ],
    nodes,
  };

  return data;
};

function __encodeCursor(custor) {
  const data = JSON.stringify(custor);
  const buff = Buffer.from(data);
  return buff.toString("base64");
}

function __decodeCursor(custor) {
  if (!custor) return null;
  const buff = Buffer.from(custor, "base64");
  const string = buff.toString("ascii");
  try {
    return JSON.parse(string);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function __q(sql) {
  return db.sequelize.query(sqlHelpers.trimSQLString(sql), {
    type: db.sequelize.QueryTypes.SELECT,
  });
}
