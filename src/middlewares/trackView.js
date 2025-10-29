import db from '../database/db.js'

export async function trackBlogView(blogId) {
  const ymd = new Date().toISOString().slice(0, 10)
  await db.query(
    `INSERT INTO blog_metrics (blog_id, views_all, last_viewed_at)
     VALUES (?, 1, NOW())
     ON DUPLICATE KEY UPDATE views_all = views_all + 1, last_viewed_at = NOW()`,
    { replacements: [blogId] }
  )
  await db.query(
    `INSERT INTO blog_view_daily (blog_id, ymd, views)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE views = views + 1`,
    { replacements: [blogId, ymd] }
  )
}

export function trackViewMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      const blogId = Number(req.params.id || req.params.blogId)
      if (blogId) trackBlogView(blogId).catch(() => {})
    }
  })
  next()
}