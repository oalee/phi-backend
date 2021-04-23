const { Sequelize } = require("sequelize");
const uuid = require("uuid/v4");

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
    "postgres://postgres:postgres@localhost:5432/postgres"
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
    parentId: Sequelize.TEXT
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
  });

  const schedule = db.define("Schedule", {
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
    exerciseId: Sequelize.UUID,
    patientId: Sequelize.UUID,
    scheduleInfoId: Sequelize.UUID,
  });

  const scheduleInfo = db.define("ScheduleInfo", {
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
    startDate: Sequelize.DATE,
    endDate: Sequelize.DATE,
    scheduleDays: Sequelize.ARRAY(Sequelize.DATE),
    scheduleType: {
      type: Sequelize.ENUM,
      values: ["Daily", "TwoDays", "ThreeDays"],
    },
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
    exerciseTitle: Sequelize.STRING,
    parameters: Sequelize.TEXT,
    enabled: Sequelize.BOOLEAN
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
  users.beforeCreate((user) => (user.id = uuid()));
  payload.beforeCreate((payload) => (payload.id = uuid()));
  exercise.beforeCreate((obj) => (obj.id = uuid()));
  patientInfo.beforeCreate((obj) => (obj.id = uuid()));
  schedule.beforeCreate((obj) => (obj.id = uuid()));
  scheduleInfo.beforeCreate((obj) => (obj.id = uuid()));
  therapist.beforeCreate((obj) => (obj.id = uuid()));
  publicExercise.beforeCreate((obj) => (obj.id = uuid()));
  therapyDay.beforeCreate((obj) => (obj.id = uuid()));
  therapySchedule.beforeCreate((obj) => (obj.id = uuid()));
  exerciseParameter.beforeCreate((obj) => (obj.id = uuid()));

  users.sync();
  payload.sync();
  exercise.sync();
  patientInfo.sync();
  schedule.sync();
  scheduleInfo.sync();
  therapist.sync();
  files.sync()
  publicExercise.sync()
  therapyDay.sync()
  therapySchedule.sync()
  exerciseParameter.sync()


  db.authenticate();

  return {
    db,
    users,
    payload,
    exercise,
    patientInfo,
    therapist,
    schedule,
    scheduleInfo,
    files,
    publicExercise,
    therapyDay,
    therapySchedule,
    exerciseParameter
  };
};
