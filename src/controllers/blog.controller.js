import sequelize from '../database/db.js'

import Blog from '../models/blog.js'

import BlogCareer from '../models/blogCareer.js'
import BlogNode from '../models/blogNode.js'
import BlogSubject from '../models/blogSubject.js'
import BlogTopic from '../models/blogTopic.js'
import Career from '../models/career.js'
import Subject from '../models/subject.js'
import Topic from '../models/topic.js'

export const getAllBlogs = async (req, res) => {
  try {
    const withMeta = String(req.query.withMeta || '').trim() === '1'

    if (!withMeta) {
      const blogs = await Blog.findAll()
      return res.json(blogs)
    }

    const blogs = await Blog.findAll({
      include: [
        { model: Career, through: { attributes: ['mode'] } },
        { model: Subject, through: { attributes: ['mode'] } },
        { model: Topic, through: { attributes: [] } }
      ],
      order: [['Fecha_Creacion', 'DESC']]
    })

    const data = blogs.map(b => {
      const json = b.toJSON()
      return {
        ...json,
        careers: (json.Careers || []).map(c => ({ id: c.id_career, nombre: c.nombre, mode: c.BlogCareer?.mode || 'recommended' })),
        subjects: (json.Subjects || []).map(s => ({ id: s.id_subject, nombre: s.nombre, mode: s.BlogSubject?.mode || 'optional' })),
        topics: (json.Topics || []).map(t => ({ id: t.id_topic, nombre: t.nombre }))
      }
    })

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los blogs' })
  }
}

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id, {
      include: [
        { model: Career, through: { attributes: ['mode'] } },
        { model: Subject, through: { attributes: ['mode'] } },
        { model: Topic, through: { attributes: [] } }
      ]
    })
    if (!blog) return res.status(404).json({ error: 'Blog no encontrado' })

    const json = blog.toJSON()
    const data = {
      ...json,
      careers: (json.Careers || []).map(c => ({ id: c.id_career, nombre: c.nombre, mode: c.BlogCareer?.mode || 'recommended' })),
      subjects: (json.Subjects || []).map(s => ({ id: s.id_subject, nombre: s.nombre, mode: s.BlogSubject?.mode || 'optional' })),
      topics: (json.Topics || []).map(t => ({ id: t.id_topic, nombre: t.nombre }))
    }

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el blog' })
  }
}

export const createBlog = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const {
      Titulo, Descripcion, Tipo, id_usuario,
      Visibilidad = 'publico',
      Es_Publicado = true,
      careers = [],
      subjects = [],
      topics = []
    } = req.body

    const nuevoBlog = await Blog.create({
      Titulo, Descripcion, Tipo, id_usuario,
      Visibilidad, Es_Publicado,
      Fecha_Creacion: new Date()
    }, { transaction: t })

    if (Array.isArray(careers) && careers.length) {
      await BlogCareer.bulkCreate(
        careers.map(c => ({ blog_id: nuevoBlog.ID_Blog, career_id: c.id, mode: c.mode || 'recommended' })),
        { transaction: t, ignoreDuplicates: true }
      )
    }
    if (Array.isArray(subjects) && subjects.length) {
      await BlogSubject.bulkCreate(
        subjects.map(s => ({ blog_id: nuevoBlog.ID_Blog, subject_id: s.id, mode: s.mode || 'optional' })),
        { transaction: t, ignoreDuplicates: true }
      )
    }
    if (Array.isArray(topics) && topics.length) {
      await BlogTopic.bulkCreate(
        topics.map(id => ({ blog_id: nuevoBlog.ID_Blog, topic_id: id })),
        { transaction: t, ignoreDuplicates: true }
      )
    }

    await t.commit()
    res.status(201).json({ message: 'Blog creado', ID_Blog: nuevoBlog.ID_Blog })
  } catch (error) {
    await t.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear el blog' })
  }
}

