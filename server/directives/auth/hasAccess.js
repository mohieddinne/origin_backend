const {
  SchemaDirectiveVisitor,
  ApolloError,
} = require("apollo-server-express");
const {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
  defaultFieldResolver,
} = require("graphql");
const hlprs = require("./helpers");

class HasAccessDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(directiveName, schema) {
    return new GraphQLDirective({
      name: "hasAccess",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
      args: {
        slug: {
          type: new GraphQLList(GraphQLString),
          defaultValue: "none",
        },
        scope: {
          type: new GraphQLList(GraphQLString),
          defaultValue: "view",
        },
        own: {
          type: new GraphQLList(GraphQLBoolean),
          defaultValue: false,
        },
      },
    });
  }

  visitFieldDefinition(field) {
    const { slug, scope, own } = this.args;
    const next = field.resolve || defaultFieldResolver;

    field.resolve = async function (result, args, context, info) {
      const user = context?.user || context?.connection?.context.user;
      // Check access
      const payload = await hlprs.hasAccess(user, slug, scope, own);
      if (payload) {
        const ctx = {
          ...context,
          user: {
            ...user,
            ...payload.user,
          },
          privilege: payload.privilege,
        };
        return next(result, args, ctx, info);
      }

      const error = "You are not authorized for this resource.";
      throw new ApolloError(error, "NOT_AUTHORIZED");
    };
  }

  visitObject(obj) {
    const fields = obj.getFields();
    const { slug, scope, own } = this.args;

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve || defaultFieldResolver;
      field.resolve = async function (result, args, context, info) {
        const user = context?.user || context?.connection?.context.user;

        // Check access
        const payload = await hlprs.hasAccess(user, slug, scope, own);
        if (payload) {
          const ctx = {
            ...context,
            user: {
              ...user,
              ...payload.user,
            },
            privilege: payload.privilege,
          };
          return next(result, args, ctx, info);
        }

        const error = "You are not authorized for this resource.";
        throw new ApolloError(error, "NOT_AUTHORIZED");
      };
    });
  }
}

module.exports = HasAccessDirective;
