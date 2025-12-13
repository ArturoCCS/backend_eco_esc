import { clamp01, normal0sigma, triangular } from '../utils/distribution.js';

const RANGO_BAJO = 0.3333;
const RANGO_ALTO = 0.6667;

const INFLUENCIAS = [
  ['HH', 'EX', 'alto', 0.05],
  ['HH', 'EX', 'bajo', 0.05],
  ['AM', 'EX', 'alto', 0.05],
  ['AM', 'EX', 'bajo', 0.05],
  ['AFE', 'EX', 'alto', 0.07],
  ['AFE', 'EX', 'bajo', 0.07],
  ['EX', 'AFE', 'alto', 0.08],
  ['EX', 'NE', 'bajo', 0.08],
  ['CON', 'AFE', 'alto', 0.12],
  ['CON', 'AFE', 'bajo', 0.12],
  ['AC', 'AFE', 'alto', 0.10],
  ['AC', 'NE', 'bajo', 0.06],
  ['SS', 'NE', 'alto', 0.08],
  ['SS', 'NE', 'bajo', 0.08]
];

const PESOS_PSICO = {
  AFE: 0.30, CON: 0.22, NE: 0.19, AC: 0.10,
  EX: 0.07, SS: 0.07, HH: 0.02, AX: 0.02, AM: 0.01
};

const PESOS_FINAL = {
  scorePsico: 0.35, difMateria: 0.15, difDocente: 0.15,
  indRep: 0.15, cargaExtra: 0.07, estres: 0.09, error: 0.04
};

function generarErrorIndividual(sigma = 0.03) {
  return normal0sigma(sigma);
}

function resolverVar(input, name) {
  const triKey = `${name}_tri`;
  if (input && input[triKey]) {
    const { min, moda, max } = input[triKey];
    return triangular(min, moda, max);
  }
  if (input && typeof input[name] === 'number') return input[name];
  return 0.5;
}

export function aplicarInfluencia(input = {}) {
  const vals = {
    AFE: resolverVar(input, 'AFE'),
    CON: resolverVar(input, 'CON'),
    NE: resolverVar(input, 'NE'),
    AC: resolverVar(input, 'AC'),
    EX: resolverVar(input, 'EX'),
    SS: resolverVar(input, 'SS'),
    HH: resolverVar(input, 'HH'),
    AX: resolverVar(input, 'AX'),
    AM: resolverVar(input, 'AM')
  };

  let iter = 0;
  let cambios = true;
  while (cambios && iter < 10) {
    cambios = false;
    iter++;
    for (const [origen, destino, tipo, peso] of INFLUENCIAS) {
      const v_origen = vals[origen];
      const v_destino = vals[destino];
      if (tipo === 'alto' && v_origen > RANGO_ALTO) {
        const mod = peso * (v_origen - RANGO_ALTO);
        const nuevo = clamp01(v_destino + mod);
        if (Math.abs(nuevo - v_destino) > 1e-8) { vals[destino] = nuevo; cambios = true; }
      } else if (tipo === 'bajo' && v_origen < RANGO_BAJO) {
        const mod = peso * (RANGO_BAJO - v_origen);
        const nuevo = clamp01(v_destino - mod);
        if (Math.abs(nuevo - v_destino) > 1e-8) { vals[destino] = nuevo; cambios = true; }
      }
    }
  }
  return vals;
}

export function calcularScorePsico(adjusted) {
  let s = 1;
  s -= PESOS_PSICO.AFE * adjusted.AFE;
  s -= PESOS_PSICO.CON * adjusted.CON;
  s -= PESOS_PSICO.AC  * adjusted.AC;
  s -= PESOS_PSICO.EX  * adjusted.EX;
  s -= PESOS_PSICO.SS  * adjusted.SS;
  s -= PESOS_PSICO.HH  * adjusted.HH;
  s -= PESOS_PSICO.AX  * adjusted.AX;
  s -= PESOS_PSICO.AM  * adjusted.AM;
  s += PESOS_PSICO.NE  * adjusted.NE;
  return clamp01(s);
}

export function calcularScoreFinal({ scorePsico, difMateria, difDocente, indRep, cargaExtra, estres, error }) {
  const e = (typeof error === 'number') ? error : generarErrorIndividual();
  const total = PESOS_FINAL.scorePsico * scorePsico
    + PESOS_FINAL.difMateria * difMateria
    + PESOS_FINAL.difDocente * difDocente
    + PESOS_FINAL.indRep * indRep
    + PESOS_FINAL.cargaExtra * cargaExtra
    + PESOS_FINAL.estres * estres
    + PESOS_FINAL.error * e;
  return clamp01(total);
}

export function calcularRiesgo(input = {}) {
  const ajustados = aplicarInfluencia(input);
  const scorePsico = calcularScorePsico(ajustados);
  const difMateria = resolverVar(input, 'difMateria');
  const difDocente = resolverVar(input, 'difDocente');
  const indRep = resolverVar(input, 'indRep');
  const cargaExtra = resolverVar(input, 'cargaExtra');
  const estres = resolverVar(input, 'estres');
  const error = (typeof input.error === 'number') ? input.error : undefined;

  const scoreFinal = calcularScoreFinal({
    scorePsico, difMateria, difDocente, indRep, cargaExtra, estres, error
  });

  return {
    ajustados,
    scorePsico,
    scoreFinal,
    pasa: scoreFinal < 0.7,
    detalle: scoreFinal < 0.4 ? 'Bajo riesgo' : (scoreFinal < 0.7 ? 'Riesgo moderado' : 'Alto riesgo')
  };
}

export default calcularRiesgo;