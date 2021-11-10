// WidgetBillableHours

export const activityDetailsQuery = (user) => `
    DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
    SET
        @dateAu = GETDATE()
    SET
        @Id_Empl = ${user}
    SELECT
        a.id as id,
        d.NumeroDossier as folderId,
        d.Responsable as responsible,
        e.NomEmploye as employeeName,
        YEAR(a.DateActivite) AS yearAct,
        a.DateActivite as date,
        CONCAT(a.Categorie, ' - ', a.Activite) AS activiteType,
        ROUND(
            IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures),
            2
        ) AS nbrOfBillableHours,
        a.FactureAffecte AS projectInvoice
    FROM
        tblActivites AS a
        INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
        INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
        INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
    WHERE
        (
            (
                d.ID_Emp_Responsable = @Id_Empl
                AND a.ID_Emp = @Id_Empl
            )
            OR (
                d.ID_Emp_Responsable = @Id_Empl
                AND a.Id_Emp <> @Id_Empl
            )
        )
        AND (
            a.FactureAffecte IS NULL
            OR a.FactureAffecte LIKE 'Projet%'
            OR a.FactureAffecte = ''
        )
        AND (
            ta.NonFacturable = 0
            OR ta.Activite LIKE 'DV%'
            OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
            OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
        )
        AND a.NumeroDossier NOT LIKE '00%'
        AND CAST(a.DateActivite AS DATE) <= @dateAu
    ORDER BY
        a.DateActivite,
        d.NumeroDossier,
        e.NomEmploye,
        a.Categorie,
        a.Activite,
    IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures);`;

export const totalPerYearQuery = (user, type) => {
  let whereUser = "d.ID_Emp_Responsable = @Id_Empl";
  if (type === 1) {
    whereUser = "a.ID_Emp = @Id_Empl";
  }
  return `
  DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
    SET
        @dateAu = GETDATE()
    SET
        @Id_Empl = ${user}
    SELECT
        ROUND(
            SUM(IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)),
            2
        ) AS numberOfBillableHours,
        IIF(
            DATEPART(month, CAST(a.DateActivite AS DATE)) >= 1
            AND DATEPART(month, CAST(a.DateActivite AS DATE)) <= 9,
            /*Entre Janvier et  septembre*/
            CONCAT(
                YEAR(DATEADD(YEAR, -1, CAST(a.DateActivite AS DATE))),
                '-',
                YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE)))
            ),
            /*Entre Octobre er Decembre*/
            CONCAT(
                YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE))),
                '-',
                YEAR(DATEADD(YEAR, 1, CAST(a.DateActivite AS DATE)))
            )
        ) AS date
    FROM
        tblActivites AS a
        INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
        INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
        INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
    WHERE
        ${whereUser}
        AND (
            a.FactureAffecte IS NULL
            OR a.FactureAffecte LIKE 'Projet%'
            OR a.FactureAffecte = ''
        )
        AND (
            ta.NonFacturable = 0
            OR ta.Activite LIKE 'DV%'
            OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
            OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
        )
        AND a.NumeroDossier NOT LIKE '00%'
        AND CAST(a.DateActivite AS DATE) <= @dateAu
    GROUP BY
        IIF(
            DATEPART(month, CAST(a.DateActivite AS DATE)) >= 1
            AND DATEPART(month, CAST(a.DateActivite AS DATE)) <= 9,
            /*Entre Janvier et  septembre*/
            CONCAT(
                YEAR(DATEADD(YEAR, -1, CAST(a.DateActivite AS DATE))),
                '-',
                YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE)))
            ),
            /*Entre Octobre er Decembre*/
            CONCAT(
                YEAR(DATEADD(YEAR, 0, CAST(a.DateActivite AS DATE))),
                '-',
                YEAR(DATEADD(YEAR, 1, CAST(a.DateActivite AS DATE)))
            )
      );`;
};
export const graphQuery = (user) => ` 
    DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
    SET
        @dateAu = GETDATE()
    SET
        @Id_Empl = ${user}
    SELECT
        a.DateActivite as date,
        ROUND(
            SUM(IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)),
            2
        ) AS numberOfBillableHours
    FROM
        tblActivites AS a
        INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
        INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
        INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
    WHERE
        (
            (
                d.ID_Emp_Responsable = @Id_Empl
                AND a.ID_Emp = @Id_Empl
            )
            OR (
                d.ID_Emp_Responsable = @Id_Empl
                AND a.Id_Emp <> @Id_Empl
            )
        )
        AND (
            a.FactureAffecte IS NULL
            OR a.FactureAffecte LIKE 'Projet%'
            OR a.FactureAffecte = ''
        )
        AND (
            ta.NonFacturable = 0
            OR ta.Activite LIKE 'DV%'
            OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
            OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
        )
        AND a.NumeroDossier NOT LIKE '00%'
        AND CAST(a.DateActivite AS DATE) <= @dateAu
        AND d.DateFerme IS NULL 
    GROUP BY
    a.DateActivite`;
