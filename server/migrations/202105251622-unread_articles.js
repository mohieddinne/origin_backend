module.exports.up = `IF OBJECT_ID('[UnreadArticles]', 'U') IS NULL CREATE TABLE [UnreadArticles] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [user_id] INTEGER NULL,
    [article_id] INTEGER NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id])
);`;

// Query for down grade
module.exports.down = "DROP TABLE UnreadArticles";
