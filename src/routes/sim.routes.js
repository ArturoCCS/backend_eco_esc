import express from 'express';
import { simulateSemester } from '../sim/semesterSimulator.js';

const router = express.Router();

const debugStore = {
  last: null,
};

function isNumberBetween0and1(x) {
  return typeof x === 'number' && isFinite(x) && x >= 0 && x <= 1;
}

function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') return 'profile must be an object';
  const keys = ['AFE','CON','NE','AC','EX','SS','HH','AX','AM'];
  for (const k of keys) {
    if (profile[k] !== undefined && !isNumberBetween0and1(profile[k])) {
      return `${k} must be a number between 0 and 1`;
    }
  }
  if (profile.cargaExtra !== undefined && typeof profile.cargaExtra !== 'number') return 'cargaExtra must be numeric';
  if (profile.indRep !== undefined && typeof profile.indRep !== 'number') return 'indRep must be numeric';
  if (profile.estres !== undefined && typeof profile.estres !== 'number') return 'estres must be numeric';
  return null;
}

function validateSemesterConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return 'semesterConfig must be an object';
  if (!Number.isInteger(cfg.weeks) || cfg.weeks <= 0) return 'weeks must be an integer > 0';
  if (!Array.isArray(cfg.materias)) return 'materias must be an array';
  for (const m of cfg.materias) {
    if (!m.id) return 'each materia must have id';
    if (!Number.isInteger(m.unidades) || m.unidades <= 0) return `materia ${m.id}: unidades must be integer > 0`;
    if (m.difDocente_tri) {
      const tri = m.difDocente_tri;
      if (!(typeof tri.min === 'number' && typeof tri.moda === 'number' && typeof tri.max === 'number')) {
        return `materia ${m.id}: difDocente_tri must contain numeric min/moda/max`;
      }
      if (!(tri.min <= tri.moda && tri.moda <= tri.max)) {
        return `materia ${m.id}: difDocente_tri requires min <= moda <= max`;
      }
    }
  }
  return null;
}

router.post('/simulate', async (req, res) => {
  try {
    const { profile, semesterConfig, options } = req.body || {};

    console.log('[SIM] /simulate received payload:', JSON.stringify({ profile, semesterConfig, options }, null, 2));

    const v1 = validateProfile(profile);
    if (v1) {
      debugStore.last = { received: { profile, semesterConfig, options }, result: null, error: v1 };
      console.warn('[SIM] validateProfile error:', v1);
      return res.status(400).json({ error: v1, where: 'profile', receivedType: typeof profile });
    }

    const v2 = validateSemesterConfig(semesterConfig);
    if (v2) {
      debugStore.last = { received: { profile, semesterConfig, options }, result: null, error: v2 };
      console.warn('[SIM] validateSemesterConfig error:', v2);
      return res.status(400).json({ error: v2, where: 'semesterConfig' });
    }

    const resultado = simulateSemester(profile, semesterConfig, options || {});

    console.log('[SIM] /simulate result:', JSON.stringify(resultado, null, 2));

    debugStore.last = { received: { profile, semesterConfig, options }, result: resultado, error: null };

    return res.json(resultado);
  } catch (err) {
    console.error('Error en /api/simulate', err);
    debugStore.last = { received: req.body || null, result: null, error: err?.message || String(err) };
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * POST /montecarlo
 * Body: { n, profile, semesterConfig, options, includeRuns }
 */
async function runMonteCarloAsync(n, profile, semesterConfig, options = {}, yieldEvery = 50, includeRuns = false) {
  const runs = [];
  for (let i = 0; i < n; i++) {
    const r = simulateSemester(profile, semesterConfig, options);
    if (includeRuns) runs.push(r);
    if ((i + 1) % yieldEvery === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  const materiaSums = {};
  if (includeRuns) {
    runs.forEach(r => {
      r.resumen.forEach(m => {
        materiaSums[m.materiaId] = materiaSums[m.materiaId] || { sumPct: 0, count: 0 };
        materiaSums[m.materiaId].sumPct += m.pct;
        materiaSums[m.materiaId].count += 1;
      });
    });
  }

  const materiaAvg = {};
  for (const k of Object.keys(materiaSums)) {
    materiaAvg[k] = materiaSums[k].sumPct / materiaSums[k].count;
  }

  return {
    runsCount: n,
    materiaAvg,
    runs: includeRuns ? runs : undefined
  };
}

router.post('/montecarlo', async (req, res) => {
  try {
    let { n, profile, semesterConfig, options, includeRuns } = req.body || {};
    n = Number(n) || 100;
    includeRuns = Boolean(includeRuns);

    console.log('[SIM] /montecarlo received:', JSON.stringify({ n, profile, semesterConfig, options, includeRuns }, null, 2));

    if (n <= 0 || n > 2000) return res.status(400).json({ error: 'n must be between 1 and 2000 (upper limit to protect server)' });

    const v1 = validateProfile(profile);
    if (v1) {
      console.warn('[SIM] validateProfile error:', v1);
      return res.status(400).json({ error: v1, where: 'profile' });
    }
    const v2 = validateSemesterConfig(semesterConfig);
    if (v2) {
      console.warn('[SIM] validateSemesterConfig error:', v2);
      return res.status(400).json({ error: v2, where: 'semesterConfig' });
    }

    const resultado = await runMonteCarloAsync(n, profile, semesterConfig, options || {}, 50, includeRuns);
    console.log('[SIM] /montecarlo result:', JSON.stringify(resultado, null, 2));
    return res.json(resultado);
  } catch (err) {
    console.error('Error en /api/montecarlo', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/debug/last', (req, res) => {
  if (!debugStore.last) return res.json({ info: 'no data yet' });
  return res.json(debugStore.last);
});

export default router;