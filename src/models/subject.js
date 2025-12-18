import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class Subject extends Model {}
Subject.init({
  id_subject: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(256), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  id_career: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },

  dificultad_base: { type: DataTypes.DECIMAL, allowNull: true },
  indice_reprobacion: { type: DataTypes.DECIMAL, allowNull: true },
  doc_min: { type: DataTypes.DECIMAL, allowNull: true },
  doc_max: { type: DataTypes.DECIMAL, allowNull: true },
  doc_moda: { type: DataTypes.DECIMAL, allowNull: true }
}, {
  sequelize,
  tableName: 'subject',
  modelName: 'Subject',
  timestamps: false
})

export default Subject