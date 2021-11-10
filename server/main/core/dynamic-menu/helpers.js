const db = require("../../../models");
const userHelpers = require("../../user/helpers");
const accessHelpers = require("../../access/helpers");
const gQlHelpers = require("../../../helpers/graphql.helper");
const { findBreakingChanges } = require("graphql");

const { MenuItems, MenuItemsCategoryPages, Access, tblEmployes_Niveaux } = db;

// name of the helper, important for the server log
module.exports.name = "Menues helper";

// Get menu items data
module.exports.get = async function (userId, requestedAttrs) {
  // Handle main attributes
  const attributes = ["id", "parentId"];
  for (const field in requestedAttrs) {
    if (Object.keys(MenuItems.rawAttributes).includes(field)) {
      attributes.push(field);
    }
  }
  // Handle menu data attributes
  const mDatAttrs = [];
  const mDatKeys = Object.keys(MenuItemsCategoryPages.rawAttributes);
  for (const field in requestedAttrs.data) {
    if (mDatKeys.includes(field)) {
      mDatAttrs.push(field);
    }
  }

  // Get data
  const data = await MenuItems.findAll({
    attributes,
    order: [["order", "ASC"]],
    include: [
      {
        model: db.Access,
        as: "access",
        attributes: ["slug"],
        include: [
          {
            as: "aValue",
            model: db.tblEmployes_Niveaux,
            attributes: ["niveau"],
            through: {
              model: db.accessValue,
              attributes: ["can_view", "can_view_own"],
            },
            include: [
              {
                as: "staff",
                model: db.tblEmployes,
                where: { id_Emp: userId },
                attributes: ["id_Emp"],
              },
            ],
          },
        ],
      },
      {
        as: "data",
        attributes: mDatAttrs,
        order: [["order", "ASC"]],
        model: MenuItemsCategoryPages,
      },
    ],
  });

  // Creating a tree
  let items = unflatten(data);

  // Check for the acceses
  items = checkForAccess(items);

  return items;
};

// Get menu items data
module.exports.getForAdmin = async function (requestedAttrs) {
  // Handle main attributes
  const attributes = ["id", "parentId"];
  for (const field in requestedAttrs) {
    if (Object.keys(MenuItems.rawAttributes).includes(field)) {
      attributes.push(field);
    }
  }
  // Handle menu data attributes
  const mDatAttrs = [];
  const mDatKeys = Object.keys(MenuItemsCategoryPages.rawAttributes);
  for (const field in requestedAttrs.data) {
    if (mDatKeys.includes(field)) {
      mDatAttrs.push(field);
    }
  }

  // Get data
  const data = await MenuItems.findAll({
    attributes,
    order: [["order", "ASC"]],
    include: [
      {
        model: db.Access,
        as: "access",
        attributes: ["slug"],
        include: [
          {
            as: "aValue",
            model: db.tblEmployes_Niveaux,
            attributes: ["niveau", "description"],
            through: {
              model: db.accessValue,
              attributes: ["can_view"],
            },
          },
        ],
      },
      {
        as: "data",
        attributes: mDatAttrs,
        order: [["order", "ASC"]],
        model: MenuItemsCategoryPages,
      },
    ],
  });

  // Creating a tree
  let items = unflatten(data, (item) => {
    item.roles = null;
    item.accessSlug = null;
    if (item.access && Array.isArray(item.access.aValue)) {
      item.accessSlug = item.access.slug;
      item.roles = [];
      for (let role of item.access.aValue) {
        if (role.accessValue.can_view) {
          item.roles.push({
            id: role.niveau,
            name: role.description,
          });
        }
      }
    }
    return item;
  });

  return items;
};

function checkForAccess(data) {
  const items = [];
  for (const item of data) {
    if (item) item.children = checkForAccess(item.children);
    const hasChildren = item.children.length > 0;
    let canView = true;
    if (item.access && item.access.aValue.length) {
      const { can_view, can_view_own } = item.access.aValue[0].accessValue;
      canView = can_view || can_view_own || false;
    }
    if (!canView) item.link = "#";
    if (canView || (!canView && hasChildren)) items.push(item);
  }
  return items;
}

