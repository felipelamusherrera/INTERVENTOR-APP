const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const filePath = path.resolve('Control de Proyectos Interventoria - Marval/PI_WORKPLANNER_OCT26.xlsx');
const wb = XLSX.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];

// Function to convert Excel serial date to YYYY-MM-DD string
function excelDateToIso(val) {
  if (!val) return '';
  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const utcDays = num - 25569;
    const date = new Date(Math.round(utcDays * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  return String(val);
}

const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
console.log(`Leídas ${rawRows.length} filas desde Excel.`);

const cleanTasks = rawRows.map(row => {
  const varFin = parseInt(row.VarFin || '0', 10);
  const varComien = parseInt(row.VarComien || '0', 10);
  const w = parseFloat(row.W || '0');
  const esHito = String(row.Hito || '').toLowerCase() === 'si' || row.type === 'milestone';

  return {
    edt: String(row.EDT || ''),
    nivel: parseInt(row.NivelEsquema || '2', 10),
    esHito,
    nombre: String(row.Nombre || ''),
    w: isNaN(w) ? 0 : w,
    duraPrev: parseInt(row.DuraPrev || '0', 10),
    dura: parseInt(row.Dura || '0', 10),
    comienPrev: excelDateToIso(row.ComienPrev),
    finPrev: excelDateToIso(row.FinPrev),
    comien: excelDateToIso(row.Comien),
    fin: excelDateToIso(row.Fin),
    varComien: isNaN(varComien) ? 0 : varComien,
    varFin: isNaN(varFin) ? 0 : varFin,
    responsable: String(row.Responsable || '').trim(),
    unidad: String(row.unidadMedida || ''),
    cantidad: String(row.cantidad || '0'),
    rendimiento: String(row.rendimiento || '0'),
    tipo: String(row.type || 'task'),
    etapa: String(row.Etapa || '')
  };
});

// Guardar como JSON limpio completo
const destJson = path.resolve('src/data/wbsBelaterraFull.json');
fs.writeFileSync(destJson, JSON.stringify(cleanTasks, null, 2), 'utf8');
console.log(`Guardado dataset completo (${cleanTasks.length} tareas) en: ${destJson}`);

// Guardar también como CSV limpio para compatibilidad directa
const csvContent = XLSX.utils.sheet_to_csv(sheet);
const destCsv = path.resolve('templates/PI_WORKPLANNER_OCT26_CLEAN.csv');
fs.writeFileSync(destCsv, csvContent, 'utf8');
console.log(`Guardado CSV limpio en: ${destCsv}`);

