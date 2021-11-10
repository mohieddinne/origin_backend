module.exports.up = `
    ALTER TABLE [tbl_billing_project_settings]
    ALTER COLUMN [project_id] NVARCHAR(15) NULL
    ALTER TABLE [tbl_billing_project_settings]
    ADD [customer_id] NVARCHAR(15) NULL
    ALTER TABLE [tbl_billing_project_settings]
    ADD [is_default] bit DEFAULT 0
`;
