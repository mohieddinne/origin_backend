const {
  SchemaDirectiveVisitor,
  ApolloError,
} = require("apollo-server-express");
const {
  DirectiveLocation,
  GraphQLDirective,
  defaultFieldResolver,
} = require("graphql");
const { tblEmployes } = require("../../models");

async function verifyAndDecodeToken({ context }) {
  const u = context?.user || context?.connection?.context.user;
  if (!u?.id_Emp) {
    const error = "You are not authenticated.";
    throw new ApolloError(error, "NOT_AUTHENTICATED");
  }
  const user = await tblEmployes.findOne({
    where: { id_Emp: u.id_Emp },
    attributes: ["actif", "NomEmploye"],
  });
  if (!user || !user.actif) {
    const error = "Your user is disabled.";
    throw new ApolloError(error, "USER_DISABLED");
  }
  return { ...u, NomEmploye: user.NomEmploye };
}

class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration() {
    return new GraphQLDirective({
      name: "isAuthenticated",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
    });
  }

  visitObject(obj) {
    const fields = obj.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve || defaultFieldResolver;

      field.resolve = async function (result, args, context, info) {
        const decoded = await verifyAndDecodeToken({ context }); // will throw error if not valid signed jwt
        return next(result, args, { ...context, user: decoded }, info);
      };
    });
  }

  visitFieldDefinition(field) {
    const next = field.resolve || defaultFieldResolver;

    field.resolve = async function (result, args, context, info) {
      const decoded = await verifyAndDecodeToken({ context });
      return next(result, args, { ...context, user: decoded }, info);
    };
  }
}

module.exports = IsAuthenticatedDirective;
