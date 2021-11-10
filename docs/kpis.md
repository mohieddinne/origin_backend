# Indicateurs de performance

Module d’administration permettant à ses utilisateurs de générer des rapports en graphique ou en tableau à partir de la base de données Origin à travers des filtres.
Cette documentation essai d’expliquer les étapes à suivre pour reproduire les résultats affichés sur la plateforme.

## Sommaire

### Indicateurs de performance
  * Système de planche
  * Filtres
    * Groupes de clients
      * Bureau
      * Type de Dossier (ou Type de perte)
      * Clients
      * Date de début et date de fin
      * Responsable
  * Principes de calculs et de requête dynamique
    * Étape à suivre pour chaque composant (widgets)
      * Méthode de calcule
        * Exemple de requête income
          * Exemple de requête number
    * Diagram explicatif
      * Algorithme de génération de requête WHERE des filtres
        * Rôle détaillé
          * Exemple d'exécution
          * Dates
          * Groupes et Clients
  * Calcul par Widget
    * Par types et bureaux 
      * Par groupes
      * Par client
      * Par types
      * Par bureau
      * Délais
      * Meilleures clients
  * Exemple complet
    * Filtres sélectionnée
      * Requête générée

## Système de planche

Pour le module Indicateur de performance, nous avons mis en place un système de planche afin de faciliter la comparaison de donnée. Chaque planche se compose de 3 grandes parties

1. L'élément de contrôle de la planche

2. Les filtres appliqués à la planche

3. Les Widgets qui affiche les données (Charts, Bars, tableaux, etc...)

