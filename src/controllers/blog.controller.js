import db from '../database/db.js'
import Blog from '../models/blog.js'
import Capitulo from '../models/capitulo.js'
import Seccion from '../models/seccion.js'

export const getAllBlogs = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM Blog')
  res.json(rows)
}

export const getBlogById = async (req, res) => {
    try {
      const blog = await Blog.findByPk(req.params.id)
  
      if (!blog) return res.status(404).json({ error: 'Blog no encontrado' })
  
      res.json(blog)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al obtener el blog' })
    }
  }

export const createBlog = async (req, res) => {
    try {
      const { Titulo, Descripcion, Tipo } = req.body
  
      const nuevoBlog = await Blog.create({
        Titulo,
        Descripcion,
        Tipo
      })
  
      res.status(201).json(nuevoBlog)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al crear el blog' })
    }
  }

export const updateBlog = async (req, res) => {
  const { Titulo, Descripcion, Tipo } = req.body
  await db.query(
    'UPDATE Blog SET Titulo = ?, Descripcion = ?, Tipo = ? WHERE ID_Blog = ?',
    [Titulo, Descripcion, Tipo, req.params.id]
  )
  res.json({ message: 'Blog actualizado' })
}

export const deleteBlog = async (req, res) => {
  await db.query('DELETE FROM Blog WHERE ID_Blog = ?', [req.params.id])
  res.json({ message: 'Blog eliminado' })
}


// backend/controllers/blog.controller.js

// Crear un capítulo
export const createCapitulo = async (req, res) => {
    try {
      const { Titulo, Descripcion, Orden, ID_Blog } = req.body
      const nuevoCapitulo = await Capitulo.create({
        Titulo,
        Descripcion,
        Orden,
        ID_Blog
      })
      res.status(201).json(nuevoCapitulo)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al crear el capítulo' })
    }
  }
  
  // Crear una sección
  export const createSeccion = async (req, res) => {
    try {
      const { Titulo, Contenido, Orden, ID_Capitulo } = req.body
      const nuevaSeccion = await Seccion.create({
        Titulo,
        Contenido,
        Orden,
        ID_Capitulo
      })
      res.status(201).json(nuevaSeccion)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al crear la sección' })
    }
  }
  

// GET /api/blogs/:id/capítulos
export const getCapitulosByBlogId = async (req, res) => {
    try {
      const capitulos = await Capitulo.findAll({
        where: { ID_Blog: req.params.id },
        order: [['Orden', 'ASC']] // Para asegurarnos de que estén en el orden correcto
      })
      
      res.json(capitulos)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al obtener los capítulos' })
    }
  }


  // GET /api/capitulos/:id/secciones
export const getSeccionesByCapituloId = async (req, res) => {
    try {
      const secciones = await Seccion.findAll({
        where: { ID_Capitulo: req.params.id },
        order: [['Orden', 'ASC']] // Ordenar las secciones
      })
  
      res.json(secciones)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error al obtener las secciones' })
    }
  }
  