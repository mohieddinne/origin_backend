const db = require("../../../models");
const mailHelper = require("../../../helpers/email.helper");

const { EmailTemplate } = db;

module.exports.sendEmailtemplate = function (content) {
  return new Promise(async (resolve, reject) => {
    const [mailTransporter, from, subject] = await Promise.all(
      mailHelper.createTransport(),
      mailHelper.getNoReplyEmail(),
      mailHelper.renderEmailSubject("Les nouveaux contacts de la semaine")
    );
    const data = await EmailTemplate.findOne({
      where: { slug: "user-forget-password" },
    });
    const options = {
      from: data.contents.from_name,
      to: "kadidam@globetechnologie.com",
      subject: data.contents.object,
      template: data.contents.message,
      content,
      name: data.name,
      attachments: [{ filename: data.category.name }],
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
