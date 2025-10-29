import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class Topic extends Model {}
Topic.init({
  id_topic: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true }
}, { sequelize, tableName: 'topic', modelName: 'Topic', timestamps: false })

export default Topic