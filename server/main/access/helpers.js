const db = require("../../models");
const Sequelize = require("sequelize");
const slugify = require("slugify");
const { tblEmployes, tblEmployes_Niveaux, Access, accessValue } = db;

// name of the helper, important for the server log
module.exports.name = "Roles and acces helper";

// Set the user val
module.exports.level = null;
module.exports.levels = null;
module.exports.access = null;

module.exports.FLAGS = {
  PAGE_FLAG: 1,
};

/**
 * Get levels details
 * @param integer id
 */
module.exports.getRoles = async function (ids) {
  const where = {};

  // Verify and clean data
  if (Array.isArray(ids)) {
    const filtredIds = ids.filter((item) => typeof item === "number");
    if (filtredIds.length <= 0) return false;
    where.niveau = filtredIds;
  }

  // Get data
  const attributes = [
    "id",
    "accessName",
    "slug",
    "allow_view",
    "allow_view_own",
    "allow_edit",
    "allow_create",
    "allow_delete",
  ];
  const promises = [
    tblEmployes_Niveaux.findAll({
      where,
      attributes: ["niveau", "description"],
      include: [
        {
          model: Access,
          as: "accesses",
          attributes,
          through: {
            attributes: [
              "id",
              "value",
              "can_view",
              "can_view_own",
              "can_edit",
              "can_create",
              "can_delete",
            ],
          },
        },
      ],
    }),
    Access.findAll({ attributes }),
  ];
  const [roles, allAccesses] = await Promise.all(promises);

  // Merge the Accesses and there privileges
  return roles.map((role) => {
    return {
      id: role.niveau,
      name: role.description,
      accesses: allAccesses.map((access) => {
        const uAccess = role.accesses.find((item) => item.id === access.id);
        const item = {
          id: access.id,
          name: access.accessName,
          slug: access.slug,
          pageFlag: false,
          allow_view: access.allow_view,
          allow_view_own: access.allow_view_own,
          allow_edit: access.allow_edit,
          allow_create: access.allow_create,
          allow_delete: access.allow_delete,
          can_view: false,
          can_view_own: false,
          can_edit: false,
          can_create: false,
          can_delete: false,
        };
        if (uAccess) {
          const privilege = uAccess.accessValue;
          item.pageFlag = privilege.pageFlag;
          item.can_view = privilege.can_view;
          item.can_view_own = privilege.can_view_own;
          item.can_edit = privilege.can_edit;
          item.can_create = privilege.can_create;
          item.can_delete = privilege.can_delete;
        }
        return item;
      }),
    };
  });
};

/**
 * Get accesses details
 * @param integer id
 */
module.exports.getAccesses = async function (ids) {
  let where = {};

  if (ids !== undefined) {
    // Verify and clean data
    ids = ids.filter((item) => typeof item === "number");
    if (!Array.isArray(ids) || ids.length <= 0) {
      return false;
    }
    where = {
      id: ids,
    };
  }

  // Get the data
  const accesses = await Access.findAll({
    where: where,
  });

  // Reforme the object and init the can_* attribute
  accesses.forEach((access) => {
    access.name = access.accessName;
    access.can_view = false;
    access.can_view_own = false;
    access.can_edit = false;
    access.can_create = false;
    access.can_delete = false;
  });
  return accesses;
};

/**
 * Bulk update an access
 * @param integer accessId
 * @param string privilege
 * @param boolean access
 * @returns boolean
 */
module.exports.bulkChangeAccess = async function (
  accessId,
  privilege,
  access = false
) {
  // Get the access params
  const accesses = await accessValue.findAll({
    where: {
      accessId: accessId,
    },
  });
  if (!accesses) {
    return false;
  }
  for (const item of accesses) {
    await item
      .update({
        [privilege]: access,
      })
      .then(() => {})
      .catch(function (err) {
        console.log(err);
      });
  }
  return true;
};

/**
 * Clean the DB of unsed accesses
 */
