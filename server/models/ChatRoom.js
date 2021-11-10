"use strict";

module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define(
    "ChatRoom",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "tbl_chat_rooms",
    }
  );
  ChatRoom.associate = function (models) {
    ChatRoom.belongsToMany(models.tblEmployes, {
      through: {
        unique: false,
        as: "chatRoomUsers",
        model: models.ChatRoomUsers,
      },
      as: "users",
      foreignKey: "room_id",
    });
    ChatRoom.hasMany(models.ChatRoomUsers, {
      as: "ChatRoomUsers_",
      foreignKey: "room_id",
    });
    ChatRoom.hasMany(models.ChatMessages, {
      as: "messages",
      foreignKey: "room_id",
    });
    ChatRoom.hasMany(models.ChatRoomUsersLastReadMessage, {
      as: "unreadMessages",
      foreignKey: "room_id",
    });
  };
  return ChatRoom;
};
