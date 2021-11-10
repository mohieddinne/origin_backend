const Sequelize = require("sequelize");
const { ActivityLog, tblEmployes } = require("../../../models");
const { Op } = Sequelize;
/**
 * Get data
 * @param array slugs
 */
module.exports.getAll = async function (requestedFields, date) {
  const where = {};
  if (date) {
    const sDate = new Date(date);
    if (sDate) {
      where[Op.and] = [
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("createdAt")),
          sDate.getFullYear()
        ),
        Sequelize.where(
          Sequelize.fn("MONTH", Sequelize.col("createdAt")),
          sDate.getMonth() + 1
        ),
        Sequelize.where(
          Sequelize.fn("DAY", Sequelize.col("createdAt")),
          sDate.getDate()
        ),
      ];
    }
  }

  // Handle main attributes
  const attributes = [];
  const allowedAttributes = Object.keys(ActivityLog.rawAttributes);

  for (const field in requestedFields) {
    if (allowedAttributes.includes(requestedFields[field]))
      attributes.push(requestedFields[field]);
  }

  // Handle includes
  const include = [];
  if (requestedFields.author) {
    const attributes = [];
    const allowedAttributes = Object.keys(tblEmployes.rawAttributes);
    for (const field in requestedFields.author)
      if (allowedAttributes.includes(field)) attributes.push(field);

    include.push({
      model: tblEmployes,
      as: "author",
      attributes,
    });
  }
  const data = await ActivityLog.findAll({
    include,
    where,
    order: [["id", "DESC"]],
    attributes,
  });
  return data;
};

module.exports.createActivityLog = async function (description, user) {
  if (!description) return;

  let userData = {};
  if (user && user.id_Emp) {
    userData = await tblEmployes.findOne({
      where: { id_Emp: user.id_Emp },
      attributes: ["courriel", "NomEmploye"],
    });
  }

  const data = {
    description,
    userEmail: userData.courriel || null,
    userName: userData.NomEmploye || null,
  };

  return ActivityLog.create(data)
    .then(() => {})
    .catch((err) => {
      console.error(err);
    });
};
