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

  async getExcercies(userId) {

    var allExcercies = await this.store.exercise.findAll({ where: { creatorId: userId } })
    var publicExcercies = await this.store.publicExercise.findAll()

    return [...allExcercies, ...publicExcercies].map(val => val.dataValues).map(async (exercise) => {
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

  async getExercisesFromIDList(exerciseIds) {
    let allExcercies = await this.store.exercise.findAll({ where: { id: exerciseIds } })

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


  }

  async updateExercise(exercise) {
    console.log("updating exercise ", exercise)
    var dbExercise = exercise

    if (exercise.pictures) {
      for (var key in exercise.pictures) {
        // console.log("create file ", file)
        let file = exercise.pictures[key]
        await this.store.files.upsert({
          id: file.id,
          width: file.width,
          height: file.height,
          order: file.order,
          size: file.size,
          url: file.url
        })

      }

      dbExercise.pictures = exercise.pictures.map((val) => val.id)

    }

    if (exercise.videos) {

      for (var key in exercise.videos) {
        let file = exercise.videos[key]

        await this.store.files.upsert({
          id: file.id,
          width: file.width,
          height: file.height,
          order: file.order,
          size: file.size,
          url: file.url,
          placeHolder: file.placeHolder
        })

        dbExercise.videos = exercise.videos.map((val) => val.id)

      }
    }

    if (exercise.assesments) {

      exercise.assesments.forEach(item => { if (item.id == undefined) item.id = uuidv4() })

      dbExercise.assesments = JSON.stringify(exercise.assesments)

    }
    if (exercise.parameters) {

      exercise.parameters.forEach(item => { if (item.id == undefined) item.id = uuidv4() })
      dbExercise.parameters = JSON.stringify(exercise.parameters)

    }

    const res = await this.store.exercise.update({ ...dbExercise }, { where: { id: exercise.id }, returning: true, plain: true })

    // console.log('res is')
    // console.log(res)
    // console.log('val is ', res[1].dataValues)

    var resExercise = res[1].dataValues
    // console.log("exercise is ", resExercise)
    const pictures = await this.store.files.findAll({
      where: { id: resExercise.pictures }
    })
    const videos = await this.store.files.findAll({
      where: { id: resExercise.videos }
    })
    // console.log('test')
    // console.log(videos)
    // // videos.map(value => value.dataValues)
    // console.log()
    // console.log("videos are ", videos.map(value => value.dataValues)
    // )
    resExercise.pictures = pictures.map(value => value.dataValues)

    resExercise.videos = videos.map(value => value.dataValues)

    resExercise.assesments = JSON.parse(resExercise.assesments)
    resExercise.parameters = JSON.parse(resExercise.parameters)
    // console.log(resExercise.parameters)

    // console.log(resExercise.assesments)
    console.log("returing ", resExercise)
    // console.log(JSON.parse())


    // console.log(res)
    return resExercise




  }

  async createExercise(exercise, creatorId) {

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

    exercise.parameters.forEach(item => item.id = uuidv4())
    exercise.assesments.forEach(item => item.id = uuidv4())

    const dbExercise = await this.store.exercise.create({
      ...exercise,
      videos: exercise.videos.map((val) => val.id),
      pictures: exercise.pictures.map((val) => val.id),
      parameters: JSON.stringify(exercise.parameters),
      assesments: JSON.stringify(exercise.assesments),
      creatorId: creatorId
    })


    return { ...exercise, id: dbExercise.dataValues.id }

  }

  async submitEvaluation(submitEvaluationInput) {


    submitEvaluationInput.parameters.forEach(item => item.id = uuidv4())
    submitEvaluationInput.assesments.forEach(item => item.id = uuidv4())

    const res = await this.store.evaluationResult.create({
      ...submitEvaluationInput,
      assesments: JSON.stringify(submitEvaluationInput.assesments),
      parameters: JSON.stringify(submitEvaluationInput.parameters)

    })

    const day = await this.store.therapyDay.findOne({
      where: { id: submitEvaluationInput.dayId }
    })

    const paramPerExercise = await this.store.exerciseParameter.findAll({
      where: {
        therapyDayId: day.dataValues.id
      }
    })

    const evaluationResults = await this.store.evaluationResult.findAll({
      where: {
        dayId: day.dataValues.id
      }
    })

    const transformedEvals = evaluationResults.map(val => val.dataValues).map(val => {
      return {
        ...val,
        assesments: JSON.parse(val.assesments),
        parameters: JSON.parse(val.parameters)
      }
    })

    const transformedParams = paramPerExercise.map(val => val.dataValues).map(val => {
      return {
        ...val,
        parameters: JSON.parse(val.parameters),
        enabled: val.enabled
      }
    })

    return {
      parameters: transformedParams,
      evaluation: transformedEvals,
      date: day.dataValues.date,
      id: day.dataValues.id,
      createdAt: day.dataValues.createdAt,
      updatedAt: day.dataValues.updatedAt,

    }

  }

  async getSchedule(patientId) {


    const therpaySchduleRes = await this.store.therapySchedule.findOne({
      where: {
        patientId: patientId
      }
    })

    if (therpaySchduleRes === null)
      return null

    // console.log("first res is ", therpaySchduleRes)

    const therapyDayRes = await this.store.therapyDay.findAll({
      where: {
        scheduleId: therpaySchduleRes.dataValues.id
      }
    })

    const days = therapyDayRes.map(item => item.dataValues)
    // console.log("day res ", therpaySchduleRes)

    var resDays = []
    for (let index = 0; index < days.length; index++) {
      const day = days[index];
      console.log("day is ", day)
      const paramPerExercise = await this.store.exerciseParameter.findAll({
        where: {
          therapyDayId: day.id
        }
      })

      const evaluationResults = await this.store.evaluationResult.findAll({
        where: {
          dayId: day.id
        }
      })


      console.log("res ", evaluationResults)

      const transformedEvals = evaluationResults.map(val => val.dataValues).map(val => {
        return {
          ...val,
          assesments: JSON.parse(val.assesments),
          parameters: JSON.parse(val.parameters)
        }
      })

      const transformedParams = paramPerExercise.map(val => val.dataValues).map(val => {

        // console.log("exercise parameter is ", JSON.parse(val.parameters))

        return {
          ...val,
          id: val.id,
          title: val.exerciseTitle,
          exerciseId: val.exerciseId,

          parameters: JSON.parse(val.parameters),
          additionalInstructions: val.additionalInstructions,

          enabled: val.enabled
        }
      })
      // console.log("param per ex", paramPerExercise)
      // console.log("transformed", transformedParams)

      resDays.push({
        parameters: transformedParams,
        evaluation: transformedEvals,
        date: day.date,
        id: day.id,
        createdAt: day.createdAt,
        updatedAt: day.updatedAt,

      })

    }
    console.log("final day res ", resDays)

    return {
      updatedAt: therpaySchduleRes.dataValues.updatedAt,
      createdAt: therpaySchduleRes.dataValues.updatedAt,
      id: therpaySchduleRes.dataValues.id,
      startDate: therpaySchduleRes.dataValues.startDate,
      endDate: therpaySchduleRes.dataValues.endDate,
      exerciseIds: therpaySchduleRes.dataValues.exercises,
      therapistId: therpaySchduleRes.dataValues.therapistId,
      patientId: therpaySchduleRes.dataValues.patientId,
      days: resDays

    }

  }


  async updateSchedule(scheduleInput, patientId, therapistId) {

    console.log("update ", scheduleInput)
    const tempRes = await this.store.therapySchedule.update({ ...scheduleInput, lastUpdate: new Date() }, { where: { id: scheduleInput.id }, returning: true, plain: true })
    const therpaySchduleRes = tempRes[1]
    // console.log(tempRes[0])
    // console.log("updateRes ", therpaySchduleRes)

    var therapyDays = []
    var i = 0
    if (scheduleInput.days)
      for (i = 0; i < scheduleInput.days.length; i++) {
        let day = scheduleInput.days[i]
        console.log("for day", day)
        var dbDay = { date: day.date }

        var tempDayRes
        var therapyDayRes
        if (!day.id)
          therapyDayRes = await this.store.therapyDay.create({
            ...dbDay,
            scheduleId: therpaySchduleRes.dataValues.id
          }, { returning: true, plain: true })
        else {
          tempDayRes = await this.store.therapyDay.update({
            ...dbDay,
            scheduleId: therpaySchduleRes.dataValues.id
          }, { where: { id: day.id }, returning: true, plain: true })
          therapyDayRes = tempDayRes[1]
        }
        // const therapyDayRes = tempDayRes[0]
        // console.log("therapy day values are ", therapyDayRes)
        // console.log("therapy day values are ", therapyDayRes.dataValues.id)

        var parameterExercises = []
        var j = 0;
        for (j = 0; j < day.parameters.length; j++) {
          let dayParam = day.parameters[j]
          // dayParam.title = dayParam.exerciseTitle
          // dayParam.exerciseTitle = undefined

          dayParam.parameters.forEach(item => { if (item.id == undefined) item.id = uuidv4() })


          var paramTemp

          if (!dayParam.id)
            paramTemp = await this.store.exerciseParameter.create({
              therapyDayId: therapyDayRes.dataValues.id,
              ...dayParam,
              parameters: JSON.stringify(dayParam.parameters)
            }, { returning: true, plain: true })
          else {
            paramTemp = await this.store.exerciseParameter.update({
              therapyDayId: therapyDayRes.dataValues.id,
              ...dayParam,
              parameters: JSON.stringify(dayParam.parameters)
            }, { where: { id: dayParam.id }, returning: true, plain: true })
          }

          const parameterExerciseRes = paramTemp[0]
          // parameterExercises.push({
          //   id: parameterExerciseRes.dataValues.id,
          //   title: parameterExerciseRes.dataValues.exerciseTitle,
          //   exerciseId: parameterExerciseRes.dataValues.exerciseId,
          //   parameters: JSON.parse(parameterExerciseRes.dataValues.parameters)
          // })
        }

        // therapyDays.push({
        //   id: therapyDayRes.dataValues.id,
        //   createdAt: therapyDayRes.dataValues.createdAt,
        //   updatedAt: therapyDayRes.dataValues.updatedAt,
        //   date: therapyDayRes.dataValues.date,
        //   parameters: parameterExercises
        // })
      }

    const therapyDayResz = await this.store.therapyDay.findAll({
      where: {
        scheduleId: therpaySchduleRes.dataValues.id
      }
    })

    const days = therapyDayResz.map(item => item.dataValues)
    // console.log("day res ", therpaySchduleRes)

    var resDays = []
    for (let index = 0; index < days.length; index++) {
      const day = days[index];
      // console.log("day is ", day)
      const paramPerExercise = await this.store.exerciseParameter.findAll({
        where: {
          therapyDayId: day.id
        }
      })

      const transformedParams = paramPerExercise.map(val => val.dataValues).map(val => {
        return {
          id: val.id,
          title: val.exerciseTitle,
          exerciseId: val.exerciseId,
          parameters: JSON.parse(val.parameters),
          additionalInstructions: val.additionalInstructions,
          enabled: val.enabled
        }
      })

      const evaluationResults = await this.store.evaluationResult.findAll({
        where: {
          dayId: day.id
        }
      })

      const transformedEvals = evaluationResults.map(val => val.dataValues).map(val => {
        return {
          ...val,
          assesments: JSON.parse(val.assesments),
          parameters: JSON.parse(val.parameters)
        }
      })

      resDays.push({
        parameters: transformedParams,
        evaluation: transformedEvals,
        date: day.date,
        id: day.id,
        createdAt: day.createdAt,
        updatedAt: day.updatedAt,

      })

    }

    return {
      updatedAt: therpaySchduleRes.dataValues.updatedAt,

      createdAt: therpaySchduleRes.dataValues.updatedAt,
      id: therpaySchduleRes.dataValues.id,
      startDate: therpaySchduleRes.dataValues.startDate,
      endDate: therpaySchduleRes.dataValues.endDate,
      exerciseIds: therpaySchduleRes.dataValues.exercises,
      therapistId: therpaySchduleRes.dataValues.therapistId,
      patientId: therpaySchduleRes.dataValues.patientId,
      days: resDays

    }

  }


  async addSchedule(scheduleInput, patientId, therapistId) {

    console.log("schedule input is ", scheduleInput)

    const therpaySchduleRes = await this.store.therapySchedule.create({
      startDate: scheduleInput.startDate,
      endDate: scheduleInput.endDate,
      exercises: scheduleInput.exercises,
      therapistId: therapistId,
      patientId: patientId
    })

    var therapyDays = []
    var i = 0
    for (i = 0; i < scheduleInput.days.length; i++) {
      let day = scheduleInput.days[i]
      console.log("day is ", day)
      const therapyDayRes = await this.store.therapyDay.create({
        date: day.date,
        scheduleId: therpaySchduleRes.dataValues.id
      })
      console.log("therapy day values are ", therapyDayRes.dataValues)
      var parameterExercises = []
      var j = 0;
      for (j = 0; j < day.parameters.length; j++) {
        let dayParam = day.parameters[j]
        console.log("dayParam ", dayParam)

        dayParam.parameters.forEach(item => item.id = uuidv4())
        console.log("dayParam ", dayParam)
        const parameterExerciseRes = await this.store.exerciseParameter.create({
          therapyDayId: therapyDayRes.dataValues.id,
          exerciseId: dayParam.exerciseId,
          ...dayParam,
          parameters: JSON.stringify(dayParam.parameters)
        })
        parameterExercises.push({
          id: parameterExerciseRes.dataValues.id,
          title: parameterExerciseRes.dataValues.exerciseTitle,
          exerciseId: parameterExerciseRes.dataValues.exerciseId,
          additionalInstructions: dayParam.additionalInstructions,
          parameters: dayParam.parameters,
          enabled: dayParam.enabled
        })
      }

      therapyDays.push({
        id: therapyDayRes.dataValues.id,
        createdAt: therapyDayRes.dataValues.createdAt,
        updatedAt: therapyDayRes.dataValues.updatedAt,
        date: therapyDayRes.dataValues.date,
        parameters: parameterExercises
      })


    }

    console.log("returning", {
      id: therpaySchduleRes.dataValues.id,
      createdAt: therpaySchduleRes.dataValues.createdAt,
      updatedAt: therpaySchduleRes.dataValues.updatedAt,
      startDate: therpaySchduleRes.dataValues.startDate,
      endDate: therpaySchduleRes.dataValues.endDate,
      exerciseIds: therpaySchduleRes.dataValues.exercises,
      days: therapyDays
    })

    return {
      id: therpaySchduleRes.dataValues.id,
      createdAt: therpaySchduleRes.dataValues.createdAt,
      updatedAt: therpaySchduleRes.dataValues.updatedAt,
      startDate: therpaySchduleRes.dataValues.startDate,
      endDate: therpaySchduleRes.dataValues.endDate,
      exerciseIds: therpaySchduleRes.dataValues.exercises,
      days: therapyDays
    }



  }


  async getMyQuestionares(currentUser) {

    var questainare = await this.store.questainare.findAll({
      where: { creatorId: currentUser.therapistId }
    })

    if (questainare.length == 0)
      return []

    questainare = questainare.map(item => item.dataValues)


    for (let i = 0; i < questainare.length; i++) {
      const q = questainare[i];
      const tempRes = await this.store.questions.findAll({
        where: { questainareId: q.id }
      })
      const res = tempRes.map(item => { return { ...item.dataValues, options: JSON.parse(item.dataValues.options) } })

      questainare[i].questions = res
    }

    return questainare


  }

  async addQuestionare(currentUser, questionareInput) {

    const questionareRes = await this.store.questainare.create({
      creatorId: currentUser.therapistId,
      title: questionareInput.title
    })

    var questionRes = []

    for (let i = 0; i < questionareInput.questions.length; i++) {

      //   questainareId: Sequelize.UUID,
      // order: Sequelize.INTEGER,
      // question: Sequelize.TEXT,
      // answerType: {
      //   type: Sequelize.ENUM,
      //   values: ["TEXT", "OPTIONS"],
      // },

      // order: Int!
      // question: String!
      // answerType: QuestionAnswerType!
      // options: [QuestionOptionInput]


      const question = questionareInput.questions[i];

      if (question.options != null)
        question.options.forEach(item => item.id = uuidv4())

      let res = await this.store.questions.create({
        questainareId: questionareRes.dataValues.id,
        order: question.order,
        question: question.question,
        answerType: question.answerType,
        options: JSON.stringify(question.options)

      })

      questionRes.push({ ...res.dataValues, options: question.options })

    }


    console.log("returning after add ", {
      ...questionareRes.dataValues,
      questions: questionRes
    }
    )

    return {
      ...questionareRes.dataValues,
      questions: questionRes
    }

  }


  async getMyPatients(currentUser) {

    const patients = await this.store.patientInfo.findAll({ where: { therapistId: currentUser.therapistId } })

    console.log('patients are ', patients)

    const patientIdList = patients.map(i => i.dataValues.id)
    const users = await this.store.users.findAll({ where: { patientId: patientIdList } })
    const userValues = users.map(i => i.dataValues)
    const res = patients.filter(i => i != null).map(i => {
      console.log('mapping patients, ', i)
      const user = userValues.find(val => val.patientId === i.id)
      // console.log(user)
      return { patientInfo: i.dataValues, ...user }
    })

    console.log(res)

    return res
  }

  async createUser(userInput, currentUser) {
    console.log(`create user  ${userInput}`);

    const ePass = await encryptPassword(userInput.password);
    const type = capitalizeFirstLetter(userInput.type);
    var user;
    var patient;

    if (type == "Admin")
      user = await this.store.users.create({
        username: userInput.username,
        password: ePass,
        type: type,
      });
    if (type == "Patient") {
      if (userInput.patient) {
        patient = await this.store.patientInfo.create({
          name: userInput.patient.name,
          age: userInput.patient.age,
          weight: userInput.patient.weight,
          therapistId: currentUser.therapistId
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

    if (patient) {
      return { ...user.dataValues, patient: patient.dataValues }
    }

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
