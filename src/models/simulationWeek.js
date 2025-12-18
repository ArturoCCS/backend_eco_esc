import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class SimulationWeek extends Model {}
SimulationWeek.init({
  id_sim: { type: DataTypes.INTEGER, primaryKey: true },
  week: { type: DataTypes.INTEGER, primaryKey: true },
  estres: { type: DataTypes.DECIMAL, allowNull: true }
}, {
  sequelize,
  tableName: 'simulation_week',
  modelName: 'SimulationWeek',
  timestamps: false
})

export default SimulationWeek