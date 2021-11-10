const Sequelize = require("sequelize");
const { CalendarHolidays } = require("../../models");
const { Op } = Sequelize;

/**
 * Get data
 * @param array ids
 * @param object options
 */
module.exports.getData = async function (options) {
  // Intialisation
  const { id, year } = options;
  const where = {};

  if (year) {
    where[Op.and] = [
      Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("date")), year),
    ];
  }
  if (id) {
    where.id = id;
  }

  // Handle main attributes
  const attributes = [];
  if (options.attributes) {
    const keys = Object.keys(CalendarHolidays.rawAttributes);
    for (const field in options.attributes)
      if (keys.includes(field)) attributes.push(field);
  }

  return await CalendarHolidays.findAll({
    where,
    attributes,
    order: [["date", "ASC"]],
  });
};

/**
 * Add item
 * @param ID
 */
module.exports.create = async function (data) {
  if (!data) return;
  return CalendarHolidays.create(data)
    .then((response) => response)
    .catch((error) => {
      console.error({ error });
    });
};

/**
 * Update item
 * @param data
 */
module.exports.update = async function (data) {
  if (!data.id) return null;
  const id = parseInt(data.id);
  const formattedData = data;
  delete formattedData.id;
  const update = await CalendarHolidays.update(formattedData, {
    where: { id },
  });
  if (!update) {
    throw new Error("Updating the holiday has failed!");
  }
  return await CalendarHolidays.findByPk(id);
};

/**
 * Delete item
 * @param object data
 */
module.exports.delete = async function (id) {
  const operation = await CalendarHolidays.destroy({ where: { id } });
  if (!operation) throw new Error("Deleting the holiday has failed.");
  return true;
};
