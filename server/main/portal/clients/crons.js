const CronJob = require("cron").CronJob;
const cwReport = require("./helpers/contactsWeeklyReport");
const jobs = [];

// Runs on every folder
/*
jobs.push(
  new CronJob(
    "0 3 * * 1", // At 03:00 on Monday.
    async function () {
      try {
        const data = await cwReport.nonSyncedData();
        const file = await cwReport.toExcel(data);
        cwReport.sendEmail(file, data.length).then(() => {
          return cwReport.setAsSent(data);
        });
      } catch (error) {
        console.error(error);
      }
    }
  )
);
*/

module.exports = jobs;