function unflatten(arr, fn) {
  const tree = [],
    mappedArr = {};
  let arrElem, mappedElem;

  // First map the nodes of the array to an object -> create a hash table.
  for (let i = 0; i < arr.length; i++) {
    arrElem = arr[i];
    if (typeof fn === "function") arrElem = fn(arrElem);
    mappedArr[arrElem.id] = arrElem;
    mappedArr[arrElem.id]["children"] = [];
  }
  for (var id in mappedArr) {
    if (mappedArr.hasOwnProperty(id)) {
      mappedElem = mappedArr[id];
      // If the element is not at the root level, add it to its parent array of children.
      if (mappedElem.parentId) {
        if (mappedArr[mappedElem["parentId"]]) {
          mappedArr[mappedElem["parentId"]]["children"].push(mappedElem);
        } else {
          tree.push(mappedElem);
        }
      }
      // If the element is at the root level, add it to first level elements array.
      else {
        tree.push(mappedElem);
      }
    }
  }
  //return tree;
  return orderTree(tree);
}

function orderTree(data) {
  if (!Array.isArray(data)) return data;
  return data
    .sort((a, b) => {
      return a.order - b.order;
    })
    .map((item) => {
      if (item) item.children = orderTree(item.children);
      return item;
    });
}

/**
 * Handling a bulk update
 * @param array items Menu items for update/create
 * @param array idsForDelete ids to delete
 * @param integer user_id The user ID
 * @return boolean
 */
module.exports.levelsCount = null;
module.exports.handle = async function (items, idsForDelete, user_id) {
  // Verify and clean data
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array");
  }
  // Get all the accesses
  const accesses = {};
  await Access.findAll({
    attributes: ["id", "slug"],
  }).then((data) => {
    if (!Array.isArray(data)) return null;
    for (const access of data) accesses[access.slug] = access.id;
  });

  // Check for validation
  const query =
    "UPDATE [tblAccessValues] SET [can_view_own] = 0 WHERE [accessId] IN (SELECT [id] FROM [tblAccess] WHERE [pageFlag] = 1);";
  await db.sequelize.query(query);

  // Check for missing acces-slugs
  const cleanedItems = [];
  for (const mItem of items) {
    if (mItem.accessSlug) {
      mItem.accessId = accesses[mItem.accessSlug.toLowerCase()];
    } else if (mItem.id) {
      const menuItemDB = await MenuItems.findOne({
        where: { id: mItem.id },
        attributes: ["id"],
        include: [
          {
            model: Access,
            as: "access",
            attributes: ["id", "slug"],
          },
        ],
      });
      if (menuItemDB) {
        if (menuItemDB.access) {
          mItem.accessId = menuItemDB.access.id;
          mItem.accessSlug = menuItemDB.access.slug;
        }
      }
    }

    // Handle access to the menu item
    mItem.accessId = await this.updateAccessForMenuItem({
      accessId: mItem.accessId,
      accessSlug: mItem.accessSlug,
      roles: mItem.roles,
      type: mItem.type,
      itemName: mItem.name,
    });
    delete mItem.accessSlug;
    delete mItem.auths;
    if (!mItem.parentId) {
      mItem.parentId = null;
    }
    cleanedItems.push(mItem);
  }

  // Reset data
  this.levelsCount = null;

  // Get the data
  let dataForUpdate = [],
    dataForInsert = [],
    dataForDelete = [];
  for (const item of cleanedItems) {
    if (item.id > 0) {
      dataForUpdate.push(item);
    } else {
      if (user_id) item.createdBy = user_id;
      dataForInsert.push(item);
    }
  }

  // Clean the remove ids
  if (Array.isArray(idsForDelete))
    dataForDelete = idsForDelete.filter((id) => {
      const itemId = parseInt(id);
      return itemId > 0;
    });

  let errors = [];

  // Insert data
  if (dataForInsert.length > 0) {
    for (const item of dataForInsert) {
      if (item.id) delete item.id;
      let categories = [];
      if (item.data && item.data.length > 0) {
        categories = item.data;
        delete item.data;
      }
      await MenuItems.create(item, {
        fields: Object.keys(item), // Force the ORM to not add the [id] column
      })
        .then(async (result) => {
          await this.saveCategoryData(categories, result.id, user_id);
        })
        .catch((error) => {
          console.error(error);
          errors.push(error);
        });
    }
  }

  // Update data
  if (dataForUpdate.length > 0) {
    for (const item of dataForUpdate) {
      const { id } = item;
      delete item.id;
      const menuItem = await MenuItems.findOne({
        where: { id },
        attributes: ["id"],
      });
      if (menuItem) {
        let categories = [];
        if (item.data && item.data.length > 0) {
          categories = item.data;
          delete item.data;
        }
        await menuItem
          .update(item)
          .then(
            async () => await this.saveCategoryData(categories, id, user_id)
          )
          .catch((error) => {
            console.error(error);
            errors.push(error);
          });
      }
    }
  }

  // Delete data
  if (dataForDelete.length > 0) {
    for (const id of dataForDelete) {
      const item = await MenuItems.findOne({
        where: { id },
        attributes: ["accessId"],
      });
      if (item) {
        await MenuItems.destroy({
          where: { id },
        })
          .then(async () => {
            await this.saveCategoryData(null, item.id, user_id);
            if (item.accessId) {
              await accessHelpers.delete(item.accessId, false);
            }
          })
          .catch((error) => {
            console.error(error);
            errors.push(error);
          });
      }
    }
  }

  if (errors.length > 0) {
    throw errors;
  }

  await Promise.all([
    accessHelpers.cleanOnServerStart(),
    this.cleanOnServerStart(),
  ]);

  return true;
};

