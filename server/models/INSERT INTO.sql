INSERT INTO
    [tbl_billing_project_settings] (
        [days_without_activity],
        [nbr_days_without_activity],
        [tec_amount],
        [max_tec_amount],
        [createdAt],
        [updatedAt]
    ) OUTPUT INSERTED.[id],
    INSERTED.[days_without_activity],
    INSERTED.[nbr_days_without_activity],
    INSERTED.[budget_before_first_invoice],
    INSERTED.[min_budget_before_first_invoice],
    INSERTED.[pourcentages_of_budget],
    INSERTED.[max_pourcentages_of_budget],
    INSERTED.[tec_amount],
    INSERTED.[max_tec_amount],
    INSERTED.[submission_process],
    INSERTED.[is_mentor],
    INSERTED.[mentor],
    INSERTED.[createdAt],
    INSERTED.[updatedAt],
    INSERTED.[tblDossierNumeroDossier]
VALUES
    (@0, @1, @2, @3, @4, @5);