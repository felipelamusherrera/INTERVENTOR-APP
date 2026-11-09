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
  w: number;
  type: 'project' | 'task';
  esHito: boolean;
  comienzoOriginal?: string;
  finOriginal?: string;
  predecesoraRaw: string;
  predecesores: PredecessoraLink[];
  sucesores: PredecessoraLink[];
  
  // Resultados CPM
  es: number; // Early Start (Día relativo)
  ef: number; // Early Finish
  ls: number; // Late Start
  lf: number; // Late Finish
  tf: number; // Total Float (Holgura Total en días)
  ff: number; // Free Float (Holgura Libre en días)
  esCritica: boolean;
  earlyStartDate?: string;
  earlyFinishDate?: string;
  lateStartDate?: string;
  lateFinishDate?: string;
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

export class CpmEngine {
  /**
   * Parsea la celda de predecesora de WorkPlanner (ej: "552;718;490CC+40%;746CC+1 dia;750FF")
   */
  static parsePredecesora(raw: string | undefined | null, duraTarea: number): PredecessoraLink[] {
    if (!raw || typeof raw !== 'string') return [];
    
    const parts = raw.split(';').map(p => p.trim()).filter(Boolean);
    const links: PredecessoraLink[] = [];

    for (const part of parts) {
      // Regex que captura: idConsec, tipo opcional (FC, CC, FF, CF), signo opcional (+/-), valor opcional (días o %)
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
   * Ejecuta el Pase Adelante (Forward Pass), Pase Atrás (Backward Pass) y cálculo de holguras
   */
  static computeSchedule(
    rawRows: Array<{
      idConsec: number;
      edt?: string;
      nombre?: string;
      dura?: number;
      duraPrev?: number;
      w?: number | string;
      type?: string;
      esHito?: boolean;
      predecesora?: string;
      comien?: string;
      fin?: string;
    }>,
    projectStartDateStr: string = '2026-11-03'
  ): { tasks: CpmTask[]; summary: CpmProjectSummary } {
    const taskMap = new Map<number, CpmTask>();

    // 1. Inicialización de Nodos
    for (const r of rawRows) {
      const id = Number(r.idConsec);
      if (!id) continue;

      const dura = Math.max(0, Math.round(Number(r.dura || r.duraPrev || 0)));
      const wNum = typeof r.w === 'number' ? r.w : parseFloat(String(r.w || '0').replace('%', '')) || 0;
      const links = this.parsePredecesora(r.predecesora, dura);

      const task: CpmTask = {
        idConsec: id,
        edt: String(r.edt || ''),
        nombre: String(r.nombre || `Tarea ${id}`),
        dura,
        w: wNum > 1 ? wNum / 100 : wNum,
        type: (r.type === 'project' ? 'project' : 'task') as 'project' | 'task',
        esHito: Boolean(r.esHito || dura === 0),
        comienzoOriginal: r.comien,
        finOriginal: r.fin,
        predecesoraRaw: String(r.predecesora || ''),
        predecesores: links,
        sucesores: [],
        es: 0,
        ef: 0,
        ls: 0,
        lf: 0,
        tf: 0,
        ff: 0,
        esCritica: false,
      };

      taskMap.set(id, task);
    }

    // 2. Construir Grafo Inverso (Sucesores)
    for (const task of taskMap.values()) {
      for (const predLink of task.predecesores) {
        const pred = taskMap.get(predLink.idConsec);
        if (pred) {
          pred.sucesores.push({
            idConsec: task.idConsec,
            tipo: predLink.tipo,
            lagDias: predLink.lagDias,
          });
        }
      }
    }

    // 3. Ordenamiento Topológico (Kahn's Algorithm para evitar ciclos y garantizar orden causal)
    const inDegree = new Map<number, number>();
    for (const task of taskMap.values()) {
      // Solo consideramos predecesores existentes en el mapa
      const validPreds = task.predecesores.filter(p => taskMap.has(p.idConsec));
      inDegree.set(task.idConsec, validPreds.length);
    }

    const queue: number[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const sortedOrder: number[] = [];
    while (queue.length > 0) {
      const currId = queue.shift()!;
      sortedOrder.push(currId);
      const currTask = taskMap.get(currId);
      if (currTask) {
        for (const succ of currTask.sucesores) {
          const nextId = succ.idConsec;
          const currentDeg = inDegree.get(nextId) || 1;
          inDegree.set(nextId, currentDeg - 1);
          if (currentDeg - 1 === 0) {
            queue.push(nextId);
          }
        }
      }
    }

    // Si hay nodos desconectados o en ciclos, agregarlos al final
    for (const id of taskMap.keys()) {
      if (!sortedOrder.includes(id)) sortedOrder.push(id);
    }

    // 4. Pase Hacia Adelante (Forward Pass)
    for (const id of sortedOrder) {
      const task = taskMap.get(id)!;
      let earliestStart = 0;

      for (const predLink of task.predecesores) {
        const pred = taskMap.get(predLink.idConsec);
        if (!pred) continue;

        let requiredStart = 0;
        switch (predLink.tipo) {
          case 'FC': // Fin a Comienzo
            requiredStart = pred.ef + 1 + predLink.lagDias;
            break;
          case 'CC': // Comienzo a Comienzo
            requiredStart = pred.es + predLink.lagDias;
            break;
          case 'FF': // Fin a Fin
            requiredStart = pred.ef + predLink.lagDias - (task.dura > 0 ? task.dura - 1 : 0);
            break;
          case 'CF': // Comienzo a Fin
            requiredStart = pred.es + predLink.lagDias - (task.dura > 0 ? task.dura - 1 : 0);
            break;
        }

        if (requiredStart > earliestStart) {
          earliestStart = requiredStart;
        }
      }

      task.es = Math.max(0, earliestStart);
      task.ef = task.dura > 0 ? task.es + task.dura - 1 : task.es;
    }

    // 5. Duración Total del Proyecto
    let maxProjectFinish = 0;
    for (const task of taskMap.values()) {
      if (task.ef > maxProjectFinish) {
        maxProjectFinish = task.ef;
      }
    }

    // 6. Pase Hacia Atrás (Backward Pass)
    const reverseOrder = [...sortedOrder].reverse();
    for (const id of reverseOrder) {
      const task = taskMap.get(id)!;
      
      if (task.sucesores.length === 0) {
        task.lf = maxProjectFinish;
      } else {
        let latestFinish = Infinity;
        for (const succLink of task.sucesores) {
          const succ = taskMap.get(succLink.idConsec);
          if (!succ) continue;

          let allowableFinish = Infinity;
          switch (succLink.tipo) {
            case 'FC':
              allowableFinish = succ.ls - 1 - succLink.lagDias;
              break;
            case 'CC':
              allowableFinish = succ.ls - succLink.lagDias + (task.dura > 0 ? task.dura - 1 : 0);
              break;
            case 'FF':
              allowableFinish = succ.lf - succLink.lagDias;
              break;
            case 'CF':
              allowableFinish = succ.lf - succLink.lagDias + (task.dura > 0 ? task.dura - 1 : 0);
              break;
          }

          if (allowableFinish < latestFinish) {
            latestFinish = allowableFinish;
          }
        }
        task.lf = latestFinish === Infinity ? maxProjectFinish : latestFinish;
      }

      task.ls = task.dura > 0 ? task.lf - task.dura + 1 : task.lf;
      task.tf = task.ls - task.es; // Holgura Total
      task.esCritica = task.tf <= 0;

      // Holgura Libre (Free Float)
      let minSuccStart = Infinity;
      for (const succLink of task.sucesores) {
        const succ = taskMap.get(succLink.idConsec);
        if (succ && succLink.tipo === 'FC') {
          if (succ.es < minSuccStart) {
            minSuccStart = succ.es;
          }
        }
      }
      task.ff = minSuccStart === Infinity ? task.tf : Math.max(0, minSuccStart - task.ef - 1);
    }

    // 7. Formatear Fechas Calendario
    const projectStartDate = new Date(projectStartDateStr);
    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy.toISOString().split('T')[0];
    };

    for (const task of taskMap.values()) {
      task.earlyStartDate = addDays(projectStartDate, task.es);
      task.earlyFinishDate = addDays(projectStartDate, task.ef);
      task.lateStartDate = addDays(projectStartDate, task.ls);
      task.lateFinishDate = addDays(projectStartDate, task.lf);
    }

    const tasks = Array.from(taskMap.values());
    const criticasCount = tasks.filter(t => t.esCritica).length;
    const enRiesgoCount = tasks.filter(t => t.tf > 0 && t.tf <= 5).length;

    const summary: CpmProjectSummary = {
      totalTareas: tasks.length,
      tareasCriticas: criticasCount,
      duracionProyectoDias: maxProjectFinish,
      porcentajeCriticidad: tasks.length > 0 ? Math.round((criticasCount / tasks.length) * 100) : 0,
      fechaInicioEstimada: projectStartDateStr,
      fechaFinEstimada: addDays(projectStartDate, maxProjectFinish),
      tareasEnRiesgo: enRiesgoCount,
    };

    return { tasks, summary };
  }
}
