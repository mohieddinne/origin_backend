const { ApolloError } = require("apollo-server-express");
const helpers = require("./helpers");
const uHlprs = require("../../user/helpers");

const hA = uHlprs.hasAccess.bind(uHlprs);

const resolvers = {
  Query: {
    async sharedFilter(_, args, { user }) {
      if (typeof helpers[args.slug] !== "function") {
        const error = `The requested filter < ${args.slug} > is unavailable`;
        throw new ApolloError(error, "FILTER_NAME_ERROR");
      }
      // Check for access
      let ownOnly = false;
      const aSlugs = helpers[args.slug + "AccessSlugs"] || [];
      if (aSlugs.length > 0) {
        let hasAccess;
        for (const aSlug of aSlugs) {
          hasAccess = await hA(aSlug, `can_view`, user.id_Emp);
          if (hasAccess) break;
          hasAccess = await hA(aSlug, `can_view_own`, user.id_Emp);
          if (hasAccess) {
            ownOnly = true;
            break;
          }
        }
        if (!hasAccess) {
          const error = `You are not authorized to ${args.slug}.`;
          throw new ApolloError(error, "NOT_AUTHORIZED");
        }
      }
      // Call the right function and retreive the data
      return helpers.resolve([args.slug], { ...args, user, ownOnly });
    },
  },
};

module.exports = resolvers;
