const db = require("../../../models");
const { CalendarHolidays, tblDossiersDelais } = db;

const sqlHelpers = require("../../../helpers/sql.helpers");

// Aliases
const tSQL = sqlHelpers.trimSQLString;

// CRON update the dates
module.exports.execCalcDelais = async function (active = false) {
  // Get the items
  const dbData = await db.sequelize.query(
    tSQL(`
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
			${active ? "WHERE [D].[DateFerme] IS NULL" : ""}
			GROUP BY
				[D].[NumeroDossier],
				[D].[Responsable];
		`),
    {
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (!Array.isArray(dbData)) {
    return null;
  }

  const holidaysRaw = await CalendarHolidays.findAll({
    attributes: ["date"],
  });
  const holidays = (holidaysRaw || []).map((e) => new Date(e.date));

  let k = 0;

  for (const folder of dbData) {
    const dates = [
      folder.DateMandat,
      folder.DateExamain,
      folder.DateRedaction,
      folder.DateFacturation,
    ];
    const delais = calcDelais(dates, holidays);
    try {
      await tblDossiersDelais.upsert({
        number: folder.NumeroDossier,
        mandateExamDelai: delais[0],
        examReportDelai: delais[1],
        reportInvoiceDelai: delais[2],
        mandateDate: folder.DateMandat,
        examDate: folder.DateExamain,
        reportDate: folder.DateRedaction,
        invoiceDate: folder.DateFacturation,
      });
    } catch (error) {
      console.error({ error });
    }
    k++;
  }
  return true;
};

const isSameDay = (day, today) => {
  if (!day || !today) return false;
  return today.getDate() === day.getDate() &&
    today.getMonth() === day.getMonth() &&
    today.getFullYear() === day.getFullYear()
    ? true
    : false;
};

const isBefore = (day1, day2) => {
  if (!day2) return false;
  const result =
    day1.getFullYear() < day2.getFullYear() ||
    (day1.getFullYear() === day2.getFullYear() &&
      day1.getMonth() < day2.getMonth()) ||
    (day1.getFullYear() === day2.getFullYear() &&
      day1.getMonth() === day2.getMonth() &&
      day1.getDate() < day2.getDate());
  return result;
};

const calcDelais = (dateArray, holidays) => {
  const delais = [0, 0, 0];
  const dateStart = new Date(dateArray[0]);
  const dateEnd = new Date(
    dateArray.reduce((acc, curr) => (curr ? curr : acc))
  );
  let k = 1;
  while (!isSameDay(dateEnd, dateStart) && !isBefore(dateEnd, dateStart)) {
    const weekDay = dateStart.getDay() + 1; // Get the week day
    const isWeekend = weekDay === 1 || weekDay === 7; // Check if it is weekend
    const isHoliday = !!holidays.find((e) => isSameDay(dateStart, e));
    if (isBefore(dateStart, dateArray[k])) {
      if (!isWeekend && !isHoliday && dateArray[k]) {
        delais[k - 1]++;
      }
    } else {
      if (!isWeekend && !isHoliday) {
        delais[k]++;
      }
      k++;
    }
    dateStart.setDate(dateStart.getDate() + 1);
  }
  return delais;
};
