const userHelpers = require("../../main/user/helpers");

const operations = async ({ slug, id_Emp, data, ids, operation, mockID }) => {
  // Define the operation type
  let privilege = "view",
    b;
  if (!data && ids) {
    operation = "view";
    privilege = "view";
  }
  if (operation && operation === "delete") {
    operation = "delete";
    privilege = "delete";
  } else if (data && mockID) {
    operation = "update";
    privilege = "edit";
  } else if (data && !mockID && !ids) {
    operation = "create";
    privilege = "create";
  }
  let access = await userHelpers.hasAccess(slug, `can_${privilege}`, id_Emp);
  return { access, operation };
};

module.exports.allAccesses = async function (slug, id_Emp, options) {
  const { data, ids, operation } = options;
  let mockID = "";
  let x = { access: false, operation };
  switch (slug) {
    case "clients":
      mockID = data && data.NumeroClient;
      x = await operations({ slug, id_Emp, data, ids, operation, mockID });
      break;
    case "invoices":
      mockID = data && data.NumeroFacture;
      x = await operations({ slug, id_Emp, data, ids, operation, mockID });
      break;
    case "folders":
      mockID = data && data.NumeroDossier;
      x = await operations({ slug, id_Emp, data, ids, operation, mockID });
      break;
    case "clients_group":
      mockID = data && data.id;
      x = await operations({ slug, id_Emp, data, operation, mockID });
      break;
  }

  return x;
};
