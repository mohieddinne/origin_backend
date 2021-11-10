// Query for upgrade
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
    'Tableau de bord',
    'dashboard',
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
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    2,
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    3,
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    4,
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    5,
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  ),
  (
    6,
    ( SELECT MAX([id]) FROM [tblAccess]),
    0,
    1,
    0,
    0,
    0,
    0
  );
`;

// Query for down grade
module.exports.down = "";
