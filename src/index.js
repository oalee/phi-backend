require("dotenv").config();

const { ApolloServer } = require("apollo-server");
const isEmail = require("isemail");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { createStore } = require("./datasources/localdataSource/dbUtil");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const internalEngineDemo = require("./engine-demo");

const { verifyToken } = require("./auth-util");

const express = require("express");
var throttle = require('express-throttle-bandwidth');
var cors = require('cors')  //use this
const multer = require("multer");

const app = express();
let whitelist = ['http://localhost:5000', 'http://localhost:3000']

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin 
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) === -1) {
      var message = 'The CORS policy for this origin doesn ' +
        'allow access from the particular origin.';
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// app.use(throttle(100));

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });


const upload = multer({ dest: "uploads/" });

app.use(express.json());



const store = createStore();

const userAPI = new UserAPI({
  store
})

app.post("/upload_image", upload.single("image"), uploadFiles);
function uploadFiles(req, res) {
  console.log(`uploading an image`)
  console.log(req.body);
  console.log(req.file)

  // res.setHeader('Access-Control-Allow-Origin', '*');

  res.json({ message: "Successfully uploaded files" });
}
app.listen(5000, () => {
  console.log(`Upload Server started...`);
});

// set up any dataSources our resolvers need
const dataSources = () => ({
  // launchAPI: new LaunchAPI(),
  userAPI: userAPI
});

// the function that sets up the global context for each resolver, using the req
async function context({ req }) {
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
  // console.log(auth);
  if (auth != "") {
    const user = await userAPI.getUserForAccessToken(auth);
    // console.log(
    //   `adding user to context ${user} and ${verifyToken(auth).payload}`
    // );
    return {
      user,
    };
  } else {
    //auth is null , then only login should be available
    // console.log(` ${Object.inspect(req)}`);
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
