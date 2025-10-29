import db from '../database/db.js'

function normalizeTag(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function attachTagsToBlog(blogId, tags = []) {
  if (!Array.isArray(tags) || !tags.length) return
  const normalized = Array.from(new Set(tags.map(normalizeTag).filter(Boolean))).slice(0, 16)
  if (!normalized.length) return

  for (const name of normalized) {
    await db.query(
      `INSERT IGNORE INTO tag (name_normalized, raw_sample) VALUES (?, ?)`,
      { replacements: [name, name] }
    )
  }
  const [rows] = await db.query(
    `SELECT id_tag, name_normalized FROM tag WHERE name_normalized IN (${normalized.map(()=>'?').join(',')})`,
    { replacements: normalized }
  )
  for (const r of rows) {
    await db.query(
      `INSERT IGNORE INTO blog_tag (blog_id, tag_id) VALUES (?, ?)`,
      { replacements: [blogId, r.id_tag] }
    )
  }
}