![Fig1: Explication des planches des indicateurs](https://samo.tekru.net/media/bilel-khelifa/planches-kpis.png)
  
## Filtres

Les filtres sont un ensemble de paramètres permettant à l’utilisateur d’appliquer des conditions à son rapport.
Les données affichées dans les listes (ou Select) des filtres sont les résultats des requêtes suivantes :

### Groupes de clients

La liste des groupes de clients vient de la BD du tableau *[tblClientGroupes]* suite à la requête suivante:

```sql
SELECT [id], [name] FROM [tblClientGroupes] AS [ClientGroups];
```

### Bureau

Exploitant la table *[tblDossier]* pour sélectionner en distincts les bureau des dossiers:

```sql
SELECT DISTINCT [D].[Bureau] as [value] FROM [tblDossier] as D ORDER BY [value];
```

### Type de Dossier *(ou Type de perte)*

Exploitant la table *[tblDossier]* pour sélectionner en distincts les types des dossiers:

```sql
SELECT DISTINCT [D].[TypeDePerte] as [value] FROM [tblDossier] as D ORDER BY [value];
```

### Clients

Exploitant la table *[tblClient]* pour sélectionner en distincts les clients:

```sql
SELECT DISTINCT [D].[NomClient] as [value] FROM [tblClient] as D ORDER BY [value];
```

### Date de début et date de fin

Fonction exécuté automatiquement pour calculer la date (début, fin) Sélectionner par défaut

``` javascript
// Returns an arrray of [Date, Date]
function  getDefaultDates() {
	let  date_start, date_end;
	const  today = new  Date();
	const  thisMonth = today.getMonth() + 1;
	const  thisYear = today.getFullYear();
	if (thisMonth >= 10) {
		date_start = new Date(thisYear, 9, 1);
		date_end = new Date(thisYear + 1, 8, 30);
	} else {
		date_start = new Date(thisYear - 1, 9, 1);
		date_end = new Date(thisYear, 8, 30);
	}
	return [date_start, date_end];
}
```

### Responsable

Exploitant la table *[tblDossier]* pour sélectionner en distincts les bureau des dossiers:

```sql
SELECT DISTINCT [D].[Responsable] as [value] FROM [tblDossier] as D ORDER BY [value];
```

## Principes de calculs et de requête dynamique

### Étape à suivre pour chaque composant (widgets)

1. On détermine la variable *math* à partir des paramètres de la requête GraphQL;
2. On génère le filtres SQL (voir *Algorithme de génération de filtre*) à utiliser par la suite dans la requête WHERE;
3. On concatène les filtres SQL avec " AND " en une chaine de caractère SQL ;
4. On exécute la requête SQL (voir *Requête SQL*);
5. On transforme le tableau de résultat SQL à un table JS au format suivant (voir *Code JavaScript* )
6. Renvoyer les données au frontend.

### Méthode de calcule

##### Important

On définit une variable qui s'appelle **math** qui peut prendre un des deux valeurs suivants: "**income**" ou "**number**";

Si elle va prendre "income", la requête SQL générée va calculer le montant de facturations (chiffre d'affaire), sinon, avec "number" elle va calculer le nombre de dossier.

#### Exemple de requête *income*:

```sql
SELECT
	...
	SUM([F].MontantFacture) as [income]
FROM
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
WHERE ... #optionel
GROUP BY ...
ORDER BY ...
```

#### Exemple de requête *number*:

```sql
SELECT
	...
	COUNT([D].[NumeroDossier]) as [number]
FROM
	[tblDossier] as D
WHERE ... #optionel
GROUP BY ...
ORDER BY ...
```

### Diagram explicatif

![Fig2: Diagram explicatif](https://samo.tekru.net/media/bilel-khelifa/diagram%20explicatif.JPG)

### Algorithme de génération de requête WHERE des filtres

L'algorithme de génération de requête SQL WHERE à partir des filtres est une fonction qui prend en paramètres les filtres (en Array) et l'options math (income ou number) et qui retourne une requête SQL;

#### Rôle détaillé :

Parcours la liste des filtres sélectionné, pour chaque filtres on transforme le code javascript en une requête SQL executable (voir *exemple d'execution*)

#### Exemple d'exécution

Paramètres à l'entrée:

``` javascript
const  filtres = {
	date_start: [ '2019-10-01' ],
	date_end: [ '2020-09-30' ],
	offices: [ 'Montréal', 'RDL', 'QC' ]
}
```

Données en sortie:

``` javascript
const filters = [
	"CAST([D].[DateMandat] as DATE) >= '2019-10-01 00:00:00.000'",
	"CAST([D].[DateMandat] as DATE) <= '2020-09-30 23:59:59.999'",
	"[D].[Bureau] IN (N'Montréal',N'RDL',N'QC')"
];
// A faire par  la suite
const WHERE = filters.joins(" AND "); // Concatiner les SQL avec un AND 
```

#### Dates

Où:
- ${column} ser a *[F].[DateFacturation]* si math = *income* sinon, *[D].[DateMandat]*
- ${date} sera remplacé par la date envoyé via GrapQl
##### date_start

``` sql
CAST(${column} as DATE) >= '${date} 00:00:00.000'
```

##### date_end

``` sql
CAST(${column} as DATE) <= '${date} 00:00:00.000'
```

#### Groupes et Clients

On génère en premier temps un WHERE SQL qui va nous chercher la liste dossiers de ces clients via la table *[tblDossierAClient]*

##### Etape 1: Requête WHERE 

###### Groupes

Où ${groupes} sera l'ensemble des ID des groupes sélectionnés
``` sql
[C].[group_id] IN (${groupes.join(", ")})
```

###### Clients

Où ${clientsIds} sera l'ensemble des ID des clients sélectionnés
``` sql
[C].[NumeroClient] IN (${clientsIds.join(", ")})
```

##### Etape 2: Condition WHERE générique

Où ${cFltr} sera l'ensemble des requêtes généré dans l'étape 1 et container avec le mot AND;
``` sql
[D].[NumeroDossier] IN (
	SELECT 
		DISTINCT [DC].[NumeroDossier]
	FROM  
		[tblDossierAClient] AS DC
		INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
	WHERE  ${cFltr.join(" AND  ")}
)
```

## Calcul par Widget

### Par types et bureaux

Code Javascript :

```javascript
const  data = [
	{
		name: "Bureau",
		value: [
			{
			name: "Type de perte",
			data: 0, // Montant ou le nombre de dossier
			}
		]
	}
];
```

Requête SQL

```sql
SELECT
	[D].[TypeDePerte],
	[D].[Bureau],
	SUM([F].MontantFacture) as [income], -- si math = "income"
	COUNT([D].[NumeroDossier]) as [number] -- si math = "number"
FROM
	-- si math = "income"
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	-- si math = "income"
	[tblDossier] as D
WHERE
	--{filters} # variable concatiné des conditions WHERE
GROUP BY
	[D].[TypeDePerte],
	[D].[Bureau]
ORDER BY
	[D].[TypeDePerte];
```

### Par groupes

Code Javascript :

```javascript
// Extrai de la variable de réponse de la requete
const  data = [
	{
		name: "Des Jardin",
		value: [
			options: {
				name: "id",
				value: group.id,
			},{
				name: "color",
				value: group.color,
			},
		]
	}
];
```

Requête SQL

```sql
SELECT
	[D].[id],
	[D].[name],
	[D].[color],
	SUM([F].MontantFacture) as [income], --# si math = "income"
	COUNT([D].[NumeroDossier]) as [number] --# si math = "number"
FROM
	-- si math = "income"
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	--si math = "number"
	[tblDossier] as D
WHERE
	--{filters} # variable concatiné des conditions WHERE
GROUP BY
	[D].[TypeDePerte],
	[D].[Bureau]
ORDER BY
	[D].[TypeDePerte];
```

### Par client

Requête SQL

```sql
SELECT
	SUM([F].MontantFacture) as [income], # si math = "income"
	COUNT([D].[NumeroDossier]) as [number], # si math = "number"
FROM
	# si math = "income"
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	# si math = "number"
	[tblDossier] as D
WHERE
	{filters} # variable concatiné des conditions WHERE
GROUP BY
	[C].[NomClient]
ORDER BY
	SUM([F].MontantFacture) DESC; -- si math = "income"
	COUNT([D].[NumeroDossier]) DESC  -- si math = "number"
```

### Par types

Requête SQL

```sql
SELECT
	SUM([F].MontantFacture) as [income], # si math = "income"
	COUNT([D].[NumeroDossier]) as [number], # si math = "number"
FROM
	# si math = "income"
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	# si math = "number"
	[tblDossier] as D
WHERE
	{filters} # variable concatiné des conditions WHERE
GROUP BY
	[C].[NomClient]
ORDER BY
	SUM([F].MontantFacture) DESC; # si math = "income"
	COUNT([D].[NumeroDossier]) DESC # si math = "number"
```

### Par bureau

Requête SQL

```sql
SELECT
	SUM([F].MontantFacture) as [income], # si math = "income"
	COUNT([D].[NumeroDossier]) as [number], # si math = "number"
FROM
	# si math = "income"
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	# si math = "number"
	[tblDossier] as D
WHERE
	{filters} # variable concatiné des conditions WHERE
GROUP BY
	[C].[NomClient]
ORDER BY
	SUM([F].MontantFacture) DESC; # si math = "income"
	COUNT([D].[NumeroDossier]) DESC # si math = "number"
```

### Délais

Requête SQL

```sql
SELECT
	COUNT([DD].[NumeroDossier]) as [count],
	AVG([DD].[Delai_Mandat_Examen]) as delais_examain,
	AVG([DD].[Delai_Examen_Redaction]) as delais_redaction,
	AVG([DD].[Delai_Redaction_Facturation]) as delais_facturation
FROM
	[tblDossierDelais] as [DD]
	LEFT JOIN [tblDossier] as [D] ON [DD].[NumeroDossier] = [D].[NumeroDossier]
WHERE
	{filters} # variable concatiné des conditions WHERE
GROUP BY
	[C].[NomClient]
ORDER BY
	[C].[NomClient],
	[C].[TypeClient],
	[C].[NumeroClient]
```

### Chiffre d'affaire Meilleures clients

Requête SQL

```sql
SELECT TOP (10) // Ou autre nombre envoyé en GrapQL
	[C].[NomClient],
	[C].[TypeClient],
	[C].[NumeroClient],
	SUM([F].MontantFacture) as [income],
	COUNT([D].[NumeroDossier]) as [folders]
FROM
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
	INNER JOIN [tblDossierAClient] AS DC ON [DC].[NumeroDossier] = [D].[NumeroDossier]
	INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
WHERE
	{filters} # variable concatiné des conditions WHERE
GROUP BY
	[C].[NomClient
ORDER BY
	[C].[NomClient],
	[C].[TypeClient],
	[C].[NumeroClient]
```

## Exemple complet

Vous pouvez exécuter cette requête directement sur Microsoft SQL Server

### Filtres sélectionnée

- Groupes de clients: Aucun, Desjardins
- Bureaux: Montréal, QC
- Type de dossier: Incendie
- Clients: *Desjardins Assurances générales inc. (succ. 6300, boul. Guillaume-Couture)* et *Desjardins Assurances générales inc. (succ. 6777, boul. Guillaume-Couture)
- Date de début: 01/10/2017*
- Date de fin: 30/09/2018
- Responsable: Alain Thériault

### Requête générée

```sql
SELECT
	[D].[TypeDePerte],
	[D].[Bureau],
	SUM([F].MontantFacture) as [income]
FROM
	[tblFactures] as F
	INNER JOIN [tblDossier] as D ON [D].[NumeroDossier] = [F].NumeroDossier
WHERE
	-- Date de début: 01/10/2017 et Date de fin: 30/09/2018
	CAST([F].[DateFacturation] as DATE) >= '2017-10-01 00:00:00.000'
	AND CAST([F].[DateFacturation] as DATE) <= '2018-09-30 23:59:59.999'
	-- Groupes de clients: Aucun, Desjardins
	AND [D].[NumeroDossier] IN (
		SELECT
			DISTINCT [DC].[NumeroDossier]
		FROM
			[tblDossierAClient] AS DC
			INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
		WHERE
			[C].[group_id] IN (1, 3)
	)
	-- Bureaux: Montréal, QC
	AND [D].[Bureau] IN (N'Montréal', N'QC')
	-- Type de dossier: Incendie
	AND [D].[TypeDePerte] IN (N'Incendie')
	--Clients: Desjardins Assurances générales inc. (succ. 6300, boul. Guillaume-Couture)
	--et Desjardins Assurances générales inc. (succ. 6777, boul. Guillaume-Couture)
	AND [D].[NumeroDossier] IN (
		SELECT
			DISTINCT [DC].[NumeroDossier]
		FROM
			[tblDossierAClient] AS DC
			INNER JOIN [tblClient] AS [C] ON [C].NumeroClient = [DC].[NumeroClient]
		WHERE
			[C].[NumeroClient] IN (141, 505)
	)
	-- Responsable: Alain Thériault
	AND [D].[Responsable] IN (N'Alain Thériault')
GROUP BY
	[D].[TypeDePerte],
	[D].[Bureau]
ORDER BY
	[D].[TypeDePerte];
```