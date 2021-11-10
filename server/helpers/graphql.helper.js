const models = require("-/models");
const Sequelize = require("sequelize");
const { Op } = Sequelize;

module.exports = {
  /**
   * Get the requested attributes from a graphql call
   * using the NPM package graphqlFields
   * @param object info The information object gotten from resolvers
   */
  requestedFields: function (info) {
    // the recursive functions for tree handling
    const flattenObjectToArray = (keys) => {
      let data = {};
      for (const k in keys) {
        if (Object.keys(keys[k]).length === 0) {
          data[k] = null;
        } else {
          data[k] = flattenObjectToArray(keys[k]);
        }
      }
      return data;
    };
    // get the fields object from qraphQL
    const graphqlFields = require("graphql-fields");
    const requestedFields = graphqlFields(info);
    // generate an array from the returned object
    return flattenObjectToArray(requestedFields);
  },

  getIncludesFields: function (requestedFields, search, noThrough) {
    // Handle includes
    const include = [];
    for (const k in requestedFields)
      if (requestedFields[k] !== null) {
        // Let's upper case the first letter of the model
        let modelName = k.charAt(0).toUpperCase() + k.slice(1);
        // Setting arrays of to match schema and DB
        const a = models.gqlNames.a;
        const b = models.gqlNames.b;
        // Set the model name to the DB model name
        if (!models[modelName] && a.includes(modelName))
          modelName = b[a.indexOf(modelName)];
        if (!models[modelName]) continue;
        // Cleaning the fields of unexisting DB fields and checking for children
        const _fields = [];
        const children = {};
        for (const fKey in requestedFields[k]) {
          const field = requestedFields[k][fKey];
          if (
            field === null &&
            Object.keys(models[modelName].rawAttributes).includes(fKey)
          ) {
            _fields.push(fKey);
          } else if (field !== null && Object.keys(field).length) {
            children[fKey] = field;
          }
        }
        // Get the modal in a const
        const model = models[modelName];
        // Create the element to be includes
        const itemToInclude = {
          model,
          as: k,
          attributes: _fields.length > 0 ? _fields : null,
          include: this.getIncludesFields(children, search, noThrough),
        };

        // Adding search
        if (search) {
          const searchWhere = {};
          const tblAttrs = model.rawAttributes;
          for (const attribute of Object.keys(tblAttrs)) {
            if (tblAttrs[attribute]._searchable !== false) {
              searchWhere[attribute] = { [Op.like]: `%${search}%` };
            }
          }
          itemToInclude.where = { [Op.or]: searchWhere };
        }

        // Check for associations data in the model object
        if (noThrough !== true && typeof model.associations === "object") {
          Object.keys(model.associations).forEach((key) => {
            // If modal association has options (may trigger error otherwise)
            if (model.associations[key].hasOwnProperty("options")) {
              const option = model.associations[key].options;
              // If the association is a M:M then reduce the attributes required
              if (option.through) {
                itemToInclude.through = {
                  attributes: [option.foreignKey],
                };
              }
            }
          });
        }

        // Get children includes
        include.push(itemToInclude);
      }
    return include;
  },
};

module.exports.getAttrs = function (fields, model) {
  const attributes = [];
  try {
    for (const field in fields) {
      const dbModel = models[model] || model;
      const modelAttrs = Object.keys(dbModel.rawAttributes);
      if (modelAttrs.includes(field)) {
        attributes.push(field);
      }
    }
  } catch (error) {
    console.log(error);
  }
  return attributes;
};

module.exports.getIncludesByHand = function (relations, mainAttrs) {
  const includes = [];
  try {
    for (const model in mainAttrs) {
      if (relations[model]) {
        includes.push({
          model: relations[model],
          as: model,
          attributes: this.getAttrs(mainAttrs[model], relations[model]),
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
  return includes;
};
