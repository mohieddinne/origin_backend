const { ClientGroups, tblClient, sequelize } = require("../../models");
const Sequelize = require("sequelize");

const { Op } = Sequelize;

/**
 * Get data
 * @param array ids
 * @param object options
 */
module.exports.getData = async function (ids, options) {
  // Verify and clean data
  const where = {};
  if (Array.isArray(ids) && ids.length > 0) {
    where.id = ids;
  }

  // Handle main attributes
  const attributes = new Set();
  if (options.attributes) {
    const keys = Object.keys(ClientGroups.rawAttributes);
    for (const field in options.attributes) {
      if (keys.includes(field)) {
        attributes.add(`ClientGroups.${field}`);
      }
    }
  }

  // Include
  const include = [];
  let group = [];
  if (options.attributes.clientCount === null) {
    attributes.add("id");
    group = Array.from(attributes);
    attributes.add([
      sequelize.fn("COUNT", sequelize.col("customers.NumeroClient")),
      "clientCount",
    ]);
    include.push({
      model: tblClient,
      as: "customers",
      attributes: [],
    });
  }

  let order = [["name", "ASC"]];

  if (!ids) {
    order = [
      ["favorite", "DESC"],
      ["name", "ASC"],
    ];
  }

  return await ClientGroups.findAll({
    where,
    include,
    attributes: Array.from(attributes), // [""]
    order,
    group,
    raw: true,
    nest: true,
  });
};

/**
 * Add item
 * @param ID
 */
module.exports.create = async function (data, attributes_) {
  let errors = [],
    item;
  await ClientGroups.create(data, {
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
    if (Object.keys(ClientGroups.rawAttributes).includes(field)) {
      attributes.push(field);
    }
  }
  const fullItem = await ClientGroups.findOne({
    where: {
      id: item.id,
    },
    attributes,
  });
  return fullItem;
};

/**
 * Update item
 * @param data
 */
module.exports.update = async function (data, attributes_) {
  if (!data.id) return [];
  const id = parseInt(data.id);
  const formattedData = data;
  delete formattedData.id;
  const update = await ClientGroups.update(formattedData, {
    where: {
      id,
    },
  });
  if (!update) {
    throw new Error("Operation Failed!");
  }
  return await ClientGroups.findByPk(id);
};

/**
 * Delete item
 * @param object data
 */
module.exports.delete = async function (data) {
  const { id } = data;

  const res = await ClientGroups.destroy({
    where: { id },
  });
  if (!res) throw new Error("ID dosn't exist");
  return { id };
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
