import Blog from '../models/blog.js';
import Capitulo from '../models/capitulo.js';
import Seccion from '../models/seccion.js';

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll();
    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los blogs' });
  }
};

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
    const { Titulo, Descripcion, Tipo, id_usuario } = req.body
    const nuevoBlog = await Blog.create({
      Titulo,
      Descripcion,
      Tipo,
      id_usuario,
      Fecha_Creacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    res.status(201).json({
      message: 'Blog creado',
      ID_Blog: nuevoBlog.ID_Blog
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear el blog' })
  }
}

export const updateBlog = async (req, res) => {
  try {
    const { Titulo, Descripcion, Tipo } = req.body;
    const [updatedRows] = await Blog.update(
      { Titulo, Descripcion, Tipo },
      { where: { ID_Blog: req.params.id } }
    );
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Blog no encontrado' });
    }
    res.json({ message: 'Blog actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el blog' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const deletedRows = await Blog.destroy({ where: { ID_Blog: req.params.id } });
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Blog no encontrado' });
    }
    res.json({ message: 'Blog eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el blog' });
  }
};

export const createCapitulo = async (req, res) => {
  try {
    const { Titulo, Contenido, Orden, ID_Blog } = req.body
    const nuevoCapitulo = await Capitulo.create({
      Titulo,
      Contenido,
      Orden,
      ID_Blog
    })
    res.status(201).json({
      message: 'Capítulo creado',
      ID_Capitulo: nuevoCapitulo.ID_Capitulo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear el capítulo' })
  }
}

export const createSeccion = async (req, res) => {
  try {
    const { Titulo, Contenido, Orden, ID_Capitulo } = req.body
    const nuevaSeccion = await Seccion.create({
      Titulo,
      Contenido,
      Orden,
      ID_Capitulo,
    })
    res.status(201).json(nuevaSeccion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear la sección' })
  }
}

export const getCapitulosByBlogId = async (req, res) => {
  try {
    const capitulos = await Capitulo.findAll({
      where: { ID_Blog: req.params.id },
      order: [['Orden', 'ASC']]
    })
    res.json(capitulos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los capítulos' })
  }
}

export const getSeccionesByCapituloId = async (req, res) => {
  try {
    const secciones = await Seccion.findAll({
      where: { ID_Capitulo: req.params.id },
      order: [['Orden', 'ASC']]
    })
    res.json(secciones)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las secciones' })
  }
}