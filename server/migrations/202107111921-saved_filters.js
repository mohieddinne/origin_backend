module.exports.up = `
	IF OBJECT_ID('[tbl_saved_filters]', 'U') IS NULL CREATE TABLE [tbl_saved_filters] (
		[id] INTEGER NOT NULL IDENTITY(1, 1),
		[name] NVARCHAR(100) NOT NULL,
		[view] NVARCHAR(80) NOT NULL,
		[user_id] INTEGER NOT NULL,
		[data] text NOT NULL,
		[createdAt] DATETIMEOFFSET NOT NULL,
		[updatedAt] DATETIMEOFFSET NOT NULL,
		PRIMARY KEY ([id])
	);
`;

// Query for down grade
module.exports.down = "";
