"use strict";

module.exports = (sequelize, DataTypes) => {
  const ChatMessages = sequelize.define(
    "ChatMessages",
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
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.INTEGER(1).UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "tbl_chat_messages",
    }
  );

  // gQL naming
  ChatMessages.gqlNames = ["Messages"];

  ChatMessages.associate = function (models) {
    ChatMessages.belongsTo(models.ChatRoom, {
      foreignKey: "room_id",
      targetKey: "id",
      as: "room",
    });
    ChatMessages.belongsTo(models.tblEmployes, {
      foreignKey: "user_id",
      targetKey: "id_Emp",
      as: "user",
    });
    ChatMessages.hasMany(models.ChatRoomUsersLastReadMessage, {
      as: "unreadMessages",
      foreignKey: "message_id",
    });
  };
  return ChatMessages;
};
