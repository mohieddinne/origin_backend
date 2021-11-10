DECLARE @responsable NVARCHAR(250) = '${employee.NomEmploye}';

WITH DD AS (
  SELECT
    [D].[NumeroDossier],
    [D].[Responsable],
    MIN([D].[DateMandat]) DateMandat,
    MIN(
      CASE
        WHEN [A].[Activite] LIKE '%Examen%' THEN [A].[DateActivite]
      END
    ) DateExamain,
    MIN(
      CASE
        WHEN [A].[Activite] LIKE '%Rédaction%' THEN [A].[DateActivite]
      END
    ) DateRedaction,
    MIN(
      CASE
        WHEN [A].[Activite] LIKE '%Révision%' THEN [A].[DateActivite]
      END
    ) DateRevision,
    MIN([F].[DateFacturation]) DateFacturation
  FROM
    [tblDossier] AS D
    LEFT JOIN [tblActivites] as A ON [D].[NumeroDossier] = [A].[NumeroDossier]
    LEFT JOIN [tblFactures] as F ON [D].[NumeroDossier] = [F].[NumeroDossier]
  WHERE
    [D].[Responsable] = @responsable
  GROUP BY
    [D].[NumeroDossier],
    [D].[Responsable]
)
SELECT
  [DD].[NumeroDossier],
  [DD].[Responsable],
  DATEDIFF(day, [DD].[DateMandat], [DD].[DateExamain]) as DelaiExamen,
  DATEDIFF(day, [DD].[DateExamain], [DD].[DateRedaction]) as DelaiRedaction,
  DATEDIFF(
    day,
    [DD].[DateRedaction],
    [DD].[DateFacturation]
  ) as DelaiFacturation
FROM
  [DD];


DECLARE @responsable NVARCHAR(250) = '${employee.NomEmploye}';

SELECT
  [D].[NumeroDossier],
  [D].[Responsable],
  MIN([D].[DateMandat]) DateMandat,
  MIN(
    CASE
      WHEN [A].[Activite] LIKE '%Examen%' THEN [A].[DateActivite]
    END
  ) DateExamain,
  MIN(
    CASE
      WHEN [A].[Activite] LIKE '%Rédaction%' THEN [A].[DateActivite]
    END
  ) DateRedaction,
  MIN(
    CASE
      WHEN [A].[Activite] LIKE '%Révision%' THEN [A].[DateActivite]
    END
  ) DateRevision,
  MIN([F].[DateFacturation]) DateFacturation
FROM
  [tblDossier] AS D
  LEFT JOIN [tblActivites] as A ON [D].[NumeroDossier] = [A].[NumeroDossier]
  LEFT JOIN [tblFactures] as F ON [D].[NumeroDossier] = [F].[NumeroDossier]
WHERE
  [D].[Responsable] = @responsable
GROUP BY
  [D].[NumeroDossier],
  [D].[Responsable];