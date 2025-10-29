import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class BlogSubject extends Model {}
BlogSubject.init({
  blog_id: { type: DataTypes.INTEGER, primaryKey: true },
  subject_id: { type: DataTypes.INTEGER, primaryKey: true },
  mode: { type: DataTypes.ENUM('optional', 'recommended'), defaultValue: 'optional' }
}, { sequelize, tableName: 'blog_subject', modelName: 'BlogSubject', timestamps: false })

export default BlogSubject