module.exports.cleanOnServerStart = async function () {
  let ops = 0;
  // Get unneeded accesses
  const accesses = await db.sequelize.query(
    "SELECT [id] FROM [tblAccess] WHERE [pageFlag]=1 AND [id] NOT IN (SELECT [accessId] FROM [tblMenuItems] WHERE [accessId] IS NOT NULL);",
    {
      type: db.sequelize.QueryTypes.SELECT,
      model: Access,
    }
  );
  if (accesses.length > 0) {
    await Access.destroy({
      where: {
        id: accesses.map((item) => item.id),
      },
    })
      .then(async () => {
        ops++;
        await accessValue
          .destroy({
            where: {
              accessId: accesses.map((item) => item.id),
            },
          })
          .then(() => {
            ops++;
          })
          .catch(console.log);
      })
      .catch(console.log);
  }
  // Get the unneeded accessValues
  const accessValues = await db.sequelize.query(
    "SELECT [id] FROM [tblAccessValues] WHERE [accessId] NOT IN (SELECT [id] FROM [tblAccess]);",
    {
      type: db.sequelize.QueryTypes.SELECT,
      model: accessValue,
    }
  );
  if (accessValues.length > 0) {
    await accessValue
      .destroy({
        where: {
          id: accessValues.map((item) => item.id),
        },
      })
      .then(() => {
        ops++;
      })
      .catch(console.log);
  }
  // Get the access
  const access = await Access.findOne({
    where: {
      slug: "reports-tec" || "folder-access",
    },
  });

  // Add the access if not found
  if (!access) {
    return await Access.create({
      accessName: "Rapport TEC" || "Folder Access",
      slug: "reports-tec" || "folder-access",
      pageFlag: false,
    });
  }
  return ops > 0;
};

// Toggle a role access
// Revisited on the 31 dec. 2020 by Kharrat M.
module.exports.toggleAccess = async function (role, slug, privilegeString) {
  if (!role || !slug || !privilegeString) {
    throw new Error("Attributes role, slug, privilege are mandatory.");
  }

  const access = await Access.findOne({
    where: {
      slug,
    },
    attributes: ["id"],
    include: [
      {
        model: tblEmployes_Niveaux,
        as: "aValue",
        attributes: ["niveau"],
        where: {
          niveau: role,
        },
        through: {
          model: accessValue,
          attributes: ["id", privilegeString],
        },
      },
    ],
  });

  let id = null,
    privilege = null;
  if (access && access.aValue && access.aValue[0]) {
    id = access.aValue[0].accessValue.id;
    privilege = access.aValue[0].accessValue[privilegeString];
  }

  try {
    if (!id) {
      const access = await Access.findOne({
        where: { slug },
        attributes: ["id"],
      });
      const fields = ["levelId", "accessId", [privilegeString]];
      await accessValue.create(
        {
          levelId: role,
          accessId: access.id,
          [privilegeString]: true,
        },
        {
          fields, // Force the ORM to not add the [id] column
        }
      );
    } else {
      await accessValue.update(
        {
          levelId: role,
          accessId: access.id,
          [privilegeString]: !privilege,
        },
        { where: { id } }
      );
    }
  } catch (e) {
    throw e;
  }

  return true;
};

// Create a role
module.exports.createRole = async function (item) {
  if (!item) throw new Error("Item is mandatory.");

  if (item.id) delete item.id;

  try {
    const niveau = Sequelize.literal(
      "(SELECT MAX([niveau]) FROM [tblEmployes_Niveaux]) + 1"
    );
    return await tblEmployes_Niveaux.create({
      niveau,
      description: item.name,
    });
  } catch (error) {
    throw error;
  }
};

module.exports.create = async function (accessName, options) {
  const item = { accessName };
  item.slug = slugify(accessName).toLowerCase();
  if (options && options.flag) {
    item.pageFlag = options.flag;
    item.allow_view = true;
    item.allow_view_own = false;
    item.allow_edit = false;
    item.allow_create = false;
    item.allow_delete = false;
  } else {
    item.allow_view = true;
    item.allow_view_own = false;
    item.allow_edit = false;
    item.allow_create = false;
    item.allow_delete = false;
  }
  const access = await Access.create(item, {
    fields: Object.keys(item), // Force the ORM to not add the [id] column
  });
  return { ...item, id: access.id };
};
