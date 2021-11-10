const db = require("../../../models");
const gQlHelpers = require("../../../helpers/graphql.helper");
const utilsHelpers = require("../../../helpers/utils.helper");
const { Op } = require("sequelize");

const {
  ChatMessages,
  ChatRoom,
  ChatRoomUsers,
  ChatRoomUsersLastReadMessage,
  tblEmployes,
} = db;

module.exports.messages = async function (roomId, userId, options) {
  if (!roomId || !userId) {
    throw new Error("Required attributes: roomId, userId");
  }

  // Handle main attributes
  const attributes = new Set();
  let include = [];
  const tblRawAttrs = ChatMessages.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
    // Handle includes
    include = gQlHelpers.getIncludesFields(options.attributes, null, true);
  }

  // Check if the user is in the room
  include.push({
    model: ChatRoom,
    as: "room",
    attributes: ["id"],
    required: true,
    include: {
      model: db.tblEmployes,
      attributes: ["id_Emp"],
      as: "users",
      required: true,
      through: {
        required: true,
        model: ChatRoomUsers,
        attributes: ["id"],
        where: { userId },
      },
    },
  });

  return await ChatMessages.findAll({
    attributes: Array.from(attributes),
    include,
    where: {
      roomId,
    },
  });
};

module.exports.getMessage = async function (id) {
  if (!id) throw new Error("Required attributes: id");

  return ChatMessages.findOne({
    include: [
      {
        model: db.tblEmployes,
        as: "user",
      },
      {
        model: db.ChatRoom,
        as: "room",
      },
    ],
    where: { id },
  });
};

module.exports.rooms = async function (userId, options) {
  if (!userId) {
    throw new Error("Required attribute: userId");
  }

  // Handle main attributes
  const attributes = new Set();
  let include = [];
  const tblRawAttrs = ChatRoom.rawAttributes;
  attributes.add("id");
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
    // Handle includes
    include = gQlHelpers.getIncludesFields(options.attributes, null, true);
  }

  // Check if the user is in the room
  include.push({
    model: db.ChatRoomUsers,
    attributes: [],
    required: true,
    as: "ChatRoomUsers_",
    where: { userId },
  });

  return await ChatRoom.findAll({
    attributes: Array.from(attributes),
    include,
  }).then((rooms) => {
    if (options.attributes.lastMessage === null) {
      return rooms.map(async (room) => {
        const message = await ChatMessages.findOne({
          attributes: ["content"],
          order: [["createdAt", "DESC"]],
          where: {
            roomId: room.id,
            type: {
              [Op.or]: {
                [Op.not]: 2,
                [Op.eq]: null,
              },
            },
          },
        });
        room.lastMessage = (message && message.content) || null;
        return room;
      });
    }
    return rooms;
  });
};

module.exports.getRoom = async function (id) {
  if (!id) throw new Error("Required attribute: id");

  return await ChatRoom.findOne({
    where: { id },
    include: [
      {
        model: db.tblEmployes,
        as: "users",
      },
      {
        model: ChatMessages,
        as: "messages",
      },
    ],
  });
};

module.exports.createChatRoom = async function (usersId, roomName, options) {
  if (!Array.isArray(usersId) || usersId.length <= 1) {
    throw new Error("Required 2 or more users to create a room.");
  }
  let name = roomName;
  if (!name) name = "no_name_group";
  const room = await ChatRoom.create({ name });
  if (!room) throw new Error("Error creating a Chat room.");

  await ChatMessages.create({
    roomId: room.id,
    userId: (options && options.by) || usersId[0],
    content: "room_created",
    type: 2,
  });

  await this.joinChatRoom(usersId, room.id, options);

  return room.id;
};

module.exports.postMessage = async function (roomId, userId, content) {
  if (!roomId || !userId || !content)
    throw new Error("Required attributes: roomId, userId, content");

  return await ChatMessages.create({
    roomId,
    userId,
    content,
  });
};

module.exports.userIsInRoomn = async function (userId, roomId) {
  const isInTheRoom = await ChatRoom.findOne({
    attributes: ["id"],
    where: { id: roomId },
    include: {
      model: db.tblEmployes,
      attributes: ["id_Emp"],
      as: "users",
      required: true,
      through: {
        required: true,
        model: ChatRoomUsers,
        attributes: ["id"],
        where: { userId },
      },
    },
  });

  return !!isInTheRoom;
};

module.exports.leaveChatRoom = async function (userId, roomId) {
  return await ChatRoomUsers.destroy({
    where: { userId, roomId },
  })
    .then(() => {
      return ChatMessages.create({
        roomId,
        userId,
        content: "user_left",
        type: 2,
      }).then(() => true);
    })
    .catch((error) => {
      throw error;
    });
};

module.exports.joinChatRoom = async function (usersId, roomId, options) {
  if (!Array.isArray(usersId) || usersId.length < 1) {
    throw new Error("Required 1 or more user(s) to join a room.");
  }
  const data = usersId.map((userId) => ({ roomId, userId }));
  await ChatRoomUsers.bulkCreate(data).then(() => {
    if (options.by) {
      const messages = usersId.map((userId) => ({
        roomId,
        userId: options.by,
        content: `user_invited_${userId}`,
        type: 2,
      }));
      return ChatMessages.bulkCreate(messages);
    }
  });
};

module.exports.contacts = async function (options) {
  // Handle main attributes
  const attributes = new Set();
  const tblRawAttrs = db.tblEmployes.rawAttributes;
  if (options.attributes) {
    for (const field in options.attributes) {
      if (tblRawAttrs[field]) attributes.add(field);
    }
  }

  return db.tblEmployes
    .findAll({
      attributes: Array.from(attributes),
      where: { person: true },
    })
    .then((users) => {
      return users.map(async (user) => {
        user.picture = await utilsHelpers.renderProfilePictureUrl(user.picture);
        return user;
      });
    });
};

module.exports.usersUnreadMessages = async function (roomId, userId, options) {
  const UnreadMessages = await ChatRoomUsersLastReadMessage.findAll({
    attributes: ["messageId"],
    where: { roomId, userId },
  });
  return UnreadMessages.length;
};
module.exports.toggleMarckMessage = async function (roomId, userId, messageId) {
  const messageRead = await ChatRoomUsersLastReadMessage.findAll({
    where: {
      roomId,
      userId,
    },
  });
  if (Array.isArray(messageRead) && messageRead.length > 0 && !messageId)
    await ChatRoomUsersLastReadMessage.destroy({
      where: { roomId, userId },
    });
  // get all subscribed users
  else {
    // TODO Get the users in the room
    const users = await tblEmployes.findAll({ attributes: ["id_Emp"] });
    const promises = users.map((user) => {
      if (userId !== user.id_Emp)
        return ChatRoomUsersLastReadMessage.create({
          roomId,
          userId: user.id_Emp,
          messageId,
        });
    });
    await Promise.all(promises);
  }
  return roomId;
};
