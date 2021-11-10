module.exports.up = `
    ALTER TABLE [tbl_billing_project_settings]
    ALTER COLUMN [days_without_activity] BIT NULL
    ALTER TABLE [tbl_billing_project_settings]
    ALTER COLUMN [budget_before_first_invoice] BIT NOT NULL
    ALTER TABLE [tbl_billing_project_settings]
    DROP COLUMN [pourcentages_of_budget]
    ALTER TABLE [tbl_billing_project_settings]
    DROP COLUMN [tec_amount]
    ALTER TABLE [tbl_billing_project_settings]
    ADD [budget_vs_tec] INTEGER NOT NULL
    ALTER TABLE [tbl_billing_project_settings]
    ALTER COLUMN [submission_process] INTEGER NOT NULL
    ALTER TABLE [tbl_billing_project_settings]
    ALTER COLUMN [mentor] INTEGER NULL;
`;
