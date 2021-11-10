"use strict";

module.exports = (sequelize, DataTypes) => {
  const ChatRoomUsers = sequelize.define(
    "ChatRoomUsers",
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
    },
    {
      tableName: "tbl_chat_rooms_users",
    }
  );

  ChatRoomUsers.associate = function (models) {
    ChatRoomUsers.belongsTo(models.ChatRoom, {
      foreignKey: "room_id",
      targetKey: "id",
      as: "room",
    });
    ChatRoomUsers.belongsTo(models.tblEmployes, {
      foreignKey: "user_id",
      targetKey: "id_Emp",
      as: "user",
    });
  };

  return ChatRoomUsers;
};
