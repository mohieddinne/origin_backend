const { Options } = require("../../models");
const utilsHelpers = require("../../helpers/utils.helper");
const config = require("../../config");

/**
 * Get data
 * @param array slugs
 */
module.exports.getData = async function (slugs) {
  let whereData = {};
  // Verify and clean data
  if (slugs != null) {
    slugs = slugs.filter((item) => typeof item === "string");
    if (!Array.isArray(slugs)) {
      return false;
    }
    if (slugs.length > 0) {
      whereData = {
        name: slugs,
      };
    }
  }

  // Get data
  const tempData = await Options.findAll({
    where: whereData,
  });

  // Special traitments
  const data = [];
  for (let option of tempData) {
    switch (option.name) {
      case "home_background_image":
        option.value = await utilsHelpers.renderFilePublicUrl(
          option.value,
          config.folders.upload_misc_image
        );
        break;
      default:
      // None
    }
    data.push(option);
  }

  return data;
};

/**
 * Update data
 * @param array data
 * @returns boolean
 */
module.exports.updateData = async function (data) {
  // Verify and clean data
  if (!data) {
    return false;
  }
  data = data.filter((item) => typeof item === "object");
  if (!Array.isArray(data) || data.length <= 0) {
    return false;
  }

  let errors = [];
  for (let option of data) {
    if (!option.name || !option.value) {
      // Silence is gold
    } else {
      await Options.update(
        {
          value: option.value,
        },
        {
          where: {
            name: option.name,
          },
        }
      )
        .then(() => {
          // Silence is gold
        })
        .catch(function (err) {
          errors.push(option.name);
        });
    }
  }

  if (errors.length > 0) {
    return false;
  }

  // Reset the options cache
  utilsHelpers.clearOptionsCache();

  return true;
};
