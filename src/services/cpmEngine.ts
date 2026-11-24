import {
  CPC_TO_BASE_ENTRY_MAP,
  WBS_HITOS_MACRO_OPTIONS,
  GENERAL_PUNTOS_CONTROL_SET,
  ZONAS_COMUNES_NO_ESENCIALES_CPC_SET,
} from './macroMilestoneService';

export interface PredecessoraLink {
  idConsec: number;
  tipo: 'FC' | 'CC' | 'FF' | 'CF';
  lagDias: number;
  lagValor?: number;
  lagUnidad?: '%' | 'd';
}

export interface CpmTask {
  idConsec: number;
  edt: string;
  nombre: string;
  dura: number;
  duraPrev?: number;
  w: number;
  type: 'project' | 'task';
  tipo?: 'project' | 'milestone' | 'task';
  esHito: boolean;
  comien: string; // Fecha proyectada de inicio (Comien)
  fin: string;    // Fecha proyectada de fin (Fin)
  comienPrev?: string; // Inicio Línea Base (ComienPrev)
  finPrev?: string;    // Fin Línea Base (FinPrev)
  varComien?: number;
  varFin?: number;
  predecesoraRaw: string;
  predecesores: PredecessoraLink[];
  sucesores: PredecessoraLink[];
  agrupacion?: string;
  codigoPlaneacion?: string;
  nivel?: number;
  proyecto?: string;
  sucursal?: string;

  // Métricas CPM calculadas sobre fechas proyectadas (Inicio / Fin Proyectado)
  earlyStartDate: string; // Coincide con Comien
  earlyFinishDate: string; // Coincide con Fin
  lateStartDate: string;   // Fecha límite de inicio
  lateFinishDate: string;  // Fecha límite de fin (LF)
  tf: number;             // Total Float (Holgura Total en días de calendario)
  ff: number;             // Free Float (Holgura Libre en días)
  esCritica: boolean;     // Calculada estrictamente sobre Inicio y Fin Proyectado
  criticalForTorres?: string[]; // Torres cuyo hito de Alistamiento es impactado por esta tarea
}

export type CpmTargetMode = 'LINEA_BASE' | 'GERENCIA';

export interface CpmAlistamientoTargetInput {
  alistamientoConfirmadoGerente?: string;
  alistamientoPrevisto?: string;
  etapa?: string;
}

export interface CpmComputeOptions {
  targetMode?: CpmTargetMode;
  fechasAlistamientoByTorre?: Record<string, CpmAlistamientoTargetInput | string>;
}

export interface CpmAlistamientoTorreSummary {
  torre: string;
  etapa: string;
  milestoneId: number;
  milestoneEdt: string;
  milestoneNombre: string;
  fechaLineaBase: string;
  fechaGerencia: string;
  fechaProyectada: string;
  diffGerenciaVsLbDias: number | null;
  tfLineaBase: number;
  tfGerencia: number | null;
  tfActivo: number;
  actividadesCriticasTorre: number;
  actividadesCriticasExternas: number;
  actividadesCriticasTotal: number;
}

export interface CpmDiagnostics {
  predecesorasHuerfanas: number;
  ciclosDetectados: number;
  alertas: string[];
}

export interface CpmZonasNoEsencialesStatus {
  activa: boolean;
  torresTotal: number;
  torresAlistadas100: number;
  porcentajeAlistamientoTorres: number;
  umbralTorres70: number;
  zonasEvaluadas: number;
  tareasCriticasAgregadas: number;
}

export interface CpmProjectSummary {
  totalTareas: number;
  tareasCriticas: number;
  duracionProyectoDias: number;
  porcentajeCriticidad: number;
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  tareasEnRiesgo: number; // 0 < tf <= 5
  targetMode?: CpmTargetMode;
  alistamientoResumen?: CpmAlistamientoTorreSummary[];
  zonasNoEsencialesCpm?: CpmZonasNoEsencialesStatus;
  diagnosticos?: CpmDiagnostics;
}

export interface TareaResumenCpcNode {
  id: string; // EDT de la tarea resumen
  edt: string;
  idConsec: number;
  nombre: string;
  codigoCpc: string;
  hitoMacro: string; // Nombre del Punto de Control
  agrupacion: string;
  tipo: 'project' | 'milestone' | 'task';
  comienPrev: string;
  finPrev: string;
  comien: string;
  fin: string;
  varComien: number;
  varFin: number;
  totalActividades: number;
  avancePct: number; // % avance real 0..100
  avanceProgramadoPct: number; // % avance programado al corte 0..100
  spi: number;
  esCritica: boolean;
  criticalForTorres?: string[];
  tasks: CpmTask[]; // Nivel 3: actividades tipo "task" (o milestone si es hito meta)
}

export interface HitoMacroGroupNode {
  id: string;
  hitoMacro: string; // Etiqueta visible (puede incluir prefijo TORRE ## ·)
  puntoControlNombre: string; // Nombre limpio del Punto de Control sin prefijo de torre
  agrupacion?: string;
  order: number;
  comienPrev: string;
  finPrev: string;
  comien: string;
  fin: string;
  varComien: number;
  varFin: number;
  totalActividades: number;
  avancePct: number; // % avance real 0..100
  avanceProgramadoPct: number; // % avance programado al corte 0..100
  spi: number;
  esCritica: boolean;
  resumenes: TareaResumenCpcNode[]; // Nivel 2: tareas resumen con Codigo CPC del archivo base
}

export interface ThreeLevelRollupResult {
  hitosMacro: HitoMacroGroupNode[];
  totalHitos: number;
  totalResumenes: number;
  totalActividades: number;
  hitosCriticos: number;
}

