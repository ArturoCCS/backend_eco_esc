import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Editorial = sequelize.define('Editorial', {
    id_editorial: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true }

}, {
    tableName: 'editorial',
    timestamps: false    
});

export default Editorial;