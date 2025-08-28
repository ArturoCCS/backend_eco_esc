import Autor from '../models/autor.js';

export const getAutores = async (req, res) => {
    try {
        const rows = await Autor.findAll();
        return res.json(rows);

    } catch (error) {
        return res.json({ error: error.message });
    }
};

export const getAutor = async (req, res) => {
    let { id_autor } = req.body;

    if ( !id_autor ){
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }
    
    try {
        const autor = await Autor.findOne({ where: { id_autor } });
        
        if (!autor) {
            return res.status(400).json({ message: "Autor no existente." });
        }

        return res.json(autor);

    } catch (error) {
        return res.json({ error: error.message });
    }
};

export const addAutor = async (req, res) => {
    let { nombre, biografia } = req.body;

    if ( !nombre || !biografia ){
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
        const autorExiste = await Autor.findOne({ where: { nombre } });
        
        if (autorExiste) {
            return res.status(400).json({ message: "El nombre de autor ya está registrado." });
        }

        const autorCreado = await Autor.create({ nombre, biografia });

        if (autorCreado) {
            return res.status(201).json({ message: "Autor registrado con éxito" });
        }else{
            return res.status(400).json({ message: "No se pudo registrar el autor" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const removeAutor = async (req, res) => {
    let { id_autor } = req.body;

    if ( !id_autor ){
        return res.status(400).json({ message: "El id del autor es requerido." });
    }

    try {
        const autorExiste = await Autor.findOne({ where: { id_autor } });
        
        if (!autorExiste) {
            return res.status(400).json({ message: "Autor no encontrado." });
        }

        await Autor.destroy({ where: { id_autor } });

        return res.status(201).json({ message: "Autor eliminado con éxito" });

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const updateAutor = async (req, res) => {
    let { id_autor, nombre, biografia } = req.body;

    if ( !id_autor || !nombre || !biografia ){
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
        const autor = await Autor.findOne({ where: { id_autor } });
        
        if (!autor) {
            return res.status(400).json({ message: "El autor no ha sido encontrado." });
        }

        if (nombre) autor.nombre = nombre;
        if (biografia) autor.biografia = biografia;

        await autor.save();

        return res.status(200).json({ message: "Autor actualizado con éxito." });

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};