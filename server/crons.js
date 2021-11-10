const CronJob = require("cron").CronJob;
const kpisHelpers = require("./main/kpis/helpers");
const { execCalcDelais } = require("./main/kpis/helpers/crons");
const { generateProjectOfInvoice } = require("./main/portal/invoices/crons");
const clientsModCron = require("./main/portal/clients/crons");
const jobs = [];

// Client module crons
jobs.push(...clientsModCron);

// Runs on active folders folder
jobs.push(
  new CronJob(
    "0 * * * *", // every 15 minutes
    function () {
      try {
        execCalcDelais(true)
          .then(() =>
            console.log({
              cron: true,
              message:
                "[OriginServer] Cron execCalcDelais(active: true) executed",
            })
          )
          .catch((error) => console.error(error));
      } catch (error) {
        console.error(error);
      }
    }
  )
);

// Runs on every folder
jobs.push(
  new CronJob(
    "0 0 * * *", // Every day at 0'
    function () {
      try {
        execCalcDelais()
          .then(() =>
            console.log({
              cron: true,
              message:
                "[OriginServer] Cron execCalcDelais(active: false) executed",
            })
          )
          .catch((error) => console.error(error));
      } catch (error) {
        console.error(error);
      }
    }
  )
);

// // Generate project of invoices
// jobs.push(
//   new CronJob(
//     "* * * * *", // every minute
//     function () {
//       try {
//         generateProjectOfInvoice()
//           .then(() =>
//             console.log({
//               cron: true,
//               message: "[OriginServer] Cron generateProjectOfInvoice executed",
//             })
//           )
//           .catch((error) => console.error(error));
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   )
// );

module.exports = jobs;
