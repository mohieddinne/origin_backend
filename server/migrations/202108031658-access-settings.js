module.exports.up = `
INSERT INTO
  tblAccess (
      [accessName]
      ,[slug]
      ,[createdAt]
      ,[updatedAt]
      ,[pageFlag]
      ,[allow_view]
      ,[allow_view_own]
      ,[allow_edit]
      ,[allow_create]
      ,[allow_delete]
  )
VALUES
  (
    'paramètres-globaux',
    'invoice-default-setting',
     GETDATE(),
     GETDATE(),
    1,
    1,
    1,
    1,
    1,
    1
  )
  
`;
