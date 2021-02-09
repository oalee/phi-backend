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
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    token: Sequelize.STRING,

    type: {
      type: Sequelize.ENUM,
      values: ["Admin", "Patient", "Therapist"],
    },
  });

  const payload = db.define("Payloadz", {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    token: Sequelize.TEXT,
    userId: Sequelize.UUID,
  });
  users.beforeCreate((user) => (user.id = uuid()));
  payload.beforeCreate((payload) => (payload.id = uuid()));

  users.sync();
  payload.sync();

  db.authenticate();

  return {
    db,
    users,
    payload,
  };
};