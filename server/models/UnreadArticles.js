"use strict";

module.exports = (sequelize, DataTypes) => {
  const UnreadArticle = sequelize.define(
    "UnreadArticle",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        field: "user_id",
        type: DataTypes.INTEGER,
      },
      articleId: {
        field: "article_id",
        type: DataTypes.INTEGER(11).UNSIGNED,
      },
    },
    {
      tableName: "UnreadArticles",
    }
  );

  UnreadArticle.associate = function (models) {};
  return UnreadArticle;
};
