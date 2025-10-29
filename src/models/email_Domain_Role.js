import { DataTypes, Model } from 'sequelize'
import sequelize from '../database/db.js'

class EmailDomainRole extends Model {}
EmailDomainRole.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  domain: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  id_rol: { type: DataTypes.INTEGER, allowNull: false },
  require_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, tableName: 'email_domain_role', modelName: 'EmailDomainRole', timestamps: false })

export default EmailDomainRole