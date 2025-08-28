import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Libro = sequelize.define('Libro', {
    id_libro: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    titulo: { type: DataTypes.STRING, allowNull: false },
    id_autor: { type: DataTypes.INTEGER, allowNull: false },
    id_categoria: { type: DataTypes.INTEGER, allowNull: false },
    isbn: { type: DataTypes.STRING, allowNull: false, unique: true },
    genero: { type: DataTypes.STRING, allowNull: false },
    anio_publicacion: { type: DataTypes.INTEGER, allowNull: false },
    idioma: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING, allowNull: false },
    numero_paginas: { type: DataTypes.INTEGER, allowNull: false },
    edicion: { type: DataTypes.STRING, allowNull: false },
    id_editorial: { type: DataTypes.INTEGER, allowNull: false }

    //portada: { type: DataTypes.STRING, allowNull: true },
    //imagen: { type: DataTypes.STRING, allowNull: true },
    //pdf: { type: DataTypes.STRING, allowNull: true }

}, {
    tableName: 'libro',
    timestamps: false    
});

export default Libro;