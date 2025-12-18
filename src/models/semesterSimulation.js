import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class SemesterSimulation extends Model {}
SemesterSimulation.init({
  id_sim: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  semester_label: { type: DataTypes.STRING(32), allowNull: false },
  final_estado_snapshot: { type: DataTypes.JSONB, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'semester_simulation',
  modelName: 'SemesterSimulation',
  timestamps: false
})

export default SemesterSimulation