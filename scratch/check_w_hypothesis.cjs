const XLSX = require('xlsx');
const wb = XLSX.readFile('templates/PI_WORKPLANNER_OCT26.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Test across all summary tasks with children
let durationWeightMatches = 0;
let arithmeticAverageMatches = 0;
let totalChecked = 0;

const summaryTasks = data.filter(d => d.type === 'project');

summaryTasks.forEach(parent => {
  const pEdt = String(parent.EDT);
  const pLevel = Number(parent.NivelEsquema);
  const pW = parseFloat(String(parent.W).replace('%','')) || 0;
  
  const children = data.filter(d => {
    const cEdt = String(d.EDT);
    return cEdt.startsWith(pEdt + '.') && Number(d.NivelEsquema) === pLevel + 1;
  });

  if (children.length >= 2) {
    const childWs = children.map(c => parseFloat(String(c.W).replace('%','')) || 0);
    const childDuraPrevs = children.map(c => Number(c.DuraPrev) || 0);
    const totalDuraPrev = childDuraPrevs.reduce((a, b) => a + b, 0);

    const avg = childWs.reduce((a, b) => a + b, 0) / children.length;
    const weightedDur = totalDuraPrev > 0
      ? childWs.reduce((acc, w, idx) => acc + (w * childDuraPrevs[idx]), 0) / totalDuraPrev
      : 0;

    // Check difference with parent
    const diffAvg = Math.abs(avg - pW);
    const diffDur = Math.abs(weightedDur - pW);

    if (pW > 0 && pW < 1) {
      totalChecked++;
      if (diffDur < 0.02) durationWeightMatches++;
      if (diffAvg < 0.02) arithmeticAverageMatches++;
      
      if (totalChecked <= 10) {
        console.log(`Parent ${pEdt} (${parent.Nombre}): Actual W=${pW} | WeightedDur=${weightedDur.toFixed(3)} (diff=${diffDur.toFixed(3)}) | Avg=${avg.toFixed(3)} (diff=${diffAvg.toFixed(3)})`);
      }
    }
  }
});

console.log(`\nChecked ${totalChecked} non-trivial summary tasks:`);
console.log(`- Matched Weighted by DuraPrev (within 2%): ${durationWeightMatches} (${(durationWeightMatches/totalChecked*100).toFixed(1)}%)`);
console.log(`- Matched Arithmetic Average (within 2%): ${arithmeticAverageMatches} (${(arithmeticAverageMatches/totalChecked*100).toFixed(1)}%)`);

