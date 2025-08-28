import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Categoria = sequelize.define('Categoria', {
    id_categoria: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true }

}, {
    tableName: 'categoria',
    timestamps: false    
});

export default Categoria;