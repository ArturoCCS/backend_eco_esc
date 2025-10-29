import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class BlogCareer extends Model {}
BlogCareer.init({
  blog_id: { type: DataTypes.INTEGER, primaryKey: true },
  career_id: { type: DataTypes.INTEGER, primaryKey: true },
  mode: { type: DataTypes.ENUM('closed', 'recommended'), defaultValue: 'recommended' }
}, { sequelize, tableName: 'blog_career', modelName: 'BlogCareer', timestamps: false })

export default BlogCareer