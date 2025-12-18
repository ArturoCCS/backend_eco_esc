import express from 'express';
import Subject from '../models/subject.js';
import SubjectUnit from '../models/SubjectUnit.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { career_id } = req.query;
    const where = {};
    if (career_id) where.id_career = Number(career_id);

    const subjects = await Subject.findAll({ where, order: [['nombre', 'ASC']] });
    const ids = subjects.map(s => s.id_subject);

    const units = await SubjectUnit.findAll({
      where: { id_subject: ids },
      order: [['id_subject', 'ASC'], ['unidad_index', 'ASC']]
    });

    const unitsBySubject = new Map();
    for (const u of units) {
      const arr = unitsBySubject.get(u.id_subject) || [];
      arr.push({ unidad_index: u.unidad_index, nombre: u.nombre });
      unitsBySubject.set(u.id_subject, arr);
    }

    const out = subjects.map(s => ({
      id_subject: s.id_subject,
      code: s.code,
      nombre: s.nombre,
      id_career: s.id_career,
      dificultad_base: s.dificultad_base,
      indice_reprobacion: s.indice_reprobacion,
      docentes_dificultad: { min: s.doc_min, max: s.doc_max, moda: s.doc_moda },
      unidades: unitsBySubject.get(s.id_subject) || []
    }));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;