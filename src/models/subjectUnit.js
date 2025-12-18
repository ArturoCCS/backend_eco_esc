import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class SubjectUnit extends Model {}
SubjectUnit.init({
  id_unit: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_subject: { type: DataTypes.INTEGER, allowNull: false },
  unidad_index: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING(256), allowNull: true }
}, {
  sequelize,
  tableName: 'subject_unit',
  modelName: 'SubjectUnit',
  timestamps: false
})

export default SubjectUnit