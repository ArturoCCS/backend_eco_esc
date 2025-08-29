import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Blog = sequelize.define('Blog', {
      ID_Blog: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Titulo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      Descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      Tipo: {
        type: DataTypes.STRING,
        allowNull: false
      }
      ,
      Fecha_Creacion: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
        tableName: 'Blog',
        timestamps: false    
    });
  
    
export default Blog;
