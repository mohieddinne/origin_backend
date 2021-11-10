const db = require("../../../models");
const {
  BillingProjectSettings,
  tblActivites,
  tblFacture,
  tblDossier,
  tblClient,
} = db;
const { report_TEC } = require("../../reports/helpers");
const invoicePdf = require("../../../helpers/pdf.helper");
// Create project invoice function

module.exports.generateProjectOfInvoice = async function () {
  // Getting settings
  const settings = await BillingProjectSettings.findAll();

  const folders = await tblDossier.findAll({
    attributes: ["NumeroDossier"],
    include: [
      {
        model: BillingProjectSettings,
        as: "settings",
      },
      {
        model: tblClient,
        as: "clients",
        include: [
          {
            model: BillingProjectSettings,
            as: "settings",
          },
        ],
      },
    ],
  });

  for (const folder of folders) {
    // console.log({ client });
    let el = null;
    if (folder.settings) el = folder.settings;
    else {
      const clientSettings = folder?.clients
        ?.map((item) => {
          if (item.settings) return item.settings?.dataValues;
          return null;
        })
        .find((e) => e);
      if (clientSettings) el = clientSettings;
      else {
        // Could't be null
        const defaultSettings = await BillingProjectSettings.findOne({
          where: { isDefault: true },
        }).then((res) => (res?.dataValues ? res?.dataValues : null));
        el = defaultSettings;
      }
    }
    const projectId = folder.NumeroDossier;
    if (!el) return;
    if (el.daysWithoutActivity) {
      // Calculating date difference
      const lastActivity = await tblActivites.findOne({
        attributes: ["id", "date"],
        where: {
          folderId: projectId,
        },
        order: [["date", "desc"]],
      });
      const actDate = new Date(lastActivity.date);
      const dateDiff = new Date(
        actDate.setDate(actDate.getDate() + settings.nbrDaysWithoutActivity)
      );
      if (dateDiff < new Date()) {
        // TODO Should create
        // console.log("should create");
        exports.createProject(projectId, "idleProject");
      }
    }
    /* TODO remove this else */ if (el.budgetBeforeFirstInvoice) {
      const report = await report_TEC({ projectNumber: projectId });
      const activityBudget = report[0]?.totalAmount;
      const budget = report[0]?.budget;
      // console.log({ activityBudget });
      // console.log({
      //   budget: folder.Budget,
      //   purcent:
      //     (folder.Budget * settings.minBudgetBeforeFirstInvoice) / 100,
      // });
      if (
        activityBudget >=
        (budget * settings.minBudgetBeforeFirstInvoice) / 100
      ) {
        // TODO Should create
        // console.log("should create");
        exports.createProject(projectId, "minBudget");
      }
    }
    /* TODO remove this else */ if (el.budgetVsTec === 1) {
      let ratioBP = settings.maxPourcentagesOfBudget?.split(",").map((el) => {
        return parseFloat(el);
      });
      // console.log({ ratioBP });
      const report = await report_TEC({ projectNumber: projectId });
      const total = report[0]?.invoiceAmount + report[0]?.totalAmount;
      const billedTotal = report[0]?.invoiceAmount;
      const budget = report[0]?.budget;
      const actualBilledRatio = (billedTotal / budget) * 100;
      const actualRatio = (total / budget) * 100;
      ratioBP = ratioBP?.filter((ratio) => ratio > actualBilledRatio);
      let i = ratioBP?.length - 1;
      while (i >= 0 && ratioBP[i]) {
        // console.log({ i });
        // console.log({ ratio: ratioBP[i], actualRatio });
        if (ratioBP[i] < actualRatio) {
          // TODO Should create
          // console.log("should create");
          exports.createProject(projectId, `budgetBreakpoint_${i}`);
          i = -1;
        }
        i--;
      }
      // console.log("*******");
    }
    /* TODO remove this else */ if (el.budgetVsTec === 2) {
      const report = await report_TEC({ projectNumber: projectId });
      const tecAmount = el.maxOfTecAmount;
      const billable = report[0]?.totalAmount;
      if (billable > tecAmount) {
        // TODO Should create
        // console.log("should create");
        exports.createProject(projectId, "tecValue");
      }
    }
  }
  
  // PDF
  const template = "project-invoice.handlebars";
  const invoice = {
    id: "8882-466",
    Fees: "700.00 $",
    administrativeCosts: "700.00 $",
    totalPart: "700.00 $",
    GST: "244.00 $",
    TVQ: "244.00 $",
    part: "50 %",
    totalAmount: "244.00 $",
  };
  const client = {
    id: 109,
    name: "Intact Compagnie d'assurance",
  };
  const folder = {
    id: "21H1202M",
    refrende: "Jean-Raymond Pierre",
    version: "21010-021685 HGX",
    adrlosses: "842 à 874, rue Lambert, Shawinigan",
  };
  const data = {
    notice: require("./notice"),
    ...invoice,
    ...folder,
    ...client,
  };
  const pdf = await invoicePdf(template, data);
};

module.exports.createProject = async function (folderId, condition) {
  console.log({ folderId, condition });
  const rules = [
    {
      value: "idleProject",
      name: "Jours sans activité atteint",
    },
    {
      value: "minBudget",
      name: "Budget minimum atteint",
    },
    {
      value: "budgetBreakpoint_0",
      name: "Pourcentage de budget numéro 1 atteint",
    },
    {
      value: "budgetBreakpoint_1",
      name: "Pourcentage de budget numéro 2 atteint",
    },
    {
      value: "budgetBreakpoint_2",
      name: "Pourcentage de budget numéro 3 atteint",
    },
    {
      value: "budgetBreakpoint_3",
      name: "Pourcentage de budget numéro 4 atteint",
    },
    {
      value: "budgetBreakpoint_4",
      name: "Pourcentage de budget numéro 5 atteint",
    },
    {
      value: "budgetBreakpoint_5",
      name: "Pourcentage de budget numéro 6 atteint",
    },
    {
      value: "tecValue",
      name: "Valeur de TEC atteinte",
    },
  ];
  const triggerRule = rules.find((el) => el.value === condition).name;
  const activities = await tblActivites.findAll({
    attributes: ["hours", "hourlyRate", "billableHours", "invoiceId"],
    where: {
      folderId,
      billableHours: 0,
      invoiceId: null,
    },
  });
  let total = 0;
  activities.forEach((act) => {
    total += act.hourlyRate * act.hours;
  });
  const lastInvoice = await tblFacture.findOne({
    attributes: ["NumeroFacture"],
    order: [["NumeroFacture", "desc"]],
  });
  const lastInvoiceNumber = parseInt(
    lastInvoice.NumeroFacture.replace("Projet", "")
  );
  //TODO fix value of invoice
  const invoice = {
    NumeroFacture: `Projet${lastInvoiceNumber}`,
    DateFacturation: new Date(),
    NumeroDossier: folderId,
    MontantFacture: total,
    triggerRule: condition,
  };
  console.log({ invoice });
};
