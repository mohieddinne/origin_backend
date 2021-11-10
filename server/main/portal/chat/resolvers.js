const hlprs = require("./helpers");
const { requestedFields } = require("../../../helpers/graphql.helper");
const { ApolloError, withFilter } = require("apollo-server-express");
const { sequelize } = require("../../../models");
const userIds = [1, 2, 3];

const resolvers = {
  ChatRoom: {
    async unreadMessages(parent, args, { user }, information) {
      if (!parent.id || !user) {
        return 0;
      }
      const attributes = requestedFields(information);
      return hlprs.usersUnreadMessages(parent.id, user.id_Emp, { attributes });
    },
  },
  Query: {
    async chatMessages(_, { room }, { user }, information) {
      const attributes = requestedFields(information);
      return hlprs.messages(parseInt(room), user.id_Emp, {
        attributes,
      });
    },
    async chatRooms(_, args, { user }, information) {
      const attributes = requestedFields(information);
      return hlprs.rooms(user.id_Emp, { attributes });
    },
    async chatContacts(_, args, { user }, information) {
      const attributes = requestedFields(information);
      return hlprs.contacts({ userId: user.id_Emp, attributes });
    },
  },
  Mutation: {
    async marckMessage(_, { roomId }, { user }, info) {
      return hlprs.toggleMarckMessage(roomId, user.id_Emp);
    },
    async createChatRoom(_, args, { user }) {
      const { name } = args;
      // Get the room users and add the connected user if not in the room
      const usersId = args.usersId.map((item) => parseInt(item));
      const userInRoom = usersId.find((userId) => userId === user.id_Emp);
      if (!userInRoom) usersId.push(user.id_Emp);
      // Handle
      try {
        const roomId = await hlprs.createChatRoom(usersId, name, {
          by: user.id_Emp,
        });

        hlprs
          .getRoom(roomId)
          .then((chatRoom) => {
            pubsub.publish("NEW_CHATROOM", { chatRoom, creator: user.id_Emp });
          })
          .catch((error) => console.error(error));

        return roomId;
      } catch (error) {
        Sentry.captureException(error);
        throw new ApolloError(
          "Error creating the chat room.",
          "ERROR_CREATING_CHATROOM",
          error
        );
      }
    },
    async leaveChatRoom(_, args, { user }) {
      const { id } = args;
      const isInTheRoom = await hlprs.userIsInRoomn(user.id_Emp, id);
      if (!isInTheRoom) {
        throw new ApolloError(
          "User is not a member in the room",
          "USER_NOT_IN_CHATROOM"
        );
      }
      // Handle
      try {
        return hlprs.leaveChatRoom(user.id_Emp, id);
      } catch (error) {
        Sentry.captureException(error);
        throw new ApolloError(
          "Error leaving the chat room.",
          "ERROR_LEAVING_CHATROOM",
          error
        );
      }
    },
    async inviteUserToJoinChatRoom(_, args, { user }) {
      const { roomId, usersId } = args;
      const isInTheRoom = await hlprs.userIsInRoomn(usersId, id);
      if (isInTheRoom) {
        throw new ApolloError(
          "User is a member in the room",
          "USER_IN_CHATROOM"
        );
      }
      // Handle
      try {
        return hlprs.joinChatRoom([usersId], roomId, {
          by: user.id_Emp,
        });
      } catch (error) {
        Sentry.captureException(error);
        throw new ApolloError(
          "Error joining the chat room.",
          "ERROR_JOINING_CHATROOM",
          error
        );
      }
    },
    async postMessageInNewRoom(_, args, { user }) {
      const { content, name } = args;
      // Get the room users and add the connected user if not in the room
      const usersId = args.usersId.map((item) => parseInt(item));
      const userInRoom = usersId.find((userId) => userId === user.id_Emp);
      if (!userInRoom) usersId.push(user.id_Emp);
      // Handle
      const trx = await sequelize.transaction();
      try {
        const roomId = await hlprs.createChatRoom(usersId, name, {
          by: user.id_Emp,
        });
        await hlprs.postMessage(roomId, user.id_Emp, content);
        await trx.commit();
      } catch (error) {
        await trx.rollback();
        console.log(error);
        Sentry.captureException(error);
        throw new ApolloError(
          "Error posting or creating a chat room.",
          "ERROR_CREATING_POSTING_CHATROOM",
          error
        );
      }

      hlprs
        .getRoom(roomId)
        .then((chatRoom) => {
          pubsub.publish("NEW_CHATROOM", { chatRoom, creator: user.id_Emp });
        })
        .catch((error) => console.error(error));

      return roomId;
    },
    async postMessage(_, args, { user, pubsub }) {
      const { content } = args;
      const roomId = parseInt(args.roomId);
      // Check if user is in the room
      const isInTheRoom = await hlprs.userIsInRoomn(user.id_Emp, roomId);
      if (!isInTheRoom) {
        throw new ApolloError(
          "User is not a member in the room",
          "USER_NOT_IN_CHATROOM"
        );
      }
      // Post the message
      try {
        const message = await hlprs.postMessage(roomId, user.id_Emp, content);
        const chatMessage = await hlprs.getMessage(message.id);
        await pubsub.publish("NEW_CHATMESSAGE", { chatMessage });
        hlprs.toggleMarckMessage(roomId, user.id_Emp, message.id);
        return roomId;
      } catch (error) {
        Sentry.captureException(error);
        throw new ApolloError(
          "Error posting a message to chat room.",
          "ERROR_POSTING_CHATMESSAGE",
          error
        );
      }
    },
  },
  Subscription: {
    chatRoom: {
      subscribe: withFilter(
        (_, args, { pubsub }) => {
          return pubsub.asyncIterator("NEW_CHATROOM");
        },
        async ({ chatRoom, creator }, args, { user }) => {
          try {
            if (creator == user.id_Emp) return false;
            return !!chatRoom.users.find((member) => {
              return member.id_Emp == user.id_Emp;
            });
          } catch (error) {
            console.error(error);
            Sentry.captureException(error);
            return false;
          }
        }
      ),
    },
    chatMessage: {
      subscribe: withFilter(
        (_, args, { pubsub }) => {
          return pubsub.asyncIterator("NEW_CHATMESSAGE");
        },
        async ({ chatMessage }, args, { user }) => {
          try {
            // If the author is the connected user do not notify
            // if (chatMessage.userId == user.id_Emp) return false;
            // If the user in the room notify
            return await hlprs.userIsInRoomn(user.id_Emp, chatMessage.roomId);
          } catch (error) {
            console.error(error);
            Sentry.captureException(error);
            return false;
          }
        }
      ),
    },
  },
};

module.exports = resolvers;
