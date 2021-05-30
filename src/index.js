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
const { SHA3, SHA256 } = require("crypto-js");
const fs = require('fs')
const app = express();
const sizeOf = require('image-size')
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

let whitelist = ['http://localhost:5000', 'http://localhost:3000', 'http://195.211.44.105:5000', 'http://195.211.44.105:3000', 'http://195.211.44.105']

let fileBaseUrl = 'http://195.211.44.105:5000/'

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




var storage = multer.diskStorage({
  destination: function (req, file, cb) {

    const path = `uploads/${SHA256(req.local.user.username)}`
    console.log(`storing in ${path}`)



    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) throw err;
    });

    cb(null, path)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const type = file.originalname.split(".").pop()
    cb(null, uniqueSuffix + "." + type)
  }
})


const upload = multer({ storage: storage });

app.use(express.json());



const store = createStore();

const userAPI = new UserAPI({
  store
})


const authChecker = async function (req, res, next) {
  const auth = (req.headers && req.headers.authorization) || "";
  if (auth != "") {
    const user = await userAPI.getUserForAccessToken(auth);

    console.log(`user is logged, procceed to upload ${user.username}`)
    req.local = { user: user }

    return next()
  } else {
    const err = new Error("Not authorized! Go back!");
    err.status = 400;
    return next(err)
  }
}
function promisifyCommand(command, run = 'run') {
  return Promise.promisify((...args) => {
    const cb = args.pop()
    command
      .on('end', () => { cb(null) })
      .on('error', (error) => { cb(error) })[run](...args)
  })
}


function generateThumbnail(file) {
  var picName = file.filename.split(".")[0] + ".jpeg"

  return new Promise((resolve, reject) => {
    ffmpeg(file.path).screenshots({
      count: 1,
      folder: file.destination,
      filename: picName
    })

      .on('error', (err) => {
        console.log(`[ffmpeg] error: ${err.message}`);
        reject(err);
      })
      .on('end', () => {
        console.log('[ffmpeg] finished');
        resolve();
      })
  });
}

function proccesVideo(file) {
  // console.log(file)


  // ffmpeg(file.path).screenshots({
  //   count: 1,
  //   folder: file.destination,
  //   filename: picName
  // }).on("end", () => {
  //   var fullPAth = file.destination + "/" + picName


  // })

  var picName = file.filename.split(".")[0] + ".jpeg"
  var fullPAth = file.destination + "/" + picName


  generateThumbnail(file).then(() => { }).catch((error) => { })


  return {
    // ...sizeOf(fullPAth),
    placeHolder: fileBaseUrl + fullPAth.slice(8)
  }
}

app.post("/upload_image", authChecker, upload.single("file"), uploadFiles);
function uploadFiles(req, res) {
  console.log(`uploading an image`)

  console.log(req.body.id);
  console.log(req.file)

  // console.log(sizeOf(req.file.path))

  if (req.body.type === "image")
    res.json({
      ...sizeOf(req.file.path), url: fileBaseUrl + req.file.path.slice(8), id: req.body.id,
      type: req.file.mimetype, size: req.file.size
    });
  else {

    const fileValues = proccesVideo(req.file)
    ffmpeg.ffprobe(req.file.path, (err, metadata) => {
      // console.log(metadata);
      res.json({
        ...fileValues,
        size: req.file.size,
        width: metadata.streams[0].width,
        height: metadata.streams[0].height,
        url: fileBaseUrl + req.file.path.slice(8), id: req.body.id, type: req.file.mimetype
      });
    })

    console.log("file is", fileValues)


  }
}

app.use(express.static('uploads'))

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
  //   `authentication header ${ auth } ${ req.headers } ${ req.authorization }`
  // );

  // get the user token from the headers
  const token = req.headers.authentication || "";

  // console.log(`token is ${ auth }`);
  // // console.log(req);
  // // console.log(dataSources);
  // // console.log(dataSources);

  // // try to retrieve a user with the token
  // console.log(auth);
  if (auth != "") {
    const user = await userAPI.getUserForAccessToken(auth);
    // console.log(
    //   `adding user to context ${ user } and ${ verifyToken(auth).payload }`
    // );
    return {
      user,
    };
  } else {
    //auth is null , then only login should be available
    // console.log(` ${ Object.inspect(req) }`);
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
  playground: true
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
