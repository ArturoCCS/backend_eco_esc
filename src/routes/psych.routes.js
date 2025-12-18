import express from 'express';
import PsychProfile from '../models/psychProfile.js';

const router = express.Router();

function normalizeLikert(avg) {
  return Math.max(0, Math.min(1, (avg - 1) / 4));
}

const SECTION_KEYS = [
  'AFE',
  'NE',
  'CON',
  'EX',
  'HH',
  'AX',
  'AM',
  'AC',
  'SS',
];


const DEFAULT_INVERT_MASKS = [
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(10).fill(false).map((v, i) => (i >= 5)),
  Array(16).fill(false).map((v, i) => (i >= 8)),
];

function buildInvertMask(sectionIndex, length) {
  if (sectionIndex >= 0 && sectionIndex <= 7) {
    const half = Math.floor(length / 2);
    return Array.from({ length }, (_, i) => (i >= half));
  }
  if (sectionIndex === 8) {
    return Array.from({ length }, (_, i) => (i >= 8));
  }
  return Array.from({ length }, () => false);
}

router.post('/submit', async (req, res) => {
  try {
    const bodyUserId = Number(req.body?.id_usuario);
    const ctxUserId = Number(req.ctx?.user?.id_usuario);
    const uid = bodyUserId || ctxUserId;

    console.log('Psych submit uid:', uid);
    console.log('Psych submit body keys:', Object.keys(req.body || {}));

    if (!uid) {
      return res.status(401).json({ error: 'unauthorized: id_usuario requerido' });
    }

    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== SECTION_KEYS.length) {
      return res.status(400).json({ error: 'answers invalid' });
    }

    const final_estado = {};

    for (let s = 0; s < SECTION_KEYS.length; s++) {
      const sectionAnswers = answers[s];
      if (!Array.isArray(sectionAnswers) || sectionAnswers.length === 0) {
        return res.status(400).json({ error: `section ${s} empty` });
      }

      const defaultMask = DEFAULT_INVERT_MASKS[s];
      const invs =
        defaultMask && defaultMask.length === sectionAnswers.length
          ? defaultMask
          : buildInvertMask(s, sectionAnswers.length);

      let sum = 0;
      for (let i = 0; i < sectionAnswers.length; i++) {
        const raw = Number(sectionAnswers[i]);
        if (!(raw >= 1 && raw <= 5)) {
          return res.status(400).json({ error: 'invalid likert value' });
        }
        sum += invs[i] ? (6 - raw) : raw;
      }

      final_estado[SECTION_KEYS[s]] = Number(
        normalizeLikert(sum / sectionAnswers.length).toFixed(3)
      );
    }

    const lastCount = await PsychProfile.count({ where: { id_usuario: uid } });
    const version = Number(lastCount || 0) + 1;

    const row = await PsychProfile.create({
      id_usuario: uid,
      version,
      final_estado,
      answers,
      computed_at: new Date(),
    });

    return res.json({ id_psych: row.id_psych || row.id, version, final_estado });
  } catch (e) {
    console.error('psych submit error:', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const bodyUserId = Number(req.query?.id_usuario);
    const ctxUserId = Number(req.ctx?.user?.id_usuario);
    const uid = bodyUserId || ctxUserId;
    if (!uid) return res.json(null);

    const row = await PsychProfile.findOne({
      where: { id_usuario: uid },
      order: [['computed_at', 'DESC']],
    });
    return res.json(row || null);
  } catch (e) {
    console.error('psych latest error:', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;