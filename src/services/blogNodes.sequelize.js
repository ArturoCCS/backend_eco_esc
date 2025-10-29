import { Op, literal } from 'sequelize'
import sequelize from '../database/db.js'
import { BlogNode } from '../models/index.js'

async function parentMeta(parent_id) {
  if (!parent_id) return { path: '', depth: 0 }
  const p = await BlogNode.findByPk(parent_id, { attributes: ['path', 'depth'] })
  if (!p) throw new Error('Parent no encontrado')
  return p.get()
}

export async function listTree(blog_id) {
  return BlogNode.findAll({
    where: { blog_id },
    order: [['path', 'ASC'], ['order_index', 'ASC']]
  })
}

export async function createNode({ blog_id, parent_id = null, type = 'chapter', title, slug = null, content = null, order_index = 0, is_published = 1 }) {
  return sequelize.transaction(async (t) => {
    const { path: ppath, depth: pdepth } = await parentMeta(parent_id)
    const node = await BlogNode.create({
      blog_id, parent_id, type, title, slug, content, order_index, path: '', depth: 0, is_published
    }, { transaction: t })

    const newPath = `${ppath}/${node.id_node}`.replace(/\/{2,}/g, '/')
    const newDepth = pdepth + 1
    await node.update({ path: newPath, depth: newDepth }, { transaction: t })
    return node
  })
}

export async function updateNode({ id_node, ...rest }) {
  const node = await BlogNode.findByPk(id_node)
  if (!node) throw new Error('Nodo no encontrado')
  await node.update(rest)
  return node
}

export async function moveNode({ id_node, new_parent_id = null, new_order_index = 0 }) {
  return sequelize.transaction(async (t) => {
    const node = await BlogNode.findByPk(id_node, { transaction: t })
    if (!node) throw new Error('Nodo no encontrado')
    const oldPrefix = node.path

    const { path: ppath, depth: pdepth } = await parentMeta(new_parent_id)
    const newPrefix = `${ppath}/${node.id_node}`.replace(/\/{2,}/g, '/')
    const newDepth = pdepth + 1

    await node.update({ parent_id: new_parent_id, order_index: new_order_index, path: newPrefix, depth: newDepth }, { transaction: t })

    await BlogNode.update(
      {
        path: literal(`CONCAT(${sequelize.escape(newPrefix)}, SUBSTRING(path, ${oldPrefix.length + 1}))`),
        depth: literal(`depth - (${node.depth} - ${newDepth})`)
      },
      {
        where: { blog_id: node.blog_id, path: { [Op.like]: `${oldPrefix}/%` } },
        transaction: t
      }
    )
  })
}