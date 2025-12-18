import { calcularRiesgo } from '../motor/core.js';
import { clamp01, triangular } from '../utils/distribution.js';

function distribuirUnidades(unidades, totalWeeks) {
  const minWeeksPerUnit = 2;
  const totalNeeded = unidades * minWeeksPerUnit;
  const span = Math.max(totalWeeks, totalNeeded);
  const weeks = [];
  for (let u = 0; u < unidades; u++) {
    const pos = Math.floor((u + 0.5) * (span / unidades));
    weeks.push(Math.min(totalWeeks - 1, pos));
  }
  return weeks;
}

const RANGO_BAJO = 0.3333;
const RANGO_ALTO = 0.6667;

function ajusteEstresPorResultado(neuroticismo, paso) {
  const baseFail = 0.01;
  const basePass = 0.01;
  let mult = 1;
  if (neuroticismo > RANGO_ALTO) mult = 2;
  else if (neuroticismo < RANGO_BAJO) mult = 0.5;
  return paso ? - (basePass * mult) : (baseFail * mult);
}

function resolvePossTri(state, name) {
  return typeof state[name] === 'number' ? state[name] : 0.5;
}

export function simulateSemester(profile, semesterConfig, options = {}) {
  const weeks = semesterConfig.weeks || 16;
  const materias = semesterConfig.materias || [];
  const passRule = options.passRule || 'probabilistic';

  const calendario = [];
  materias.forEach(mat => {
    const weeksForUnits = distribuirUnidades(mat.unidades, weeks);
    for (let u = 0; u < mat.unidades; u++) {
      calendario.push({
        materiaId: mat.id,
        unidadIndex: u,
        week: weeksForUnits[u],
        meta: mat
      });
    }
  });

  const porSemana = Array.from({ length: weeks }, () => []);
  calendario.forEach(item => porSemana[item.week].push(item));

  let estado = { ...profile };

  if (typeof options.initialEstres === 'number') {
    estado.estres = clamp01(options.initialEstres);
  } else {
    let initialEstres =
      typeof profile.estres === 'number' ? clamp01(profile.estres) : 0.18;
    if (initialEstres < 0.15) initialEstres = 0.15;
    if (initialEstres > 0.35) initialEstres = 0.35;
    estado.estres = initialEstres;
  }

  const history = [];

  for (let w = 0; w < weeks; w++) {
    const eventos = porSemana[w];
    if (eventos.length > 1) {
      const extra = (eventos.length - 1) * 0.10;
      estado.estres = clamp01(estado.estres + extra);
    }

    const eventosSemanaResult = [];

    for (const ev of eventos) {
      const inputMotor = {
        AFE: estado.AFE,
        CON: estado.CON,
        NE: estado.NE,
        AC: estado.AC,
        EX: estado.EX,
        SS: estado.SS,
        HH: estado.HH,
        AX: estado.AX,
        AM: estado.AM,
        difMateria: (ev.meta && ev.meta.difMateria !== undefined) ? ev.meta.difMateria : resolvePossTri(estado, 'difMateria'),
        indRep: (ev.meta && ev.meta.indRep !== undefined) ? ev.meta.indRep : (estado.indRep || 0.5),
        cargaExtra: estado.cargaExtra || 0,
        estres: estado.estres
      };

      if (ev.meta && ev.meta.difDocente_tri) {
        inputMotor.difDocente = triangular(
          ev.meta.difDocente_tri.min,
          ev.meta.difDocente_tri.moda,
          ev.meta.difDocente_tri.max
        );
      } else {
        inputMotor.difDocente = resolvePossTri(estado, 'difDocente');
      }

      const resultado = calcularRiesgo(inputMotor);
      const scoreFinal = resultado.scoreFinal;

      let paso = false;
      if (passRule === 'threshold') {
        paso = resultado.pasa;
      } else {
        const probAprobar = clamp01(1 - scoreFinal);
        paso = Math.random() < probAprobar;
      }

      const deltaEstres = ajusteEstresPorResultado(estado.NE, paso);
      estado.estres = clamp01(estado.estres + deltaEstres);

      if (paso) {
        estado.AFE = clamp01((estado.AFE ?? 0.5) + 0.01);
        estado.CON = clamp01((estado.CON ?? 0.5) + 0.005);
      } else {
        estado.AFE = clamp01((estado.AFE ?? 0.5) - 0.01);
        estado.NE = clamp01((estado.NE ?? 0.5) + 0.005);
      }

      eventosSemanaResult.push({
        materiaId: ev.materiaId,
        unidadIndex: ev.unidadIndex,
        week: ev.week,
        paso,
        scoreFinal,
        detalle: resultado.detalle
      });
    }

    const progress = (w + 1) / weeks;
    const incrementoBase = 0.001;
    let incremento = incrementoBase;
    if (progress > 0.75) incremento *= 1.5;
    estado.estres = clamp01(estado.estres + incremento);

    history.push({
      week: w,
      eventos: eventosSemanaResult,
      estres: estado.estres
    });
  }

  const resumenMat = {};
  history.flatMap(h => h.eventos).forEach(ev => {
    resumenMat[ev.materiaId] = resumenMat[ev.materiaId] || { aprobadas: 0, totales: 0 };
    resumenMat[ev.materiaId].totales += 1;
    if (ev.paso) resumenMat[ev.materiaId].aprobadas += 1;
  });

  const resumen = Object.keys(resumenMat).map(id => {
    const r = resumenMat[id];
    return { materiaId: id, aprobadas: r.aprobadas, totales: r.totales, pct: r.aprobadas / r.totales };
  });

  return {
    finalEstado: estado,
    history,
    resumen
  };
}