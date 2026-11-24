import * as XLSX from 'xlsx';
import { WbsItem, MacroMilestone, MajorDelay } from '../types';
import { normalizeTorreStandard, normalizeEtapaStandard } from './projectService';

export interface FechaAlistamientoTorreRecord {
  agrupacion: string;
  etapa: string;
  hc?: string;
  proyecto?: string;
  gerente?: string;
  alistamientoPrevisto?: string;
  alistamientoProyectadoWp?: string;
  alistamientoConfirmadoGerente: string;
  aprueba?: string;
  fechaConfirmacion?: string;
  ingresoRph?: string;
  salidaRph?: string;
  banderaRph?: string;
  alistamientoTramite?: string;
}

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
  if (val === undefined || val === null || val === '') return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return '';
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const utcDays = Math.floor(num - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  return str;
}

/**
 * Normaliza el avance W del Workplanner a fracción 0-1.
 * Acepta 0.04, "4%", "4", "100%" o 1.
 */
export function normalizePercent(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return val > 1 ? val / 100 : val;
  }
  const str = String(val).trim();
  const num = parseFloat(str.replace('%', '').replace(',', '.'));
  if (isNaN(num)) return 0;
  if (str.includes('%') || num > 1) return num / 100;
  return num;
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

    const pickCol = (candidates: string[]): any => {
      const lowerKeys = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
        acc[k.trim().toLowerCase()] = k;
        return acc;
      }, {});
      for (const c of candidates) {
        const key = lowerKeys[c.toLowerCase()];
        if (key !== undefined && row[key] !== '' && row[key] !== undefined) {
          return row[key];
        }
      }
      return '';
    };

    const comienPrevVal = formatScheduleDate(
      pickCol(['ComienPrev', 'Comienprev', 'Comien_Prev', 'ComienzoPrev', 'Comienzo Linea Base'])
    );
    const finPrevVal = formatScheduleDate(
      pickCol(['FinPrev', 'Finprev', 'Fin_Prev', 'Fin Linea Base'])
    );
    const comienVal = formatScheduleDate(pickCol(['Comien', 'ComienReal', 'Comienzo Real']));
    const finVal = formatScheduleDate(pickCol(['Fin', 'FinReal', 'Fin Real']));

    tasks.push({
      idConsec: Number(pickCol(['idConsec', 'IdConsec', 'ID'])) || tasks.length + 1,
      edt,
      nivel: parseInt(String(row.NivelEsquema || row.nivel || '2'), 10),
      esHito,
      nombre: cleanTextEncoding(String(row.Nombre || row.nombre || 'Sin nombre')),
      w: normalizePercent(row.W !== undefined && row.W !== '' ? row.W : row.w),
      duraPrev: parseInt(String(pickCol(['DuraPrev', 'Duraprev', 'Dura_Prev']) || '0'), 10),
      dura: parseInt(String(row.Dura || row.dura || '0'), 10),
      comienPrev: comienPrevVal || comienVal,
      finPrev: finPrevVal || finVal,
      comien: comienVal || comienPrevVal,
      fin: finVal || finPrevVal,
      varComien: isNaN(varComienVal) ? 0 : varComienVal,
      varFin: isNaN(varFinVal) ? 0 : varFinVal,
      responsable: cleanTextEncoding(String(row.Responsable || row.responsable || '')),
      unidad: cleanTextEncoding(String(row.unidadMedida || row.unidad || '')),
      cantidad: String(row.cantidad || '0'),
      rendimiento: String(row.rendimiento || '0'),
      predecesora: String(pickCol(['predecesora', 'Predecesora', 'Predecesoras']) || ''),
      agrupacion: cleanTextEncoding(String(pickCol(['Agrupacion', 'agrupacion', 'Agrupación']) || '')),
      codigoPlaneacion: String(pickCol(['codigoPlaneacion', 'CodigoPlaneacion', 'Codigo Planeacion', 'CodigoCPC']) || ''),
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
  const delimiter = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter);
  
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
  const idxIdConsec = getColIndex('idConsec');
  const idxPredecesora = getColIndex('predecesora');
  const idxAgrupacion = getColIndex('agrupacion');
  const idxCodigoPlaneacion = getColIndex('codigoPlaneacion');

  const tasks: WbsItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], delimiter);
    if (row.length === 0 || !row[idxEdt]) continue;

    const varFinVal = parseInt(row[idxVarFin] || '0', 10);
    const varComienVal = parseInt(row[idxVarComien] || '0', 10);
    const hitoStr = cleanTextEncoding(row[idxHito] || '').toLowerCase();

    const csvComienPrev = formatScheduleDate(row[idxComienPrev]);
    const csvFinPrev = formatScheduleDate(row[idxFinPrev]);
    const csvComien = formatScheduleDate(row[idxComien]);
    const csvFin = formatScheduleDate(row[idxFin]);
    const idConsecVal = idxIdConsec >= 0 ? parseInt(row[idxIdConsec] || '', 10) : NaN;

    tasks.push({
      idConsec: isNaN(idConsecVal) ? tasks.length + 1 : idConsecVal,
      edt: cleanTextEncoding(row[idxEdt] || ''),
      nivel: parseInt(row[idxNivel] || '2', 10),
      esHito: hitoStr === 'si' || hitoStr === 's' || row[idxTipo] === 'milestone',
      nombre: cleanTextEncoding(row[idxNombre] || 'Sin nombre'),
      w: normalizePercent(row[idxW]),
      duraPrev: parseInt(row[idxDuraPrev] || '0', 10),
      dura: parseInt(row[idxDura] || '0', 10),
      comienPrev: csvComienPrev || csvComien,
      finPrev: csvFinPrev || csvFin,
      comien: csvComien || csvComienPrev,
      fin: csvFin || csvFinPrev,
      varComien: isNaN(varComienVal) ? 0 : varComienVal,
      varFin: isNaN(varFinVal) ? 0 : varFinVal,
      responsable: cleanTextEncoding(row[idxResp] || ''),
      unidad: cleanTextEncoding(row[idxUnidad] || ''),
      cantidad: row[idxCantidad] || '',
      rendimiento: row[idxRend] || '',
      tipo: row[idxTipo] || 'task',
      etapa: cleanTextEncoding(row[idxEtapa] || ''),
      predecesora: idxPredecesora >= 0 ? row[idxPredecesora] || '' : '',
      agrupacion: idxAgrupacion >= 0 ? cleanTextEncoding(row[idxAgrupacion] || '') : '',
      codigoPlaneacion: idxCodigoPlaneacion >= 0 ? row[idxCodigoPlaneacion] || '' : ''
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

function parseCsvLine(text: string, delimiter: string = ','): string[] {
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
    } else if (c === delimiter && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function normalizeAlistamientoHeaderKey(k: string): string {
  return cleanTextEncoding(k)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parsea las filas de la plantilla "FECHAS DE ALISTAMIENTO" (Excel / CSV)
 * extrayendo la fecha confirmada por Gerencia (`AlistamientConfirmadoGerente(C)`) por torre.
 */
export function parseFechasAlistamientoRows(rows: Record<string, any>[]): FechaAlistamientoTorreRecord[] {
  const result: FechaAlistamientoTorreRecord[] = [];
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

  for (const row of rows) {
    const normEntries = Object.entries(row).map(([k, v]) => ({
      norm: normalizeAlistamientoHeaderKey(k),
      val: v,
    }));

    const pickExactOrContains = (candidates: string[], containsAll?: string[]): any => {
      for (const c of candidates) {
        const hit = normEntries.find((e) => e.norm === c && e.val !== '' && e.val !== undefined && e.val !== null);
        if (hit) return hit.val;
      }
      if (containsAll && containsAll.length > 0) {
        const hit = normEntries.find(
          (e) =>
            containsAll.every((token) => e.norm.includes(token)) &&
            e.val !== '' &&
            e.val !== undefined &&
            e.val !== null
        );
        if (hit) return hit.val;
      }
      return '';
    };

    const rawAgr = cleanTextEncoding(
      String(
        pickExactOrContains(
          ['agrupacionworkplanner', 'agrupacion', 'torre'],
          ['agrupacion']
        ) || ''
      )
    );
    if (!rawAgr) continue;

    const agrupacion = normalizeTorreStandard(rawAgr) || rawAgr.toUpperCase();
    const rawEtapa = cleanTextEncoding(
      String(pickExactOrContains(['etapa'], ['etapa']) || '')
    );
    const etapa = normalizeEtapaStandard(rawEtapa) || rawEtapa.toUpperCase();

    const confirmadoRaw = pickExactOrContains(
      [
        'alistamientconfirmadogerentec',
        'alistamientoconfirmadogerentec',
        'alistamientconfirmadogerente',
        'alistamientoconfirmadogerente',
        'confirmadogerentec',
        'confirmadogerente',
      ],
      ['confirmadogerente']
    ) || pickExactOrContains(['fechagerenciac'], ['gerente', 'c']);

    const alistamientoConfirmadoGerente = formatScheduleDate(confirmadoRaw);
    if (!isoDateRe.test(alistamientoConfirmadoGerente)) continue;

    const previstoRaw = pickExactOrContains(
      ['alistamientoprevistoa', 'alistamientoprevisto'],
      ['previsto']
    );
    const proyWpRaw = pickExactOrContains(
      ['alistamientoproyectadoworkplannerb', 'alistamientoproyectadoworkplanner'],
      ['proyectado', 'workplanner']
    );

    const alistamientoPrevisto = formatScheduleDate(previstoRaw);
    const alistamientoProyectadoWp = formatScheduleDate(proyWpRaw);

    result.push({
      agrupacion,
      etapa,
      hc: String(pickExactOrContains(['hc']) || '').trim() || undefined,
      proyecto: cleanTextEncoding(String(pickExactOrContains(['proyecto']) || '')) || undefined,
      gerente: cleanTextEncoding(String(pickExactOrContains(['gerente']) || '')) || undefined,
      alistamientoPrevisto: isoDateRe.test(alistamientoPrevisto) ? alistamientoPrevisto : undefined,
      alistamientoProyectadoWp: isoDateRe.test(alistamientoProyectadoWp) ? alistamientoProyectadoWp : undefined,
      alistamientoConfirmadoGerente,
      aprueba: cleanTextEncoding(String(pickExactOrContains(['aprueba']) || '')) || undefined,
      fechaConfirmacion: (() => {
        const d = formatScheduleDate(pickExactOrContains(['fechadeconfirmacion', 'fechaconfirmacion']));
        return isoDateRe.test(d) ? d : undefined;
      })(),
      ingresoRph: (() => {
        const d = formatScheduleDate(pickExactOrContains(['ingresorph']));
        return isoDateRe.test(d) ? d : undefined;
      })(),
      salidaRph: (() => {
        const d = formatScheduleDate(pickExactOrContains(['salidarph']));
        return isoDateRe.test(d) ? d : undefined;
      })(),
      banderaRph: cleanTextEncoding(String(pickExactOrContains(['banderarph']) || '')) || undefined,
      alistamientoTramite: (() => {
        const d = formatScheduleDate(pickExactOrContains(['alistamientotramite']));
        return isoDateRe.test(d) ? d : undefined;
      })(),
    });
  }

  return result;
}

export function parseFechasAlistamientoExcel(data: ArrayBuffer): FechaAlistamientoTorreRecord[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  return parseFechasAlistamientoRows(rows);
}

export function parseFechasAlistamientoCsv(text: string): FechaAlistamientoTorreRecord[] {
  const workbook = XLSX.read(text, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  return parseFechasAlistamientoRows(rows);
}
