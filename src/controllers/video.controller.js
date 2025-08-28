import axios from 'axios';
import { verificarToken } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbacMiddlewares.js';

const STRAPI_API_URL = 'http://localhost:1337/api/videos'; // URL de Strapi
const STRAPI_ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN; // Usa una variable de entorno

export const obtenerVideos = async (req, res) => {
    const { userEmail } = req.query; // Obtener el email del usuario desde la URL

    try {
        if (!userEmail) {
            return res.status(400).json({ error: "El parámetro 'userEmail' es requerido" });
        }

        const url = `${STRAPI_API_URL}?filters[user_email][$eq]=${encodeURIComponent(userEmail)}`;


        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}` }
        });

        const videos = response.data?.data || []; 

        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener videos' });
    }
};


// Agregar un video (solo admin o roles con permisos)
export const agregarVideo = async (req, res) => {
    try {
        await verificarToken(req, res, async () => {
            await checkPermission('create_content')(req, res, async () => {
                const response = await axios.post(STRAPI_API_URL, req.body, {
                    headers: { Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}` }
                });
                res.json(response.data);
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar video' });
    }
};

// Editar un video
export const editarVideo = async (req, res) => {
    const { id } = req.params;
    try {
        await verificarToken(req, res, async () => {
            await checkPermission('edit_content')(req, res, async () => {
                const response = await axios.put(`${STRAPI_API_URL}/${id}`, { data: req.body }, {
                    headers: { Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}` }
                });
                res.json(response.data);
            });
        });
    } catch (error) {
        console.error('Error al editar video:', error);
        res.status(500).json({ error: 'Error al editar video' });
    }
};
export const eliminarVideo = async (req, res) => {
    const { documentId } = req.params;
    try {
        const response = await axios.delete(`${STRAPI_API_URL}/${documentId}`, {
            headers: {
              Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
            },
        });
          
        if (response.status === 200 || response.status === 204) {
            res.json({ status : response.status ,message: "Video eliminado correctamente" });
        } else {
            console.error("❌ Strapi no eliminó el video:", response.data);
            res.status(500).json({ message: "Strapi no eliminó el video" });
        }

    } catch (error) {
        console.error("❌ Error al eliminar el video:", error.response?.data || error.message);
        res.status(500).json({
            message: "Error al eliminar el video en Strapi",
            error: error.response?.data || error.message
        });
    }
};
