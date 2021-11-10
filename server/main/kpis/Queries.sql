SELECT
  [D].[TypeDePerte],
  [D].[Bureau],
  COUNT([D].[NumeroDossier]) as [number]
FROM
  [tblDossier] as D
  INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
  INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
WHERE
  -- Dates start
  [D].[DateMandat] >= '2018-10-01 00:00:00.000' -- Dates end
  AND [D].[DateMandat] <= '2019-09-30 23:59:59.999' --- Groups
  AND (
    [C].[NomClient] LIKE '%Promutuel%' -- Promutuel
    OR [C].[NomClient] LIKE '%Desjardins%'
    OR [C].[NomClient] LIKE '%La Personnelle%' -- Desjardins
    OR [C].[NomClient] LIKE '%Bélair%'
    OR NOT (
      [C].[NomClient] LIKE '%Bélair%'
      OR [C].[NomClient] LIKE '%Desjardins%'
      OR [C].[NomClient] LIKE '%La Personnelle%'
      OR [C].[NomClient] LIKE '%Promutuel%'
    )
  ) -- Clients
  AND [C].[NumeroClient] NOT IN (0) -- place the ids and remove the NOT
  -- Type de dossier
  AND [D].[TypeDePerte] NOT IN ('kharrat') -- place the types and remove the NOT
  -- Offices
  AND [D].[Bureau] IN ('Montréal', 'QC') -- Employee
  AND [D].[Responsable] IN ('Catherine Dicaire')
GROUP BY
  [D].[TypeDePerte],
  [D].[Bureau]
ORDER BY
  [D].[TypeDePerte];

----
SELECT
  [D].[TypeDePerte],
  [D].[Bureau],
  COUNT([D].[NumeroDossier]) as [number]
FROM
  [tblDossier] as D
WHERE
  CAST([D].[DateMandat] as DATE) >= '2018-10-01 00:00:00.000' -- Dates start
  AND CAST([D].[DateMandat] as DATE) <= '2019-09-30 23:59:59.999' -- Dates end
  --- Groups & Clients
  AND [D].[NumeroDossier] IN (
    SELECT
      DISTINCT [DC].[NumeroDossier]
    FROM
      [tblDossierAClient] AS DC
      INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
    WHERE
      --- Groups
      [C].[NomClient] LIKE '%Promutuel%' -- Promutuel
      OR [C].[NomClient] LIKE '%Desjardins%'
      OR [C].[NomClient] LIKE '%La Personnelle%' -- Desjardins
      OR [C].[NomClient] LIKE '%Bélair%'
      OR NOT (
        [C].[NomClient] LIKE '%Bélair%'
        OR [C].[NomClient] LIKE '%Desjardins%'
        OR [C].[NomClient] LIKE '%La Personnelle%'
        OR [C].[NomClient] LIKE '%Promutuel%'
      ) -- Clients
      AND [C].[NumeroClient] NOT IN (0) -- place the ids and remove the NOT
  ) -- Type de dossier
  AND [D].[TypeDePerte] NOT IN ('kharrat') -- place the types and remove the NOT
  -- Offices
  AND [D].[Bureau] IN ('Montréal', 'QC') -- Employee
  AND [D].[Responsable] IN ('Catherine Dicaire')
GROUP BY
  [D].[TypeDePerte],
  [D].[Bureau]
ORDER BY
  [D].[TypeDePerte];

----
