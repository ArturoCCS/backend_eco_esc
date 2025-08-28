import express from 'express';
import { addCategoria, getCategoria, getCategorias, removeCategoria, updateCategoria } from '../controllers/categoria.controller.js';

const router = express.Router();
router.post('/showCategory', getCategoria);
router.post('/showCategories', getCategorias);
router.post('/addCategory', addCategoria);
router.post('/removeCategory', removeCategoria);
router.post('/updateCategory', updateCategoria);

export default router;