import db from '../database/db.js'

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function recomputeEmergentThemes({ days = 90, minPairSupport = 3, minClusterBlogs = 5, topThemes = 3, blogsPerTheme = 10 } = {}) {

  const [blogs] = await db.query(
    `SELECT b.ID_Blog AS id
     FROM blog b
     WHERE b.Es_Publicado=1 AND b.Fecha_Creacion >= NOW() - INTERVAL ? DAY`,
    { replacements: [days] }
  )
  if (!blogs.length) return

  const ids = blogs.map(b => b.id)
  const [pairs] = await db.query(
    `SELECT bt.blog_id, t.name_normalized AS tag
     FROM blog_tag bt
     JOIN tag t ON t.id_tag = bt.tag_id
     WHERE bt.blog_id IN (${ids.map(()=>'?').join(',')})`,
    { replacements: ids }
  )

  const tagsByBlog = new Map()
  for (const row of pairs) {
    const t = normalize(row.tag)
    if (!t) continue
    if (!tagsByBlog.has(row.blog_id)) tagsByBlog.set(row.blog_id, new Set())
    tagsByBlog.get(row.blog_id).add(t)
  }

  const tagFreq = new Map()
  const pairFreq = new Map()
  for (const [bid, set] of tagsByBlog.entries()) {
    const arr = Array.from(set)
    for (const t of arr) tagFreq.set(t, (tagFreq.get(t) || 0) + 1)
    for (let i=0;i<arr.length;i++){
      for (let j=i+1;j<arr.length;j++){
        const a = arr[i] < arr[j] ? arr[i] : arr[j]
        const b = arr[i] < arr[j] ? arr[j] : arr[i]
        const key = `${a}::${b}`
        pairFreq.set(key, (pairFreq.get(key) || 0) + 1)
      }
    }
  }

  const adj = new Map()
  for (const [key, sup] of pairFreq.entries()) {
    if (sup < minPairSupport) continue
    const [a,b] = key.split('::')
    if (!adj.has(a)) adj.set(a, new Set())
    if (!adj.has(b)) adj.set(b, new Set())
    adj.get(a).add(b); adj.get(b).add(a)
  }

  const visited = new Set()
  const clusters = []
  for (const node of adj.keys()) {
    if (visited.has(node)) continue
    const queue = [node]; visited.add(node)
    const cluster = new Set([node])
    while (queue.length) {
      const u = queue.shift()
      for (const v of (adj.get(u) || [])) {
        if (!visited.has(v)) { visited.add(v); queue.push(v); cluster.add(v) }
      }
    }
    clusters.push(cluster)
  }

  const result = []
  for (const cl of clusters) {
    const tags = Array.from(cl)
    const blogsIn = []
    for (const [bid, set] of tagsByBlog.entries()) {
      let inter = 0
      for (const t of tags) if (set.has(t)) inter++
      if (inter >= 2) blogsIn.push(bid)
    }
    if (blogsIn.length >= minClusterBlogs) {
      const localFreq = tags.map(t => [t, tagFreq.get(t) || 0]).sort((a,b)=>b[1]-a[1])
      const label = localFreq.slice(0,2).map(x=>x[0]).join(' • ')
      result.push({ label, blogs: blogsIn.slice(0, blogsPerTheme), tags })
    }
  }

  const top = result.slice(0, topThemes)
  await db.query(`UPDATE emergent_theme SET valid_to = NOW() WHERE valid_to IS NULL`)
  for (const th of top) {
    await db.query(
      `INSERT INTO emergent_theme (label, blogs_json, tags_json, score, valid_from)
       VALUES (?, ?, ?, ?, NOW())`,
      { replacements: [th.label, JSON.stringify(th.blogs), JSON.stringify(th.tags), th.blogs.length] }
    )
  }
}