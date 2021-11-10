module.exports.up = `IF OBJECT_ID('[tbl_chat_rooms_users_last_read_messages]', 'U') IS NULL CREATE TABLE [tbl_chat_rooms_users_last_read_messages] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [room_id] INTEGER NULL,
    [user_id] INTEGER NULL,
    [message_id] INTEGER NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id]),
    FOREIGN KEY ([room_id]) REFERENCES [tbl_chat_rooms] ([id]) ON DELETE CASCADE,
    FOREIGN KEY ([message_id]) REFERENCES [tbl_chat_messages] ([id]) ON DELETE CASCADE
);`;

// Query for down grade
module.exports.down = "";
