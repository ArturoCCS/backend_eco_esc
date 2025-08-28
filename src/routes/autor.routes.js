import express from 'express';
import { addAutor, getAutor, getAutores, removeAutor, updateAutor } from '../controllers/autor.controller.js';

const router = express.Router();

router.post('/showAuthor', getAutor);
router.post('/showAuthors', getAutores);
router.post('/addAuthor', addAutor);
router.post('/removeAuthor', removeAutor);
router.post('/updateAuthor', updateAutor);

export default router;