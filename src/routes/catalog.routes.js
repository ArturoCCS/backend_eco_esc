import express from 'express'
import db from '../database/db.js'
import { Career, Subject, Topic } from '../models/index.js'

const router = express.Router()

router.get('/catalogs', async (_req, res) => {
  const careers = await Career.findAll({ where: { activo: 1 }, attributes: ['id_career','nombre','slug'] })
  const subjects = await Subject.findAll({ where: { activo: 1 }, attributes: ['id_subject','nombre','slug'] })
  const topics = await Topic.findAll({ attributes: ['id_topic','nombre','slug'] })
  res.json({ careers, subjects, topics })
})

router.post('/suggest', async (req, res) => {
  const { type, name, slug, description = '' } = req.body
  if (!['career','subject','topic'].includes(type)) return res.status(400).json({ error: 'type inválido' })
  if (!name?.trim() || !slug?.trim()) return res.status(400).json({ error: 'name/slug requeridos' })

  try {
    await db.query(
      `INSERT INTO proposed_taxon (type, name, slug, description, status, suggested_by)
       VALUES (?,?,?,?, 'pending', ?) ON DUPLICATE KEY UPDATE description=VALUES(description), updated_at=CURRENT_TIMESTAMP`,
      { replacements: [type, name.trim(), slug.trim(), description, req.user?.id_usuario || null] }
    )
    return res.status(201).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo registrar la sugerencia' })
  }
})

export default router