import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class BlogTopic extends Model {}
BlogTopic.init({
  blog_id: { type: DataTypes.INTEGER, primaryKey: true },
  topic_id: { type: DataTypes.INTEGER, primaryKey: true }
}, { sequelize, tableName: 'blog_topic', modelName: 'BlogTopic', timestamps: false })

export default BlogTopic