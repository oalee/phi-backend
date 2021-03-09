const S3 = require("aws-sdk/clients/s3");
const isEmail = require("isemail");
const mime = require("mime");
const uuidv4 = require("uuid/v4");
const { DataSource } = require("apollo-datasource");
const {
  getToken,
  verifyToken,
  encryptPassword,
  comparePassword,
} = require("../auth-util");

const {
  ApolloError,
  UserInputError,
  AuthenticationError,
} = require("apollo-server");

function capitalizeFirstLetter(string) {
  console.log(`capitilize this ${string}`);

  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
class UserAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
    // console.log(store);
  }

  /**
   * This is a function that gets called by ApolloServer when being setup.
   * This function gets called with the datasource config including things
   * like caches and context. We'll assign this.context to the request context
   * here, so we can know about the user making requests
   */
  initialize(config) {
    this.context = config.context;
  }

  async login({ username, password }) {
    const users = await this.store.users.findAll({
      where: {
        username: username,
      },
    });

    if (users.length != 1) {
      throw new AuthenticationError("Wrong Password!");
    }

    const user = users[0].dataValues;

    const isMatch = await comparePassword(password, user.password);
    if (isMatch) {
      const token = getToken(user);

      const cd = await this.store.payload.create({
        userId: user.id,
        token: token,
      });

      return { token: token };
    } else {
      throw new AuthenticationError("Wrong Password!");
    }
  }

  async getAllUsers() {
    const users = await this.store.users
      .findAll()
      .map((user) => user.dataValues);

    // console.log(users);
    return users;
  }

  async getPatientInfo(user) {
    const pInfo = await this.store.patientInfo.findOne({
      where: { id: user.patientId },
    });

    return pInfo;
  }

  async getTherapistInfo(user) {
    const pInfo = await this.store.therapist.findOne({
      where: { id: user.therapistId },
    });

    return pInfo;
  }

  async getExcercies() {

    var allExcercies = await this.store.exercise.findAll()
    return allExcercies.map(val => val.dataValues).map(async (exercise) => {
      console.log("exercise is ", exercise)
      const pictures = await this.store.files.findAll({
        where: { id: exercise.pictures }
      })
      const videos = await this.store.files.findAll({
        where: { id: exercise.videos }
      })
      exercise.pictures = pictures
      exercise.videos = videos
      exercise.assesments = JSON.parse(exercise.assesments)
      exercise.parameters = JSON.parse(exercise.parameters)
      console.log(exercise.parameters)

      console.log(exercise.assesments)
      console.log("returing ", exercise)
      // console.log(JSON.parse())
      return exercise
    })


    return allExcercies
  }

  async createExercise(exercise) {

    console.log("creating exercise ", exercise)

    for (var key in exercise.pictures) {
      // console.log("create file ", file)
      let file = exercise.pictures[key]
      await this.store.files.create({
        id: file.id,
        width: file.width,
        height: file.height,
        order: file.order,
        size: file.size,
        url: file.url
      })

    }


    for (var key in exercise.videos) {
      let file = exercise.videos[key]

      await this.store.files.create({
        id: file.id,
        width: file.width,
        height: file.height,
        order: file.order,
        size: file.size,
        url: file.url,
        placeHolder: file.placeHolder
      })
    }

    // exercise.videos = exercise.videos.map( (val) => val.id )
    // exercise.pictures = exercise.pictures.map( (val) => val.id )

    const dbExercise = await this.store.exercise.create({
      ...exercise,
      videos: exercise.videos.map((val) => val.id),
      pictures: exercise.pictures.map((val) => val.id),
      parameters: JSON.stringify(exercise.parameters),
      assesments: JSON.stringify(exercise.assesments)
    })


    return { ...exercise, id: dbExercise.dataValues.id }

  }

  async createUser(userInput) {
    console.log(`create user  ${userInput}`);

    const ePass = await encryptPassword(userInput.password);
    const type = capitalizeFirstLetter(userInput.type);
    var user;
    if (type == "Admin")
      user = await this.store.users.create({
        username: userInput.username,
        password: ePass,
        type: type,
      });
    if (type == "Patient") {
      if (userInput.patient) {
        const patient = await this.store.patientInfo.create({
          name: userInput.patient.name,
        });

        console.log(`patient is ${patient.dataValues}`);

        user = await this.store.users.create({
          username: userInput.username,
          password: ePass,
          type: type,
          patientId: patient.dataValues.id,
        });
      } else {
        // throw error
        throw new UserInputError(
          "type is patient and there is no patient Input"
        );
      }
    }

    if (type == "Therapist") {
      if (userInput.therapist) {
        const therapist = await this.store.therapist.create({
          name: userInput.therapist.name,
        });

        // console.log(`patient is ${patient.dataValues}`);

        user = await this.store.users.create({
          username: userInput.username,
          password: ePass,
          type: type,
          therapistId: therapist.dataValues.id,
        });
      } else {
        // throw error
        throw new UserInputError(
          "type is patient and there is no patient Input"
        );
      }
    }
    // console.log("start, ")
    // console.log(user)

    // const token = getToken(user.dataValues);

    // const cd = await this.store.payload.create({
    //   userId: user.dataValues.id,
    //   token: token,
    // });

    // console.log(token)

    // console.log('token?')

    // console.log(`user is ${user.dataValues}`);

    return user.dataValues;
  }

  async getUserForAccessToken(token) {
    console.log("find user for token");
    const tokens = await this.store.payload.findAll({
      where: { token: token },
    });

    // console.log(tokens);

    if (tokens.length <= 0) throw new AuthenticationError("Invalid Token!");
    else {
      const user = await this.store.users.findOne({
        where: { id: tokens[0].dataValues.userId },
      });

      // console.log(user);

      return user.dataValues;
    }
  }

  /**
   * User can be called with an argument that includes email, but it doesn't
   * have to be. If the user is already on the context, it will use that user
   * instead
   */
  // async createUser({ email: emailArg } = {}) {
  //   const email =
  //     this.context && this.context.user ? this.context.user.email : emailArg;
  //   if (!email || !isEmail.validate(email)) return null;

  //   const users = await this.store.users.findOrCreate({ where: { email } });
  //   return users && users[0] ? users[0] : null;
  // }

  async bookTrips({ launchIds }) {
    const userId = this.context.user.id;
    if (!userId) return;

    let results = [];

    // for each launch id, try to book the trip and add it to the results array
    // if successful
    for (const launchId of launchIds) {
      const res = await this.bookTrip({ launchId });
      if (res) results.push(res);
    }

    return results;
  }

  async bookTrip({ launchId }) {
    const userId = this.context.user.id;
    const res = await this.store.trips.findOrCreate({
      where: { userId, launchId },
    });
    return res && res.length ? res[0].get() : false;
  }

  async cancelTrip({ launchId }) {
    const userId = this.context.user.id;
    return !!this.store.trips.destroy({ where: { userId, launchId } });
  }

  async getLaunchIdsByUser() {
    const userId = this.context.user.id;
    const found = await this.store.trips.findAll({
      where: { userId },
    });
    return found && found.length
      ? found.map((l) => l.dataValues.launchId).filter((l) => !!l)
      : [];
  }

  async isBookedOnLaunch({ launchId }) {
    if (!this.context || !this.context.user) return false;
    const userId = this.context.user.id;
    const found = await this.store.trips.findAll({
      where: { userId, launchId },
    });
    return found && found.length > 0;
  }

  /**
   * This function is currently only used by the iOS tutorial to upload a
   * profile image to S3 and update the user row
   */
  async uploadProfileImage({ file }) {
    const userId = this.context.user.id;
    if (!userId) return;

    // Create new S3 client instance
    const s3 = new S3();

    /**
     * Destructure mimetype and stream creator from provided file and generate
     * a unique filename for the upload
     */
    const { createReadStream, mimetype } = await file;
    const filename = uuidv4() + "." + mime.getExtension(mimetype);

    // Upload the file to an S3 bucket using the createReadStream
    const { AWS_S3_BUCKET } = process.env;
    await s3
      .upload({
        ACL: "public-read", // This will make the file publicly available
        Body: createReadStream(),
        Bucket: AWS_S3_BUCKET,
        Key: filename,
        ContentType: mimetype,
      })
      .promise();

    // Save the profile image URL in the DB and return the updated user
    return this.context.user.update({
      profileImage: `https://${AWS_S3_BUCKET}.s3.us-west-2.amazonaws.com/${filename}`,
    });
  }
}

module.exports = UserAPI;
