import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const User = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  id_rol: { type: DataTypes.INTEGER, allowNull: false },
  confirmationToken: { type: DataTypes.STRING },
  isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  confirmationExpires: { type: DataTypes.DATE },
  recoveryToken: { type: DataTypes.STRING },
  recoveryExpires: { type: DataTypes.DATE },
}, {
  tableName: 'usuario',
  timestamps: false
});

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.generateAuthToken = function() {
  return jwt.sign({ id: this.id_usuario, email: this.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export default User;
