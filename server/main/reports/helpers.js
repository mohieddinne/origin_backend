const db = require("../../models");
const { trimSQLString } = require("../../helpers/sql.helpers");

// Report_TEC
module.exports.report_TEC = async function ({ employees, projectNumber }) {
  let whereEmployee = "";
  if (Array.isArray(employees)) {
    whereEmployee = "AND vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable";
    if (employees[0] === "every_user" || employees.length === 0) {
      whereEmployee += " IS NOT NULL";
    } else if (employees[0] === "with_no_users") {
      whereEmployee += " IS NULL";
    } else {
      whereEmployee += " IN ('" + employees.join("', '") + "')";
    }
  }
  
  let whereProject = "";
  if (projectNumber) {
    whereEmployee = `  AND vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier = '${projectNumber}' `;
  }
  const query = `
  	DECLARE @dateAu_form AS DATE
      SET
        @dateAu_form = CAST(GETDATE() AS DATE)
        SELECT
      ISNULL(
        vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable,
        'Aucun responsable'
      ) AS Responsable,
      vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier as folderId,
      vw_qrySommaireTravauxEnCoursGlobalPass1.Reference as refrence,
      vw_qrySommaireTravauxEnCoursGlobalPass1.DateMandat AT TIME ZONE 'Eastern Standard Time' as mandateDate,
      vw_qrySommaireTravauxEnCoursGlobalPass1.DateLivraison AT TIME ZONE 'Eastern Standard Time' as deliveryDate,
      vw_qrySommaireTravauxEnCoursGlobalPass1.DernierDeDateActivite AT TIME ZONE 'Eastern Standard Time' as lastActivityDate,
      vw_qrySommaireTravauxEnCoursGlobalPass1.DateProchaineActivite AT TIME ZONE 'Eastern Standard Time' as nextActivityDate,
      vw_qrySommaireTravauxEnCoursGlobalPass1.Budget as budget,
      ROUND(ISNULL([SommeDeMontantFacture], 0), 2) as invoiceAmount,
      ROUND(
        ISNULL(
          (
            SELECT
              SUM(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantAdm
            FROM
              vw_qry_Adm_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ) + ISNULL(
          (
            SELECT
              SUM(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantDepenses
            FROM
              vw_qry_Depenses_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ) + ISNULL(
          (
            SELECT
              SUM(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantActivites
            FROM
              vw_qry_Activites_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ),
        2
      ) as totalAmount,
      ROUND(
        IIf(
          ISNULL([Budget], 0) - ISNULL([SommeDeMontantFacture], 0) - ISNULL([SommeDeMontant], 0) - ISNULL([Montant], 0) < 0,
          0,
          ISNULL([Budget], 0) - ISNULL([SommeDeMontantFacture], 0) - ISNULL([SommeDeMontant], 0) - ISNULL([Montant], 0)
        ),
        2
      ) as toComplete,
      ROUND(
        ISNULL(
          (
            SELECT
              Sum(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantAdm
            FROM
              vw_qry_Adm_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ),
        2
      ) AS SommeDeMontantAdm,
      ROUND(
        ISNULL(
          (
            SELECT
              Sum(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantDepenses
            FROM
              vw_qry_Depenses_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ),
        2
      ) AS SommeDeMontantDepenses,
      ROUND(
        ISNULL(
          (
            SELECT
              Sum(ISNULL(sdtec.Montant, 0)) AS SommeDeMontantActivites
            FROM
              vw_qry_Activites_TEC AS sdtec
            WHERE
              (
                ISNULL(sdtec.NumeroFacture, 'Projet') LIKE 'Projet%'
              )
              AND sdtec.NumeroDossier = vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier
              AND sdtec.Responsable = vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable
            GROUP BY
              sdtec.NumeroDossier,
              sdtec.Responsable
          ),
          0
        ),
        2
      ) AS SommeDeMontantActivites,
      IIF(ISNULL([Specimens], 0) = 0, '', [specimens]) as specimen,
      vw_qrySommaireTravauxEnCoursGlobalPass1.Stats as stats,
      IIf(
        ISNULL([Budget], 0) - ISNULL([SommeDeMontantFacture], 0) - ISNULL([SommeDeMontant], 0) - ISNULL([Montant], 0) < 0,
        -1,
        0
      ) AS redFlag
    FROM
      vw_qrySommaireTravauxEnCoursGlobalPass1 AS vw_qrySommaireTravauxEnCoursGlobalPass1
      LEFT JOIN vw_qrySumFactures AS vw_qrySumFactures ON vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier = vw_qrySumFactures.NumeroDossier
    WHERE
      (
        (
          (
            vw_qrySommaireTravauxEnCoursGlobalPass1.DateFerme
          ) Is Null
          Or (
            vw_qrySommaireTravauxEnCoursGlobalPass1.DateFerme
          ) > @dateAu_form
        )
      ) ${whereEmployee} ${whereProject}
    ORDER BY
  vw_qrySommaireTravauxEnCoursGlobalPass1.Responsable,
  vw_qrySommaireTravauxEnCoursGlobalPass1.NumeroDossier;`;
  const items = await db.sequelize.query(trimSQLString(query), {
    type: db.sequelize.QueryTypes.SELECT,
  });

  return items.map((item) => {
    item.stats = item.stats === "OUI";
    item.redFlag = item.redFlag === -1;
    return item;
  });
};
