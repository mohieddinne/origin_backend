"use strict";

module.exports = (sequelize, DataTypes) => {
  const DBVersion = sequelize.define(
    "DBVersion",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      version: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: null,
      },
      executedAt: {
        field: "executed_at",
        type: DataTypes.DATE,
        allowNull: false,
        // if to MySQL, change to sequelize.fn("NOW"),
        defaultValue: sequelize.fn("GETDATE"),
      },
    },
    {
      tableName: "tbl_db_version",
      timestamps: false,
    }
  );
  return DBVersion;
};
