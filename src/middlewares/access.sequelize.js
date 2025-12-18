import { Op } from 'sequelize'
import { Blog, BlogAllowedRole, BlogCareer, UserCareer } from '../models/index.js'

export async function loadUserContext(req, _res, next) {
  
  const user = req.user || null
  req.ctx = { user, roles: [], careers: [] }
  if (!user) return next()

  if (req.user.id_rol) req.ctx.roles.push(Number(req.user.id_rol))

  try {
    const careers = await UserCareer.findAll({
      where: { id_usuario: Number(req.user.id_usuario) },
      attributes: ['id_career']
    })
    req.ctx.careers = careers.map(x => Number(x.id_career))
  } catch {
    req.ctx.careers = []
  }
  next()
}

export async function canReadBlog(req, res, next) {
  const blogId = Number(req.params.id || req.params.blogId || req.body.blog_id)
  if (!blogId) return res.status(400).json({ error: 'blogId requerido' })

  const blog = await Blog.findByPk(blogId, { attributes: ['ID_Blog', 'Visibilidad'] })
  if (!blog) return res.status(404).json({ error: 'Blog no encontrado' })

  if (blog.Visibilidad === 'publico') return next()

  if (!req.ctx?.user) return res.status(401).json({ error: 'Autenticación requerida' })
  if (blog.Visibilidad === 'autenticado') return next()

  try {
    const closedCareers = await BlogCareer.findAll({
      where: { blog_id: blogId, mode: 'closed' },
      attributes: ['career_id']
    })
    if (closedCareers.length) {
      const allowed = new Set(closedCareers.map(x => Number(x.career_id)))
      const ok = (req.ctx.careers || []).some(id => allowed.has(Number(id)))
      if (ok) return next()
    }
  } catch {
  }

  try {
    if ((req.ctx.roles || []).length) {
      const row = await BlogAllowedRole.findOne({
        where: { blog_id: blogId, id_rol: { [Op.in]: req.ctx.roles.map(Number) } }
      })
      if (row) return next()
    }
  } catch {
  }

  return res.status(403).json({ error: 'Acceso restringido' })
}