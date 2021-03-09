const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    """
    gets excersices

    Equivalent to GET /exercises
    """
    exercises(
      """
      patientId
      """
      patientId: String!
    ): [Exercise]

    allExercises: [Exercise]

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

  type Exercise {
    createdAt: String
    updatedAt: String
    creator: Therapist
    id: ID!
    longDescription: String!
    pictures: [URLHolder]!
    scheduleInfo: ScheduleInfo
    shortDescription: String!
    title: String!
    videos: [URLHolder]!
    parameters: Parameters
    assesments: Assesments
  }

  type Assesments{
    tiredness: Assesment
    dificulty: Assesment
    shortnessOfBreath: Assesment
    pain: Assesment

  }
  type Assesment{
    enabled: Boolean!
    name: String!

  }


  type Parameters{
    sets: Parameter
    reps: Parameter
    repPerDay: Parameter
    hold: Parameter
    restPerSet: Parameter
    totalDUration: Parameter
  }

  type Parameter{
    enabled: Boolean!
    name: String!
    value: Int
    secondValue: Int
    valueType: ParameterType

  }

  enum ExerciseType{
    Exercise,
    Educational
  }

  enum ParameterType{
    rep,
    time
  }

  type URLHolder{
    url: String!
    width: Int
    height: Int
    placeHolder: String
    type: String
    order: Int
  }

  type Therapist {
    excersices: [Exercise]!
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
    exercises: [Exercise]
    id: ID!
    name: String!
  }

  enum Type {
    Admin
    Patient
    Therapist
  }

  type Mutation {
    """
    Adds an excersice to the system

    Equivalent to POST /exercises
    """
    addExercise(exerciseInput: ExerciseInput): Exercise

    """
    Adds an user to the system

    Equivalent to POST /users
    """
    addUser(userInput: UserInput): User
  }

  input ExerciseInput {
    longDescription: String!
    pictures: [URLHolderInput]!
    shortDescription: String!
    title: String!
    type: ExerciseType
    videos: [URLHolderInput]!
    parameters: ParametersInput
    assesments: AssesmentsInput
    state: String
  }

  input URLHolderInput{
    url: String!
    width: Int
    height: Int
    placeHolder: String
    type: String
    id: ID
    size: Int
    order: Int
  }
  input TherapistInput {
    name: String!
  }
  input ParametersInput{
    sets: ParameterInput
    reps: ParameterInput
    repPerDay: ParameterInput
    hold: ParameterInput
    restPerSet: ParameterInput
    totalDuration: ParameterInput
  }

  input ParameterInput{
    enabled: Boolean!
    name: String!
    title: String
    value: Int
    secondValue: Int
    valueType: ParameterType

  }

  input AssesmentsInput{
    tiredness: AssesmentInput
    dificulty: AssesmentInput
    shortnessOfBreath: AssesmentInput
    pain: AssesmentInput

  }
  input AssesmentInput{
    enabled: Boolean!
    name: String!
    title: String


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
