const { tblEmployes } = require("../../models");
const userHelpers = require("../../main/user/helpers");
const { ApolloError } = require("apollo-server-express");

module.exports.hasAccess = async function (u, slug, scope, own) {
  const userId = u?.id_Emp;
  // Check the user ID (via JWT)
  if (!userId) {
    const error = "You are not authenticated.";
    throw new ApolloError(error, "NOT_AUTHENTICATED");
  }
  // Check for the user active ID in DB
  const user = await tblEmployes.findOne({
    where: { id_Emp: userId },
    attributes: ["actif", "NomEmploye"],
  });
  if (!user || !user.actif) {
    const error = "Your user is disabled.";
    throw new ApolloError(error, "USER_DISABLED");
  }

  // Check for own view
  // Important to use == not ===
  if (scope == "view" && own) {
    const canView = await userHelpers.hasAccess(slug, "can_view", userId);

    let privilege = null;
    if (canView) privilege = "can_view";
    else {
      const canViewOwn = await userHelpers.hasAccess(
        slug,
        "can_view_own",
        userId
      );
      if (canViewOwn) privilege = "can_view_own";
    }
    if (privilege)
      return {
        privilege,
        user: {
          NomEmploye: user.NomEmploye,
        },
      };

    return false;
  }

  // Get the privilege
  const privilege = `can_${scope}`;
  const canScope = await userHelpers.hasAccess(slug, privilege, userId);

  if (canScope)
    return {
      privilege,
      user: {
        NomEmploye: user.NomEmploye,
      },
    };

  return false;
};
