const configHelpers = require("./helpers");
const userHelpers = require("../user/helpers");
const utilsHelpers = require("../../helpers/utils.helper");
const i18nHelper = require("../../helpers/i18n.helper");
const { ApolloError } = require("apollo-server-express");
const config = require("../../config");
const { createActivityLog } = require("../core/activity-logs/helpers");

// Aliases
const hA = userHelpers.hasAccess.bind(userHelpers);

const resolvers = {
  Query: {
    async options(_, args, { user }) {
      // Get the options
      const options = await configHelpers.getData(args.slugs);

      // Let's check the rights
      let access = false;
      if (user) {
        access = await hA("config", "can_view", user.id_Emp);
      }
      let returnData = [];

      options.forEach((element) => {
        if (element.access === "public" || (user && access)) {
          returnData.push(element);
        }
      });
      return await returnData;
    },
  },

  Mutation: {
    async updateOptions(_, { options }, { user }) {
      // Execute the operation
      const operation = await configHelpers.updateData(options);
      if (!operation) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }
      createActivityLog("Plateform options are updated", user);
      return true;
    },

    /**
     * Update home_background_image
     * This function uploads and updathe the home_background_image option
     */
    async updateHomeBackgroundImageOption(_, { file }, { user }) {
      // Upload the file
      const { mimetype } = await file;

      const today = new Date();
      const mimeType_temp = mimetype.split("/");
      const uploadedFile = await utilsHelpers.uploadFile({
        destination: config.folders.upload_misc_image,
        file: file,
        allowedFileMime: ["image/jpeg", "image/jpg", "image/png"],
        savedFileName:
          "background-" +
          today.getFullYear() +
          ("0" + (today.getMonth() + 1)).slice(-2) +
          today.getDate() +
          "-" +
          today.getTime() +
          "-" +
          user.id_Emp +
          "." +
          mimeType_temp[1],
      });

      if (!uploadedFile) {
        console.error("[OriginServer] Error saving the file.");
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      // Update the DB
      const data = [
        {
          name: "home_background_image",
          value: uploadedFile,
        },
      ];
      const operation = await configHelpers.updateData(data);
      if (!operation) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      createActivityLog("The default background image is updated.", user);
      return await utilsHelpers.renderFilePublicUrl(
        uploadedFile,
        config.folders.upload_misc_image
      );
    },

    /**
     * Update misc photos
     */
    async uploadImage(_, { file, attachedTo }, { user }) {
      // Check access
      const promises = [
        hA("config", "can_edit", user.id_Emp),
        hA("platform-admin", "can_edit", user.id_Emp),
      ];
      const [cConfig, cAdmin] = await Promise.all(promises);
      if (!cConfig && !cAdmin) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      // Upload the file
      const { mimetype } = await file;

      const today = new Date();
      const mimeType_temp = mimetype.split("/");
      let destination = config.folders.upload_misc_image;
      const slug = attachedTo ? attachedTo.replace("-", "_") : "misc";
      if (config.folders["upload_" + slug]) {
        destination = config.folders["upload_" + slug];
      }
      const uploadedFile = await utilsHelpers.uploadFile({
        destination,
        file: file,
        allowedFileMime: ["image/jpeg", "image/jpg", "image/png"],
        savedFileName:
          slug +
          "-" +
          today.getFullYear() +
          ("0" + (today.getMonth() + 1)).slice(-2) +
          today.getDate() +
          "-" +
          today.getTime() +
          "-" +
          user.id_Emp +
          "." +
          mimeType_temp[1],
      });

      if (!uploadedFile) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      return await utilsHelpers.renderFilePublicUrl(uploadedFile, destination);
    },
  },
};

module.exports = resolvers;
