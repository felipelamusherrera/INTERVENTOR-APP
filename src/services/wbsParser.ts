import { WbsItem, MacroMilestone, MajorDelay } from '../types';

export interface ParsedScheduleResult {
  tasks: WbsItem[];
  milestones: MacroMilestone[];
  topDelays: MajorDelay[];
  totalTasks: number;
  criticalDelaysCount: number;
  averageVariance: number;
}

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

    tasks.push({
      edt: row[idxEdt] || '',
      nivel: parseInt(row[idxNivel] || '2', 10),
      esHito: (row[idxHito] || '').toLowerCase().includes('s') || row[idxTipo] === 'milestone',
      nombre: row[idxNombre] || 'Sin nombre',
      w: isNaN(wVal) ? 0 : wVal,
      duraPrev: parseInt(row[idxDuraPrev] || '0', 10),
      dura: parseInt(row[idxDura] || '0', 10),
      comienPrev: row[idxComienPrev] || '',
      finPrev: row[idxFinPrev] || '',
      comien: row[idxComien] || '',
      fin: row[idxFin] || '',
      varComien: isNaN(varComienVal) ? 0 : varComienVal,
      varFin: isNaN(varFinVal) ? 0 : varFinVal,
      responsable: (row[idxResp] || '').trim(),
      unidad: row[idxUnidad] || '',
      cantidad: row[idxCantidad] || '',
      rendimiento: row[idxRend] || '',
      tipo: row[idxTipo] || 'task',
      etapa: row[idxEtapa] || ''
    });
  }

  // Calculate Top 5 Delays
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
      impactoRutaCritica: t.varFin > 30
    }));

  const totalVariance = tasks.reduce((acc, curr) => acc + (curr.varFin || 0), 0);
  const avgVar = tasks.length > 0 ? Math.round(totalVariance / tasks.length) : 0;
  const critCount = tasks.filter(t => t.varFin > 30).length;

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
