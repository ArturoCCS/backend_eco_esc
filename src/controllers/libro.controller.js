import Libro from '../models/libro.js';

export const getLibros = async (req, res) => {
    try {
        const [rows] = await User.findAll();
        return res.json(rows);

    } catch (error) {
        return res.json({ error: error.message });
    }
};

export const addLibro = async (req, res) => {
    let { titulo, id_autor, id_categoria, isbn, genero, 
        anio_publicacion, idioma, descripcion, numero_paginas, 
        edicion, id_editorial } = req.body;

    if ( !titulo, !isbn || !genero || !anio_publicacion || !idioma || !descripcion || !numero_paginas || !edicion){
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
        const isbnExistente = await Libro.findOne({ where: { isbn } });
        
        if (isbnExistente) {
            return res.status(400).json({ message: "El isbn ya está registrado." });
        }

        const usuarioCreado = await User.create({
            titulo, 
            id_autor,  
            id_categoria, 
            isbn, 
            genero, 
            anio_publicacion, 
            idioma, 
            descripcion, 
            numero_paginas, 
            edicion, 
            id_editorial   
        });

        if (usuarioCreado) {
            return res.status(201).json({ message: "Libro registrado con éxito" });
        }else{
            return res.status(400).json({ message: "No se pudo registrar el libro" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};