const db = require("../../../models");
const Sequelize = require("sequelize");
const gqlHlpers = require("../../../helpers/graphql.helper");
const { graphql } = require("graphql");

// Aliases
const {
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateContent,
  EmailTemplateVariables,
} = db;
const sqlze = db.sequelize;
const { Op } = Sequelize;

/**
 * Get data [
 * @param array ids
 * @param object options
 */

module.exports.getData = async function (options) {
  const { ids, categoryId } = options;

  // Handle the where
  const where = {};
  if (Array.isArray(ids) && ids.length > 0) where.id = ids;
  if (categoryId) where.categoryId = categoryId;

  // Handle main attributes
  const attributes = [];
  for (const field in options.attributes) {
    const modelAttrs = Object.keys(EmailTemplate.rawAttributes);
    if (modelAttrs.includes(field)) {
      attributes.push(field);
    }
  }

  // Handle includes
  const avaibleInclds = {
    contents: EmailTemplateContent,
    category: EmailTemplateCategory,
    variables: EmailTemplateVariables,
  };
  const include = gqlHlpers.getIncludesByHand(
    avaibleInclds,
    options.attributes
  );

  return await EmailTemplate.findAll({
    where,
    attributes,
    include,
  });
};

module.exports.getGategoryData = async function (options) {
  const { ids } = options;

  // Handle the where
  const where = {};
  if (Array.isArray(ids) && ids.length > 0) where.id = ids;

  // Handle main attributes
  const attributes = [];
  for (const field in options.attributes) {
    const modelAttrs = Object.keys(EmailTemplateCategory.rawAttributes);
    if (modelAttrs.includes(field)) {
      attributes.push(field);
    }
  }

  return await EmailTemplateCategory.findAll({
    where,
    attributes,
  });
};

module.exports.activeEmailTemplate = async function (id) {
  const template = await EmailTemplate.findByPk(id, {
    attributes: ["id", "active"],
  });
  return await template.update({ active: !template.active });
};

module.exports.update = async function (data) {
  const isNew = !data.id;
  const options = {};
  if (data.id) {
    options.where = { id: data.id };
    delete data.id;
  }

  const func = isNew ? "create" : "update";
  const operation = await EmailTemplateContent[func](data, options);

  if (!operation) return false;

  return true;
};
