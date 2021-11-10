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
    const thisDay = new Date(dateArray[k]);
    if (isBefore(dateStart, thisDay)) {
      if (!isWeekend && !isHoliday && thisDay) {
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

const dates = [
  "2020-08-10 16:19:44", // DateMandat,
  "2020-08-11 00:00:00", // DateExamain,
  "2020-08-11 00:00:00", // DateRedaction,
  "2020-09-22 00:00:00", // DateFacturation,
];

const delais = calcDelais(dates, []);
