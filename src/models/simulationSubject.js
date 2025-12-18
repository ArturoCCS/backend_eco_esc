import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class SimulationSubject extends Model {}
SimulationSubject.init({
  id_sim: { type: DataTypes.INTEGER, primaryKey: true },
  id_subject: { type: DataTypes.INTEGER, primaryKey: true }
}, {
  sequelize,
  tableName: 'simulation_subject',
  modelName: 'SimulationSubject',
  timestamps: false
})

export default SimulationSubject