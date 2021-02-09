# Phi-Backend
this projects creates a GraphQL API with ApolloServer, connects and manages postgres database with Sequilize.

## Architecture
The first source of truth for data models and API is defined with OpenAPI3 located at `api/file.yaml`, then this file is used to generate GraphQL schema with [openapi-to-graphql](https://github.com/IBM/openapi-to-graphql). consequentially the database models are defined with little modifications in `src/datasources/localdataSource/dbUtils` with Sequilize. 

### Documentation
#### src
##### index.js
ApolloServer init and run
##### resolvers.js
Resolvers for ApolloServer
##### schema.js
GraphQL schema definition
##### auth-utils
utility functions for authentication

### src/dataSources
#### user.js
User Data Store, used in the apolloServer init

### src/dataSources/localDataSource
#### dbUtil.js
the main entry to access postgres database


## Running
to run the project you need to have a running postgres database, the configuration for now is directly at `src/datasources/localdataSource/dbUtils` file running in the localhost ("postgres://postgres:postgres@localhost:5432/postgres"). then just simply initialize and run the project
```
npm install
npm start

```

## Acknoledgments
the skeleton of this project has been forked from [this](https://github.com/apollographql/fullstack-tutorial) repository.

## License
MIT