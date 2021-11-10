module.exports.formatLongDate = function (date, dateOnly) {
  const isValid = Date.parse(date);
  if (!isValid) return null;

  const d = new Date(date);
  let string;

  string = d.getFullYear();
  string = string + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
  string = string + "-" + ("0" + d.getDate()).slice(-2);

  if (dateOnly) return string;

  string = string + " " + ("0" + d.getHours()).slice(-2);
  string = string + ":" + ("0" + d.getMinutes()).slice(-2);
  string = string + ":" + ("0" + d.getSeconds()).slice(-2);

  return string;
};

module.exports.isValidDate = function (date) {
  return date instanceof Date && !isNaN(date);
};

module.exports.daysOfAWeek = function (current) {
  const week = [];
  const dd = new Date(current);
  if (!module.exports.isValidDate(dd)) {
    return week;
  }
  let daysToSunday = dd.getDate() - dd.getDay() - 1;
  const pointer = new Date(dd.setDate(daysToSunday));
  for (let i = 0; i < 7; i++) {
    const e = new Date(pointer.setDate(pointer.getDate() + 1));
    week.push(e);
  }
  return week;
};
