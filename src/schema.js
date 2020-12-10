const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    login(username: String!, password: String!): TokenPaylod!
    users: [User]
    verifyToken(token: String!): User
  }

  type TokenPaylod {
    token: String
  }

  type User {
    id: ID!
    username: String!
    createdAt: String
    updatedAt: String
  }

  type Mutation {
    addUser(username: String, password: String): User
  }
`;

module.exports = typeDefs;
