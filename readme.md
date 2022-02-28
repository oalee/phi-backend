# Phi-Backend
The backend that connects to a [web front-end]() and [android front-end]().


## Architecture
This projects creates a GraphQL API with ApolloServer, an REST API upload server for content management. The API connects and manages a postgres database with Sequilize. The first source of truth for data models and API is defined with GraphQL.


## Running
This projets has two severs, one that runs on 4000 port (GraphQL Sever) and an upload server to upload the contet (runs on port 3000). The postgress database con be configured with setting the evirnoment variable dbPath (`export dbPath=postgres://postgres:postgres@localhost:5432/postgres`). Then just simply initialize and run the project. An NginX Configuration for mapping these ports to 8080 can be find at todo.
```
npm install
npm start

```

## Acknoledgments
the skeleton of this project has been forked from [this](https://github.com/apollographql/fullstack-tutorial) repository.

## License
MIT

## Skeleton
### src
the source package, contains all the source codes
#### index.js
ApolloServer init and run
#### resolvers.js
Resolvers for ApolloServer
#### schema.js
GraphQL schema definition
#### auth-utils
utility functions for authentication

## src/dataSources
the data source package, all the data sources and Stores are defined here.  
### user.js
User Data Store, used in the apolloServer init

## src/dataSources/localDataSource
### dbUtil.js
the main entry to access postgres database

