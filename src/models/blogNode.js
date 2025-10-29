import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db.js';
import Blog from './blog.js';

class BlogNode extends Model {}
BlogNode.init({
  id_node: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blog_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Blog, key: 'ID_Blog' } },
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('folder', 'chapter', 'section', 'asset'), defaultValue: 'chapter' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: true },
  content: { type: DataTypes.TEXT('long'), allowNull: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  path: { type: DataTypes.STRING(1024), allowNull: false },
  depth: { type: DataTypes.SMALLINT, defaultValue: 0 },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'blog_node', modelName: 'BlogNode', timestamps: false })

export default BlogNode