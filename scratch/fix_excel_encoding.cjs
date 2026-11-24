const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const filePath = path.resolve('Control de Proyectos Interventoria - Marval/PI_WORKPLANNER_OCT26.xlsx');
const backupPath = path.resolve('Control de Proyectos Interventoria - Marval/PI_WORKPLANNER_OCT26_ORIGINAL_BACKUP.xlsx');

// Ensure backup exists
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('Backup guardado en:', backupPath);
}

const wb = XLSX.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const range = XLSX.utils.decode_range(sheet['!ref']);

console.log(`Procesando hoja '${sheetName}' (${range.e.r + 1} filas x ${range.e.c + 1} columnas)...`);

let modifiedCount = 0;
const replacementsLog = {};

function cleanValue(str) {
  if (typeof str !== 'string') return str;
  let s = str;

  // 1. Corregir errores causados por acentos ("´") sin colocar la tilde ("´"):
  // 'í' (Ã­ / \xC3\xAD) -> 'i'
  s = s.replace(/Ã­/g, 'i').replace(/\u00C3\u00AD/g, 'i');
  // 'ó' (Ã³ / \xC3\xB3) -> 'o'
  s = s.replace(/Ã³/g, 'o').replace(/\u00C3\u00B3/g, 'o');
  // 'á' (Ã¡ / \xC3\xA1) -> 'a'
  s = s.replace(/Ã¡/g, 'a').replace(/\u00C3\u00A1/g, 'a');
  // 'é' (Ã© / \xC3\xA9) -> 'e'
  s = s.replace(/Ã©/g, 'e').replace(/\u00C3\u00A9/g, 'e');
  // 'ú' (Ãº / \xC3\xBA) -> 'u'
  s = s.replace(/Ãº/g, 'u').replace(/\u00C3\u00BA/g, 'u');

  // Tildes sueltas o apóstrofes raros
  s = s.replace(/[´`\u00B4]/g, '');

  // 2. Corregir errores causados por 'ñ' y 'Ñ':
  // 'ñ' (\xC3\xB1 / Ã±) -> 'ñ'
  s = s.replace(/Ã±/g, 'ñ').replace(/\u00C3\u00B1/g, 'ñ');
  // 'Ñ' (\xC3\x91 / Ã‘ / \u00C3\u2018) -> 'Ñ'
  s = s.replace(/Ã‘/g, 'Ñ').replace(/\u00C3\u2018/g, 'Ñ').replace(/\u00C3\u0091/g, 'Ñ');

  return s;
}

// Recorrer todas las celdas del rango
for (let r = range.s.r; r <= range.e.r; r++) {
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[cellAddr];
    if (!cell || typeof cell.v !== 'string') continue;

    const original = cell.v;
    const cleaned = cleanValue(original);

    if (cleaned !== original) {
      cell.v = cleaned;
      if (cell.w) {
        cell.w = cleanValue(cell.w);
      }
      modifiedCount++;
      const key = `${original}  ==>  ${cleaned}`;
      replacementsLog[key] = (replacementsLog[key] || 0) + 1;
    }
  }
}

console.log(`\nTotal de celdas modificadas: ${modifiedCount}`);
console.log('\n--- Detalle de Transformaciones Realizadas ---');
for (const [k, count] of Object.entries(replacementsLog)) {
  console.log(`[${count}x] ${k}`);
}

// Guardar archivo actualizado
XLSX.writeFile(wb, filePath);
console.log('\nArchivo Excel actualizado exitosamente en:', filePath);

// También guardar una copia en templates/
const templateDest = path.resolve('templates/PI_WORKPLANNER_OCT26.xlsx');
XLSX.writeFile(wb, templateDest);
console.log('Copia limpia guardada en templates:', templateDest);
