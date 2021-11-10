const nodemailer = require("nodemailer");
const handlebars = require("express-handlebars");
const hbs = require("nodemailer-express-handlebars");
const i18nHelper = require("./i18n.helper");
const utilsHelpers = require("./utils.helper");
const path = require("path");
const config = require("../config");

module.exports.createTransport = async function () {
  // Creat the mail transporter
  const mailConfig = {
    host: config.email.host,
    port: parseInt(config.email.port),
    auth: {
      user: config.email.username,
      pass: config.email.password,
    },
    secure: config.email.secure,
    requireTLS: config.email.require_TLS,
    tls: {
      rejectUnauthorized: config.email.rejectUnauthorized,
    },
  };
  const mailTransport = nodemailer.createTransport(mailConfig);

  // Get the Handlebars optionq
  const hls = handlebars.create({
    extName: ".hbs",
    partialsDir: path.join(
      __dirname,
      "../../public/assets/views/email/partials"
    ),
    layoutsDir: path.join(__dirname, "../../public/assets/views/email"),
    defaultLayout: false,
    helpers: {
      translate: function (str) {
        return i18nHelper != undefined ? i18nHelper.__(str) : str;
      },
      greetingByGender: function (name, sexe) {
        if (sexe == undefined || sexe == "M") {
          return i18nHelper.__("HELLO_M") + " " + name;
        } else {
          return i18nHelper.__("HELLO_F") + " " + name;
        }
      },
    },
  });

  const handlebarOptions = {
    viewEngine: hls,
    viewPath: path.join(__dirname, "../../public/assets/views/email"),
  };

  mailTransport.use("compile", hbs(handlebarOptions));

  return mailTransport;
};

module.exports.renderEmailSubject = async function (subject) {
  const prefix = await utilsHelpers.getOption("email_subject_prefix");
  subject = i18nHelper.__(subject);
  if (prefix == "") {
    return subject;
  }
  return prefix + " | " + subject;
};

module.exports.getNoReplyEmail = async function () {
  const [email, name] = await Promise.all([
    utilsHelpers.getOption("email_default_address"),
    utilsHelpers.getOption("email_defautl_sender_name"),
  ]);
  return name + " <" + email + ">";
};

module.exports.startServer = async function () {
  global.emailService = null;
  console.log("\n");
  console.log("[Catu] Starting email serviceses...");
  console.log(
    "[Catu] Email host: " + config.email.host + ":" + config.email.port
  );

  // Create the transporter
  const transporter = await this.createTransport();
  const verify = await transporter.verify();
  if (!verify) {
    throw new Error("Email transporter");
  }
  const ops = [
    this.getNoReplyEmail(),
    utilsHelpers.getOption("email_subject_prefix"),
  ];
  const [defaultAddress, subjectPrefix] = await Promise.all(ops);

  global.emailService = {
    transporter,
    defaultAddress,
    subjectPrefix,
  };
  console.log("[Catu] Mail service: OK.\n");
}; 