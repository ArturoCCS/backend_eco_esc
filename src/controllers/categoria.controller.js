import Categoria from '../models/categoria.js';

export const getCategorias = async (req, res) => {
    try {
        const rows = await Categoria.findAll();
        return res.json(rows);

    } catch (error) {
        return res.json({ error: error.message });
    }
};

export const getCategoria = async (req, res) => {
    let { id_categoria } = req.body;

    if ( !id_categoria ){
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }
    
    try {
        const categoria = await Categoria.findOne({ where: { id_categoria } });
        
        if (!categoria) {
            return res.status(400).json({ message: "Categoria no existente." });
        }

        return res.json(categoria);

    } catch (error) {
        return res.json({ error: error.message });
    }
};

export const addCategoria = async (req, res) => {
    let { nombre } = req.body;

    if ( !nombre ){
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    try {
        const categoriaExiste = await Categoria.findOne({ where: { nombre } });
        
        if (categoriaExiste) {
            return res.status(400).json({ message: "El nombre de la categoria ya está registrado." });
        }

        const categoriaCreada = await Categoria.create({ nombre });

        if (categoriaCreada) {
            return res.status(201).json({ message: "Categoria registrada con éxito." });
        }else{
            return res.status(400).json({ message: "No se pudo registrar la categoria." });
        }

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const removeCategoria = async (req, res) => {
    let { id_categoria } = req.body;

    if ( !id_categoria ){
        return res.status(400).json({ message: "El id de la categoria es requerido." });
    }

    try {
        const categoriaExiste = await Categoria.findOne({ where: { id_categoria } });
        
        if (!categoriaExiste) {
            return res.status(400).json({ message: "Categoria no encontrada." });
        }

        await Categoria.destroy({ where: { id_categoria } });

        return res.status(201).json({ message: "Categoria eliminada con éxito" });

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const updateCategoria = async (req, res) => {
    let { id_categoria, nombre } = req.body;

    if ( !id_categoria || !nombre ){
        return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
        const categoria = await Categoria.findOne({ where: { id_categoria } });
        
        if (!categoria) {
            return res.status(400).json({ message: "La categoria no ha sido encontrada." });
        }

        if (nombre) categoria.nombre = nombre;

        await categoria.save();

        return res.status(200).json({ message: "Categoria actualizada con éxito." });

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

