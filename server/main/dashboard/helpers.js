const db = require("../../models");
const { tblEmployes, CalendarHolidays } = require("../../models");
const moment = require("moment");

const helpers = {
  /**
   * Get data
   * @param array slugs
   */
  async widgetReceivedFolder(user, filters) {
    // Get the employee name
    const employee = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
      },
    });
    // Prepare the date
    const d = new Date();
    const calendar = {};
    calendar.thisMonth = d.getMonth() + 1;
    calendar.lastMonth = {
      month: calendar.thisMonth === 1 ? 12 : calendar.thisMonth - 1,
      year: calendar.thisMonth === 1 ? d.getFullYear() - 1 : d.getFullYear(),
    };
    calendar.thisYear = d.getFullYear();
    let projectState = null;
    if (Array.isArray(filters) && filters.length > 0) {
      if (filters[0] === "Dossiers fermés") projectState = "IS NULL";
      if (filters[0] === "Dossiers ouverts") projectState = "IS NOT NULL";
    }
    // Get the items
    const items = await db.sequelize.query(
      this.trimSQLString(`
            DECLARE @responsable NVARCHAR(250) = '${employee.NomEmploye}';
            DECLARE @daylimit DATE = CONVERT (date, GETDATE());
            SELECT 
              COUNT([tblDossier].[NumeroDossier]) folders,
              SUM(CASE WHEN [tblDossier].[DateMandat] >= DATEADD(WEEK, -1, @daylimit) THEN 1 ELSE 0 END) this_week,
              SUM(CASE WHEN 
                [tblDossier].[DateMandat] >= DATEADD(WEEK, -2, @daylimit)
                AND [tblDossier].[DateMandat] <= DATEADD(WEEK, -1, @daylimit)
                THEN 1 ELSE 0 END
              ) last_week,
              SUM(CASE WHEN [tblDossier].[DateMandat] >= DATEADD(MONTH, -1, @daylimit) THEN 1 ELSE 0 END) this_month,
              SUM(CASE WHEN 
                [tblDossier].[DateMandat] >= DATEADD(MONTH, -2, @daylimit)
                AND [tblDossier].[DateMandat] <= DATEADD(MONTH, -1, @daylimit)
                THEN 1 ELSE 0 END
              ) last_month,
              SUM(CASE WHEN [tblDossier].[DateMandat] >= DATEADD(MONTH, -3, @daylimit) THEN 1 ELSE 0 END) this_quarter,
              SUM(CASE WHEN 
                [tblDossier].[DateMandat] >= DATEADD(MONTH, -6, @daylimit)
                AND [tblDossier].[DateMandat] <= DATEADD(MONTH, -3, @daylimit)
                THEN 1 ELSE 0 END
              ) last_quarter
            FROM [tblDossier]
            WHERE  [tblDossier].[NumeroDossier] NOT LIKE '00%' AND [tblDossier].[Responsable] = @responsable

            ${
              projectState ? `AND [tblDossier].[DateFerme] ${projectState}` : ""
            }

          `),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    const graphData = await db.sequelize.query(
      this.trimSQLString(`
            WITH CTE AS
            (
              SELECT convert(date, GETDATE()) [date]
              UNION ALL SELECT DATEADD(DAY, -1, [date]) FROM CTE WHERE [date] > DATEADD(DAY, -29, GETDATE())
            )
            SELECT 
              [date],
              COUNT([tblDossier].[NumeroDossier]) AS [openCases]
            FROM [CTE]
            LEFT JOIN [tblDossier] ON
              [CTE].[date] >= [tblDossier].[DateMandat] 
              AND [CTE].[date] < [tblDossier].[DateFerme] 
              AND [tblDossier].[Responsable] = '${employee.NomEmploye}'
            GROUP BY [CTE].[date]
          `),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (items && items[0]) {
      return {
        active: items[0].folders,
        graph: graphData.map((e) => ({
          name: e["date"],
          value: e["openCases"],
        })),
        data: [
          {
            type: "7_days",
            value: items[0].this_week,
            change: this.calcChangePourcentage(
              items[0].last_week,
              items[0].this_week
            ),
          },
          {
            type: "this_month",
            value: items[0].this_month,
            change: this.calcChangePourcentage(
              items[0].last_month,
              items[0].this_month
            ),
          },
          {
            type: "this_quarter",
            value: items[0].this_quarter,
            change: this.calcChangePourcentage(
              items[0].last_quarter,
              items[0].this_quarter
            ),
          },
        ],
      };
    }

    return null;
  },

  /**
   * Get data for Widget 2
   * @param object user
   */
  async widgetIncome(user) {
    const d = new Date();
    const calendar = {};
    calendar.thisMonth = d.getMonth() + 1;
    calendar.thisYear = d.getFullYear();
    if (calendar.thisMonth >= 10) {
      // October
      calendar.firstYear = d.getFullYear();
      calendar.secondYear = d.getFullYear() + 1;
    } else {
      calendar.firstYear = d.getFullYear() - 1;
      calendar.secondYear = d.getFullYear();
    }
    // Get the data
    const incomeData = await db.sequelize.query(
      // Year(Getdate())
      this.trimSQLString(`
          DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
          SET
              @dateAu = GETDATE()
          SET
              @Id_Empl = ${user.id_Emp}
          SELECT
              ROUND(
                  Sum(
                      IIF(
                          (
                              f.FF_Montant = 0
                              AND f.FF_Montant_Tot = 0
                          ),
                          a.HeuresFacture,
                          IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
                      )
                  ),
                  2
              ) AS NombreHeuresFacturees,
              f.DateFacturation
          FROM
              tblActivites AS a
              INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
              INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
              INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
              INNER JOIN tblFactures AS f ON f.NumeroFacture = a.FactureAffecte
          WHERE
              a.Id_Emp = @Id_Empl
              AND (
                  a.FactureAffecte IS NOT NULL
                  AND a.FactureAffecte NOT LIKE 'Projet%'
              )
              AND (
                  (
                      (
                          f.FF_Montant > 0
                          OR f.FF_Montant_Tot > 0
                      )
                      AND a.Activite NOT LIKE 'RV%'
                  )
                  OR (
                      f.FF_Montant = 0
                      AND f.FF_Montant_Tot = 0
                  )
              )
              AND a.NumeroDossier NOT LIKE '00%'
              AND (
                  ta.NonFacturable = 0
                  OR ta.Activite LIKE 'DV%'
                  OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
                  OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
              )
              AND CAST(f.DateFacturation AS DATE) >= IIF(
                  DATEPART(month, @dateAu) >= 1
                  AND DATEPART(month, @dateAu) <= 9,
                  /*Entre Janvier et  septembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
                  ),
                  /*Entre Octobre er Decembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
                  )
              )
              AND CAST(f.DateFacturation AS DATE) <= GETDATE()
              /*AND f.FF_Montant<>f.FF_Montant_Tot*/
          GROUP By
              f.DateFacturation
          ORDER BY
        f.DateFacturation
          `),
      { type: db.sequelize.QueryTypes.SELECT }
    );

    let CumulativeSum = 0;
    const formattedData = incomeData.map((el) => {
      CumulativeSum += el.NombreHeuresFacturees;
      return {
        CumulativeSum,
        BillableHours: el.NombreHeuresFacturees,
        Year: el.DateFacturation.getFullYear(),
        Month: el.DateFacturation.getMonth() + 1,
        Day: el.DateFacturation.getDate(),
      };
    });

    //get the billable hours data
    const billableHoursQuery = this.trimSQLString(`
        DECLARE @dateAu AS DATE DECLARE @Id_Empl AS INTEGER
        SET
            @dateAu = GETDATE()
        SET
            @Id_Empl = ${user.id_Emp}
        SELECT
            ROUND(
                SUM(
                    IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
                ),
                2
            ) AS billableHours,
            IIF(
                DATEPART(month, @dateAu) >= 1
                AND DATEPART(month, @dateAu) <= 9,
                /*Entre Janvier et  septembre*/
                CAST(
                    CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
                ),
                /*Entre Octobre er Decembre*/
                CAST(
                    CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
                )
            ) AS dateStart
        FROM
            tblActivites AS a
            INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
            INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
            INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
        WHERE
            a.ID_Emp = @Id_Empl
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
            AND CAST(a.DateActivite AS DATE) >= IIF(
                DATEPART(month, @dateAu) >= 1
                AND DATEPART(month, @dateAu) <= 9,
                /*Entre Janvier et  septembre*/
                CAST(
                    CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
                ),
                /*Entre Octobre er Decembre*/
                CAST(
                    CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
                )
            )
            AND CAST(a.DateActivite AS DATE) <= @dateAu
        GROUP BY
          a.ID_Emp
        `);

    const billedHoursData = await db.sequelize.query(billableHoursQuery, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    // TODO render it dynamicly
    let hoursGoal = 1200;
    //get hours of goal
    const expert = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
        Expert: 1,
        Actif: 1,
      },
      raw: true,
      nest: true,
      attributes: ["Objectif_Annuel_Hres"],
    });
    if (expert) hoursGoal = expert.Objectif_Annuel_Hres;
    const goalsOptions = {
      weekCount: 52, // (52-4),
      hoursGoal,
    };

    // Year day count
    let dayCount = 365;
    if (
      calendar.thisYear % 400 === 0 ||
      (calendar.thisYear % 100 !== 0 && calendar.thisYear % 4 === 0)
    ) {
      dayCount = 366;
    }
    const dailyGoal = goalsOptions.hoursGoal / dayCount;

    const data = [
      {
        name: "income",
        data: [],
      },
      {
        name: "cumulativeIncome",
        data: [],
      },
      {
        name: "goal",
        data: [],
      },
    ];

    const dateStart = moment(`${calendar.firstYear}-10-01`);
    const dateEnd = moment().add(1, "days");
    let key = 0;
    let lastCumulativeSumNoneZero = 0;
    while (!dateEnd.isSame(dateStart, "days")) {
      const day = {
        y: parseInt(dateStart.format("YYYY")),
        m: parseInt(dateStart.format("M")),
        d: parseInt(dateStart.format("D")),
      };
      const dateString = dateStart.format("YYYY-MM-DD");
      const income = formattedData.find(
        (item) =>
          item["Year"] === day.y &&
          item["Month"] === day.m &&
          item["Day"] === day.d
      );
      if (income && income["CumulativeSum"] !== 0)
        lastCumulativeSumNoneZero = income["CumulativeSum"];
      data[0].data[key] = {
        name: dateString,
        value: income ? income["Income"] : 0,
      };
      data[1].data[key] = {
        name: dateString,
        value:
          income && income["CumulativeSum"] !== 0
            ? income["CumulativeSum"]
            : lastCumulativeSumNoneZero,
      };
      data[2].data[key] = {
        name: dateString,
        value: dailyGoal * (key + 1),
      };
      dateStart.add(1, "days");
      key++;
    }
    const weeksRemaining = await db.sequelize.query(
      // Year(Getdate())
      this.trimSQLString(`
          DECLARE @dateAu AS DATE
          SET
              @dateAu = GETDATE()
          SELECT
              a.NomEmploye,
              e.ID_Emp,
              IIF(
                  DATEPART(month, @dateAu) >= 1
                  AND DATEPART(month, @dateAu) <= 9,
                  /*Entre Janvier et  septembre*/
                  DATEPART(
                      week,
                      CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01')
                  ) - DATEPART(week, @dateAu),
                  /*Entre Octobre er Decembre*/
                  (
                      DATEPART(
                          week,
                          CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-12-31')
                      ) - DATEPART(week, @dateAu)
                  ) + DATEPART(
                      week,
                      CONCAT(YEAR(DATEADD(YEAR, 1, @dateAu)), '-09-30')
                  )
              ) AS nombreSemRestantes,
              ROUND(
                  SUM(
                      IIF(
                          (
                              f.FF_Montant = 0
                              AND f.FF_Montant_Tot = 0
                          ),
                          a.HeuresFacture,
                          IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
                      )
                  ),
                  2
              ) AS NombreHeureTotalFactureEtForfaitAnnee,
              ROUND(
                  (
                      e.Objectif_Annuel_Hres - ROUND(
                          SUM(
                              IIF(
                                  (
                                      f.FF_Montant = 0
                                      AND f.FF_Montant_Tot = 0
                                  ),
                                  a.HeuresFacture,
                                  IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
                              )
                          ),
                          2
                      )
                  ) / IIF(
                      DATEPART(month, @dateAu) >= 1
                      AND DATEPART(month, @dateAu) <= 9,
                      /*Entre Janvier et  septembre*/
                      DATEPART(
                          week,
                          CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01')
                      ) - DATEPART(week, @dateAu),
                      /*Entre Octobre er Decembre*/
                      (
                          DATEPART(
                              week,
                              CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-12-31')
                          ) - DATEPART(week, @dateAu)
                      ) + DATEPART(
                          week,
                          CONCAT(YEAR(DATEADD(YEAR, 1, @dateAu)), '-09-30')
                      )
                  ),
                  2
              ) AS NbreHeureParSemaineAFacturer,
              e.Objectif_Annuel_Hres,
              ROUND(
                  (
                      e.Objectif_Annuel_Hres - SUM(
                          IIF(
                              f.FF_Montant = 0,
                              a.HeuresFacture,
                              IIF(a.HeuresFacture <> 0, a.HeuresFacture, a.Heures)
                          )
                      )
                  ),
                  2
              ) AS ResteAFacturer,
              IIF(
                  DATEPART(month, @dateAu) >= 1
                  AND DATEPART(month, @dateAu) <= 9,
                  /*Entre Janvier et  septembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
                  ),
                  /*Entre Octobre er Decembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
                  )
              ) AS DebutCalcul
          FROM
              tblActivites AS a
              INNER JOIN tblEmployes AS e ON e.ID_Emp = a.Id_Emp
              INNER JOIN tblDossier AS d ON d.NumeroDossier = a.NumeroDossier
              INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
              INNER JOIN tblFactures AS f ON f.NumeroFacture = a.FactureAffecte
          WHERE
              e.ID_Emp = ${user.id_Emp}
              AND (
                  a.FactureAffecte IS NOT NULL
                  AND a.FactureAffecte NOT LIKE 'Projet%'
              )
              AND (
                  (
                      (
                          f.FF_Montant > 0
                          OR f.FF_Montant_Tot > 0
                      )
                      AND a.Activite NOT LIKE 'RV%'
                  )
                  OR (
                      f.FF_Montant = 0
                      AND f.FF_Montant_Tot = 0
                  )
              )
              AND (
                  ta.NonFacturable = 0
                  OR ta.Activite LIKE 'DV%'
                  OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
                  OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
              )
              AND a.NumeroDossier NOT LIKE '00%'
              AND CAST(f.DateFacturation AS DATE) >= IIF(
                  DATEPART(month, @dateAu) >= 1
                  AND DATEPART(month, @dateAu) <= 9,
                  /*Entre Janvier et  septembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, -1, @dateAu)), '-10-01') AS DATE
                  ),
                  /*Entre Octobre er Decembre*/
                  CAST(
                      CONCAT(YEAR(DATEADD(YEAR, 0, @dateAu)), '-10-01') AS DATE
                  )
              )
              AND CAST(f.DateFacturation AS DATE) <= @dateAu
          GROUP BY
              a.NomEmploye,
              e.Objectif_Annuel_Hres,
              e.ID_Emp;`),
      { type: db.sequelize.QueryTypes.SELECT }
    );
    let NbreHeureParSemaineAFacturer = 0;
    let Objectif_Annuel_Hres =
      tblEmployes
        .findOne({
          where: {
            id_Emp: user.id_Emp,
            Expert: 1,
            Actif: 1,
          },
          raw: true,
          nest: true,
          attributes: ["Objectif_Annuel_Hres"],
        })

        .then((res) => res.Objectif_Annuel_Hres)
        .catch((err) => 0) || 0;
    if (weeksRemaining.length > 0) {
      NbreHeureParSemaineAFacturer =
        weeksRemaining[0].NbreHeureParSemaineAFacturer;
      Objectif_Annuel_Hres = weeksRemaining[0].Objectif_Annuel_Hres;
    }
    return {
      billableHours: {
        value: billedHoursData[0]?.billableHours,
        date: billedHoursData[0]?.dateStart,
      },
      goal: Objectif_Annuel_Hres,
      value: NbreHeureParSemaineAFacturer,
      widget: data,
    };
  },

  /**
   * Get data for Widget 3
   * @param object user
   * @param object options
   */
  async widgetSTEC(user, options) {
    // Get the employee name
    const employee = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
      },
      attributes: ["NomEmploye"],
    });

    // Options
    const { period } = options || {};
    let months,
      groupBy = [];
    switch (period) {
      case "year":
        months = 12;
        groupBy = ["YEAR", "MONTH"];
        break;
      case "month":
        months = 1;
        groupBy = ["YEAR", "MONTH", "DAY"];
        break;
      default:
        months = 3;
        groupBy = ["YEAR", "MONTH", "DAY"];
        break;
    }
    const sqlPeriod = `DATEADD(MONTH, -${months}, GETDATE())`;
    const sqlGroup = `${groupBy.map(
      (e) => `${e}([tblActivites].[DateActivite])`
    )}`;
    // Get the data
    const dbData = await db.sequelize.query(
      this.trimSQLString(`
          SELECT
              SUM([tblActivites].[Heures] * [tblActivites].[HeuresFacture]) AS Amount,
              YEAR([tblActivites].[DateActivite]) AS Year, 
              MONTH([tblActivites].[DateActivite]) AS Month
              ${
                months < 12 ? `, DAY([tblActivites].[DateActivite]) AS Day` : ""
              }
          FROM tblActivites
          WHERE 
              [tblActivites].[Categorie] <> 'Absence'
              AND [tblActivites].[DateActivite] >= ${sqlPeriod}
              AND [tblActivites].[FactureAffecte] IS NULL
              AND [tblActivites].[NumeroDossier] IS NOT NULL
              AND [tblActivites].[NomEmploye] = '${employee.NomEmploye}'
          GROUP BY ${sqlGroup}
          ORDER BY Year, Month ${months < 12 ? `, Day` : ""}
        `),
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const data = [
      {
        name: "inProgress",
        data: [],
      },
    ];

    let step = months < 12 ? "days" : "months";
    const dateStart = moment().subtract(months, "months");
    const dateEnd = moment().add(1, step);
    let key = 0;
    while (!dateEnd.isSame(dateStart, step)) {
      const day = {
        y: parseInt(dateStart.format("YYYY")),
        m: parseInt(dateStart.format("M")),
        d: parseInt(dateStart.format("D")),
      };
      const dateString = dateStart.format();
      const amount = dbData.find(
        (item) =>
          item["Year"] === day.y &&
          item["Month"] === day.m &&
          (item["Day"] === day.d || months >= 12)
      );
      data[0].data[key] = {
        name: dateString,
        value: amount ? amount["Amount"] : 0,
      };
      dateStart.add(1, step);
      key++;
    }

    return data;
  },

  /**
   * Get data for Widget 4
   * @param object user
   * @param object options
   */
  async widgetBudgetAndDelais(user, options) {
    // Get the employee name
    const employee = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
      },
      attributes: ["NomEmploye"],
    });
    let projectState = null;

    // Options
    const { period, state } = options || {};

    if (state === "Dossiers ouverts") projectState = "IS NOT NULL";
    if (state === "Dossiers fermés") projectState = "IS NULL";
    let months;
    switch (period) {
      case "year":
        months = 12;
        break;
      case "month":
      case "week":
        months = 1;
        break;
      default:
        months = 3;
        break;
    }
    const sqlPeriod = `DATEADD(${
      period === "week" ? "WEEK" : "MONTH"
    }, -${months}, GETDATE())`;

    // Get the data
    const query = this.trimSQLString(`
    SELECT 
      d.DateMandat AS DateOuverture,
      a.NumeroDossier,
      cg.color ,
      ROUND (
        (
            SUM(
                [a].[Heures] * [a].[HeuresFacture]
            ) * 100.0 / NULLIF([d].[Budget], 0)
        ),
        3
    ) as [Pourcentage],
      MIN(CASE WHEN a.Activite LIKE '%Examen%' THEN a.DateActivite END ) DateExamen,
      DATEDIFF( DAY,CAST(d.DateMandat AS date),MIN(CASE WHEN a.Activite LIKE '%Examen%' THEN a.DateActivite END ) ) AS delaiExam,
      MIN(CASE WHEN a.Activite LIKE '%Compte-rendu%' THEN a.DateActivite END ) DateCompteRendu,
      DATEDIFF( DAY,CAST(d.DateMandat AS date),MIN(CASE WHEN a.Activite LIKE '%Compte-rendu%' THEN a.DateActivite END ) ) AS delaiCompteRendu,
      MIN(CASE WHEN a.Activite LIKE '%Rédaction%' THEN a.DateActivite END ) DateRedaction,
      DATEDIFF( DAY,CAST(d.DateMandat AS date),MIN(CASE WHEN a.Activite LIKE '%Rédaction%' THEN a.DateActivite END ) ) AS delaiRedaction,
      d.DateLivraison,
      DATEDIFF( DAY,CAST(d.DateMandat AS date),CAST(d.DateLivraison AS Date ) ) AS delaiLivraison
      /*a.*,
      d.**/
    FROM tblDossier AS d
    INNER JOIN tblDossierAClient AS dc ON d.NumeroDossier = dc.NumeroDossier
    INNER JOIN tblClient AS c ON c.NumeroClient = dc.NumeroClient
    INNER JOIN tblClientGroupes AS cg ON cg.id = c.group_id
    
    INNER JOIN tblActivites AS a
      ON a.NumeroDossier=d.NumeroDossier
    WHERE 
       d.DateMandat >= ${sqlPeriod}
      AND d.[Responsable] = '${employee.NomEmploye}'
      ${projectState ? `AND d.[DateFerme] ${projectState}` : ""}

    GROUP BY
      a.NumeroDossier,
      d.DateMandat,
      d.DateFerme,
      d.DateLivraison,
      cg.color,
      [d].[Budget]  
    ORDER BY
      a.NumeroDossier ASC
      ;
      `);
    //  -- AND [tblActivites].[FactureAffecte] NOT LIKE '%Projet%'
    //console.log({ query });
    const renderColor = (color) => {
      if (!color) return "#606060";
      const allowedColors = ["#fbbc08"];
      if (allowedColors.includes(color)) return color;
      else return "#606060";
    };
    const dbData = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
    });

    const data = [
      {
        name: "budget",
        data: (dbData || []).map((folder) => ({
          name: folder["NumeroDossier"],
          value: folder["Pourcentage"] * 100,
        })),
      },
      {
        name: "delais_exam",
        data: [],
      },
      {
        name: "delais_redaction",
        data: [],
      },
      {
        name: "delais_livraison",
        data: [],
      },
      {
        name: "delais_reporting",
        data: [],
      },
      {
        name: "opening_date",
        data: (dbData || []).map((folder, index) => {
          return {
            name: folder.NumeroDossier,
            value: folder.DateOuverture,
          };
        }),
      },
      {
        name: "color",
        data: (dbData || []).map((folder, index) => {
          return {
            name: folder.NumeroDossier,
            color: renderColor(folder.color),
          };
        }),
      },
    ];
    (dbData || []).map((folder) => {
      data[1].data.push({
        name: folder.NumeroDossier,
        value: folder.delaiExam || 0,
        description: folder.DateExamen || null,
      });
      data[2].data.push({
        name: folder.NumeroDossier,
        value: folder.delaiRedaction || 0,
        description: folder.DateRedaction || null,
      });
      data[3].data.push({
        name: folder.NumeroDossier,
        value: folder.delaiLivraison || 0,
        description: folder.DateLivraison || null,
      });
      data[4].data.push({
        name: folder.NumeroDossier,
        value: folder.delaiCompteRendu || 0,
        description: folder.DateCompteRendu || null,
      });
    });

    return data;
  },

  /**
   * Get data for Widget 5
   * @param object user
   * @param object options
   */
  async widgetBvNbHours(user, options) {
    // Options
    const { count, dateSorter, operator, compareValue } = options;
    let operatorWhere = "";

    if (operator && compareValue) {
      operatorWhere = `WHERE q.AmountNoneBilled ${operator} ${compareValue}`;
    }

    const sqlOptions = {
      dateSorter: "DateMandat",
      limit: parseInt(count) || 30,
    };
    // Data protection
    if (sqlOptions.limit > 100) {
      sqlOptions.limit = 100;
    }
    switch (dateSorter) {
      case "closing_date":
        sqlOptions.dateSorter = "DateFerme";
        break;
      default:
        // None
        break;
    }
    // Get the data
    const query1 = `
        SELECT
        ${parseInt(count) ? `TOP(${sqlOptions.limit})` : ""} q.*
          FROM
            (
              SELECT
                a.NumeroDossier,
                d.DateMandat,
                d.DateFerme,
                d.ID_Emp_Responsable,
                MAX(d.Budget) as Budget,
                ROUND(SUM(ISNULL(a.Heures * a.TauxHoraire, 0)), 2) AS AmountNoneBilled,
                ROUND(SUM(ISNULL(a.Heures, 0)), 2) AS SumNoneBilled,
                MAX(a.TauxHoraire) AS TauxHoraire
            FROM
                [tblActivites] AS a
                INNER JOIN [tblDossier] AS d ON a.NumeroDossier = d.NumeroDossier
                INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
            WHERE
                a.Heures <> 0
                AND (
                    a.FactureAffecte IS NULL
                    OR a.FactureAffecte LIKE 'Projet%'
                )
                AND d.DateFerme IS NOT NULL
                AND d.NumeroDossier NOT LIKE '00%'
                AND YEAR(CAST(d.DateMandat AS DATE)) >= '2012' 
                AND (
                    ta.NonFacturable = 0
                    OR ta.Activite LIKE 'DV%'
                    OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
                    OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
                )
                AND d.ID_Emp_Responsable = ${user.id_Emp}
            GROUP BY
                a.NumeroDossier,
                d.DateMandat,
                d.DateFerme,
                d.ID_Emp_Responsable,
                a.FactureAffecte
            ) AS q
          ${operatorWhere}
        ORDER BY
          q.[${sqlOptions.dateSorter}] desc`;

    const noneBilledData = await db.sequelize.query(
      this.trimSQLString(query1),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    const folderIds = [];
    noneBilledData.map((el) => {
      if (!folderIds.includes(`'${el.NumeroDossier}'`)) {
        folderIds.push(`'${el.NumeroDossier}'`);
      }
    });

    let whereFolders = "";
    if (Array.isArray(folderIds) && folderIds.length > 0) {
      whereFolders = `AND d.NumeroDossier IN (${folderIds})`;
    }

    const query2 = `
        SELECT
          ${parseInt(count) ? `TOP(${sqlOptions.limit})` : ""} a.NumeroDossier,
          a.NumeroDossier,
          d.DateMandat,
          d.DateFerme,
          d.ID_Emp_Responsable,
          MAX(d.Budget) as Budget,
          ROUND(
            SUM(ISNULL(a.HeuresFacture * a.TauxHoraire, 0)),
            2
          ) AS AmountBilled,
          ROUND(SUM(ISNULL(a.HeuresFacture, 0)), 2) AS SumBilled,
          MAX(a.TauxHoraire) AS TauxHoraire
        FROM
          [tblActivites] AS a
          INNER JOIN [tblDossier] AS d ON a.NumeroDossier = d.NumeroDossier
          INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
        WHERE
          (
            a.FactureAffecte IS NOT NULL
            AND a.FactureAffecte NOT LIKE 'Projet%'
          )
          AND d.DateFerme IS NOT NULL
          AND d.NumeroDossier NOT LIKE '00%'
          AND (
              ta.NonFacturable = 0
              OR ta.Activite LIKE 'DV%'
              OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
              OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
          )
          AND a.HeuresFacture <> 0
          AND d.ID_Emp_Responsable = ${user.id_Emp} ${whereFolders}
        GROUP BY
          a.NumeroDossier,
          d.DateMandat,
          d.DateFerme,
          d.ID_Emp_Responsable
        ORDER BY
          d.[${sqlOptions.dateSorter}];`;

    let BilledData = [];

    if (whereFolders.length > 0) {
      BilledData = await db.sequelize.query(this.trimSQLString(query2), {
        type: db.sequelize.QueryTypes.SELECT,
      });
    }

    // Get the count
    if (operator && compareValue) {
      operatorWhere = `WHERE q.Montant ${operator} ${compareValue}`;
    }
    const queryCount = `
        SELECT
          COUNT(*) AS Count
            FROM
                (
                    SELECT
                        ROUND(SUM(ISNULL(a.Heures * a.TauxHoraire, 0)), 2) AS Montant,
                        d.NumeroDossier
                    FROM
                        [tblActivites] AS a
                        INNER JOIN [tblDossier] AS d ON a.NumeroDossier = d.NumeroDossier
                        INNER JOIN tblTypesActivites AS ta ON ta.ID = a.IdTypesActivites
                    WHERE
                        a.Heures <> 0
                        AND (
                            a.FactureAffecte IS NULL
                            OR a.FactureAffecte LIKE 'Projet%'
                        )
                        AND d.DateFerme IS NOT NULL
                        AND d.NumeroDossier NOT LIKE '00%'
                        AND YEAR(CAST(d.DateMandat AS DATE)) >= '2012' 
                        AND (
                            ta.NonFacturable = 0
                            OR ta.Activite LIKE 'DV%'
                            OR ta.Activite = 'MT - Déplacement forfaitaire QC-MTL'
                            OR ta.Activite = 'RB - Rabais 2hrs et 200 km Promutuel'
                        )
                        AND d.ID_Emp_Responsable = ${user.id_Emp}
                    GROUP BY
                        d.NumeroDossier
                ) AS q
            ${operatorWhere}`;

    const dbData2 = await db.sequelize.query(this.trimSQLString(queryCount), {
      type: db.sequelize.QueryTypes.SELECT,
    });

    let data = [];
    if (Array.isArray(noneBilledData)) {
      if (noneBilledData.length === 0) {
        data = BilledData.map((item) => {
          return {
            budget: item["Budget"],
            folder: item["NumeroDossier"],
            billed: item["SumBilled"],
            amountBilled: item["AmountBilled"],
          };
        });
      } else if (Array.isArray(BilledData) && BilledData.length === 0) {
        data = noneBilledData;
        data = noneBilledData.map((item) => {
          return {
            folder: item["NumeroDossier"],
            noneBilled: item["SumNoneBilled"],
            amountNoneBilled: item["AmountNoneBilled"],
            budget: item["Budget"],
          };
        });
      } else {
        data = noneBilledData.map((item) => {
          const found = BilledData.find(
            (el) => el.NumeroDossier === item.NumeroDossier
          );
          return {
            folder: item["NumeroDossier"],
            billed: found ? found["SumBilled"] : null,
            noneBilled: item["SumNoneBilled"],
            amountBilled: found ? found["AmountBilled"] : null,
            amountNoneBilled: item["AmountNoneBilled"],
            budget: item["Budget"],
          };
        });
      }
    }

    // The sum of expenses
    // https://extranet.globetechnologie.com/projects/origin-intranet/tasks/474
    /*const genSumExpensesQuery = (folderId) => `
          SELECT
            SUM([D].[MontantFacture]) AS [sumExpenses]
          FROM
            [tblDepenses] AS [D]
          WHERE
            [D].[NumeroDossier] = '${folderId}'
          GROUP BY
            [D].[NumeroDossier];
        `;
    
        const promises = await data.map(async (item) => {
          const query = genSumExpensesQuery(item.folder);
          const result = await db.sequelize.query(this.trimSQLString(query), {
            type: db.sequelize.QueryTypes.SELECT,
          });
          item.sumExpenses = Array.isArray(result) ? result[0]?.sumExpenses : 0;
          return item;
        });
    
        const table = await Promise.all(promises);
        console.log({ table });*/

    return {
      count: dbData2[0]["Count"],
      table: data,
    };
  },

  calcChangePourcentage(lastValue, newValue) {
    const val = ((newValue - lastValue) / lastValue) * 100.0;
    return val && val !== Infinity ? val : 0;
  },

  trimSQLString(sqlString) {
    return sqlString
      .replace(/\t/g, "")
      .replace(/\n/g, " ")
      .replace(/\s\s+/g, " ")
      .trim();
  },
};

module.exports = helpers;

module.exports.WidgetBillableHours = async function (user, type) {
  const totalPerYearData = await db.sequelize.query(
    this.trimSQLString(require("./queries").totalPerYearQuery(user, type)),
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  const graphData = await db.sequelize.query(
    this.trimSQLString(require("./queries").graphQuery(user)),
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  const totalBillableHours = totalPerYearData?.reduce(
    (acc, el) => el.numberOfBillableHours + acc,
    0
  );
  return { totalPerYearData, graphData, totalBillableHours };
};
