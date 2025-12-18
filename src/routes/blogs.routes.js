import express from 'express'
import { Op } from 'sequelize'
import db from '../database/db.js'
import { canReadBlog, loadUserContext } from '../middlewares/access.sequelize.js'
import { trackViewMiddleware } from '../middlewares/trackView.js'
import { Blog } from '../models/index.js'
import { createNode, listTree, moveNode, updateNode } from '../services/blogNodes.sequelize.js'
import { getSections } from '../services/sectionsService.sequelize.js'
import { attachTagsToBlog } from '../services/tags.sequelize.js'

import BlogSubjectMap from '../models/BlogSubjectMap.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { career, subject, topic, q, visibility } = req.query
  const where = { Es_Publicado: 1 }
  const include = []
  if (q) where[Op.or] = [{ Titulo: { [Op.like]: `%${q}%` } }, { Descripcion: { [Op.like]: `%${q}%` } }]
  if (visibility) where.Visibilidad = visibility
  if (career) include.push({ association: Blog.associations.Careers, where: { id_career: career }, through: { attributes: [] }, required: true })
  if (subject) include.push({ association: Blog.associations.Subjects, where: { id_subject: subject }, through: { attributes: [] }, required: true })
  if (topic) include.push({ association: Blog.associations.Topics, where: { id_topic: topic }, through: { attributes: [] }, required: true })

  const rows = await Blog.findAll({ where, include, order: [['Fecha_Creacion', 'DESC']], limit: 100, subQuery: false })
  res.json(rows)
})

router.get('/by-subject', async (req, res) => {
  try {
    const { subject_id, subject_code, unidad_index } = req.query
    let slug = null

    if (subject_id) {
      const map = await BlogSubjectMap.findOne({ where: { id_subject: Number(subject_id) } })
      if (!map) return res.json([])
      slug = map.blog_subject_slug
    } else if (subject_code) {
      const map = await BlogSubjectMap.findOne({ where: { code: String(subject_code) } })
      if (!map) return res.json([])
      slug = map.blog_subject_slug
    } else {
      return res.status(400).json({ error: 'subject_id or subject_code required' })
    }

    const where = { subject_slug: slug }
    if (unidad_index !== undefined) {
      const ui = Number(unidad_index)
      if (!Number.isNaN(ui)) where.unidad_index = ui
    }

    const posts = await Blog.findAll({ where, order: [['Fecha_Creacion', 'DESC']], limit: 20 })
    res.json(posts)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'server_error' })
  }
})


router.get('/sections', loadUserContext, async (req, res) => {
  const sections = await getSections({ q: req.query.q || '', userCtx: req.ctx })
  res.json(sections)
})

router.post('/', async (req, res) => {
  try {
    const { Titulo, Descripcion, Tipo, id_usuario, Visibilidad = 'publico', Es_Publicado = 1, careers = [], subjects = [], topics = [], tags = [] } = req.body
    const nuevo = await Blog.create({ Titulo, Descripcion, Tipo, id_usuario, Visibilidad, Es_Publicado, Fecha_Creacion: new Date() })

    if (Array.isArray(careers) && careers.length) {
      await db.query(
        `INSERT IGNORE INTO blog_career (blog_id, career_id, mode) VALUES ${careers.map(()=>'(?,?,?)').join(',')}`,
        { replacements: careers.flatMap(c => [nuevo.ID_Blog, Number(c.id), c.mode || 'recommended']) }
      )
    }
    if (Array.isArray(subjects) && subjects.length) {
      await db.query(
        `INSERT IGNORE INTO blog_subject (blog_id, subject_id, mode) VALUES ${subjects.map(()=>'(?,?,?)').join(',')}`,
        { replacements: subjects.flatMap(s => [nuevo.ID_Blog, Number(s.id), s.mode || 'optional']) }
      )
    }
    if (Array.isArray(topics) && topics.length) {
      await db.query(
        `INSERT IGNORE INTO blog_topic (blog_id, topic_id) VALUES ${topics.map(()=>'(?,?)').join(',')}`,
        { replacements: topics.flatMap(id => [nuevo.ID_Blog, Number(id)]) }
      )
    }

    await attachTagsToBlog(nuevo.ID_Blog, Array.isArray(tags) ? tags : [])
    await db.query(`INSERT IGNORE INTO blog_metrics (blog_id) VALUES (?)`, { replacements: [nuevo.ID_Blog] })

    res.status(201).json({ message: 'Blog creado', ID_Blog: nuevo.ID_Blog })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear el blog' })
  }
})

router.get('/:id', loadUserContext, canReadBlog, trackViewMiddleware, async (req, res) => {
  const b = await Blog.findByPk(req.params.id)
  if (!b) return res.status(404).json({ error: 'No encontrado' })
  res.json(b)
})

router.get('/:id/nodes', loadUserContext, canReadBlog, trackViewMiddleware, async (req, res) => {
  const tree = await listTree(Number(req.params.id))
  res.json(tree)
})

router.post('/:id/nodes', loadUserContext, canReadBlog, async (req, res) => {
  const blog_id = Number(req.params.id)
  const { parent_id = null, type = 'chapter', title, slug = null, content = null, order_index = 0, is_published = 1 } = req.body
  if (!title) return res.status(400).json({ error: 'title requerido' })
  const node = await createNode({ blog_id, parent_id, type, title, slug, content, order_index, is_published })
  res.status(201).json(node)
})

router.put('/nodes/:nodeId', loadUserContext, async (req, res) => {
  await updateNode({ id_node: Number(req.params.nodeId), ...req.body })
  res.json({ ok: true })
})

router.patch('/nodes/:nodeId/move', loadUserContext, async (req, res) => {
  const { new_parent_id = null, new_order_index = 0 } = req.body
  await moveNode({ id_node: Number(req.params.nodeId), new_parent_id, new_order_index })
  res.json({ ok: true })
})

router.post('/:id/like', loadUserContext, async (req, res) => {
  if (!req.ctx?.user) return res.status(401).json({ error: 'Auth requerida' })
  const blog_id = Number(req.params.id)
  const uid = Number(req.ctx.user.id_usuario)
  await db.query(`INSERT IGNORE INTO blog_like (blog_id, id_usuario) VALUES (?,?)`, { replacements: [blog_id, uid] })
  await db.query(`INSERT INTO blog_metrics (blog_id, likes_all) VALUES (?,1) ON DUPLICATE KEY UPDATE likes_all=likes_all+1`, { replacements: [blog_id] })
  res.json({ ok: true })
})

router.post('/:id/bookmark', loadUserContext, async (req, res) => {
  if (!req.ctx?.user) return res.status(401).json({ error: 'Auth requerida' })
  const blog_id = Number(req.params.id)
  const uid = Number(req.ctx.user.id_usuario)
  await db.query(`INSERT IGNORE INTO blog_bookmark (blog_id, id_usuario) VALUES (?,?)`, { replacements: [blog_id, uid] })
  await db.query(`INSERT INTO blog_metrics (blog_id, bookmarks_all) VALUES (?,1) ON DUPLICATE KEY UPDATE bookmarks_all=bookmarks_all+1`, { replacements: [blog_id] })
  res.json({ ok: true })
})

export default router