export const updateBlog = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const {
      Titulo, Descripcion, Tipo,
      Visibilidad, Es_Publicado,
      careers, subjects, topics
    } = req.body

    const [updatedRows] = await Blog.update(
      { Titulo, Descripcion, Tipo, Visibilidad, Es_Publicado },
      { where: { ID_Blog: req.params.id }, transaction: t }
    )
    if (updatedRows === 0) {
      await t.rollback()
      return res.status(404).json({ error: 'Blog no encontrado' })
    }

    const blog_id = Number(req.params.id)

    if (Array.isArray(careers)) {
      await BlogCareer.destroy({ where: { blog_id }, transaction: t })
      if (careers.length) {
        await BlogCareer.bulkCreate(
          careers.map(c => ({ blog_id, career_id: c.id, mode: c.mode || 'recommended' })),
          { transaction: t }
        )
      }
    }

    if (Array.isArray(subjects)) {
      await BlogSubject.destroy({ where: { blog_id }, transaction: t })
      if (subjects.length) {
        await BlogSubject.bulkCreate(
          subjects.map(s => ({ blog_id, subject_id: s.id, mode: s.mode || 'optional' })),
          { transaction: t }
        )
      }
    }

    if (Array.isArray(topics)) {
      await BlogTopic.destroy({ where: { blog_id }, transaction: t })
      if (topics.length) {
        await BlogTopic.bulkCreate(
          topics.map(id => ({ blog_id, topic_id: id })),
          { transaction: t }
        )
      }
    }

    await t.commit()
    res.json({ message: 'Blog actualizado' })
  } catch (error) {
    await t.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar el blog' })
  }
}

export const deleteBlog = async (req, res) => {
  try {
    const deletedRows = await Blog.destroy({ where: { ID_Blog: req.params.id } })
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Blog no encontrado' })
    }
    res.json({ message: 'Blog eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar el blog' })
  }
}

export const createCapitulo = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const blog_id = Number(req.params.id)
    const { Titulo, Contenido = null, Orden = 0, parent_id = null } = req.body

    const parentMeta = parent_id
      ? await BlogNode.findByPk(parent_id, { transaction: t })
      : null

    const pPath = parentMeta?.path || ''
    const pDepth = parentMeta?.depth || 0

    const cap = await BlogNode.create({
      blog_id,
      parent_id: parent_id || null,
      type: 'chapter',
      title: Titulo,
      slug: null,
      content: Contenido,
      order_index: Orden,
      path: '',
      depth: 0,
      is_published: true
    }, { transaction: t })

    const newPath = `${pPath}/${cap.id_node}`.replace(/\/{2,}/g, '/')
    await cap.update({ path: newPath, depth: pDepth + 1 }, { transaction: t })

    await t.commit()
    res.status(201).json({ message: 'Capítulo creado', ID_Capitulo: cap.id_node })
  } catch (error) {
    await t.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear el capítulo' })
  }
}

export const createSeccion = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const parent_id = Number(req.params.id)
    const { Titulo, Contenido = null, Orden = 0 } = req.body

    const parent = await BlogNode.findByPk(parent_id, { transaction: t })
    if (!parent) {
      await t.rollback()
      return res.status(404).json({ error: 'Capítulo (nodo padre) no encontrado' })
    }

    const sec = await BlogNode.create({
      blog_id: parent.blog_id,
      parent_id,
      type: 'section',
      title: Titulo,
      slug: null,
      content: Contenido,
      order_index: Orden,
      path: '',
      depth: 0,
      is_published: true
    }, { transaction: t })

    const newPath = `${parent.path}/${sec.id_node}`.replace(/\/{2,}/g, '/')
    await sec.update({ path: newPath, depth: parent.depth + 1 }, { transaction: t })

    await t.commit()
    res.status(201).json({
      message: 'Sección creada',
      ID_Seccion: sec.id_node
    })
  } catch (error) {
    await t.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear la sección' })
  }
}

export const getCapitulosByBlogId = async (req, res) => {
  try {
    const capitulos = await BlogNode.findAll({
      where: { blog_id: Number(req.params.id), type: 'chapter', parent_id: null },
      order: [['order_index', 'ASC']]
    })
    const data = capitulos.map(n => ({
      ID_Capitulo: n.id_node,
      Titulo: n.title,
      Contenido: n.content,
      ID_Blog: n.blog_id,
      Orden: n.order_index
    }))
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los capítulos' })
  }
}

export const getSeccionesByCapituloId = async (req, res) => {
  try {
    const parent_id = Number(req.params.id)
    const secciones = await BlogNode.findAll({
      where: { parent_id, type: 'section' },
      order: [['order_index', 'ASC']]
    })
    const data = secciones.map(n => ({
      ID_Seccion: n.id_node,
      Titulo: n.title,
      Contenido: n.content,
      ID_Capitulo: n.parent_id,
      Orden: n.order_index
    }))
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las secciones' })
  }
}