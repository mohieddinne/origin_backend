module.exports.up = `
	IF NOT COL_LENGTH('tblEmployes', 'uses_avanced_filters') IS NOT NULL
	BEGIN
		ALTER TABLE [tblEmployes] ADD [uses_avanced_filters] BIT NULL DEFAULT 0;
	END
`;
