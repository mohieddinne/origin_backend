// Query for upgrade
module.exports.up = `
BEGIN IF NOT EXISTS (
  SELECT
    [slug]
  FROM
    [tblAccess]
  WHERE
    slug = 'clients_group'
) BEGIN
INSERT INTO
  [tblAccess] ([accessName], [slug])
VALUES
  ('Groupes des clients', 'clients_group')
END
END;

UPDATE
  [tblAccess]
SET
  pageFlag = 0;

UPDATE
  [tblAccess]
SET
  pageFlag = 1,
  allow_view = 1,
  allow_view_own = 0,
  allow_edit = 0,
  allow_create = 0,
  allow_delete = 0
WHERE
  slug LIKE 'page-%';

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 1,
  allow_edit = 1,
  allow_create = 1,
  allow_delete = 1
WHERE
  slug IN ('content', 'clients_group');

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 1,
  allow_edit = 1,
  allow_create = 0,
  allow_delete = 0
WHERE
  slug IN ('folders', 'clients');

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 1,
  allow_edit = 0,
  allow_create = 0,
  allow_delete = 0
WHERE
  slug IN ('reports-tec', 'kpis', 'invoices', 'dashboard');

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 0,
  allow_edit = 0,
  allow_create = 0,
  allow_delete = 0
WHERE
  slug IN ('activity-log');

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 0,
  allow_edit = 1,
  allow_create = 0,
  allow_delete = 0
WHERE
  slug IN ('platform-admin');

UPDATE
  [tblAccess]
SET
  allow_view = 1,
  allow_view_own = 0,
  allow_edit = 1,
  allow_create = 1,
  allow_delete = 0
WHERE
  slug IN ('permissions');
`;

// Query for down grade
module.exports.down = "";
