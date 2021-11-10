"use strict";

module.exports = (sequelize, DataTypes) => {
  const Access = sequelize.define(
    "Access",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      accessName: DataTypes.STRING,
      slug: DataTypes.STRING,
      pageFlag: DataTypes.BOOLEAN,
      allow_view: DataTypes.BOOLEAN,
      allow_view_own: DataTypes.BOOLEAN,
      allow_edit: DataTypes.BOOLEAN,
      allow_create: DataTypes.BOOLEAN,
      allow_delete: DataTypes.BOOLEAN,
    },
    {
      freezeTableName: true,
      tableName: "tblAccess",
    }
  );

  Access.associate = function (models) {
    models.Access.belongsToMany(models.tblEmployes_Niveaux, {
      through: {
        model: models.accessValue,
      },
      as: "aValue",
      foreignKey: "accessId",
    });
  };

  return Access;
};
