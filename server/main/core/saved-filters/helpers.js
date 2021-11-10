const db = require("../../../models");
const gQlHelpers = require("../../../helpers/graphql.helper");

const { SavedFilters } = db;

module.exports.getFilters = async function (options) {
  const { where } = options;

  if (!where.userId || (!where.view && !where.id)) {
    throw new Error("Required attributes: view, userId");
  }

  // Handle main attributes
  const attributes = new Set();
  let include = [];
  const tblRawAttrs = SavedFilters.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
    // Handle includes
    include = gQlHelpers.getIncludesFields(options.attributes, null, true);
  }

  return SavedFilters.findAll({
    attributes: Array.from(attributes),
    include,
    where,
  });
};

module.exports.create = async function (options) {
  const { data } = options;

  if (!data.userId || !data.name || !data.view) {
    throw new Error("Required attributes: name, view, userId");
  }

  const filter = await SavedFilters.create({
    name: data.name,
    view: data.view,
    userId: data.userId,
    data: data.data, // Handle
  });
  const id = filter.id;

  // Handle main attributes
  const attributes = new Set();
  let include = [];
  const tblRawAttrs = SavedFilters.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
    // Handle includes
    include = gQlHelpers.getIncludesFields(options.attributes, null, true);
  }

  return SavedFilters.findOne({
    attributes: Array.from(attributes),
    include,
    where: { id },
  });
};

module.exports.delete = async function (options) {
  const { data } = options;

  if (!data.userId || !data.id) {
    throw new Error("Required attributes: id, userId");
  }

  // Handle main attributes
  const attributes = new Set();
  let include = [];
  const tblRawAttrs = SavedFilters.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
    // Handle includes
    include = gQlHelpers.getIncludesFields(options.attributes, null, true);
  }

  const item = await SavedFilters.findOne({
    attributes: Array.from(attributes),
    include,
    where: { id: data.id, userId: data.userId },
  });

  await item.destroy();

  return item;
};
