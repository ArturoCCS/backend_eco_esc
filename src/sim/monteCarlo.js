const { simulateSemester } = require('./semesterSimulator');

function runMonteCarlo(n, profile, semesterConfig, options = {}) {
  const runs = [];
  for (let i = 0; i < n; i++) {
    const r = simulateSemester(profile, semesterConfig, options);
    runs.push(r);
  }

  const materiaSums = {};S
  runs.forEach(r => {
    r.resumen.forEach(m => {
      materiaSums[m.materiaId] = materiaSums[m.materiaId] || { sumPct: 0, count: 0 };
      materiaSums[m.materiaId].sumPct += m.pct;
      materiaSums[m.materiaId].count += 1;
    });
  });

  const materiaAvg = {};
  Object.keys(materiaSums).forEach(k => {
    materiaAvg[k] = materiaSums[k].sumPct / materiaSums[k].count;
  });

  return { runsCount: runs.length, materiaAvg, runs };
}

module.exports = { runMonteCarlo };