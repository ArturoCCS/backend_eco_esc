import express from 'express';
import {
    createBlog,
    createCapitulo,
    createSeccion,
    deleteBlog,
    getAllBlogs,
    getBlogById,
    getCapitulosByBlogId,
    getSeccionesByCapituloId,
    updateBlog
} from '../controllers/blog.controller.js';
import { metodoPrueba } from '../controllers/plataform.controller.js';

const router = express.Router();

router.get('/protected-route', metodoPrueba);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

router.get('/:id/capitulos', getCapitulosByBlogId);
router.post('/:id/capitulos', createCapitulo);

router.get('/capitulos/:id/secciones', getSeccionesByCapituloId);
router.post('/capitulos/:id/secciones', createSeccion);

export default router;
