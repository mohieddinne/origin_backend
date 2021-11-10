// Query for upgrade
module.exports.up = `
  BEGIN IF NOT EXISTS (
    SELECT
      [slug]
    FROM
      [tblAccess]
    WHERE
      slug = 'chat'
  ) BEGIN
    INSERT INTO
      [tblAccess] (
        [accessName],
        [slug],
        [pageFlag],
        [allow_view],
        [allow_view_own],
        [allow_edit],
        [allow_create],
        [allow_delete]
      )
    VALUES
      ('Chat', 'chat', 0, 1, 0, 0, 0, 0)
  END
  END;

  

  DECLARE @accessID AS INT
  SET @accessID = (SELECT MAX([id]) FROM [tblAccess])

  INSERT INTO
    [tblAccessValues] ([levelId], [accessId], [value], [can_view], [can_view_own], [can_edit], [can_create], [can_delete])
  VALUES
    (1, @accessID, 0, 1, 0, 0, 0, 0),
    (2, @accessID, 0, 1, 0, 0, 0, 0),
    (3, @accessID, 0, 1, 0, 0, 0, 0),
    (4, @accessID, 0, 1, 0, 0, 0, 0),
    (5, @accessID, 0, 1, 0, 0, 0, 0);

  IF OBJECT_ID('[tbl_chat_rooms]', 'U') IS NULL CREATE TABLE [tbl_chat_rooms] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [name] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id])
  );
  
  EXEC sys.sp_helpindex @objname = N'[tbl_chat_rooms]';

  IF OBJECT_ID('[tbl_chat_messages]', 'U') IS NULL CREATE TABLE [tbl_chat_messages] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [room_id] INTEGER NULL,
    [user_id] INTEGER NULL,
    [content] NVARCHAR(255) NOT NULL,
    [type] INTEGER DEFAULT NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id]),
    FOREIGN KEY ([room_id]) REFERENCES [tbl_chat_rooms] ([id]) ON DELETE SET NULL
  );

  EXEC sys.sp_helpindex @objname = N'[tbl_chat_messages]';

  IF OBJECT_ID('[tbl_chat_rooms_users]', 'U') IS NULL CREATE TABLE [tbl_chat_rooms_users] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [room_id] INTEGER NULL,
    [user_id] INTEGER NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id]),
    FOREIGN KEY ([room_id]) REFERENCES [tbl_chat_rooms] ([id]) ON DELETE CASCADE
  );
  
  EXEC sys.sp_helpindex @objname = N'[tbl_chat_rooms_users]';

  INSERT INTO
    [tbl_chat_rooms] ([name], [createdAt], [updatedAt])
  VALUES
    ('Discussion Origin', GETDATE(), GETDATE());

  INSERT INTO
    [tbl_chat_rooms_users] ([room_id], [user_id], [createdAt], [updatedAt])
  SELECT 
    (SELECT [id] FROM [tbl_chat_rooms] WHERE [name] = 'Discussion Origin'),
    [id_Emp],
    GETDATE(),
    GETDATE()
  FROM [tblEmployes]
  WHERE [tblEmployes].[Actif] = 1 AND [tblEmployes].[Individu] = 1;



`;

// Query for down grade
module.exports.down = "";