/**
 * Update access data
 * @param array data
 * @param integer id
 * @return boolean
 */
module.exports.updateAccessForMenuItem = async function (options) {
  const { roles, itemName, type } = options;
  let accessId = null,
    accessSlug = null;
  // If the access exists
  if (options.accessId) {
    accessId = options.accessId;
    accessSlug = options.accessSlug;
    await accessHelpers.bulkChangeAccess(accessId, "can_view", false);
  } else {
    // Get levels count
    if (!this.levelsCount) this.levelsCount = await tblEmployes_Niveaux.count();
    // Not every one can view
    if (Array.isArray(roles) && roles.length !== this.levelsCount) {
      // Create an access
      const options_ = {};
      const suffixe = type === 2 ? "Menu - lien" : "Menu - page";
      const name = suffixe + ": " + itemName;
      options_.flag = accessHelpers.FLAGS.PAGE_FLAG;
      const access = await accessHelpers.create(name, options_);
      if (access) {
        accessId = access.id;
        accessSlug = access.slug;
      }
    }
  }

  // Make can view
  if (accessSlug && Array.isArray(roles)) {
    const promises = roles.map((role) => {
      return accessHelpers.toggleAccess(role.id, accessSlug, "can_view");
    });
    await Promise.all(promises);
  }
  return accessId;
};

/**
 * Save category data
 * @param array data
 * @param integer id
 * @return boolean
 */
