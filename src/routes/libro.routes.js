import express from 'express';
import { addLibro, getLibros } from '../controllers/libro.controller.js';

const router = express.Router();

router.post('/showBooks', getLibros);
router.post('/addBook', addLibro);

export default router;