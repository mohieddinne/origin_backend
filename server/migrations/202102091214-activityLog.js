module.exports.up = `
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
	(
		'Journal d''activité',
		'activity-log',
		0,
		1,
		0,
		0,
		0,
		0
	);
	INSERT INTO
	[tblAccessValues] (
		[levelId],
		[accessId],
		[value],
		[can_view],
		[can_view_own],
		[can_edit],
		[can_create],
		[can_delete]
	)
	VALUES
	(
		1,
		(
			SELECT
				MAX("id")
			FROM
				"tblAccess"
		),
		0,
		1,
		0,
		0,
		0,
		0
	)
`;
