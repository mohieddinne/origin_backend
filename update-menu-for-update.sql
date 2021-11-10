DELETE FROM
  [tblAccess]
WHERE
  [pageFlag] = 1
  OR [slug] IN ('allierh');

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 0,
  [allow_edit] = 1,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'permissions';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 0,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'users';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 0,
  [allow_edit] = 1,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'config';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'content';

UPDATE
  [tblAccess]
SET
  [allow_view] = 0,
  [allow_view_own] = 0,
  [allow_edit] = 1,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'platform-admin';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 0,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'kpis';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'clients';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'invoices';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'folders';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 0,
  [allow_edit] = 1,
  [allow_create] = 1,
  [allow_delete] = 1,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'clients_group';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 0,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'reports-tec';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 1,
  [allow_edit] = 0,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'dashboard';

UPDATE
  [tblAccess]
SET
  [allow_view] = 1,
  [allow_view_own] = 0,
  [allow_edit] = 0,
  [allow_create] = 0,
  [allow_delete] = 0,
  [updatedAt] = GETDATE()
WHERE
  [slug] = 'activity-log';

UPDATE
  [tblMenuItems]
SET
  [accessId] = null,
  [updatedAt] = GETDATE();