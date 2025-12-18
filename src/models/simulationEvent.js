import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class SimulationEvent extends Model {}
SimulationEvent.init({
  id_event: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sim: { type: DataTypes.INTEGER, allowNull: false },
  week: { type: DataTypes.INTEGER, allowNull: false },
  id_subject: { type: DataTypes.INTEGER, allowNull: false },
  unidad_index: { type: DataTypes.INTEGER, allowNull: false },
  paso: { type: DataTypes.BOOLEAN, allowNull: true },
  score_final: { type: DataTypes.DECIMAL, allowNull: true },
  detalle: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'simulation_event',
  modelName: 'SimulationEvent',
  timestamps: false
})

export default SimulationEvent