function parseDate(d: string | number | undefined | null): Date | null {
  if (!d) return null;
  if (typeof d === 'number') {
    const utc_days = Math.floor(d - 25569);
    return new Date(utc_days * 86400 * 1000);
  }
  const s = String(d).trim();
  if (!s) return null;
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  const parsed = new Date(isoMatch ? `${isoMatch[1]}T12:00:00` : s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateStr(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function diffDaysIso(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return 0;
  return Math.round((da.getTime() - db.getTime()) / MS_PER_DAY);
}

const MS_PER_DAY = 86400 * 1000;

export class CpmEngine {
  /**
   * Parsea la celda de predecesora de WorkPlanner (ej: "552;718;490CC+40%;746CC+1 dia;750FF")
   */
  static parsePredecesora(raw: string | number | undefined | null, duraTarea: number): PredecessoraLink[] {
    if (raw === undefined || raw === null || raw === '') return [];
    const rawStr = String(raw);

    const parts = rawStr.split(';').map((p) => p.trim()).filter(Boolean);
    const links: PredecessoraLink[] = [];

    for (const part of parts) {
      const match = part.match(/^(\d+)(CC|FC|FF|CF|SS)?([+-]?\d+)?(%|d[ií]as?|d)?/i);
      if (match) {
        const idConsec = parseInt(match[1], 10);
        const rawTipo = (match[2] ? match[2].toUpperCase() : 'FC');
        const tipo = (rawTipo === 'SS' ? 'CC' : rawTipo) as 'FC' | 'CC' | 'FF' | 'CF';
        let lagDias = 0;
        let lagValor = 0;
        let lagUnidad: '%' | 'd' = 'd';

        if (match[3]) {
          lagValor = parseInt(match[3], 10);
          const uRaw = match[4] ? match[4].toLowerCase() : 'd';
          if (uRaw.includes('%')) {
            lagUnidad = '%';
            lagDias = Math.round((lagValor / 100) * duraTarea);
          } else {
            lagUnidad = 'd';
            lagDias = lagValor;
          }
        }

        links.push({ idConsec, tipo, lagDias, lagValor, lagUnidad });
      }
    }

    return links;
  }

  /**
   * Calcula la Ruta Crítica y Holguras ancladas a los hitos (milestone) de Alistamiento por torre,
   * evaluando las fechas objetivo fijas (Línea Base o Fechas confirmadas por Gerencia) contra las
   * fechas proyectadas actuales (Comien / Fin) a través de toda la red de precedencias.
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
      tipo?: string;
      esHito?: boolean;
      predecesora?: string | number;
      comien?: string | number;
      fin?: string | number;
      comienPrev?: string | number;
      finPrev?: string | number;
      varComien?: number;
      varFin?: number;
      agrupacion?: string;
      etapa?: string;
      codigoPlaneacion?: string | number;
      nivel?: number;
      proyecto?: string;
      sucursal?: string;
    }>,
    options?: CpmComputeOptions
  ): { tasks: CpmTask[]; summary: CpmProjectSummary } {
    const targetMode: CpmTargetMode = options?.targetMode || 'LINEA_BASE';
    const taskMap = new Map<
      number,
      {
        task: CpmTask;
        comienDate: Date | null;
        finDate: Date | null;
        lfMs: number;
        etapa: string;
      }
    >();

    let maxProjectFinTime = 0;
    let minProjectStartTime = Infinity;

    // 1. Inicialización de Nodos con fechas Inicio Proyectado / Fin Proyectado
    for (let idx = 0; idx < rawRows.length; idx++) {
      const r = rawRows[idx];
      const id = Number(r.idConsec) || idx + 1;

      const dura = Math.max(0, Math.round(Number(r.dura !== undefined ? r.dura : r.duraPrev || 0)));
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

      const rawTipo = String(r.tipo || r.type || 'task').toLowerCase().trim();
      const isTask = rawTipo === 'task';
      const isMilestone = rawTipo === 'milestone';

      const task: CpmTask = {
        idConsec: id,
        edt: String(r.edt || ''),
        nombre: String(r.nombre || `Tarea ${id}`),
        dura,
        duraPrev: Number(r.duraPrev || 0),
        w: wNum > 1 ? wNum / 100 : wNum,
        type: (isTask ? 'task' : 'project') as 'project' | 'task',
        tipo: isMilestone ? 'milestone' : isTask ? 'task' : 'project',
        esHito: Boolean(r.esHito || isMilestone || dura === 0),
        comien: formatDateStr(cDate),
        fin: formatDateStr(fDate),
        comienPrev: formatDateStr(parseDate(r.comienPrev)),
        finPrev: formatDateStr(parseDate(r.finPrev)),
        varComien: r.varComien,
        varFin: r.varFin,
        agrupacion: r.agrupacion || 'NO APLICA',
        codigoPlaneacion: r.codigoPlaneacion !== undefined ? String(r.codigoPlaneacion).trim() : '',
        nivel: r.nivel !== undefined ? Number(r.nivel) : r.edt ? r.edt.split('.').length : 1,
        proyecto: r.proyecto || 'Belaterra Pietra',
        sucursal: r.sucursal || 'CALI',
        predecesoraRaw: r.predecesora !== undefined && r.predecesora !== null ? String(r.predecesora) : '',
        predecesores: links,
        sucesores: [],
        earlyStartDate: formatDateStr(cDate),
        earlyFinishDate: formatDateStr(fDate),
        lateStartDate: '',
        lateFinishDate: '',
        tf: 0,
        ff: 0,
        esCritica: false,
        criticalForTorres: [],
      };

      taskMap.set(id, {
        task,
        comienDate: cDate,
        finDate: fDate,
        lfMs: Infinity,
        etapa: String(r.etapa || '').trim(),
      });
    }

    if (maxProjectFinTime === 0) {
      maxProjectFinTime = Date.now();
    }

    const alertas: string[] = [];
    let orphanCount = 0;
    let cycleCount = 0;

    // 2. Limpieza de Predecesoras Huérfanas y resolución de enlaces hacia subtareas de resumen
    const allItemsList = Array.from(taskMap.values());
    const leafByProjectEdt = new Map<string, Array<{ id: number; finMs: number }>>();
    allItemsList.forEach(({ task, finDate }) => {
      if (task.tipo === 'project' && task.edt) {
        const prefix = `${task.edt}.`;
        const children: Array<{ id: number; finMs: number }> = [];
        allItemsList.forEach((c) => {
          if (c.task.tipo !== 'project' && c.task.edt.startsWith(prefix)) {
            children.push({ id: c.task.idConsec, finMs: c.finDate?.getTime() || 0 });
          }
        });
        leafByProjectEdt.set(task.edt, children);
      }
    });

    // Vínculos expandidos para el Backward Pass (si una predecesora apunta a un `project` sin predecesoras,
    // propaga el retroceso hacia las tareas hijas que determinan su fin proyectado)
    const effectivePredsById = new Map<number, PredecessoraLink[]>();

    for (const item of allItemsList) {
      const validPreds: PredecessoraLink[] = [];
      const expandedPreds: PredecessoraLink[] = [];

      for (const predLink of item.task.predecesores) {
        const predEntry = taskMap.get(predLink.idConsec);
        if (!predEntry) {
          orphanCount++;
          if (orphanCount <= 5) {
            alertas.push(
              `Tarea ${item.task.edt || item.task.idConsec} (${item.task.nombre}) referencia predecesora inexistente #${predLink.idConsec}`
            );
          }
          continue;
        }
        validPreds.push(predLink);

        if (predEntry.task.tipo === 'project' && predEntry.task.predecesores.length === 0 && predEntry.task.edt) {
          const ch = leafByProjectEdt.get(predEntry.task.edt) || [];
          if (ch.length > 0) {
            const maxFin = ch.reduce((m, c) => Math.max(m, c.finMs), 0);
            const drivers = ch.filter((c) => c.finMs >= maxFin - 2 * MS_PER_DAY);
            const targets = drivers.length > 0 ? drivers : ch;
            targets.forEach((d) => expandedPreds.push({ ...predLink, idConsec: d.id }));
            continue;
          }
        }
        expandedPreds.push(predLink);
      }

      item.task.predecesores = validPreds;
      effectivePredsById.set(item.task.idConsec, expandedPreds);
    }
    if (orphanCount > 5) {
      alertas.push(`Se detectaron ${orphanCount} referencias a predecesoras inexistentes en total.`);
    }

    // 2b. Detección y Aislamiento de Ciclos (DFS 3 Colores) sobre la red efectiva
    const color = new Map<number, number>();
    const breakingCycles = new Set<string>();

    const dfsDetectCycle = (u: number): void => {
      color.set(u, 1);
      const preds = effectivePredsById.get(u) || [];
      for (const link of preds) {
        const v = link.idConsec;
        const vColor = color.get(v) || 0;
        if (vColor === 1) {
          cycleCount++;
          breakingCycles.add(`${u}->${v}`);
          if (cycleCount <= 3) {
            const uTask = taskMap.get(u)?.task;
            alertas.push(`Dependencia circular aislada entre Tarea #${u} (${uTask?.nombre || ''}) y Predecesora #${v}`);
          }
        } else if (vColor === 0) {
          dfsDetectCycle(v);
        }
      }
      color.set(u, 2);
    };

    for (const id of taskMap.keys()) {
      if ((color.get(id) || 0) === 0) {
        dfsDetectCycle(id);
      }
    }

    const effectiveSuccsById = new Map<number, Array<{ succId: number; link: PredecessoraLink }>>();
    for (const id of taskMap.keys()) {
      effectiveSuccsById.set(id, []);
    }

    for (const item of allItemsList) {
      const uId = item.task.idConsec;
      item.task.predecesores = item.task.predecesores.filter(
        (p) => !breakingCycles.has(`${uId}->${p.idConsec}`)
      );

      for (const p of item.task.predecesores) {
        const pred = taskMap.get(p.idConsec);
        if (pred) {
          pred.task.sucesores.push({
            idConsec: uId,
            tipo: p.tipo,
            lagDias: p.lagDias,
            lagValor: p.lagValor,
            lagUnidad: p.lagUnidad,
          });
        }
      }

      const cleanEff = (effectivePredsById.get(uId) || []).filter(
        (p) => !breakingCycles.has(`${uId}->${p.idConsec}`)
      );
      effectivePredsById.set(uId, cleanEff);

      for (const link of cleanEff) {
        effectiveSuccsById.get(link.idConsec)?.push({ succId: uId, link });
      }
    }

    // 3. Orden Topológico (Kahn) + Pase Hacia Atrás ESTRICTO sobre Fechas Proyectadas (Comien / Fin)
    const indegree = new Map<number, number>();
    const queue: number[] = [];
    for (const id of taskMap.keys()) {
      const deg = (effectivePredsById.get(id) || []).length;
      indegree.set(id, deg);
      if (deg === 0) queue.push(id);
    }

    const topoOrder: number[] = [];
    let qHead = 0;
    while (qHead < queue.length) {
      const id = queue[qHead++];
      topoOrder.push(id);
      const succs = effectiveSuccsById.get(id) || [];
      for (const s of succs) {
        const nextDeg = (indegree.get(s.succId) || 0) - 1;
        indegree.set(s.succId, nextDeg);
        if (nextDeg === 0) queue.push(s.succId);
      }
    }

    const getLagMsForPredecessor = (
      predComienMs: number,
      predFinMs: number,
      link: PredecessoraLink
    ): number => {
      const span = Math.max(MS_PER_DAY, predFinMs - predComienMs);
      if (link.lagUnidad === '%' && link.lagValor !== undefined) {
        return (span * link.lagValor) / 100;
      }
      const val = link.lagValor !== undefined ? link.lagValor : link.lagDias;
      return val * 1.4 * MS_PER_DAY;
    };

    const isAlistamientoMilestone = (task: CpmTask): boolean => {
      const cpc = String(task.codigoPlaneacion || '').trim();
      return cpc === '603510' || (task.tipo === 'milestone' && /alistamiento/i.test(task.nombre));
    };

    const resolveTorreKey = (
      task: Pick<CpmTask, 'agrupacion' | 'nombre'>,
      allowFromNameFallback: boolean
    ): string => {
      const agr = String(task.agrupacion || '').trim().toUpperCase();
      const agrMatch = agr.match(/TORRE\s*0*(\d{1,2})/i);
      if (agrMatch) {
        return `TORRE ${String(parseInt(agrMatch[1], 10)).padStart(2, '0')}`;
      }
      const noExplicitGroup = !agr || agr === 'NO APLICA' || agr === 'PROYECTO';
      if (allowFromNameFallback || noExplicitGroup) {
        const nom = String(task.nombre || '').toUpperCase();
        const nomMatch = nom.match(/(?:TORRE|ALISTAMIENTO\s*T|\bT)\s*0*(\d{1,2})\b/i);
        if (nomMatch) {
          return `TORRE ${String(parseInt(nomMatch[1], 10)).padStart(2, '0')}`;
        }
      }
      return agr || 'GENERAL';
    };

    const lookupGerenciaInput = (
      torreKey: string
    ): { gerIso: string; etapa?: string } | null => {
      const map = options?.fechasAlistamientoByTorre;
      if (!map) return null;
      const direct = map[torreKey] || map[torreKey.toUpperCase()];
      if (direct) {
        if (typeof direct === 'string') return { gerIso: direct };
        if (direct.alistamientoConfirmadoGerente) {
          return {
            gerIso: direct.alistamientoConfirmadoGerente,
            etapa: direct.etapa,
          };
        }
      }
      // Búsqueda tolerante normalizando clave "TORRE ##"
      for (const [k, v] of Object.entries(map)) {
        const kNorm = resolveTorreKey({ agrupacion: k, nombre: k }, true);
        if (kNorm === torreKey) {
          if (typeof v === 'string') return { gerIso: v };
          if (v?.alistamientoConfirmadoGerente) {
            return {
              gerIso: v.alistamientoConfirmadoGerente,
              etapa: v.etapa,
            };
          }
        }
      }
      return null;
    };

    const alistamientoMilestones = allItemsList.filter((item) => isAlistamientoMilestone(item.task));
    const alistamientoResumen: CpmAlistamientoTorreSummary[] = [];
    let zonasNoEsencialesCpm: CpmZonasNoEsencialesStatus | undefined;

    if (alistamientoMilestones.length > 0) {
      // Pase hacia atrás independiente por cada hito de Alistamiento por torre
      // fijando la meta en Línea Base (finPrev) o en Fecha Alistamiento Confirmado Gerencia (C)
      for (const mEntry of alistamientoMilestones) {
        const mTask = mEntry.task;
        const torreKey = resolveTorreKey(mTask, true);
        const mFinMs = mEntry.finDate
          ? mEntry.finDate.getTime()
          : mEntry.comienDate?.getTime() || maxProjectFinTime;

        const lbDate = parseDate(mTask.finPrev || mTask.comienPrev);
        const lbTargetMs = lbDate ? lbDate.getTime() : mFinMs;
        const lbIso = formatDateStr(new Date(lbTargetMs));

        const gerData = lookupGerenciaInput(torreKey);
        const gerDate = gerData?.gerIso ? parseDate(gerData.gerIso) : null;
        const gerTargetMs = gerDate ? gerDate.getTime() : null;
        const gerIso = gerTargetMs !== null ? formatDateStr(new Date(gerTargetMs)) : '';

        const activeTargetMs =
          targetMode === 'GERENCIA' && gerTargetMs !== null ? gerTargetMs : lbTargetMs;

        const localLfMap = new Map<number, number>();
        localLfMap.set(mTask.idConsec, activeTargetMs);

        if (activeTargetMs < mEntry.lfMs) {
          mEntry.lfMs = activeTargetMs;
        }

        const localCritTorre = new Set<number>();
        const localCritExternas = new Set<number>();

        const mTfActivo = Math.round((activeTargetMs - mFinMs) / MS_PER_DAY);
        if (mTfActivo <= 3) {
          if (!mTask.criticalForTorres) mTask.criticalForTorres = [];
          if (!mTask.criticalForTorres.includes(torreKey)) {
            mTask.criticalForTorres.push(torreKey);
          }
          localCritTorre.add(mTask.idConsec);
        }

        for (let i = topoOrder.length - 1; i >= 0; i--) {
          const id = topoOrder[i];
          if (id === mTask.idConsec) continue;
          const entry = taskMap.get(id);
          if (!entry || !entry.finDate) continue;

          const { task, comenDateOrComien, finDate } = {
            task: entry.task,
            comenDateOrComien: entry.comienDate,
            finDate: entry.finDate,
          };
          const uComienMs = comenDateOrComien ? comenDateOrComien.getTime() : finDate.getTime();
          const uFinMs = finDate.getTime();
          const uSpan = Math.max(0, uFinMs - uComienMs);
          const effSuccs = effectiveSuccsById.get(id) || [];

          let minAllowableFinishTime = Infinity;
          let minSuccEarlyStart = Infinity;

          for (const succRef of effSuccs) {
            const succLfMs = localLfMap.get(succRef.succId);
            if (succLfMs === undefined) continue;
            const succEntry = taskMap.get(succRef.succId);
            if (!succEntry || !succEntry.comienDate) continue;

            const vComienMs = succEntry.comienDate.getTime();
            const vFinMs = succEntry.finDate ? succEntry.finDate.getTime() : vComienMs;
            const vSpan = Math.max(0, vFinMs - vComienMs);
            const vLsMs = succLfMs - vSpan;
            const lagMs = getLagMsForPredecessor(uComienMs, uFinMs, succRef.link);

            let allowedTime = Infinity;
            if (succRef.link.tipo === 'FC' || succRef.link.tipo === 'CF') {
              allowedTime = vLsMs - lagMs - MS_PER_DAY;
              if (vComienMs < minSuccEarlyStart) minSuccEarlyStart = vComienMs;
            } else if (succRef.link.tipo === 'FF') {
              allowedTime = succLfMs - lagMs;
            } else if (succRef.link.tipo === 'CC') {
              allowedTime = vLsMs - lagMs + uSpan;
            }

            if (allowedTime < minAllowableFinishTime) {
              minAllowableFinishTime = allowedTime;
            }
          }

          if (minAllowableFinishTime !== Infinity) {
            localLfMap.set(id, minAllowableFinishTime);

            if (minAllowableFinishTime < entry.lfMs) {
              entry.lfMs = minAllowableFinishTime;
              if (minSuccEarlyStart !== Infinity) {
                const ffDays = Math.round((minSuccEarlyStart - uFinMs) / MS_PER_DAY) - 1;
                task.ff = Math.max(0, ffDays);
              }
            }

            const tfTorre = Math.round((minAllowableFinishTime - uFinMs) / MS_PER_DAY);
            if (task.tipo !== 'project' && tfTorre <= 3) {
              if (!task.criticalForTorres) task.criticalForTorres = [];
              if (!task.criticalForTorres.includes(torreKey)) {
                task.criticalForTorres.push(torreKey);
              }
              const ownerGroup = resolveTorreKey(task, false);
              if (ownerGroup === torreKey) {
                localCritTorre.add(id);
              } else {
                localCritExternas.add(id);
              }
            }
          }
        }

        const tfLineaBase = Math.round((lbTargetMs - mFinMs) / MS_PER_DAY);
        const tfGerencia =
          gerTargetMs !== null ? Math.round((gerTargetMs - mFinMs) / MS_PER_DAY) : null;

        alistamientoResumen.push({
          torre: torreKey,
          etapa: gerData?.etapa || mEntry.etapa || '',
          milestoneId: mTask.idConsec,
          milestoneEdt: mTask.edt,
          milestoneNombre: mTask.nombre,
          fechaLineaBase: lbIso,
          fechaGerencia: gerIso,
          fechaProyectada: mTask.fin || mTask.comien,
          diffGerenciaVsLbDias: gerIso && lbIso ? diffDaysIso(gerIso, lbIso) : null,
          tfLineaBase,
          tfGerencia,
          tfActivo: mTfActivo,
          actividadesCriticasTorre: localCritTorre.size,
          actividadesCriticasExternas: localCritExternas.size,
          actividadesCriticasTotal: localCritTorre.size + localCritExternas.size,
        });
      }

      alistamientoResumen.sort((a, b) =>
        a.torre.localeCompare(b.torre, 'es', { numeric: true, sensitivity: 'base' })
      );

      // Regla legal Zonas Comunes No Esenciales (50% + 1 inmuebles):
      // Se activa únicamente cuando el >= 70% de las torres del proyecto alcanzan 100% de avance
      // en sus milestones de Alistamiento. Cuando se activa, se fija como hito de ruta crítica la fecha
      // de terminación (Línea Base) de la última actividad "task" de cada zona común no esencial (CPC del archivo base).
      const torresTotal = alistamientoMilestones.length;
      const torresAlistadas100 = alistamientoMilestones.filter(
        (m) => m.task.w >= 0.999 || Math.round(m.task.w * 100) >= 100
      ).length;
      const umbralTorres70 = Math.ceil(torresTotal * 0.7);
      const porcentajeAlistamientoTorres =
        torresTotal > 0 ? Math.round((torresAlistadas100 / torresTotal) * 100) : 0;
      const zonasNoEsencialesActiva =
        torresTotal > 0 && torresAlistadas100 / torresTotal >= 0.7;

      let zonasEvaluadasCount = 0;
      const zonasNoEsCritAdded = new Set<number>();

      if (zonasNoEsencialesActiva) {
        const noEsAnchors = allItemsList.filter((item) =>
          ZONAS_COMUNES_NO_ESENCIALES_CPC_SET.has(String(item.task.codigoPlaneacion || '').trim())
        );

        for (const anc of noEsAnchors) {
          const prefix = anc.task.edt ? `${anc.task.edt}.` : '';
          const zoneTasks = allItemsList.filter(
            (c) =>
              c.task.tipo === 'task' &&
              (c.task.edt === anc.task.edt || (prefix !== '' && c.task.edt.startsWith(prefix)))
          );
          if (zoneTasks.length === 0) continue;
          zonasEvaluadasCount++;

          let maxTargetMs = 0;
          zoneTasks.forEach((zt) => {
            const lbD = parseDate(zt.task.finPrev || zt.task.comienPrev);
            const ms = lbD ? lbD.getTime() : zt.finDate?.getTime() || 0;
            if (ms > maxTargetMs) maxTargetMs = ms;
          });

          const lastTasks = zoneTasks.filter((zt) => {
            const lbD = parseDate(zt.task.finPrev || zt.task.comienPrev);
            const ms = lbD ? lbD.getTime() : zt.finDate?.getTime() || 0;
            return ms >= maxTargetMs - MS_PER_DAY;
          });

          for (const lastEntry of lastTasks) {
            const lastTask = lastEntry.task;
            const lastFinMs = lastEntry.finDate
              ? lastEntry.finDate.getTime()
              : lastEntry.comienDate?.getTime() || maxProjectFinTime;
            const lbDate = parseDate(lastTask.finPrev || lastTask.comienPrev);
            const fixedTargetMs = lbDate ? lbDate.getTime() : lastFinMs;

            const localLfMap = new Map<number, number>();
            localLfMap.set(lastTask.idConsec, fixedTargetMs);

            if (fixedTargetMs < lastEntry.lfMs) {
              lastEntry.lfMs = fixedTargetMs;
            }

            const lastTf = Math.round((fixedTargetMs - lastFinMs) / MS_PER_DAY);
            if (lastTf <= 3) {
              if (!lastTask.criticalForTorres) lastTask.criticalForTorres = [];
              if (!lastTask.criticalForTorres.includes('Zonas comunes no esenciales')) {
                lastTask.criticalForTorres.push('Zonas comunes no esenciales');
              }
              zonasNoEsCritAdded.add(lastTask.idConsec);
            }

            for (let i = topoOrder.length - 1; i >= 0; i--) {
              const id = topoOrder[i];
              if (id === lastTask.idConsec) continue;
              const entry = taskMap.get(id);
              if (!entry || !entry.finDate) continue;

              const { task, comenDateOrComien, finDate } = {
                task: entry.task,
                comenDateOrComien: entry.comienDate,
                finDate: entry.finDate,
              };
              const uComienMs = comenDateOrComien ? comenDateOrComien.getTime() : finDate.getTime();
              const uFinMs = finDate.getTime();
              const uSpan = Math.max(0, uFinMs - uComienMs);
              const effSuccs = effectiveSuccsById.get(id) || [];

              let minAllowableFinishTime = Infinity;
              for (const succRef of effSuccs) {
                const succLfMs = localLfMap.get(succRef.succId);
                if (succLfMs === undefined) continue;
                const succEntry = taskMap.get(succRef.succId);
                if (!succEntry || !succEntry.comienDate) continue;

                const vComienMs = succEntry.comienDate.getTime();
                const vFinMs = succEntry.finDate ? succEntry.finDate.getTime() : vComienMs;
                const vSpan = Math.max(0, vFinMs - vComienMs);
                const vLsMs = succLfMs - vSpan;
                const lagMs = getLagMsForPredecessor(uComienMs, uFinMs, succRef.link);

                let allowedTime = Infinity;
                if (succRef.link.tipo === 'FC' || succRef.link.tipo === 'CF') {
                  allowedTime = vLsMs - lagMs - MS_PER_DAY;
                } else if (succRef.link.tipo === 'FF') {
                  allowedTime = succLfMs - lagMs;
                } else if (succRef.link.tipo === 'CC') {
                  allowedTime = vLsMs - lagMs + uSpan;
                }

                if (allowedTime < minAllowableFinishTime) {
                  minAllowableFinishTime = allowedTime;
                }
              }

              if (minAllowableFinishTime !== Infinity) {
                localLfMap.set(id, minAllowableFinishTime);
                if (minAllowableFinishTime < entry.lfMs) {
                  entry.lfMs = minAllowableFinishTime;
                }
                const tfZone = Math.round((minAllowableFinishTime - uFinMs) / MS_PER_DAY);
                if (task.tipo !== 'project' && tfZone <= 3) {
                  if (!task.criticalForTorres) task.criticalForTorres = [];
                  if (!task.criticalForTorres.includes('Zonas comunes no esenciales')) {
                    task.criticalForTorres.push('Zonas comunes no esenciales');
                  }
                  zonasNoEsCritAdded.add(id);
                }
              }
            }
          }
        }
      }

      zonasNoEsencialesCpm = {
        activa: zonasNoEsencialesActiva,
        torresTotal,
        torresAlistadas100,
        porcentajeAlistamientoTorres,
        umbralTorres70,
        zonasEvaluadas: zonasEvaluadasCount,
        tareasCriticasAgregadas: zonasNoEsCritAdded.size,
      };

      // Consolidar holgura más estricta y fechas tardías sobre toda la sábana
      for (const entry of allItemsList) {
        if (!entry.finDate) continue;
        const { task, comenDateOrComien, finDate } = {
          task: entry.task,
          comenDateOrComien: entry.comienDate,
          finDate: entry.finDate,
        };
        const uComienMs = comenDateOrComien ? comenDateOrComien.getTime() : finDate.getTime();
        const uFinMs = finDate.getTime();
        const uSpan = Math.max(0, uFinMs - uComienMs);

        if (entry.lfMs !== Infinity) {
          task.tf = Math.round((entry.lfMs - uFinMs) / MS_PER_DAY);
          task.esCritica = task.tipo !== 'project' && task.tf <= 3;
        } else {
          // Actividades sin conexión aguas arriba hacia ningún hito Alistamiento
          entry.lfMs = maxProjectFinTime;
          task.esCritica = false;
          task.tf = Math.max(4, Math.round((maxProjectFinTime - uFinMs) / MS_PER_DAY));
        }

        task.lateFinishDate = formatDateStr(new Date(entry.lfMs));
        task.lateStartDate = formatDateStr(new Date(entry.lfMs - uSpan));
      }
    } else {
      // Fallback para cronogramas genéricos sin hitos de Alistamiento
      for (let i = topoOrder.length - 1; i >= 0; i--) {
        const id = topoOrder[i];
        const entry = taskMap.get(id);
        if (!entry || !entry.finDate) continue;

        const { task, comenDateOrComien, finDate } = {
          task: entry.task,
          comenDateOrComien: entry.comienDate,
          finDate: entry.finDate,
        };
        const uComienMs = comenDateOrComien ? comenDateOrComien.getTime() : finDate.getTime();
        const uFinMs = finDate.getTime();
        const uSpan = Math.max(0, uFinMs - uComienMs);
        const effSuccs = effectiveSuccsById.get(id) || [];

        if (effSuccs.length === 0) {
          entry.lfMs = task.tipo === 'milestone' ? uFinMs : maxProjectFinTime;
          task.tf = Math.round((entry.lfMs - uFinMs) / MS_PER_DAY);
        } else {
          let minAllowableFinishTime = Infinity;
          let minSuccEarlyStart = Infinity;

          for (const succRef of effSuccs) {
            const succEntry = taskMap.get(succRef.succId);
            if (!succEntry || !succEntry.comienDate || succEntry.lfMs === Infinity) continue;

            const vComienMs = succEntry.comienDate.getTime();
            const vFinMs = succEntry.finDate ? succEntry.finDate.getTime() : vComienMs;
            const vSpan = Math.max(0, vFinMs - vComienMs);
            const vLsMs = succEntry.lfMs - vSpan;
            const lagMs = getLagMsForPredecessor(uComienMs, uFinMs, succRef.link);

            let allowedTime = Infinity;
            if (succRef.link.tipo === 'FC' || succRef.link.tipo === 'CF') {
              allowedTime = vLsMs - lagMs - MS_PER_DAY;
              if (vComienMs < minSuccEarlyStart) minSuccEarlyStart = vComienMs;
            } else if (succRef.link.tipo === 'FF') {
              allowedTime = succEntry.lfMs - lagMs;
            } else if (succRef.link.tipo === 'CC') {
              allowedTime = vLsMs - lagMs + uSpan;
            }

            if (allowedTime < minAllowableFinishTime) {
              minAllowableFinishTime = allowedTime;
            }
          }

          if (minAllowableFinishTime !== Infinity) {
            entry.lfMs = minAllowableFinishTime;
            task.tf = Math.round((entry.lfMs - uFinMs) / MS_PER_DAY);
            if (minSuccEarlyStart !== Infinity) {
              const ffDays = Math.round((minSuccEarlyStart - uFinMs) / MS_PER_DAY) - 1;
              task.ff = Math.max(0, ffDays);
            }
          } else {
            entry.lfMs = maxProjectFinTime;
            task.tf = Math.round((maxProjectFinTime - uFinMs) / MS_PER_DAY);
          }
        }

        // Tolerancia de +/- 3 días calendario (fines de semana / festivos del calendario Workplanner)
        task.esCritica = task.tipo !== 'project' && task.tf <= 3;

        const lfDate = new Date(entry.lfMs);
        const lsDate = new Date(entry.lfMs - uSpan);
        task.lateFinishDate = formatDateStr(lfDate);
        task.lateStartDate = formatDateStr(lsDate);
      }
    }

    const tasks = Array.from(taskMap.values()).map((i) => i.task);
    const criticasCount = tasks.filter((t) => t.esCritica).length;
    const enRiesgoCount = tasks.filter((t) => t.tf > 3 && t.tf <= 10).length;

    const summary: CpmProjectSummary = {
      totalTareas: tasks.length,
      tareasCriticas: criticasCount,
      duracionProyectoDias: Math.round((maxProjectFinTime - minProjectStartTime) / MS_PER_DAY),
      porcentajeCriticidad: tasks.length > 0 ? Math.round((criticasCount / tasks.length) * 100) : 0,
      fechaInicioEstimada: formatDateStr(new Date(minProjectStartTime)),
      fechaFinEstimada: formatDateStr(new Date(maxProjectFinTime)),
      tareasEnRiesgo: enRiesgoCount,
      targetMode,
      alistamientoResumen,
      zonasNoEsencialesCpm,
      diagnosticos: {
        predecesorasHuerfanas: orphanCount,
        ciclosDetectados: cycleCount,
        alertas,
      },
    };

    return { tasks, summary };
  }

  /**
   * Motor de Rollup CPM de 3 Niveles estandarizado:
   * Nivel 1: Hito macro (15 hitos del archivo base)
   * Nivel 2: Tarea resumen (actividades propias con el Codigo CPC del catálogo base de 54 hitos)
   * Nivel 3: Actividades tipo "task" que las componen (omitiendo project intermedios)
   */
  static buildThreeLevelRollup(params: {
    cpmTasks: CpmTask[];
    hitoByEdt: Record<string, string>;
    fechaCorte?: string;
    agrupacion?: string;
    soloCriticas?: boolean;
    searchTerm?: string;
    horizonteDias?: number;
  }): ThreeLevelRollupResult {
    const {
      cpmTasks,
      hitoByEdt,
      fechaCorte = new Date().toISOString().split('T')[0],
      agrupacion = 'TODAS',
      soloCriticas = false,
      searchTerm = '',
      horizonteDias,
    } = params;

    const cutMs = parseDate(fechaCorte)?.getTime() || Date.now();
    const horizonStartMs = cutMs - 6 * MS_PER_DAY;
    const horizonEndMs = horizonteDias ? cutMs + horizonteDias * MS_PER_DAY : Infinity;
    const q = searchTerm.trim().toLowerCase();

    const intersectsHorizonte = (cPrev?: string, fPrev?: string, cProy?: string, fProy?: string): boolean => {
      if (!horizonteDias) return true;
      const checkInterval = (sIso?: string, eIso?: string) => {
        const sMs = parseDate(sIso)?.getTime();
        const eMs = parseDate(eIso || sIso)?.getTime();
        if (sMs === undefined || eMs === undefined) return false;
        const lo = Math.min(sMs, eMs);
        const hi = Math.max(sMs, eMs);
        return hi >= horizonStartMs && lo <= horizonEndMs;
      };
      return checkInterval(cPrev, fPrev) || checkInterval(cProy, fProy);
    };

    // 1. Localizar todas las tareas ancla (tienen Codigo CPC presente en los 54 registros del archivo base)
    const anchors = cpmTasks.filter((t) => {
      const cpc = String(t.codigoPlaneacion || '').trim();
      return CPC_TO_BASE_ENTRY_MAP.has(cpc);
    });

    // Ordenar descendientemente por longitud de EDT para asociar cada "task" con su ancestro CPC más específico
    const anchorsDesc = [...anchors].sort((a, b) => b.edt.length - a.edt.length);
    const childrenByAnchorEdt = new Map<string, CpmTask[]>();
    anchors.forEach((a) => childrenByAnchorEdt.set(a.edt, []));

    cpmTasks.forEach((t) => {
      const tipoNorm = t.tipo || (t.type === 'task' ? 'task' : 'project');
      if (tipoNorm !== 'task') return; // Nivel 3 contiene solo actividades tipo "task"
      for (const anc of anchorsDesc) {
        if (t.edt === anc.edt || t.edt.startsWith(`${anc.edt}.`)) {
          childrenByAnchorEdt.get(anc.edt)?.push(t);
          break;
        }
      }
    });

    // Helper matemático para calcular fechas rollup, avance ponderado y SPI al corte
    const computeMetrics = (items: CpmTask[]) => {
      let minComienPrev = '';
      let maxFinPrev = '';
      let minComien = '';
      let maxFin = '';
      let sumEv = 0;
      let sumPv = 0;
      let sumDur = 0;
      let hasCritical = false;

      for (const t of items) {
        const cPrev = t.comienPrev || t.comien;
        const fPrev = t.finPrev || t.fin;
        if (cPrev && (!minComienPrev || cPrev < minComienPrev)) minComienPrev = cPrev;
        if (fPrev && (!maxFinPrev || fPrev > maxFinPrev)) maxFinPrev = fPrev;
        if (t.comien && (!minComien || t.comien < minComien)) minComien = t.comien;
        if (t.fin && (!maxFin || t.fin > maxFin)) maxFin = t.fin;
        if (t.esCritica) hasCritical = true;

        const durWeight = Math.max(1, Number(t.duraPrev || t.dura || 1));
        const w = Math.max(0, Math.min(1, Number(t.w || 0)));
        sumDur += durWeight;
        sumEv += w * durWeight;

        const sMs = parseDate(cPrev)?.getTime() || cutMs;
        const eMs = parseDate(fPrev)?.getTime() || sMs;
        let wPlan = 0;
        if (cutMs >= eMs) {
          wPlan = 1;
        } else if (cutMs > sMs && eMs > sMs) {
          wPlan = (cutMs - sMs) / (eMs - sMs);
        }
        sumPv += wPlan * durWeight;
      }

      const avancePct = sumDur > 0 ? Number(((sumEv / sumDur) * 100).toFixed(1)) : 0;
      const avanceProgramadoPct = sumDur > 0 ? Number(((sumPv / sumDur) * 100).toFixed(1)) : 0;
      const spi = sumPv > 0 ? Number((sumEv / sumPv).toFixed(2)) : sumEv > 0 ? 1.0 : 1.0;

      return {
        comienPrev: minComienPrev,
        finPrev: maxFinPrev,
        comien: minComien,
        fin: maxFin,
        varComien: diffDaysIso(minComien, minComienPrev),
        varFin: diffDaysIso(maxFin, maxFinPrev),
        avancePct,
        avanceProgramadoPct,
        spi,
        esCritica: hasCritical,
      };
    };

    // 2. Construir nodos de Nivel 2 (Tareas Resumen CPC) agrupados por llave AGRUPACIÓN & HITO MACRO en Torres/Vivienda
    interface HitoBucket {
      key: string;
      agrupacion: string;
      hitoMacro: string;
      esVivienda: boolean;
      resumenes: TareaResumenCpcNode[];
    }
    const bucketsMap = new Map<string, HitoBucket>();
    const hitoOrderMap = new Map<string, number>();
    WBS_HITOS_MACRO_OPTIONS.forEach((h, idx) => hitoOrderMap.set(h, idx + 1));

    const torresConAlistamiento = new Set<string>();
    cpmTasks.forEach((t) => t.criticalForTorres?.forEach((tk) => torresConAlistamiento.add(tk)));
    const filterByTorreCriticality =
      soloCriticas && agrupacion !== 'TODAS' && torresConAlistamiento.has(agrupacion);
    const isTaskCriticalForScope = (t: CpmTask): boolean =>
      filterByTorreCriticality
        ? Boolean(t.criticalForTorres?.includes(agrupacion))
        : t.esCritica;

    for (const anc of anchors) {
      const cpc = String(anc.codigoPlaneacion || '').trim();
      const baseEntry = CPC_TO_BASE_ENTRY_MAP.get(cpc);
      const rawHito = hitoByEdt[anc.edt] || baseEntry?.hitoMacro || 'Urbanismo';
      const hitoMacro =
        rawHito === 'Zonas comune no esenciales'
          ? 'Zonas comunes no esenciales'
          : rawHito === 'Urbanismo y movimiento de tierra'
            ? baseEntry?.hitoMacro || 'Urbanismo'
            : rawHito;

      const tipoAgrupUpper = (baseEntry?.tipoAgrupacion || '').toUpperCase();
      const ancAgrupUpper = (anc.agrupacion || '').toUpperCase();
      const isGeneralHito = GENERAL_PUNTOS_CONTROL_SET.has(hitoMacro);
      const isVivienda =
        !isGeneralHito &&
        (tipoAgrupUpper === 'VIVIENDA' ||
          tipoAgrupUpper.includes('TORRE') ||
          ancAgrupUpper.includes('TORRE'));

      const isMilestoneAnchor = anc.tipo === 'milestone';
      let constituentTasks = isMilestoneAnchor ? [anc] : childrenByAnchorEdt.get(anc.edt) || [];

      if (agrupacion !== 'TODAS') {
        constituentTasks = constituentTasks.filter(
          (t) =>
            t.agrupacion === agrupacion ||
            anc.agrupacion === agrupacion ||
            (soloCriticas && Boolean(t.criticalForTorres?.includes(agrupacion)))
        );
      }

      if (constituentTasks.length === 0) continue;

      // Para hitos asociados a VIVIENDA/TORRES, separar por AGRUPACIÓN & HITO MACRO
      const resolveAgrupBucket = (itemAgrup?: string): string => {
        const clean = (itemAgrup || '').trim();
        if (clean && clean !== 'NO APLICA' && clean !== 'PROYECTO') return clean;
        const ancClean = (anc.agrupacion || '').trim();
        if (ancClean && ancClean !== 'NO APLICA' && ancClean !== 'PROYECTO') return ancClean;
        return '';
      };

      const groupedByTower = new Map<string, CpmTask[]>();
      if (isVivienda) {
        for (const t of constituentTasks) {
          const agKey = resolveAgrupBucket(t.agrupacion) || 'VIVIENDA';
          if (!groupedByTower.has(agKey)) groupedByTower.set(agKey, []);
          groupedByTower.get(agKey)!.push(t);
        }
      } else {
        groupedByTower.set('GENERAL', constituentTasks);
      }

      for (const [agBucketKey, subTasks] of groupedByTower.entries()) {
        if (subTasks.length === 0) continue;

        const tasksInHorizonte = horizonteDias
          ? subTasks.filter((t) =>
              intersectsHorizonte(
                t.comienPrev || t.comien,
                t.finPrev || t.fin,
                t.comien,
                t.fin
              )
            )
          : subTasks;

        if (horizonteDias && tasksInHorizonte.length === 0) continue;

        const metrics = computeMetrics(subTasks);
        const isSingleBucket = groupedByTower.size === 1;
        const isFullAnchor =
          isSingleBucket && (agrupacion === 'TODAS' || anc.agrupacion === agrupacion);

        const finPrev = isFullAnchor && anc.finPrev ? anc.finPrev : metrics.finPrev;
        const comienPrev = isFullAnchor && anc.comienPrev ? anc.comienPrev : metrics.comienPrev;
        const comien = isFullAnchor && anc.comien ? anc.comien : metrics.comien;
        const fin = isFullAnchor && anc.fin ? anc.fin : metrics.fin;

        const baseVisibleTasks = horizonteDias ? tasksInHorizonte : subTasks;
        const visibleTasks = soloCriticas
          ? baseVisibleTasks.filter((t) => isTaskCriticalForScope(t))
          : baseVisibleTasks;

        const agrupDisplay = isVivienda ? agBucketKey : anc.agrupacion || 'PROYECTO';
        const qMatchesHito =
          q &&
          (hitoMacro.toLowerCase().includes(q) || agrupDisplay.toLowerCase().includes(q));
        const qMatchesResumen =
          q &&
          (anc.nombre.toLowerCase().includes(q) ||
            anc.edt.toLowerCase().includes(q) ||
            cpc.toLowerCase().includes(q));

        const searchFilteredTasks =
          !q || qMatchesHito || qMatchesResumen
            ? visibleTasks
            : visibleTasks.filter(
                (t) =>
                  t.nombre.toLowerCase().includes(q) ||
                  t.edt.toLowerCase().includes(q) ||
                  (t.agrupacion || '').toLowerCase().includes(q)
              );

        const scopeHasCritical = subTasks.some((t) => isTaskCriticalForScope(t));
        if (soloCriticas && visibleTasks.length === 0) continue;
        if (q && !qMatchesHito && !qMatchesResumen && searchFilteredTasks.length === 0) continue;

        const critTorresSet = new Set<string>();
        subTasks.forEach((st) => st.criticalForTorres?.forEach((tk) => critTorresSet.add(tk)));

        const resNode: TareaResumenCpcNode = {
          id: `${anc.edt}::${agBucketKey}`,
          edt: anc.edt,
          idConsec: anc.idConsec,
          nombre: anc.nombre,
          codigoCpc: cpc,
          hitoMacro,
          agrupacion: agrupDisplay,
          tipo: anc.tipo || 'project',
          comienPrev,
          finPrev,
          comien,
          fin,
          varComien: diffDaysIso(comien, comienPrev),
          varFin: diffDaysIso(fin, finPrev),
          totalActividades: subTasks.length,
          avancePct: metrics.avancePct,
          avanceProgramadoPct: metrics.avanceProgramadoPct,
          spi: metrics.spi,
          esCritica: filterByTorreCriticality ? scopeHasCritical : metrics.esCritica,
          criticalForTorres: Array.from(critTorresSet),
          tasks: searchFilteredTasks,
        };

        const compositeKey = isVivienda ? `${agBucketKey}::${hitoMacro}` : `GENERAL::${hitoMacro}`;
        if (!bucketsMap.has(compositeKey)) {
          bucketsMap.set(compositeKey, {
            key: compositeKey,
            agrupacion: isVivienda ? agBucketKey : '',
            hitoMacro,
            esVivienda: isVivienda,
            resumenes: [],
          });
        }
        bucketsMap.get(compositeKey)!.resumenes.push(resNode);
      }
    }

    // 3. Construir nodos de Nivel 1 (AGRUPACIÓN & HITO MACRO) ordenados por Agrupación/Torre y orden estándar del Hito
    const sortedBuckets = Array.from(bucketsMap.values()).sort((a, b) => {
      if (a.esVivienda !== b.esVivienda) return a.esVivienda ? 1 : -1;
      if (a.agrupacion !== b.agrupacion) {
        return a.agrupacion.localeCompare(b.agrupacion, 'es', { numeric: true, sensitivity: 'base' });
      }
      return (hitoOrderMap.get(a.hitoMacro) || 99) - (hitoOrderMap.get(b.hitoMacro) || 99);
    });

    const hitosMacro: HitoMacroGroupNode[] = [];
    let orderIdx = 0;

    for (const bucket of sortedBuckets) {
      const { resumenes, hitoMacro: hitoName, agrupacion: bucketAgrup } = bucket;
      if (resumenes.length === 0) continue;
      orderIdx++;

      const allTasksOfHito = resumenes.flatMap((r) => r.tasks);
      const metrics = computeMetrics(
        allTasksOfHito.length > 0
          ? allTasksOfHito
          : resumenes.map(
              (r) =>
                ({
                  ...r,
                  w: r.avancePct / 100,
                  dura: 1,
                  duraPrev: 1,
                  type: 'task',
                  esHito: false,
                  predecesoraRaw: '',
                  predecesores: [],
                  sucesores: [],
                  earlyStartDate: r.comien,
                  earlyFinishDate: r.fin,
                  lateStartDate: r.comien,
                  lateFinishDate: r.fin,
                  tf: 0,
                  ff: 0,
                }) as CpmTask
            )
      );

      let minCPrev = '';
      let maxFPrev = '';
      let minC = '';
      let maxF = '';
      let totalActs = 0;
      let isCrit = false;

      resumenes.forEach((r) => {
        if (r.comienPrev && (!minCPrev || r.comienPrev < minCPrev)) minCPrev = r.comienPrev;
        if (r.finPrev && (!maxFPrev || r.finPrev > maxFPrev)) maxFPrev = r.finPrev;
        if (r.comien && (!minC || r.comien < minC)) minC = r.comien;
        if (r.fin && (!maxF || r.fin > maxF)) maxF = r.fin;
        totalActs += r.totalActividades;
        if (r.esCritica) isCrit = true;
      });

      const displayHito = bucketAgrup ? `${bucketAgrup} · ${hitoName}` : hitoName;

      hitosMacro.push({
        id: bucket.key,
        hitoMacro: displayHito,
        puntoControlNombre: hitoName,
        agrupacion: bucketAgrup || undefined,
        order: orderIdx,
        comienPrev: minCPrev,
        finPrev: maxFPrev,
        comien: minC,
        fin: maxF,
        varComien: diffDaysIso(minC, minCPrev),
        varFin: diffDaysIso(maxF, maxFPrev),
        totalActividades: totalActs,
        avancePct: metrics.avancePct,
        avanceProgramadoPct: metrics.avanceProgramadoPct,
        spi: metrics.spi,
        esCritica: isCrit,
        resumenes: [...resumenes].sort((a, b) => a.edt.localeCompare(b.edt, undefined, { numeric: true })),
      });
    }

    const totalResumenes = hitosMacro.reduce((acc, h) => acc + h.resumenes.length, 0);
    const totalActividades = hitosMacro.reduce((acc, h) => acc + h.totalActividades, 0);
    const hitosCriticos = hitosMacro.filter((h) => h.esCritica).length;

    return {
      hitosMacro,
      totalHitos: hitosMacro.length,
      totalResumenes,
      totalActividades,
      hitosCriticos,
    };
  }
}
