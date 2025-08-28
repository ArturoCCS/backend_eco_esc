import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Autor = sequelize.define('Autor', {
    id_autor: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    biografia: { type: DataTypes.TEXT, allowNull: true }

}, {
    tableName: 'autor',
    timestamps: false    
});

export default Autor;