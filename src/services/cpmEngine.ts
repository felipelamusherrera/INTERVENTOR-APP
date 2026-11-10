export interface PredecessoraLink {
  idConsec: number;
  tipo: 'FC' | 'CC' | 'FF' | 'CF';
  lagDias: number;
}

export interface CpmTask {
  idConsec: number;
  edt: string;
  nombre: string;
  dura: number;
  duraPrev?: number;
  w: number;
  type: 'project' | 'task';
  esHito: boolean;
  comien: string; // Fecha reprogramada oficial del software (Comien)
  fin: string;    // Fecha reprogramada oficial del software (Fin)
  comienPrev?: string;
  finPrev?: string;
  varFin?: number;
  predecesoraRaw: string;
  predecesores: PredecessoraLink[];
  sucesores: PredecessoraLink[];
  agrupacion?: string;
  nivel?: number;
  proyecto?: string;
  sucursal?: string;
  
  // Métricas CPM calculadas
  earlyStartDate: string; // Coincide con Comien
  earlyFinishDate: string; // Coincide con Fin
  lateStartDate: string;   // Fecha límite de inicio
  lateFinishDate: string;  // Fecha límite de fin (LF)
  tf: number;             // Total Float (Holgura Total en días de calendario)
  ff: number;             // Free Float (Holgura Libre en días)
  esCritica: boolean;     // TF <= 0
}

export interface CpmProjectSummary {
  totalTareas: number;
  tareasCriticas: number;
  duracionProyectoDias: number;
  porcentajeCriticidad: number;
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  tareasEnRiesgo: number; // 0 < tf <= 5
}

