const userHelpers = require("./helpers");
const accessHelpers = require("../access/helpers");
const utilsHelpers = require("../../helpers/utils.helper");
const mailHelper = require("../../helpers/email.helper");
const jsonwebtoken = require("jsonwebtoken");
const { ApolloError } = require("apollo-server-express");
const i18nHelper = require("../../helpers/i18n.helper");
const { ApolloServer } = require("apollo-server-express");
const config = require("../../config");
const { createActivityLog } = require("../core/activity-logs/helpers");

const resolvers = {
  Upload: ApolloServer.GraphQLUpload,

  User: {
    async picture({ picture }) {
      if (picture && picture.indexOf("http") !== 0) {
        return await utilsHelpers.renderProfilePictureUrl(picture);
      }
      return picture;
    },
    async menunNotifications(_, args, { user }) {
      return userHelpers.notifications(user.id_Emp);
    },
    usesAdvancedFilters({ usesAdvancedFilters }) {
      return !!usesAdvancedFilters;
    },
  },

  Query: {
    // fetch the profile of currently authenticated user
    async me(_, args, { user }) {
      return await userHelpers.getUserById(user.id_Emp);
    },
  },

  Mutation: {
    // User signup handler
    // !!! Not tested, not to be useed
    async signup(_, { userName, courriel, pswd }) {
      // ToDo
    },

    // User login handler
    async login(_, { courriel, pswd }) {
      const user = await userHelpers.verifyEmailPassword(courriel, pswd);
      if (!user) {
        createActivityLog(`Failed login attempt (login: ${courriel})`);
        throw new ApolloError("Bad password or login", "BAD_USER_PASSWORD");
      }

      // Get the user if active
      if (!user.actif) {
        createActivityLog(
          `Disabled user (login: ${courriel}) tries to connect`
        );
        throw new ApolloError("User disabled", "USER_DEACTIVATED");
      }

      // Get session duration
      const sessionDuration = await utilsHelpers.getOption("token_life");

      // Generate the Json Web Token
      const tokenPayload = {
        id_Emp: user.id_Emp,
        courriel: user.courriel,
      };
      const tOpts = { expiresIn: sessionDuration };
      const token = jsonwebtoken.sign(tokenPayload, config.jwt_secret, tOpts);

      createActivityLog("New successful login", user);

      return { token, user };
    },

    /**
     * Verify the token and resend a newer one
     */
    async token(_, {}, { user }) {
      // Make sure the token is good
      if (!user || !user.id_Emp) {
        throw new ApolloError("No user is connected", "BAD_TOKEN");
      }

      // Get the user
      user = await userHelpers.getUserById(user.id_Emp);
      if (!user.actif) {
        createActivityLog(
          `Disabled user (login: ${courriel}) tries to connect`
        );
        throw new ApolloError("User disabled", "USER_DEACTIVATED");
      }

      // Get session duration
      const sessionDuration = await utilsHelpers.getOption("token_life");

      // Generate the Json Web Token
      const tokenPayload = {
        id_Emp: user.id_Emp,
        courriel: user.courriel,
      };
      const tOpts = { expiresIn: sessionDuration };
      const token = jsonwebtoken.sign(tokenPayload, config.jwt_secret, tOpts);

      return { token, user };
    },

    // Forget the password handler
    async forgetpassword(_, { courriel }) {
      // Verify email server
      const mailTransporter = await mailHelper.createTransport();
      const verifyEmailService = await mailTransporter.verify();
      if (!verifyEmailService) {
        throw new ApolloError("Mail service is OFF", "MAIL_SERVER_ERROR");
      }

      // ToDo (Security) add an IP and User Agent verification
      let { user, token } = await userHelpers.getForgetPasswordToken(courriel);

      if (!token) {
        // Check if user exists
        throw new ApolloError(i18nHelper.__("NO_USER_FOUND"), "NO_USER_FOUND");
      }

      const url = "auth/reset-password/" + token;
      const resetlink = await utilsHelpers.fromUrl(url);

      // Get the email node modules
      const helperOptions = {
        from: await mailHelper.getNoReplyEmail(),
        to: await userHelpers.getUserEmailAdressWithName(user.id_Emp),
        subject: await mailHelper.renderEmailSubject("PWD_FORGET_SUBJECT"),
        template: "forgetpassword",
        context: {
          name: user.prenom,
          sexe: user.sexe,
          action_url: resetlink,
        },
      };

      mailTransporter.sendMail(helperOptions, (error, info) => {
        if (error) {
          // ToDo log the error and send the email later
          throw new Error(error);
        }
        createActivityLog("Forget password request", user);

        let nodemailer = require("nodemailer");
        console.log(info);
        console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
        return true;
      });

      return true;
    },

    async setForgotPassword(_, { token, newpassword }) {
      // Check if token exists and not used
      const userId = await userHelpers.verifyPasswordToken(token);

      if (!userId) {
        // Check if token exists and not used
        throw new ApolloError(
          i18nHelper.__("RESET_TOKEN_ERROR"),
          "RESET_TOKEN_ERROR"
        );
      }

      // Update the password
      const user = await userHelpers.setNewPassword(newpassword, userId, token);
      if (!user) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      const mailTransporter = await mailHelper.createTransport();

      // If OK, send email
      // Get the email node modules
      const helperOptions = {
        from: await mailHelper.getNoReplyEmail(),
        to: await userHelpers.getUserEmailAdressWithName(user.id_Emp),
        subject: await mailHelper.renderEmailSubject("PWD_RESTED_SUBJECT"),
        template: "resetpassword",
        context: {
          name: user.prenom,
          sexe: user.sexe,
        },
      };

      // Verify email server
      if (!(await mailTransporter.verify())) {
        throw new ApolloError(
          i18nHelper.__("MAIL_SERVER_ERROR"),
          "MAIL_SERVER_ERROR"
        );
      }

      createActivityLog("User set password after forget-request.", user);

      mailTransporter.sendMail(helperOptions, (error, info) => {
        if (error) {
          // ToDo log the error and send the email later
          throw new Error(error);
        }
        let nodemailer = require("nodemailer");
        console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
        return true;
      });

      return true;
    },

    /**
     * Change the user password
     * @param oldpassword String
     * @param newpassword String
     * @param newpassword2 String
     */
    async setNewPassword(
      _,
      { oldpassword, newpassword, newpassword2 },
      { user }
    ) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Check if the two passwords are the same
      if (
        newpassword == "" ||
        newpassword != newpassword2 ||
        newpassword == oldpassword
      ) {
        throw new ApolloError(
          i18nHelper.__("PASSWORDS_NOT_OK"),
          "PASSWORDS_NOT_OK"
        );
      }

      // Get the employee by the token email
      if (
        !(await userHelpers.verifyEmailPassword(user.courriel, oldpassword))
      ) {
        throw new ApolloError(
          i18nHelper.__("OLD_PASSWORD_NOT_OK"),
          "OLD_PASSWORD_NOT_OK"
        );
      }

      // Update the password
      user = await userHelpers.setNewPassword(newpassword, user.id_Emp);
      if (!user) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      createActivityLog("User changed his password", user);

      const fromEmail = await mailHelper.getNoReplyEmail();
      const mailTransporter = await mailHelper.createTransport();

      // If OK, send email
      // Get the email node modules
      const helperOptions = {
        from: fromEmail,
        to: await userHelpers.getUserEmailAdressWithName(0, user),
        subject: await mailHelper.renderEmailSubject("PWD_RESTED_SUBJECT"),
        template: "resetpassword",
        context: {
          name: user.prenom,
          sexe: user.sexe,
        },
      };

      const r = mailTransporter.verify((error, success) => {
        if (error) {
          throw new Error(error);
        } else {
          mailTransporter.sendMail(helperOptions, (error, info) => {
            if (error) {
              throw new Error(error);
            }
            let nodemailer = require("nodemailer");
            console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
            return info.response;
          });
          return true;
        }
      });
      return true;
    },

    // Update my user
    async updateMyUser(_, { data }, { user }) {
      const userId = parseInt(user.id_Emp);
      delete data.id_Emp;

      // Update the profile
      try {
        return await userHelpers.update(data, userId);
      } catch (error) {
        console.error(error);
        throw new ApolloError(error);
      }
    },

    /**
     * Change the user group
     * @param integer groupId
     */
    async setUserGroup(_, { groupId }, { user }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Check access
      const access = await userHelpers.hasAccess(
        "users",
        "can_edit",
        user.id_Emp
      );
      if (!access) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      // Get the employee by the token email
      if (!(await userHelpers.changeGroup(groupId, user.id_Emp))) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      return true;
    },

    /**
     * Activate the user
     * TODO correct, this function is not getting user to activate/desactivate
     */
    async activateDeactivateUser(_, {}, { user }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Check access
      const access = await userHelpers.hasAccess(
        "users",
        "can_edit",
        user.id_Emp
      );
      if (!access) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      // Get the employee by the token email
      if (!(await userHelpers.activateDeactivate(user.id_Emp))) {
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      return true;
    },

    /**
     * Activate the user
     */
    async abulkActivateDeactivateUser(_, { ids, state }, { user }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Check access
      const access = await userHelpers.hasAccess(
        "users",
        "can_edit",
        user.id_Emp
      );
      if (!access) {
        throw new ApolloError(i18nHelper.__("GRANT_ERROR"), "GRANT_ERROR");
      }

      return await userHelpers.bulkActivateDeactivate(ids, state);
    },

    /**
     * Check access
     */
    async userHasAccess(_, { accessSlug }, { user }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Get the employee by the token email
      if (!(await userHelpers.hasAccess(accessSlug, user.id_Emp))) {
        return false;
      }

      return true;
    },

    async setProfilePicture(_, { file }, { user }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      // Upload the file
      const { mimetype } = await file;
      const today = new Date();
      const mimeType_temp = mimetype.split("/");
      const newProfilePicture = await utilsHelpers.uploadFile({
        destination: config.folders.upload_user,
        file: file,
        allowedFileMime: ["image/jpeg", "image/jpg", "image/png"],
        savedFileName:
          "" +
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

      if (!newProfilePicture) {
        console.error("[OriginServer] Error saving the file.");
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      // Update the DB
      const picutreUrl = await userHelpers.setProfilePicture(
        user.id_Emp,
        newProfilePicture
      );
      if (!picutreUrl) {
        console.error("[OriginServer] Error updating the profile in DB.");
        throw new ApolloError(i18nHelper.__("SERVER_ERROR"), "SERVER_ERROR");
      }

      return picutreUrl;
    },
  },
};

module.exports = resolvers;
