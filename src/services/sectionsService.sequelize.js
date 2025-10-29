import db from '../database/db.js'

function likeCond(q) {
  return q ? `AND (b.Titulo LIKE ? OR b.Descripcion LIKE ?)` : ''
}
function likeRepl(q) {
  return q ? [`%${q}%`, `%${q}%`] : []
}

async function recientes({ q, limit = 20 }) {
  const [rows] = await db.query(
    `SELECT b.*, u.nombre AS AutorNombre
     FROM blog b
     LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
     WHERE b.Es_Publicado = 1
       ${likeCond(q)}
     ORDER BY b.Fecha_Creacion DESC
     LIMIT ?`,
    { replacements: [...likeRepl(q), limit] }
  )
  return { key: 'recent', title: 'Recientes', items: rows }
}

async function populares30d({ q, limit = 20 }) {
  const [rows] = await db.query(
    `SELECT b.*, u.nombre AS AutorNombre, v.v30
     FROM blog b
     JOIN (
       SELECT blog_id, COALESCE(SUM(views),0) AS v30
       FROM blog_view_daily
       WHERE ymd >= CURDATE() - INTERVAL 30 DAY
       GROUP BY blog_id
     ) v ON v.blog_id = b.ID_Blog
     LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
     WHERE b.Es_Publicado = 1
       ${likeCond(q)}
     ORDER BY v.v30 DESC, b.Fecha_Creacion DESC
     LIMIT ?`,
    { replacements: [...likeRepl(q), limit] }
  )
  return { key: 'popular_30d', title: 'Populares (30 días)', items: rows }
}

async function paraTi({ userCtx, q, limit = 20 }) {
  const careers = (userCtx?.careers || []).map(Number)
  if (!careers.length) return { key: 'for_you', title: 'Para ti', items: [] }

  const [rows] = await db.query(
    `SELECT DISTINCT b.*, u.nombre AS AutorNombre
     FROM blog b
     JOIN blog_career bc ON bc.blog_id = b.ID_Blog
     LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
     WHERE b.Es_Publicado = 1
       AND bc.career_id IN (${careers.map(()=>'?').join(',')})
       ${likeCond(q)}
     ORDER BY b.Fecha_Creacion DESC
     LIMIT ?`,
    { replacements: [...careers, ...likeRepl(q), limit] }
  )
  return { key: 'for_you', title: 'Para ti', items: rows }
}

async function fueraCatalogo({ q, limit = 20 }) {
  const [rows] = await db.query(
    `SELECT b.*, u.nombre AS AutorNombre
     FROM blog b
     LEFT JOIN blog_career bc ON bc.blog_id = b.ID_Blog
     LEFT JOIN blog_subject bs ON bs.blog_id = b.ID_Blog
     LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
     WHERE b.Es_Publicado = 1
       AND bc.blog_id IS NULL
       AND bs.blog_id IS NULL
       ${likeCond(q)}
     ORDER BY b.Fecha_Creacion DESC
     LIMIT ?`,
    { replacements: [...likeRepl(q), limit] }
  )
  return { key: 'uncurated', title: 'Novedades fuera del catálogo', items: rows }
}

async function sugeridos({ q, limit = 20 }) {
  const [rows] = await db.query(
    `SELECT DISTINCT b.*, u.nombre AS AutorNombre
     FROM blog b
     JOIN blog_proposed_taxon bpt ON bpt.blog_id = b.ID_Blog
     JOIN proposed_taxon pt ON pt.id = bpt.proposed_id AND pt.status IN ('pending','provisional')
     LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
     WHERE b.Es_Publicado = 1
       ${likeCond(q)}
     ORDER BY b.Fecha_Creacion DESC
     LIMIT ?`,
    { replacements: [...likeRepl(q), limit] }
  )
  return { key: 'suggested', title: 'Sugeridos por la comunidad', items: rows }
}

async function tendencias({ limit = 20 }) {
  const [themes] = await db.query(
    `SELECT id, label, blogs_json FROM emergent_theme
     WHERE valid_to IS NULL OR valid_to >= NOW()
     ORDER BY score DESC
     LIMIT 3`
  )
  const items = []
  for (const th of themes) {
    const ids = JSON.parse(th.blogs_json || '[]').slice(0, limit)
    if (!ids.length) continue
    const [blogs] = await db.query(
      `SELECT b.*, u.nombre AS AutorNombre
       FROM blog b
       LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
       WHERE b.Es_Publicado = 1
         AND b.ID_Blog IN (${ids.map(()=>'?').join(',')})`,
      { replacements: ids }
    )
    items.push(...blogs.slice(0, 10))
  }
  return { key: 'trending', title: 'Tendencias', items }
}

