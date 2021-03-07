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

  const exercise = db.define("Excercise", {
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
    longDescription: Sequelize.STRING,

    pictures: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    videos: {
      type: Sequelize.ARRAY(Sequelize.STRING),
    },
    creatorId: Sequelize.UUID, //TherapistId
  });

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

  const payload = db.define("Payloadz", {
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

  users.sync();
  payload.sync();
  exercise.sync();
  patientInfo.sync();
  schedule.sync();
  scheduleInfo.sync();
  therapist.sync();

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
  };
};
