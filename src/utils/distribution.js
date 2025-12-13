export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function triangular(min, moda, max) {
  if (!(min <= moda && moda <= max)) {
    throw new Error('triangular: requiere min <= moda <= max');
  }
  const u = Math.random();
  const f = (moda - min) / (max - min);
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (moda - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - moda));
  }
}

export function normal0sigma(sigma = 0.03) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma;
}