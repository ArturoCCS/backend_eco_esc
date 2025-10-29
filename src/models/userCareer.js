import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class UserCareer extends Model {}
UserCareer.init({
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true },
  id_career: { type: DataTypes.INTEGER, primaryKey: true }
}, { sequelize, tableName: 'user_career', modelName: 'UserCareer', timestamps: false })

export default UserCareer