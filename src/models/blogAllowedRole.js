import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class BlogAllowedRole extends Model {}
BlogAllowedRole.init({
  blog_id: { type: DataTypes.INTEGER, primaryKey: true },
  id_rol: { type: DataTypes.INTEGER, primaryKey: true }
}, { sequelize, tableName: 'blog_allowed_role', modelName: 'BlogAllowedRole', timestamps: false })

export default BlogAllowedRole