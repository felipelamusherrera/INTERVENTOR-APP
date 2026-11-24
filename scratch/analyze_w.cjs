const XLSX = require('xlsx');
const wb = XLSX.readFile('templates/PI_WORKPLANNER_OCT26.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', data.length);

// Let's examine multiple parent-child groups across the project
// A parent at level N has direct children at level N+1 whose EDT starts with parent.EDT + '.'
const summaryTasks = data.filter(d => d.type === 'project' && d.NivelEsquema <= 5);

console.log(`Found ${summaryTasks.length} summary tasks at levels 2-5.`);

let sampleTests = [];

summaryTasks.slice(0, 15).forEach(parent => {
  const pEdt = String(parent.EDT);
  const pLevel = Number(parent.NivelEsquema);
  const pW = parseFloat(String(parent.W).replace('%','')) || 0;
  
  // Direct children have NivelEsquema === pLevel + 1 and EDT starts with pEdt + '.'
  const children = data.filter(d => {
    const cEdt = String(d.EDT);
    return cEdt.startsWith(pEdt + '.') && Number(d.NivelEsquema) === pLevel + 1;
  });

  if (children.length > 0) {
    const childWs = children.map(c => parseFloat(String(c.W).replace('%','')) || 0);
    const childDuraPrevs = children.map(c => Number(c.DuraPrev) || 0);
    const childDuras = children.map(c => Number(c.Dura) || 0);

    const sumW = childWs.reduce((a, b) => a + b, 0);
    const avgW = sumW / children.length;

    // Weighted by DuraPrev
    const totalDuraPrev = childDuraPrevs.reduce((a, b) => a + b, 0);
    const weightedDuraPrevW = totalDuraPrev > 0
      ? childWs.reduce((acc, w, idx) => acc + (w * childDuraPrevs[idx]), 0) / totalDuraPrev
      : 0;

    // Weighted by Dura
    const totalDura = childDuras.reduce((a, b) => a + b, 0);
    const weightedDuraW = totalDura > 0
      ? childWs.reduce((acc, w, idx) => acc + (w * childDuras[idx]), 0) / totalDura
      : 0;

    sampleTests.push({
      parentEDT: pEdt,
      parentNombre: parent.Nombre,
      parentLevel: pLevel,
      parentW: pW,
      childrenCount: children.length,
      sumChildrenW: Math.round(sumW * 1000) / 1000,
      avgChildrenW: Math.round(avgW * 1000) / 1000,
      weightedDuraPrevW: Math.round(weightedDuraPrevW * 1000) / 1000,
      weightedDuraW: Math.round(weightedDuraW * 1000) / 1000,
      childSample: children.slice(0, 3).map(c => ({ edt: c.EDT, w: c.W, duraPrev: c.DuraPrev, nombre: c.Nombre }))
    });
  }
});

console.log(JSON.stringify(sampleTests.slice(0, 8), null, 2));

