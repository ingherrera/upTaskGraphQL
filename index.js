const { ApolloServer } = require('apollo-server')
const jwt = require('jsonwebtoken')
require('dotenv').config('variables.env')

const typeDefs = require('./db/schema')
const resolvers = require('./db/resolvers')
const conectarDB = require('./config/db')

// Conectar a la BD 
conectarDB()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => {
    // console.log("Request Header...", req.headers);
    // console.log("Request Headert Authorization....", req.headers['authorization']);


    const token = req.headers['authorization'] || ''
    // console.log("Desde Index de upTaskGraphQL  Token....",token);

    if (token) {
      try {
        // const usuario = jwt.verify(token, process.env.SECRETA)
        const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA)
        // console.log("Desde Index,  Usuario logueado..", usuario);

        return {
          usuario
        }
      } catch (error) {
        console.log(error);
      }
    }


  }
})



server.listen({port: process.env.PORT || 4000}).then(({url}) => {
  console.log(`Servidor listo en la URL ${url}`);
})