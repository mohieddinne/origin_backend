const { Op } = require("sequelize");
const db = require("../../../../models");
const mailHelper = require("../../../../helpers/email.helper");
const { genTimeStamp } = require("../../../../helpers/utils.helper");
const { trimSQLString } = require("../../../../helpers/sql.helpers");
const dataToExel = require("../../../../libs/exel-generator");

module.exports.nonSyncedData = async function () {
  const query = trimSQLString(`
    SELECT
      [CC].[NumeroClient] AS [NumeroClient],
      [CC].[AppellationContact] AS [Salutations],
      [C].[NomClient] AS [Entreprise],
      [CC].[NomContact] AS [NomContact],
      SUBSTRING([CC].[NomContact], 1, CHARINDEX(' ', [CC].[NomContact])) AS [Prenom],
      SUBSTRING([CC].[NomContact], LEN((SUBSTRING([CC].[NomContact], 1, CHARINDEX(' ', [CC].[NomContact])))) + 2, LEN([CC].[NomContact])) AS [Nom],
      [C].[Langue] AS [Langue],
      [CC].[Courriel] AS [Courriel],
      [CC].[TelBureau] AS [Telephone],
      [CC].[TelCellulaire] AS [Cellulaire],
      [CC].[FonctionContact] AS [Titre],
      [CC].[Adresse] AS [Adresse1],
      '' AS [Adresse2],
      [CC].[Ville] AS [Ville],
      'Québec' AS [Province],
      'Canada' AS [Pays],
      [CC].[CodePostal] AS [CodePostal]
    FROM [tblClientContact] AS [CC]
      INNER JOIN [tblClient] AS [C] ON [C].[NumeroClient] = [CC].[NumeroClient]
    WHERE [CC].[synced_date] IS NULL
		ORDER BY [C].[NomClient], [CC].[NomContact];
  `);

  return await db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
  });
};

module.exports.toExcel = async function (data) {
  return await dataToExel(
    data.map((contact) => {
      const row = Object.assign({}, contact);
      delete row.NumeroClient;
      return row;
    })
  );
};

module.exports.sendEmail = function (content, count) {
  return new Promise(async (resolve, reject) => {
    const [mailTransporter, from, subject] = await Promise.all([
      mailHelper.createTransport(),
      mailHelper.getNoReplyEmail(),
      mailHelper.renderEmailSubject("Les nouveaux contacts de la semaine"),
    ]);

    // File name
    const filename = genTimeStamp() + " Nouveaux contacts de la semaine.xlsx";

    const options = {
      from,
      to: "abathalon@origin.expert",
      cc: "mathieul@globetechnologie.com",
      subject,
      template: "crm-send-all-new-client-every-week",
      attachments: [{ filename, content }],
      context: {
        name: "Amélie Bathalon",
        sexe: "F",
        count,
      },
    };

    mailTransporter.sendMail(options, (error, info) => {
      if (error) {
        reject(error);
        throw new Error(error);
      }
      resolve(info);
    });
  });
};

module.exports.setAsSent = async function (data) {
  const contacts = data.map((contact) => {
    const { NomContact, NumeroClient } = contact;
    return {
      [Op.and]: { NomContact, NumeroClient },
    };
  });

  return await db.CustomerContact.update(
    { synced_date: new Date() },
    {
      where: {
        [Op.or]: contacts,
      },
    }
  );
};
