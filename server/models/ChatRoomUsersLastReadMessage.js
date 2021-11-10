"use strict";

module.exports = (sequelize, DataTypes) => {
  const ChatRoomUsersLastReadMessage = sequelize.define(
    "ChatRoomUsersLastReadMessage",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      roomId: {
        field: "room_id",
        type: DataTypes.INTEGER(11).UNSIGNED,
        allowNull: false,
      },
      userId: {
        field: "user_id",
        type: DataTypes.INTEGER,
      },
      messageId: {
        field: "message_id",
        type: DataTypes.INTEGER(11).UNSIGNED,
      },
    },
    {
      tableName: "tbl_chat_rooms_users_last_read_messages",
    }
  );

  ChatRoomUsersLastReadMessage.associate = function (models) {
    ChatRoomUsersLastReadMessage.belongsTo(models.ChatRoom, {
      foreignKey: "room_id",
      targetKey: "id",
      as: "room",
    });
    ChatRoomUsersLastReadMessage.belongsTo(models.tblEmployes, {
      foreignKey: "user_id",
      targetKey: "id_Emp",
      as: "user",
    });
    ChatRoomUsersLastReadMessage.belongsTo(models.ChatMessages, {
      foreignKey: "message_id",
      targetKey: "id",
      as: "message",
    });
  };

  return ChatRoomUsersLastReadMessage;
};