function parseDate(d: string | number | undefined | null): Date | null {
  if (!d) return null;
  if (typeof d === 'number') {
    // Serial de Excel
    const utc_days = Math.floor(d - 25569);
    return new Date(utc_days * 86400 * 1000);
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateStr(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const MS_PER_DAY = 86400 * 1000;

export class CpmEngine {
  /**
   * Parsea la celda de predecesora de WorkPlanner (ej: "552;718;490CC+40%;746CC+1 dia;750FF")
   */
  static parsePredecesora(raw: string | undefined | null, duraTarea: number): PredecessoraLink[] {
    if (!raw || typeof raw !== 'string') return [];
    
    const parts = raw.split(';').map(p => p.trim()).filter(Boolean);
    const links: PredecessoraLink[] = [];

    for (const part of parts) {
      const match = part.match(/^(\d+)(CC|FC|FF|CF)?([+-]?\d+)?(%|dias?|d)?/i);
      if (match) {
        const idConsec = parseInt(match[1], 10);
        const tipo = (match[2] ? match[2].toUpperCase() : 'FC') as 'FC' | 'CC' | 'FF' | 'CF';
        let lagDias = 0;

        if (match[3]) {
          const valor = parseInt(match[3], 10);
          const unidad = match[4] ? match[4].toLowerCase() : 'd';
          if (unidad === '%') {
            lagDias = Math.round((valor / 100) * duraTarea);
          } else {
            lagDias = valor;
          }
        }

        links.push({ idConsec, tipo, lagDias });
      }
    }

    return links;
  }

  /**
   * Analiza la red de Ruta Crítica y Holguras basándose estrictamente en las fechas oficiales
   * reprogramadas del software ("Comien", "Fin", "Dura") y los vínculos de "predecesora".
   */
  static computeSchedule(
    rawRows: Array<{
      idConsec?: number;
      edt?: string;
      nombre?: string;
      dura?: number;
      duraPrev?: number;
      w?: number | string;
      type?: string;
      esHito?: boolean;
      predecesora?: string;
      comien?: string | number;
      fin?: string | number;
      comienPrev?: string | number;
      finPrev?: string | number;
      varFin?: number;
      agrupacion?: string;
      nivel?: number;
      proyecto?: string;
      sucursal?: string;
    }>
  ): { tasks: CpmTask[]; summary: CpmProjectSummary } {
    const taskMap = new Map<number, {
      task: CpmTask;
      comienDate: Date | null;
      finDate: Date | null;
    }>();

    let maxProjectFinTime = 0;
    let minProjectStartTime = Infinity;

    // 1. Inicialización de Nodos con fechas reprogramadas reales
    for (let idx = 0; idx < rawRows.length; idx++) {
      const r = rawRows[idx];
      const id = Number(r.idConsec) || (idx + 1);

      const dura = Math.max(0, Math.round(Number(r.dura !== undefined ? r.dura : (r.duraPrev || 0))));
      const wNum = typeof r.w === 'number' ? r.w : parseFloat(String(r.w || '0').replace('%', '')) || 0;
      const links = this.parsePredecesora(r.predecesora, dura);

      const cDate = parseDate(r.comien);
      const fDate = parseDate(r.fin) || cDate;

      if (cDate && cDate.getTime() < minProjectStartTime) {
        minProjectStartTime = cDate.getTime();
      }
      if (fDate && fDate.getTime() > maxProjectFinTime) {
        maxProjectFinTime = fDate.getTime();
      }

      const task: CpmTask = {
        idConsec: id,
        edt: String(r.edt || ''),
        nombre: String(r.nombre || `Tarea ${id}`),
        dura,
        duraPrev: Number(r.duraPrev || 0),
        w: wNum > 1 ? wNum / 100 : wNum,
        type: (r.type === 'project' ? 'project' : 'task') as 'project' | 'task',
        esHito: Boolean(r.esHito || dura === 0),
        comien: formatDateStr(cDate),
        fin: formatDateStr(fDate),
        comienPrev: formatDateStr(parseDate(r.comienPrev)),
        finPrev: formatDateStr(parseDate(r.finPrev)),
        varFin: r.varFin,
        agrupacion: r.agrupacion || 'NO APLICA',
        nivel: r.nivel !== undefined ? Number(r.nivel) : (r.edt ? r.edt.split('.').length : 1),
        proyecto: r.proyecto || 'Belaterra Pietra',
        sucursal: r.sucursal || 'CALI',
        predecesoraRaw: String(r.predecesora || ''),
        predecesores: links,
        sucesores: [],
        earlyStartDate: formatDateStr(cDate),
        earlyFinishDate: formatDateStr(fDate),
        lateStartDate: '',
        lateFinishDate: '',
        tf: 0,
        ff: 0,
        esCritica: false,
      };

      taskMap.set(id, { task, comienDate: cDate, finDate: fDate });
    }

    if (maxProjectFinTime === 0) {
      maxProjectFinTime = Date.now();
    }

    // 2. Construir Grafo Inverso de Sucesores
    for (const item of taskMap.values()) {
      for (const predLink of item.task.predecesores) {
        const pred = taskMap.get(predLink.idConsec);
        if (pred) {
          pred.task.sucesores.push({
            idConsec: item.task.idConsec,
            tipo: predLink.tipo,
            lagDias: predLink.lagDias,
          });
        }
      }
    }

    // 3. Pase Hacia Atrás (Backward Pass) y Cálculo de Holgura Total (TF)
    // Para cada actividad, su Fin Tardío (LF) es el tiempo más temprano en que debe terminar
    // para no desplazar el inicio temprano de sus sucesoras reprogramadas.
    for (const item of taskMap.values()) {
      const { task, finDate, comienDate } = item;
      if (!finDate) continue;

      let minAllowableFinishTime = maxProjectFinTime;

      if (task.sucesores.length > 0) {
        let minSuccFinish = Infinity;
        let minSuccEarlyStart = Infinity;

        for (const succLink of task.sucesores) {
          const succ = taskMap.get(succLink.idConsec);
          if (!succ || !succ.comienDate) continue;

          let allowedTime = Infinity;
          if (succLink.tipo === 'FC') {
            allowedTime = succ.comienDate.getTime() - (succLink.lagDias + 1) * MS_PER_DAY;
            if (succ.comienDate.getTime() < minSuccEarlyStart) {
              minSuccEarlyStart = succ.comienDate.getTime();
            }
          } else if (succLink.tipo === 'FF' && succ.finDate) {
            allowedTime = succ.finDate.getTime() - succLink.lagDias * MS_PER_DAY;
          } else if (succLink.tipo === 'CC') {
            allowedTime = succ.comienDate.getTime() - succLink.lagDias * MS_PER_DAY + task.dura * MS_PER_DAY;
          }

          if (allowedTime < minSuccFinish) {
            minSuccFinish = allowedTime;
          }
        }

        if (minSuccFinish !== Infinity) {
          minAllowableFinishTime = minSuccFinish;
        }

        // Holgura Libre (Free Float): margen antes de retrasar el inicio temprano del sucesor más próximo
        if (minSuccEarlyStart !== Infinity && finDate) {
          const ffDays = Math.round((minSuccEarlyStart - finDate.getTime()) / MS_PER_DAY) - 1;
          task.ff = Math.max(0, ffDays);
        }
      }

      // Holgura Total = Días entre Fin Reprogramado y Fin Tardío Permisible
      const tfDays = Math.round((minAllowableFinishTime - finDate.getTime()) / MS_PER_DAY);
      task.tf = tfDays;
      task.esCritica = tfDays <= 0;

      const lfDate = new Date(minAllowableFinishTime);
      const lsDate = new Date(minAllowableFinishTime - task.dura * MS_PER_DAY);

      task.lateFinishDate = formatDateStr(lfDate);
      task.lateStartDate = formatDateStr(lsDate);
    }

    const tasks = Array.from(taskMap.values()).map(i => i.task);
    const criticasCount = tasks.filter(t => t.esCritica).length;
    const enRiesgoCount = tasks.filter(t => t.tf > 0 && t.tf <= 5).length;

    const summary: CpmProjectSummary = {
      totalTareas: tasks.length,
      tareasCriticas: criticasCount,
      duracionProyectoDias: Math.round((maxProjectFinTime - minProjectStartTime) / MS_PER_DAY),
      porcentajeCriticidad: tasks.length > 0 ? Math.round((criticasCount / tasks.length) * 100) : 0,
      fechaInicioEstimada: formatDateStr(new Date(minProjectStartTime)),
      fechaFinEstimada: formatDateStr(new Date(maxProjectFinTime)),
      tareasEnRiesgo: enRiesgoCount,
    };

    return { tasks, summary };
  }
}
