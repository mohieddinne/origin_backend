/**
 * Tekru SQL helpers
 */

module.exports.trimSQLString = function (sql) {
  return sql
    .replace(/\t/g, "")
    .replace(/\n/g, " ")
    .replace(/\s\s+/g, " ")
    .trim();
};

/**
 * Get paging variables from Input PagingOptions
 * The numbers of requested items
 */
module.exports.paging = function (input) {
  let count = 25,
    offset = 0;
  if (input.first > 0) count = input.first;
  if (input.offset >= 0) offset = input.offset;
  else if (input.pointer > 0) offset = (input.pointer - 1) * count;
  return { count, offset };
};
