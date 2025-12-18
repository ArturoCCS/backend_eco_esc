import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db.js';
class PsychProfile extends Model {}

PsychProfile.init({
  id_psych: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  final_estado: { type: DataTypes.JSON, allowNull: false },
  answers: { type: DataTypes.JSON, allowNull: true },
  computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  tableName: 'psych_profile',
  modelName: 'PsychProfile',
  timestamps: false,
});

export default PsychProfile;