module.exports.up = `
IF OBJECT_ID('[tbl_billing_project_settings]', 'U') IS NULL CREATE TABLE [tbl_billing_project_settings] (
    [id] INTEGER NOT NULL IDENTITY(1, 1),
    [days_without_activity] BIT NOT NULL,
    [nbr_days_without_activity] INTEGER NOT NULL,
    [budget_before_first_invoice] BIT NULL,
    [min_budget_before_first_invoice] FLOAT NULL,
    [pourcentages_of_budget] BIT NULL,
    [max_pourcentages_of_budget] NVARCHAR(255) NULL,
    [tec_amount] BIT NULL,
    [max_tec_amount] FLOAT NULL,
    [submission_process] NVARCHAR(255) NULL,
    [is_mentor] BIT NULL,
    [mentor] NVARCHAR(255) NULL,
    [project_id] NVARCHAR(15) NOT NULL,
    [createdAt] DATETIMEOFFSET NOT NULL,
    [updatedAt] DATETIMEOFFSET NOT NULL,
    PRIMARY KEY ([id]),
    FOREIGN KEY ([project_id]) REFERENCES [tblDossier] ([NumeroDossier])
);
`;
