import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class Subject extends Model {}
Subject.init({
  id_subject: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'subject', modelName: 'Subject', timestamps: false })

export default Subject