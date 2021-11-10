"use strict";

module.exports = (sequelize, DataTypes) => {
  const SavedFilters = sequelize.define(
    "SavedFilters",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      view: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      userId: {
        field: "user_id",
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "tbl_saved_filters",
    }
  );
  SavedFilters.associate = function (models) {
    SavedFilters.belongsTo(models.tblEmployes, {
      foreignKey: "user_id",
      targetKey: "id_Emp",
      as: "user",
    });
  };
  return SavedFilters;
};
