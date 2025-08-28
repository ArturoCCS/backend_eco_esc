import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Capitulo = sequelize.define('Capitulo', {
      ID_Capitulo: {
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
      Orden: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      tableName: 'Capitulo',
      timestamps: false
    })
  
    Capitulo.associate = (models) => {
      Capitulo.belongsTo(models.Blog, { foreignKey: 'ID_Blog' })
    }
  
export default Capitulo
  