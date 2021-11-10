const contentHelpers = require("./helpers");
const userHelpers = require("../user/helpers");
const i18nHelper = require("../../helpers/i18n.helper");
const utilsHelpers = require("../../helpers/utils.helper");
const { ApolloError } = require("apollo-server-express");
const config = require("../../config");
const { createActivityLog } = require("../core/activity-logs/helpers");
const { UnreadArticle } = require("../../models");
// Aliases
const hA = userHelpers.hasAccess.bind(userHelpers);

const resolvers = {
  ContentData: {
    async read(parent, _, { user }) {
      if (!parent.id || !user) return false;
      // Check if the message was read
      const ureadContent = await UnreadArticle.findOne({
        where: { userId: user.id_Emp, articleId: parent.id },
        attributes: ["id"],
      });
      // If content has uread on DB then is not read
      return !ureadContent;
    },
  },
  Query: {
    async contents(_, args, { user }) {
      // Get the options
      const contents = await contentHelpers.getData(
        args.ids,
        user.id_Emp,
        await hA("content", "can_edit", user.id_Emp)
      );
      return await contents;
    },
  },

  Mutation: {
    /**
     * Update content
     */
    async content(_, { content }, { user }) {
      // Check access
      const privilege = content.id ? "can_edit" : "can_create";
      const access = await hA("content", privilege, user.id_Emp);
      if (!access && content.read === undefined) {
        const log = `Trying to mutate contents without permission (cID: ${content.id}).`;
        createActivityLog(log, user);
        const eMsg = "You are not authorized for this resource.";
        throw new ApolloError(eMsg, "GRANT_ERROR");
      }

      if (typeof content.read === "boolean") {
        await contentHelpers.toggleMarckNews(user.id_Emp, content.id);
        return content.id;
      }

      let response = 0;
      if (content.id === undefined || content.id === 0) {
        content.author_id = user.id_Emp;
        response = await contentHelpers.create(user.id_Emp, content);
        if (!response) {
          throw new ApolloError(
            "Error creating content",
            "SERVER_ERROR_CREATING_CONTENT"
          );
        } else {
          createActivityLog(
            `Content is created (Title: ${content.title}).`,
            user
          );
        }
      } else {
        const updating = await contentHelpers.update(content);
        if (!updating) {
          const error = "Error updating content";
          throw new ApolloError(error, "SERVER_ERROR_UPDATING_CONTENT");
        } else {
          createActivityLog(`Content is updated (id: ${content.id}).`, user);
          response = content.id;
        }
      }

      return response;
    },

    // Delete content
    async deleteContent(_, { ids }, { user }) {
      const operation = await contentHelpers.delete(ids);
      if (!operation) {
        const error = "Error deleteing the content.";
        throw new ApolloError(error, "SERVER_DELETING_CONTENT");
      }
      createActivityLog(`Content is deleted (ids: ${ids.join(", ")}).`, user);
      return true;
    },

    // Increment views on a Content
    async incrementViewsOnContent(_, { id }) {
      const operation = await contentHelpers.incrementViews(id);
      if (!operation) {
        const error = "Error increment views on content.";
        throw new ApolloError(error, "ERROR_VIEWING_CONTENT");
      }
      return true;
    },

    // Upload an image for content
    async uploadImageForContent(_, args, { user }) {
      const { file, id } = args;
      // Check access
      const promises = [
        hA("content", "can_create", user.id_Emp),
        hA("content", "can_edit", user.id_Emp),
      ];
      const [cCreate, cEdit] = await Promise.all(promises);
      if (!cCreate && !cEdit) {
        const error = "You are not authorized for this resource.";
        throw new ApolloError(error, "NOT_AUTHORIZED");
      }

      // What to do with tht image
      const type = args.type || "in-content";

      // Upload the file
      const { mimetype } = await file;

      const today = new Date();
      const mimeType_temp = mimetype.split("/");
      const uploadedFile = await utilsHelpers.uploadFile({
        destination: config.folders.upload_content_image,
        file: file,
        allowedFileMime: ["image/jpeg", "image/jpg", "image/png"],
        savedFileName:
          "content-" +
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
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          "ERROR_UPLOADING_FILE"
        );
      }

      let op = true;
      // Special treatments
      switch (type) {
        // Save the cover image in the post data
        case "cover-image":
          op = await contentHelpers.update({
            id: id,
            featured_image: uploadedFile,
          });
          break;

        default:
          break;
      }

      if (!op) {
        throw new ApolloError(
          i18nHelper.__("SERVER_ERROR"),
          "ERROR_POST_IMAGE_TREATMENT"
        );
      }

      return await utilsHelpers.renderFilePublicUrl(
        uploadedFile,
        config.folders.upload_content_image
      );
    },
  },
};

module.exports = resolvers;