module.exports.saveCategoryData = async function (data, id, user_id = null) {
  if (!id) {
    return false;
  }

  // delete all previous data
  await MenuItemsCategoryPages.destroy({
    where: {
      menuItemId: id,
    },
  })
    .then(() => {
      // Silence is gold
    })
    .catch((err) => {
      errors.push(err);
    });

  if (!data || data.length <= 0) {
    return false;
  }

  const errors = [];
  const dataForInsert = [];
  let i = 1;
  for (const item of data) {
    dataForInsert.push({
      menuItemId: id,
      title: item.title,
      image: item.image,
      color_text: item.color_text,
      color_background: item.color_background,
      link: item.link,
      external: Boolean(item.external),
      order: i,
      createdBy: user_id,
    });
    i++;
  }

  if (dataForInsert.length > 0) {
    await MenuItemsCategoryPages.bulkCreate(dataForInsert, {
      fields: Object.keys(dataForInsert[0]), // Force the ORM to not add the [id] column
    })
      .then((result) => {
        // Handel data
      })
      .catch((err) => {
        errors.push(err);
      });
  }

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Create an item
 * @param object data
 * @return int
 */
module.exports.create = async function (row_data) {
  // Verify and clean data
  if (!row_data || row_data.length <= 0) {
    return false;
  }

  // Get the data
  let data = row_data;

  // Clean data
  data.createdBy = parseInt(data.createdBy);
  data.type = parseInt(row_data.type);
  data.order = parseInt(row_data.order);
  data.external = Boolean(row_data.order);
  if (row_data.id) {
    delete data.id;
  }
  if (row_data.color && row_data.color.indexOf("#") >= 0) {
    data.color = row_data.color.slice(1);
  }
  if (row_data.type) {
    data.type = 1;
  }

  // Required data
  if (data.type <= 0 || data.name === "") {
    return false;
  }

  let errors = [];
  await MenuItems.create(data, {
    fields: Object.keys(data), // Force the ORM to not add the [id] column
  })
    .then((result) => {
      data = result;
    })
    .catch(function (err) {
      console.error(err);
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return data.id;
};

/**
 * Update an item
 * @param array data
 * @return boolean
 */
module.exports.update = async function (data) {
  // Verify and clean data
  if (!data || data.length <= 0 || !data.id) {
    return false;
  }

  const errors = [],
    { id } = data;
  delete data.id;
  // check order
  await MenuItems.update(data, {
    where: {
      id,
    },
  })
    .then(() => {
      // Silence is gold
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Reorder an item
 * @param int id
 * @param int order
 * @return boolean
 */
module.exports.reorder = async function (id, order) {
  // Verify and clean data
  if (!id || !order) {
    return false;
  }

  const errors = [];
  await MenuItems.update(
    {
      order,
    },
    {
      where: {
        id,
      },
    }
  )
    .then(() => {
      MenuItems.update(
        {
          order: Sequelize.literal("order + 1"),
        },
        {
          where: {
            order: {
              [Op.gte]: order,
            },
          },
        }
      );
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Delete data
 * @param array data
 * @return boolean
 */
module.exports.delete = async function (ids) {
  // Verify and clean data
  if (!ids) {
    return false;
  }
  // Filter the input
  ids = ids.map(Number).filter((item) => item > 0);
  if (!Array.isArray(ids) || ids.length <= 0) {
    return false;
  }

  //destroy

  let errors = [];
  await MenuItems.destroy({
    where: {
      id: ids,
      parentId: ids,
    },
  })
    .then(() => {
      MenuItemsCategoryPages.destroy({
        where: {
          menuItemId: ids,
        },
      });
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Clean the DB of unsed accesses
 */
module.exports.cleanOnServerStart = async function () {
  let ops = 0;
  // Get unneeded categories pages
  const items = await db.sequelize.query(
    "SELECT [id] FROM [tblMenuItemsCategoryPages] WHERE [menuItemId] NOT IN (SELECT [id] FROM [tblMenuItems])",
    {
      type: db.sequelize.QueryTypes.SELECT,
      model: MenuItemsCategoryPages,
    }
  );
  if (items.length > 0) {
    await MenuItemsCategoryPages.destroy({
      where: {
        id: items.map((item) => item.id),
      },
    })
      .then(async () => {
        ops++;
      })
      .catch(console.log);
  }
  return ops > 0;
};
