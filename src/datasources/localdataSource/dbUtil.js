const { Sequelize } = require("sequelize");
const uuid = require("uuid/v4");
require('dotenv').config();

module.exports.paginateResults = ({
  after: cursor,
  pageSize = 20,
  results,
  // can pass in a function to calculate an item's cursor
  getCursor = () => null,
}) => {
  if (pageSize < 1) return [];

  if (!cursor) return results.slice(0, pageSize);
  const cursorIndex = results.findIndex((item) => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let itemCursor = item.cursor ? item.cursor : getCursor(item);

    // if there's still not a cursor, return false by default
    return itemCursor ? cursor === itemCursor : false;
  });

  return cursorIndex >= 0
    ? cursorIndex === results.length - 1 // don't let us overflow
      ? []
      : results.slice(
        cursorIndex + 1,
        Math.min(results.length, cursorIndex + 1 + pageSize)
      )
    : results.slice(0, pageSize);
};

module.exports.createStore = () => {
  const db = new Sequelize(
    `${process.env.dbPath}`
  );

  const users = db.define("User", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
    },
    password: Sequelize.STRING,
    // token: Sequelize.STRING,

    type: {
      type: Sequelize.ENUM,
      values: ["Admin", "Patient", "Therapist"],
    },
    patientId: Sequelize.UUID,
    therapistId: Sequelize.UUID,
  });

  const exercise = db.define("Exercise", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    title: Sequelize.STRING,
    shortDescription: Sequelize.STRING,
    longDescription: Sequelize.TEXT,

    // type: Sequelize.STRING,

    pictures: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    videos: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    type: {
      type: Sequelize.ENUM,
      values: ["Exercise", "Educational"],
    },

    creatorId: Sequelize.TEXT, //TherapistId
    parameters: Sequelize.TEXT,
    assesments: Sequelize.TEXT,
    parentId: Sequelize.TEXT,

    instructions: Sequelize.TEXT,
    additionalInstructions: Sequelize.TEXT

  });

  const publicExercise = db.define("PublicExercise", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    title: Sequelize.STRING,
    shortDescription: Sequelize.STRING,
    longDescription: Sequelize.TEXT,

    // type: Sequelize.STRING,

    pictures: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    videos: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    type: {
      type: Sequelize.ENUM,
      values: ["Exercise", "Educational"],
    },

    creatorId: Sequelize.TEXT, //TherapistId
    parameters: Sequelize.TEXT,
    assesments: Sequelize.TEXT,
    parentId: Sequelize.TEXT

    ,

    instructions: Sequelize.TEXT,
    additionalInstructions: Sequelize.TEXT

  });
  const files = db.define("FileRecords", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    url: Sequelize.STRING,
    placeHolder: Sequelize.STRING,
    size: Sequelize.INTEGER,
    width: Sequelize.INTEGER,
    height: Sequelize.INTEGER,
    order: Sequelize.INTEGER

  })

  const patientInfo = db.define("PatientInfo", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    name: Sequelize.STRING,
    age: Sequelize.INTEGER,
    weight: Sequelize.INTEGER,
    therapistId: Sequelize.UUID

  });

  const therapist = db.define("Therapist", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    name: Sequelize.STRING,
    phoneNumber: Sequelize.STRING
  });


  const therapySchedule = db.define("TherapySchedule", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    // createdAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    lastUpdate: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    startDate: Sequelize.STRING,
    endDate: Sequelize.STRING,
    exercises: Sequelize.ARRAY(Sequelize.UUID),
    patientId: Sequelize.UUID,
    therapistId: Sequelize.UUID
  });

  const therapyDay = db.define("TherapyDay", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    // createdAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    // updatedAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    date: Sequelize.STRING,
    scheduleId: Sequelize.UUID,
    questionareIds: Sequelize.ARRAY(Sequelize.UUID),

  })

  const exerciseParameter = db.define("ExerciseParameter", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    // createdAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    // updatedAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    therapyDayId: Sequelize.UUID,
    exerciseId: Sequelize.UUID,
    // exerciseTitle: Sequelize.STRING,
    parameters: Sequelize.TEXT,
    enabled: Sequelize.BOOLEAN,
    additionalInstructions: Sequelize.TEXT
  })

  const exerciseAssesment = db.define("ExerciseAssesment", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    exerciseId: Sequelize.UUID,
    therapyDayId: Sequelize.UUID,
    assesments: Sequelize.TEXT
  })

  const payload = db.define("Payloadz", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    // createdAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    // updatedAt: {
    //   type: Sequelize.DATE,
    //   defaultValue: Sequelize.NOW,
    // },
    token: Sequelize.TEXT,
    userId: Sequelize.UUID,
  });

  const evaluationResult = db.define("EvaluationResult", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },

    dayId: Sequelize.UUID,
    exerciseId: Sequelize.UUID,
    feedback: Sequelize.STRING,
    parameters: Sequelize.TEXT,
    assesments: Sequelize.TEXT

  })

  const questainare = db.define("Questainare", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    creatorId: Sequelize.UUID, //TherapistId
    title: Sequelize.TEXT
  })

  const questions = db.define("Questions", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    questainareId: Sequelize.UUID,
    order: Sequelize.INTEGER,
    question: Sequelize.TEXT,
    answerType: {
      type: Sequelize.ENUM,
      values: ["TEXT", "OPTIONS"],
    },
    options: Sequelize.TEXT
  })

  const questionAnswers = db.define("QuestionAnswer", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    questionId: Sequelize.UUID,
    dayId: Sequelize.UUID,
    answerStr: Sequelize.TEXT,
    answeredOptionId: Sequelize.UUID
  })

  const questionOption = db.define("QuestionOptions", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    questionId: Sequelize.UUID,
    order: Sequelize.INTEGER,
    value: Sequelize.TEXT

  })

  questionAnswers.beforeCreate((user) => (user.id = uuid()));

  questainare.beforeCreate((user) => (user.id = uuid()));
  questions.beforeCreate((user) => (user.id = uuid()));
  questionOption.beforeCreate((user) => (user.id = uuid()));


  users.beforeCreate((user) => (user.id = uuid()));
  payload.beforeCreate((payload) => (payload.id = uuid()));
  exercise.beforeCreate((obj) => (obj.id = uuid()));
  patientInfo.beforeCreate((obj) => (obj.id = uuid()));
  // schedule.beforeCreate((obj) => (obj.id = uuid()));
  // scheduleInfo.beforeCreate((obj) => (obj.id = uuid()));
  therapist.beforeCreate((obj) => (obj.id = uuid()));
  publicExercise.beforeCreate((obj) => (obj.id = uuid()));
  therapyDay.beforeCreate((obj) => (obj.id = uuid()));
  therapySchedule.beforeCreate((obj) => (obj.id = uuid()));
  exerciseParameter.beforeCreate((obj) => (obj.id = uuid()));
  exerciseAssesment.beforeCreate((obj) => (obj.id = uuid()));
  evaluationResult.beforeCreate((obj) => (obj.id = uuid()));

  questionAnswers.sync()
  questainare.sync();
  questions.sync();
  questionOption.sync();


  users.sync();
  payload.sync();
  exercise.sync();
  patientInfo.sync();
  // schedule.sync();
  // scheduleInfo.sync();
  therapist.sync();
  files.sync()
  publicExercise.sync()
  therapyDay.sync()
  therapySchedule.sync()
  exerciseParameter.sync()
  exerciseAssesment.sync()
  evaluationResult.sync()

  db.authenticate();

  return {
    db,
    users,
    payload,
    exercise,
    patientInfo,
    therapist,
    evaluationResult,
    files,
    publicExercise,
    therapyDay,
    therapySchedule,
    exerciseParameter,
    exerciseAssesment,
    questainare,
    questions,
    questionOption,
    questionAnswers
  };
};
