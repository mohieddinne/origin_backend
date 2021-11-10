# Origin backend

Origin Apollo is an Apollo Server for Origin Expert company in Canada.

Created by **Globe Technologie Inc** (Canda)

## Installation

Make sure you have [Node.js](https://nodejs.org/).
Use the package manager [NPM](https://www.npmjs.com/) to install Origin Backend.

```bash
npm install
```

Your app should now be running on [localhost:8880/graphql](http://localhost:8880/graphql).

Do not deploy the /server folder

## Dev run

If you already installed the dev server, execute

```bash
npm start
```

## Built With

- [NodeJS](https://nodejs.org/) - The web framework
- [ExpressJS](https://expressjs.com/fr/) - Web infrastructure
- [ApolloServer](https://www.apollographql.com/) - GraphQL server

## Deployment

To genereate the deployment code, you need to build the code before.

**Important**: To build to code you'll need the _devDependencies_ from the _package.json_ file.

```bash
npm run build
```

The **Babel** will then build to /server (ES6) folder to /build _(standard javascript)_. Then start the server using:

```bash
node build/app.js
```

**Important**: need to set the NODE_ENV before node inde.js
**Important**: update the configs in \_config.json\*

## Erros

| Const             | Description                               |
| ----------------- | ----------------------------------------- |
| NOT_AUTHENTICATED | You are not authenticated.                |
| NOT_AUTHORIZED    | You are not authorized for this resource. |
| USER_DISABLED     | Your user is disabled.                    |
| REQUEST_ERROR     | The request has errors.                   |

## Authors

**Mohamed Kharrat** - kharratm [at] globetechnologie.com

## License

Private code owned by **Globe technologie Inc**
