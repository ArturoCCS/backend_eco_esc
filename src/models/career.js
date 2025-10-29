import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db.js';

class Career extends Model {}
Career.init({
  id_career: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'career', modelName: 'Career', timestamps: false })

export default Career