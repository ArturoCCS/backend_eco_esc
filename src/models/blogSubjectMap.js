import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class BlogSubjectMap extends Model {}
BlogSubjectMap.init({
  id_map: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  blog_subject_slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  id_subject: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING(64), allowNull: false }
}, {
  sequelize,
  tableName: 'blog_subject_map',
  modelName: 'BlogSubjectMap',
  timestamps: false
})

export default BlogSubjectMap