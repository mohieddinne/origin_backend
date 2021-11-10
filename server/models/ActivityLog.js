"use strict";

module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    "ActivityLog",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "tbl_activity_log",
    }
  );
  ActivityLog.associate = function (models) {
    ActivityLog.belongsTo(models.tblEmployes, {
      foreignKey: "userId",
      targetKey: "NomEmploye",
      as: "author",
    });
  };
  return ActivityLog;
};
