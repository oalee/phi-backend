require("dotenv").config();

const { ApolloServer } = require("apollo-server");
const isEmail = require("isemail");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { createStore } = require("./datasources/localdataSource/dbUtil");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const internalEngineDemo = require("./engine-demo");

// creates a sequelize connection once. NOT for every request
const store = createStore();

// set up any dataSources our resolvers need
const dataSources = () => ({
  // launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({
    store,
  }),
});

// the function that sets up the global context for each resolver, using the req
function context({ req }) {
  // simple auth check on every request
  const auth = (req.headers && req.headers.authorization) || "";

  // console.log(
  //   `authentication header ${auth} ${req.headers} ${req.authorization}`
  // );

  // get the user token from the headers
  const token = req.headers.authentication || "";

  // console.log(`token is ${auth}`);
  // // console.log(req);
  // // console.log(dataSources);
  // // console.log(dataSources);

  // // try to retrieve a user with the token
  if (token != "") {
    const user = dataSources().userAPI.getUserForAccessToken(token);

    return {
      user,
    };
  }
  // console.log(req.body.operationName);
  // // optionally block the user
  // // we could also check user roles/permissions here
  // if (!user)
  //   throw new AuthenticationError("you must be logged in to query this schema");
}

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  introspection: true,
  playground: true,
});

// Start our server if we're not in a test env.
// if we're in a test env, we'll manually start it in a test
if (process.env.NODE_ENV !== "test") {
  server.listen().then(() => {
    console.log(`
      Server is running!
      Listening on port 4000
      Query at https://studio.apollographql.com/dev
    `);
  });
}

// export all the important pieces for integration/e2e tests to use
module.exports = {
  dataSources,
  context,
  typeDefs,
  resolvers,
  ApolloServer,
  UserAPI,
  store,
  server,
};
