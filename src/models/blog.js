import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/db.js';

class Blog extends Model {}
Blog.init({
  ID_Blog: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Titulo: DataTypes.STRING(255),
  Descripcion: DataTypes.TEXT,
  Tipo: DataTypes.ENUM('simple', 'documentacion'),
  Visibilidad: { type: DataTypes.ENUM('publico', 'autenticado', 'restringido'), defaultValue: 'publico' },
  Es_Publicado: { type: DataTypes.BOOLEAN, defaultValue: true },
  Fecha_Creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false }
}, { sequelize, tableName: 'blog', modelName: 'Blog', timestamps: false })

export default Blog