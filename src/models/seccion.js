import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

    const Seccion = sequelize.define('Seccion', {
      ID_Seccion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Titulo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      Contenido: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      Orden: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ID_Capitulo: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      tableName: 'Seccion',
      timestamps: false
    })
  
    Seccion.associate = (models) => {
      Seccion.belongsTo(models.Capitulo, { foreignKey: 'ID_Capitulo' })
    }
  
export default Seccion