async function careersFeatured({ userCtx, q, recentDays = 90, sectionsLimit = 3, blogsPerSection = 10 }) {
  const [careers] = await db.query(
    `SELECT c.id_career, c.nombre, COUNT(*) AS n, MAX(b.Fecha_Creacion) AS last_date
     FROM blog_career bc
     JOIN career c ON c.id_career = bc.career_id AND c.activo = 1
     JOIN blog b ON b.ID_Blog = bc.blog_id AND b.Es_Publicado = 1
                AND b.Fecha_Creacion >= NOW() - INTERVAL ? DAY
     GROUP BY c.id_career, c.nombre
     ORDER BY n DESC, last_date DESC
     LIMIT ?`,
    { replacements: [recentDays, sectionsLimit] }
  )
  const out = []
  const userCareers = (userCtx?.careers || []).map(Number)
  for (const c of careers) {
    const closedFilter =
      userCareers.length
        ? `AND (bc.mode <> 'closed' OR bc.career_id IN (${userCareers.map(()=>'?').join(',')}))`
        : `AND (bc.mode <> 'closed')`

    const [rows] = await db.query(
      `SELECT b.*, u.nombre AS AutorNombre
       FROM blog b
       JOIN blog_career bc ON bc.blog_id = b.ID_Blog AND bc.career_id = ?
       LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
       WHERE b.Es_Publicado = 1
         AND b.Visibilidad IN ('publico','autenticado')
         ${likeCond(q)}
         ${closedFilter}
       ORDER BY b.Fecha_Creacion DESC
       LIMIT ?`,
      { replacements: [c.id_career, ...likeRepl(q), ...(userCareers.length ? userCareers : []), blogsPerSection] }
    )
    if (rows.length) out.push({ key: `career_${c.id_career}`, title: `Carrera: ${c.nombre}`, items: rows })
  }
  return out
}

async function subjectsFeatured({ q, recentDays = 90, sectionsLimit = 3, blogsPerSection = 10 }) {
  const [subjects] = await db.query(
    `SELECT s.id_subject, s.nombre, COUNT(*) AS n, MAX(b.Fecha_Creacion) AS last_date
     FROM blog_subject bs
     JOIN subject s ON s.id_subject = bs.subject_id AND s.activo = 1
     JOIN blog b ON b.ID_Blog = bs.blog_id AND b.Es_Publicado = 1
                AND b.Fecha_Creacion >= NOW() - INTERVAL ? DAY
     GROUP BY s.id_subject, s.nombre
     ORDER BY n DESC, last_date DESC
     LIMIT ?`,
    { replacements: [recentDays, sectionsLimit] }
  )
  const out = []
  for (const s of subjects) {
    const [rows] = await db.query(
      `SELECT b.*, u.nombre AS AutorNombre
       FROM blog b
       JOIN blog_subject bs ON bs.blog_id = b.ID_Blog AND bs.subject_id = ?
       LEFT JOIN usuario u ON u.id_usuario = b.id_usuario
       WHERE b.Es_Publicado = 1
         AND b.Visibilidad IN ('publico','autenticado')
         ${likeCond(q)}
       ORDER BY b.Fecha_Creacion DESC
       LIMIT ?`,
      { replacements: [s.id_subject, ...likeRepl(q), blogsPerSection] }
    )
    if (rows.length) out.push({ key: `subject_${s.id_subject}`, title: `Materia: ${s.nombre}`, items: rows })
  }
  return out
}

export async function getSections({ q = '', userCtx = null }) {
  const sections = []
  if (userCtx?.user) {
    const p = await paraTi({ userCtx, q })
    if (p.items?.length) sections.push(p)
  }
  sections.push(await recientes({ q }))
  const pop = await populares30d({ q })
  if (pop.items?.length) sections.push(pop)

  const car = await careersFeatured({ userCtx, q })
  sections.push(...car)

  const mat = await subjectsFeatured({ q })
  sections.push(...mat)

  const sug = await sugeridos({ q })
  if (sug.items?.length) sections.push(sug)

  const unc = await fueraCatalogo({ q })
  if (unc.items?.length) sections.push(unc)

  const ten = await tendencias({})
  if (ten.items?.length) sections.push(ten)

  return sections
}