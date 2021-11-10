const {
  SchemaDirectiveVisitor,
  ApolloError,
} = require("apollo-server-express");
const { defaultFieldResolver } = require("graphql");
const i18nHelper = require("../../helpers/i18n.helper");
const { allAccesses } = require("./allAccess");

class AccessDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;

    const { slug } = this.args;

    field.resolve = async function (...param) {
      const [, arg, context] = param;

      try {
        const { access, operation } = await allAccesses(
          slug,
          context.user.id_Emp,
          arg
        );

        if (operation) {
          arg.operation = operation;
        }

        if (access) {
          return resolve.apply(this, param);
        }
        if (!access) {
          throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
        }
      } catch (error) {
        console.log(error);
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }
    };
  }
}

module.exports = AccessDirective;
