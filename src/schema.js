const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    """
    gets excersices

    Equivalent to GET /excercises
    """
    excercises(
      """
      patientId
      """
      patientId: String!
    ): [Excercise]

    """
    Equivalent to GET /login
    """
    tokenPayload(password: String!, username: String!): TokenPayload

    """
    Equivalent to GET /user
    """
    user: User

    """
    Equivalent to GET /users
    """
    users: [User]
  }

  type Excercise {
    createdAt: String!
    creator: Therapist!
    id: ID!
    longDescription: String!
    pictures: [String]!
    scheduleInfo: ScheduleInfo!
    shortDescription: String!
    title: String!
    updatedAt: String!
    videos: [String]!
  }

  type Therapist {
    excersices: [Excercise]!
    id: ID!
    name: String!
  }

  type ScheduleInfo {
    createdAt: String!
    endDate: String!
    id: ID!
    scheduleDays: [String]!
    scheduleType: ScheduleType!
    startDate: String!
    updatedAt: String!
  }

  enum ScheduleType {
    DAILY
    TWODAYS
    THREEDAYS
  }

  type TokenPayload {
    token: String!
  }

  type User {
    id: ID!
    password: String
    patient: PatientInfo
    patientId: String
    therapist: Therapist
    therapistId: String
    type: Type!
    username: String!
  }

  type PatientInfo {
    exercises: [Excercise]
    id: ID!
    name: String!
  }

  enum Type {
    ADMIN
    PATIENT
    THERAPIST
  }

  type Mutation {
    """
    Adds an excersice to the system

    Equivalent to POST /excercises
    """
    addExcersice(excerciseInput: ExcerciseInput): String

    """
    Adds an user to the system

    Equivalent to POST /users
    """
    addUser(userInput: UserInput): User
  }

  input ExcerciseInput {
    creator: ID
    longDescription: String!
    pictures: [String]!
    scheduleInfo: ScheduleInfoInput!
    shortDescription: String!
    title: String!
    videos: [String]!
  }

  input TherapistInput {
    name: String!
  }

  input ScheduleInfoInput {
    endDate: String!
    scheduleDays: [String]!
    scheduleType: ScheduleType!
    startDate: String!
  }

  input UserInput {
    password: String!
    patient: PatientInfoInput
    patientId: String
    therapist: TherapistInput
    therapistId: String
    type: Type!
    username: String!
  }

  input PatientInfoInput {
    name: String!
  }
`;

module.exports = typeDefs;
