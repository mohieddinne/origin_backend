// Important for babel compiler
require("core-js/stable");

global.Sentry = require("@sentry/node");
Sentry.init({
  dsn:
    "https://e9da73c9480248e1a7e8c237cb446240@o459444.ingest.sentry.io/5468292",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// Start importing the rest
const config = require("./config");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { ApolloServer, PubSub } = require("apollo-server-express");
const { sequelize, tblEmployes, Contents, UnreadArticle } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const mailHlpr = require("./helpers/email.helper");
// const schemas and resolvers
const { resolvers, typeDefs } = require("./main");

// const directives
const schemaDirectives = require("./directives");

// const helpers
const accessHelpers = require("./main/access/helpers");
const menuHelpers = require("./main/core/dynamic-menu/helpers");
const kpisHelpers = require("./main/kpis/helpers");

console.log("\nWelcome to Origin Backend Server\n");

console.log("[OriginServer] All imports are good, let's connect to the DB");

console.log("[DB] Name: " + sequelize.config.database + "\n");
console.log("[DB] Host: " + sequelize.config.host);

(async () => {
  console.log("[DB] Connecting...");
  await sequelize.authenticate();
  console.log("[DB] Connected.");
  const migrationTool = require("./migrations/");
  await migrationTool.upgrade();
  // Loading resolvers
  console.log("[OriginServer] Loading the resolvers and schemas.");
  const helpers = [accessHelpers, menuHelpers, kpisHelpers];
  // Cleaning before start
  if (config.cleanOnStart) {
    console.log("\n[OriginServer] DB cleaning actions.");
    let cleaningOps = 0;
    for (let helper of helpers) {
      if (typeof helper.cleanOnServerStart === "function") {
        if (await helper.cleanOnServerStart()) {
          cleaningOps++;
          console.log(`[OriginServer] ${helper.name} is cleaned.`);
        }
      }
    }
    if (cleaningOps > 0) {
      console.log(`[OriginServer] ${cleaningOps} cleaning operation executed.`);
      console.log(`[OriginServer] DB cleaning is over.\n`);
    } else {
      console.log(`[OriginServer] No DB cleaning is required.\n`);
    }
  } else {
    console.log(
      `[OriginServer] DB cleaning is marked FALSE for [ ${config.env} ].`
    );
  }

  console.log("[OriginServer] Creating the ExpressJS server");
  const PORT = process.env.PORT || config.port || 4000;
  const app = express();

  // Set the powred by mark
  app.use(function (req, res, next) {
    res.setHeader("X-Powered-By", "Tekru Technologies - TN");
    next();
  });

  // JWT requirements
  const jwt = require("express-jwt");
  const auth = jwt({
    secret: config.jwt_secret,
    credentialsRequired: false,
    algorithms: ["HS256"],
  });

  // Email server
  try {
    await mailHlpr.startServer();
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    console.error("[Catu] Email servise is not starting.");
  }

  // Creat Apollo Server
  console.log("[OriginServer] Creating the ApolloServer");
  const pubsub = new PubSub();
  const jwt_lib = require("jsonwebtoken");

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    introspection: !config.frontend.serve,
    playground: !config.frontend.serve,
    uploads: {
      maxFileSize: 10000000, // 10 MB
      maxFiles: 20,
    },
    subscriptions: {
      onConnect: (params) => {
        try {
          //   if (!params.authorization) throw new Error("No authorization header");
          //  const parts = params.authorization.split(" ");
          //  if (parts.length < 2) throw new Error("No token detected");
          //  const token = parts[1];
          /// const user = jwt_lib.verify(token, config.jwt_secret, {
          //  credentialsRequired: false,
          // algorithms: ["HS256"],
          // });
          return {
            //   user,
            pubsub,
          };
        } catch (error) {
          throw new Error("Bad token!");
        }
      },
      onDisconnect: (webSocket, connectionContext) => {},
    },
    context: (context) => {
      const user = context.req?.user || context.connection?.context.user;
      return { ...context, user, pubsub };
    },
  });
  app.use(server.graphqlPath, auth);
  // Handler for JWT errors
  app.use(function (err, req, res, next) {
    if (err instanceof auth.UnauthorizedError) {
      res.status(err.status).send({ message: err.message });
      return;
    }
    next();
  });

  // CORS Policy
  var corsOptions = {
    origin: false,
  };
  app.use(cors(corsOptions));
  console.log("[CORS] Origin policy: " + corsOptions.origin);

  // Upload limits
  // TODO Set an ENV var
  app.use(
    bodyParser.json({
      limit: "50mb",
    })
  );
  app.use(
    bodyParser.urlencoded({
      limit: "10mb",
      extended: true,
    })
  );

  // Make the upload folder public
  console.log(
    `[OriginServer] Serving static server folder at: ${path.join(
      __dirname,
      "../public"
    )}`
  );
  app.use("/public", express.static(path.join(__dirname, "../public")));

  // Serve staticly the frondend
  console.log(`[OriginServer] Serving the front-end...`);
  if (config.frontend.serve) {
    console.log(`[OriginServer] Verify if the frond-end folder exists...`);
    const frontend_folder = path.join(__dirname, "../", config.frontend.folder);
    // Verify if the user folder exists
    if (!fs.existsSync(frontend_folder)) {
      console.log(
        `[OriginServer] The frond-end folder don't exist, we creat it.`
      );
      fs.mkdirSync(frontend_folder); // Creat the folder
      fs.closeSync(fs.openSync(path.join(frontend_folder, "index.html"), "a")); // Creat an index.html file
    }
    // Serve the static folder
    app.use("/", express.static(frontend_folder));
    app.get("/*", function (req, res) {
      res.sendFile(path.join(frontend_folder, "index.html"));
    });
  } else {
    console.log(
      `[OriginServer] Config.frontend.serve is false. No front-end will be served.`
    );
  }

  // Apply Middleware
  server.applyMiddleware({
    app,
    //cors: true,
  });

  // Crons
  const jobs = require("./crons");

  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  // Make sure to call listen on httpServer, NOT on app.
  httpServer.listen(PORT, () => {
    let key = 0;
    for (const job of jobs) {
      job.start();
      console.log(`[OriginServer] Cron #${key} started.`);
      key++;
    }
    console.log(
      `[OriginServer] Server ready at PORT: ${PORT} |
       Endpoint: ${server.graphqlPath}\n`
    );
  });
})().catch((error) => {
  Sentry.captureException(error);
  console.error("Error ! Unhandled exception.");
  console.error(error);
  console.log("About to exit with code: 1");
  Sentry.close(2000).then(function () {
    process.exit(1);
  });
});
