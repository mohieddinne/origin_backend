module.exports.up = `
    IF OBJECT_ID('[tbl_project_invoice_confirmation]', 'U') IS NULL CREATE TABLE [tbl_project_invoice_confirmation] (
        [id] INTEGER NOT NULL IDENTITY(1, 1),
        [invoice_id] NVARCHAR(15) NOT NULL,
        [employee_id] INTEGER NOT NULL,
        [createdAt] DATETIMEOFFSET NOT NULL,
        [updatedAt] DATETIMEOFFSET NOT NULL,
        PRIMARY KEY ([id])
    );
`;
