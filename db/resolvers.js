const  Usuario = require('../models/Usuario')
const bcryptjs = require('bcryptjs')

const jwt = require('jsonwebtoken')
const Proyecto = require('../models/Proyecto')
const Tarea = require('../models/Tarea')
require('dotenv').config({ path: 'variables.env'})

function crearToken (usuario, secreta, expiresIn)  {
  // console.log('usuario...', usuario);
  const { id, email, nombre } = usuario

  return (
    jwt.sign({id, email, nombre},secreta, {expiresIn})
  )
}

const resolvers = {
  Query:{
    obtenerProyectos: async (_, {}, ctx) => {
      const proyectos = await Proyecto.find({creador: ctx.usuario.id}) 
      return proyectos
    },
    obtenerTareas: async (_, {input}, ctx) => {

      const tareas = await Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto)

      return tareas

    }
  },

  Mutation:{
    crearUsuario: async (_, {input}) => {
      // console.log("Valor de input...", input);
      // console.log("Creando Usuario...");
      const { email, password } = input

      const existeUsuario = await Usuario.findOne({email})
      // console.log("Existe Usuario...", existeUsuario);

      if (existeUsuario){
        throw new Error('El usuario Ya esta registrado')
      }

      try {
        const salt= await bcryptjs.genSalt(10)
        input.password = await bcryptjs.hash(password, salt)

        const nuevoUsuario = new Usuario(input)
        console.log("Nuevo Usuario..", nuevoUsuario);
  
        nuevoUsuario.save()
        return "Usuario creado correctamente"
        
      } catch (error) {
        console.log(error);
      }

    },
    autenticarUsuario: async (_, {input}) => {
      const { email, password } = input

      //Buscamos email en la BD y guardamos la respuesta
      const existeUsuario =  await Usuario.findOne({email})

      //Si no se encontró email en BD
      if (!existeUsuario) {
        throw new Error('El Usuario No existe')
      }

      //Si se encontró email en BD comparamos passwords
      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
      // console.log('Pasword Correcto...',passwordCorrecto)

      if (!passwordCorrecto) {
        throw new Error('Password Incorrecto')  
      }

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '4hr')
      }

    },
    nuevoProyecto: async(_, {input}, ctx) =>{
      console.log("Context-General desde nuevoProyecto...", ctx);
      console.log("Context-Usuario desde nuevoProyecto...", ctx.usuario)
      console.log("Context-Usuario-id desde nuevoProyecto...", ctx.usuario.id)

      try {
        console.log("Creando Nuevo Proyecto..");
        const proyecto = new Proyecto(input)
        console.log("Proyecto Creado..", proyecto);

        // Asociar el creador
        proyecto.creador = ctx.usuario.id

        // Almacenarlo en la BD
        const resultado = await proyecto.save()

        return resultado

        
      } catch (error) {
        console.log(error);
      }

    },
    actualizarProyecto: async(_, {id, input}, ctx) =>{

      // Revisar si el proyecto existe o no
      let proyecto = await Proyecto.findById(id)

      // console.log("Tipo de dato para ctx.usuario.id...", typeof ctx.usuario.id);
      // console.log("Tipo de dato para proyecto.creadorid...", typeof proyecto.creador);
      // console.log("Proyecto...", proyecto);

      if (!proyecto) {
        throw new Error ('Proyecto no encontrado')
      }

      // Revisar que la persona que trata de editarlo, es el creador
      if(proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales para editar');
      }

      // Guardar el Proyecto
      proyecto = await Proyecto.findByIdAndUpdate({_id: id}, input,{new:true})

      return proyecto
    },
    eliminarProyecto: async(_, {id}, ctx) =>{

      // Revisar si el proyecto existe o no
      let proyecto = await Proyecto.findById(id)

      if (!proyecto) {
        throw new Error ('Proyecto no encontrado')
      }

      // Revisar que la persona que trata de editarlo, es el creador
      if(proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales para Eliminar');
      }

      // Eliminar el Proyecto
      await Proyecto.findOneAndDelete({_id: id})

      return "Proyecto Eliminado..."
    },
    nuevaTarea: async(_, {input}, ctx) => {
      console.log("Desde Nueva Tarea..",ctx);
      try {
        const tarea = new Tarea(input)
        tarea.creador = ctx.usuario.id
        const resultado = await tarea.save()
        return resultado
      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async(_, {id, input, estado}, ctx) =>{

      console.log("Parametro INPUT...", input)
      console.log("Parametro estado...", estado)


      // Revisar si la Tarea existe o no
      let tarea = await Tarea.findById(id)
      console.log('tarea...', tarea);

      if (!tarea) {
        throw new Error ('Tarea no encontrada')
      }

      // Revisar que la persona que trata de editarlo, es el creador
      if(tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales para Actualizar');
      }

      input.estado = estado

      // Guardar la Tarea
      tarea = await Tarea.findOneAndUpdate({_id: id}, input,{new:true})

      return tarea
    },
    eliminarTarea: async(_, {id}, ctx) =>{

      // Revisar si la Tarea existe o no
      let tarea = await Tarea.findById(id)

      if (!tarea) {
        throw new Error ('Tarea no encontrado')
      }

      // Revisar que la persona que trata de editarlo, es el creador
      if(tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error('No tienes las credenciales para Eliminar');
      }

      // Eliminar la Tarea
      await Tarea.findOneAndDelete({_id: id})

      return "Tarea Eliminada..."
    },
  }
}



module.exports = resolvers
