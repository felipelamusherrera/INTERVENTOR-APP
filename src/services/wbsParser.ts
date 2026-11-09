import * as XLSX from 'xlsx';
import { WbsItem, MacroMilestone, MajorDelay } from '../types';

export interface ParsedScheduleResult {
  tasks: WbsItem[];
  milestones: MacroMilestone[];
  topDelays: MajorDelay[];
  totalTasks: number;
  criticalDelaysCount: number;
  averageVariance: number;
}

/**
 * Función de limpieza y normalización:
 * Si los errores son por acento/tilde ("´"), se eliminan sin colocar la tilde.
 * Se normalizan caracteres mojibake y codificaciones corruptas.
 */
export function cleanTextEncoding(val: string): string {
  if (!val || typeof val !== 'string') return '';
  let s = val;

  // 1. Corregir vocales con tilde ("´") eliminando el error SIN colocar la tilde:
  s = s.replace(/Ã­/g, 'i').replace(/\u00C3\u00AD/g, 'i');
  s = s.replace(/Ã³/g, 'o').replace(/\u00C3\u00B3/g, 'o');
  s = s.replace(/Ã¡/g, 'a').replace(/\u00C3\u00A1/g, 'a');
  s = s.replace(/Ã©/g, 'e').replace(/\u00C3\u00A9/g, 'e');
  s = s.replace(/Ãº/g, 'u').replace(/\u00C3\u00BA/g, 'u');
  s = s.replace(/[´`\u00B4]/g, '');

  // 2. Corregir 'ñ' y 'Ñ':
  s = s.replace(/Ã±/g, 'ñ').replace(/\u00C3\u00B1/g, 'ñ');
  s = s.replace(/Ã‘/g, 'Ñ').replace(/\u00C3\u2018/g, 'Ñ').replace(/\u00C3\u0091/g, 'Ñ');

  return s.trim();
}

/**
 * Convierte fechas en formato serial de Excel o formato dd/mm/aaaa a ISO YYYY-MM-DD
 */
export function formatScheduleDate(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
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
  return str;
}

/**
 * Ingesta y parsea un archivo Excel (.xlsx / .xls) de WorkPlanner
 */
export function parseScheduleExcel(data: ArrayBuffer): ParsedScheduleResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const tasks: WbsItem[] = [];

  for (const row of rows) {
    const edt = cleanTextEncoding(String(row.EDT || row.edt || ''));
    if (!edt) continue;

    const varFinVal = parseInt(String(row.VarFin || row.varFin || '0'), 10);
    const varComienVal = parseInt(String(row.VarComien || row.varComien || '0'), 10);
    const wVal = parseFloat(String(row.W || row.w || '0').replace('%', ''));
    const hitoStr = cleanTextEncoding(String(row.Hito || row.hito || '')).toLowerCase();
    const esHito = hitoStr === 'si' || hitoStr === 's' || row.type === 'milestone';

    tasks.push({
      edt,
      nivel: parseInt(String(row.NivelEsquema || row.nivel || '2'), 10),
      esHito,
      nombre: cleanTextEncoding(String(row.Nombre || row.nombre || 'Sin nombre')),
      w: isNaN(wVal) ? 0 : wVal,
      duraPrev: parseInt(String(row.DuraPrev || row.duraPrev || '0'), 10),
      dura: parseInt(String(row.Dura || row.dura || '0'), 10),
      comienPrev: formatScheduleDate(row.ComienPrev || row.comienPrev),
      finPrev: formatScheduleDate(row.FinPrev || row.finPrev),
      comien: formatScheduleDate(row.Comien || row.comien),
      fin: formatScheduleDate(row.Fin || row.fin),
      varComien: isNaN(varComienVal) ? 0 : varComienVal,
      varFin: isNaN(varFinVal) ? 0 : varFinVal,
      responsable: cleanTextEncoding(String(row.Responsable || row.responsable || '')),
      unidad: cleanTextEncoding(String(row.unidadMedida || row.unidad || '')),
      cantidad: String(row.cantidad || '0'),
      rendimiento: String(row.rendimiento || '0'),
      tipo: String(row.type || row.tipo || 'task'),
      etapa: cleanTextEncoding(String(row.Etapa || row.etapa || ''))
    });
  }

  return processCalculatedMetrics(tasks);
}

/**
 * Ingesta y parsea un archivo CSV de WorkPlanner
 */
export function parseScheduleCsv(csvContent: string): ParsedScheduleResult {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      tasks: [],
      milestones: [],
      topDelays: [],
      totalTasks: 0,
      criticalDelaysCount: 0,
      averageVariance: 0
    };
  }

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  
  const getColIndex = (name: string): number => {
    return headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
  };

  const idxEdt = getColIndex('EDT');
  const idxNivel = getColIndex('NivelEsquema');
  const idxHito = getColIndex('Hito');
  const idxNombre = getColIndex('Nombre');
  const idxW = getColIndex('W');
  const idxDuraPrev = getColIndex('DuraPrev');
  const idxDura = getColIndex('Dura');
  const idxComienPrev = getColIndex('ComienPrev');
  const idxFinPrev = getColIndex('FinPrev');
  const idxComien = getColIndex('Comien');
  const idxFin = getColIndex('Fin');
  const idxVarComien = getColIndex('VarComien');
  const idxVarFin = getColIndex('VarFin');
  const idxResp = getColIndex('Responsable');
  const idxUnidad = getColIndex('unidadMedida');
  const idxCantidad = getColIndex('cantidad');
  const idxRend = getColIndex('rendimiento');
  const idxTipo = getColIndex('type');
  const idxEtapa = getColIndex('Etapa');

  const tasks: WbsItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || !row[idxEdt]) continue;

    const varFinVal = parseInt(row[idxVarFin] || '0', 10);
    const varComienVal = parseInt(row[idxVarComien] || '0', 10);
    const wVal = parseFloat(row[idxW] || '0');
    const hitoStr = cleanTextEncoding(row[idxHito] || '').toLowerCase();

    tasks.push({
      edt: cleanTextEncoding(row[idxEdt] || ''),
      nivel: parseInt(row[idxNivel] || '2', 10),
      esHito: hitoStr === 'si' || hitoStr === 's' || row[idxTipo] === 'milestone',
      nombre: cleanTextEncoding(row[idxNombre] || 'Sin nombre'),
      w: isNaN(wVal) ? 0 : wVal,
      duraPrev: parseInt(row[idxDuraPrev] || '0', 10),
      dura: parseInt(row[idxDura] || '0', 10),
      comienPrev: formatScheduleDate(row[idxComienPrev]),
      finPrev: formatScheduleDate(row[idxFinPrev]),
      comien: formatScheduleDate(row[idxComien]),
      fin: formatScheduleDate(row[idxFin]),
      varComien: isNaN(varComienVal) ? 0 : varComienVal,
      varFin: isNaN(varFinVal) ? 0 : varFinVal,
      responsable: cleanTextEncoding(row[idxResp] || ''),
      unidad: cleanTextEncoding(row[idxUnidad] || ''),
      cantidad: row[idxCantidad] || '',
      rendimiento: row[idxRend] || '',
      tipo: row[idxTipo] || 'task',
      etapa: cleanTextEncoding(row[idxEtapa] || '')
    });
  }

  return processCalculatedMetrics(tasks);
}

function processCalculatedMetrics(tasks: WbsItem[]): ParsedScheduleResult {
  // Top 5 mayores retrasos
  const sortedDelays = [...tasks]
    .filter(t => t.tipo === 'task' && t.varFin > 0)
    .sort((a, b) => b.varFin - a.varFin)
    .slice(0, 5)
    .map((t, idx) => ({
      id: `delay-${idx + 1}`,
      tarea: t.nombre,
      finPrevisto: t.finPrev,
      finProyectado: t.fin,
      diasAtraso: t.varFin,
      responsable: t.responsable || 'No Asignado',
      causaRaiz: t.nombre.toLowerCase().includes('relleno') ? 'Equipos' :
                 t.nombre.toLowerCase().includes('provisional') ? 'Licencias / Permisos' :
                 t.nombre.toLowerCase().includes('baranda') ? 'Contratistas / Personal' : 'Formaleta',
      impactoRutaCritica: t.varFin >= 15
    }));

  const totalVariance = tasks.reduce((acc, curr) => acc + (curr.varFin || 0), 0);
  const avgVar = tasks.length > 0 ? Math.round(totalVariance / tasks.length) : 0;
  const critCount = tasks.filter(t => t.varFin >= 15).length;

  return {
    tasks,
    milestones: [],
    topDelays: sortedDelays,
    totalTasks: tasks.length,
    criticalDelaysCount: critCount,
    averageVariance: avgVar
  };
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}
