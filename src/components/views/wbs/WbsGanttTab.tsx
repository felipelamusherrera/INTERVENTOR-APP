import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Calendar,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Milestone,
} from 'lucide-react';
import {
  CpmEngine,
  CpmTask,
  CpmTargetMode,
  HitoMacroGroupNode,
  TareaResumenCpcNode,
} from '../../../services/cpmEngine';
import {
  CorteProgramacion,
  ScheduleService,
  FechasAlistamientoState,
} from '../../../services/scheduleService';
import { BaselineService } from '../../../services/baselineService';
import { WbsHitosProyectoView } from './WbsHitosProyectoView';

interface WbsGanttTabProps {
  proyecto: string;
  cortes: CorteProgramacion[];
  initialCorteId?: string;
}

type DrillLevel = 1 | 2 | 3 | 4;

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatShortDateEs(iso?: string): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const year = m[1];
  const monthIdx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
  const day = parseInt(m[3], 10);
  return `${day} ${MESES_CORTOS[monthIdx]} ${year}`;
}

function formatSignedDays(d: number): string {
  if (d > 0) return `+${d} d`;
  return `${d} d`;
}

function parseMs(iso?: string): number | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = new Date(m ? `${m[1]}-${m[2]}-${m[3]}T12:00:00` : iso);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

function getSaturdayOfCutWeek(fechaIso?: string): string {
  const sem = BaselineService.getSemanaCorte(fechaIso || new Date());
  const dt = new Date(`${sem.lunesStr}T12:00:00`);
  dt.setDate(dt.getDate() + 5); // Sábado de esa ventana semanal
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export const WbsGanttTab: React.FC<WbsGanttTabProps> = ({
  proyecto,
  cortes,
  initialCorteId,
}) => {
  const [selectedCorteId, setSelectedCorteId] = useState<string>(
    () => initialCorteId || cortes[cortes.length - 1]?.id || ''
  );

  useEffect(() => {
    if (cortes.length > 0 && !cortes.some((c) => c.id === selectedCorteId)) {
      setSelectedCorteId(cortes[cortes.length - 1].id);
    }
  }, [cortes, selectedCorteId]);
  const [ganttViewMode, setGanttViewMode] = useState<'GANTT' | 'HITOS'>('GANTT');
  const [filtroAgrupacion, setFiltroAgrupacion] = useState<string>('TODAS');
  const [soloCriticas, setSoloCriticas] = useState<boolean>(false);
  const [cpmTargetMode, setCpmTargetMode] = useState<CpmTargetMode>('LINEA_BASE');
  const [horizonteFiltro, setHorizonteFiltro] = useState<'TODOS' | '6_SEMANAS' | '3_MESES'>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeZoom, setTimeZoom] = useState<'MONTHS' | 'QUARTERS' | 'YEARS'>('QUARTERS');

  // Expansión jerárquica:
  // Nivel 1 (Predeterminado): Agrupaciones generales + 1 línea por cada Torre (desplegable a Puntos de Control)
  // Nivel 2: Punto de Control
  // Nivel 3: Tarea resumen
  // Nivel 4: Actividad "task"
  const [expandedTorres, setExpandedTorres] = useState<Set<string>>(new Set());
  const [expandedHitos, setExpandedHitos] = useState<Set<string>>(new Set());
  const [expandedResumenes, setExpandedResumenes] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState(() => ScheduleService.getWbsAssignments(proyecto));
  const [fechasAlistamiento, setFechasAlistamiento] = useState<FechasAlistamientoState | null>(() =>
    ScheduleService.getFechasAlistamiento(proyecto)
  );

  useEffect(() => {
    const refresh = () => {
      setAssignments(ScheduleService.getWbsAssignments(proyecto));
      setFechasAlistamiento(ScheduleService.getFechasAlistamiento(proyecto));
    };
    refresh();
    window.addEventListener('marval_wbs_assignments_updated', refresh);
    window.addEventListener('marval_alistamiento_updated', refresh);
    window.addEventListener('schedule_updated', refresh);
    return () => {
      window.removeEventListener('marval_wbs_assignments_updated', refresh);
      window.removeEventListener('marval_alistamiento_updated', refresh);
      window.removeEventListener('schedule_updated', refresh);
    };
  }, [proyecto]);

  const corteActivo = useMemo(() => {
    return cortes.find((c) => c.id === selectedCorteId) || cortes[cortes.length - 1];
  }, [cortes, selectedCorteId]);

  const fechaCorteSemana = useMemo(
    () => getSaturdayOfCutWeek(corteActivo?.fechaCorte),
    [corteActivo?.fechaCorte]
  );

  // 1. Calcular Ruta Crítica anclada a hitos de Alistamiento por torre (Línea Base o Gerencia)
  const cpmData = useMemo(() => {
    if (!corteActivo) return { tasks: [] as CpmTask[], summary: null };
    return CpmEngine.computeSchedule(corteActivo.tasks as any[], {
      targetMode: cpmTargetMode,
      fechasAlistamientoByTorre: fechasAlistamiento?.byTorre,
    });
  }, [corteActivo, cpmTargetMode, fechasAlistamiento]);

  const agrupaciones = useMemo(() => {
    const set = new Set<string>();
    cpmData.tasks.forEach((t) => {
      if (t.agrupacion && t.agrupacion !== 'NO APLICA') {
        set.add(t.agrupacion);
      }
    });
    return Array.from(set).sort();
  }, [cpmData.tasks]);

  // 2. Motor de Rollup CPM de 3 Niveles (Agrupación & Hito macro -> Tarea resumen CPC -> Actividad Task)
  const rollup = useMemo(() => {
    const horizonteDias =
      horizonteFiltro === '6_SEMANAS' ? 42 : horizonteFiltro === '3_MESES' ? 90 : undefined;
    return CpmEngine.buildThreeLevelRollup({
      cpmTasks: cpmData.tasks,
      hitoByEdt: assignments.hitoByEdt,
      fechaCorte: fechaCorteSemana,
      agrupacion:
        ganttViewMode === 'HITOS' || filtroAgrupacion === 'URBANISMO_GENERAL'
          ? 'TODAS'
          : filtroAgrupacion,
      soloCriticas,
      searchTerm,
      horizonteDias,
    });
  }, [
    cpmData.tasks,
    assignments.hitoByEdt,
    fechaCorteSemana,
    ganttViewMode,
    filtroAgrupacion,
    soloCriticas,
    searchTerm,
    horizonteFiltro,
  ]);

  // Agrupar Puntos de Control de Torres en 1 sola línea padre por Torre
  interface TorreGroupNode {
    id: string;
    torre: string;
    comienPrev: string;
    finPrev: string;
    comien: string;
    fin: string;
    varComien: number;
    varFin: number;
    totalActividades: number;
    avancePct: number;
    avanceProgramadoPct: number;
    spi: number;
    esCritica: boolean;
    puntosControl: HitoMacroGroupNode[];
  }

  const { generalPuntosControl, torreGroups } = useMemo(() => {
    const general: HitoMacroGroupNode[] = [];
    const byTorre = new Map<string, HitoMacroGroupNode[]>();

    for (const h of rollup.hitosMacro) {
      if (!h.agrupacion) {
        general.push(h);
      } else {
        if (!byTorre.has(h.agrupacion)) byTorre.set(h.agrupacion, []);
        byTorre.get(h.agrupacion)!.push(h);
      }
    }

    const torres: TorreGroupNode[] = [];
    const sortedKeys = Array.from(byTorre.keys()).sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );

    for (const torre of sortedKeys) {
      const list = byTorre.get(torre) || [];
      if (list.length === 0) continue;
      let minCPrev = '';
      let maxFPrev = '';
      let minC = '';
      let maxF = '';
      let totalActs = 0;
      let sumReal = 0;
      let sumProg = 0;
      let sumWeight = 0;
      let isCrit = false;

      list.forEach((p) => {
        if (p.comienPrev && (!minCPrev || p.comienPrev < minCPrev)) minCPrev = p.comienPrev;
        if (p.finPrev && (!maxFPrev || p.finPrev > maxFPrev)) maxFPrev = p.finPrev;
        if (p.comien && (!minC || p.comien < minC)) minC = p.comien;
        if (p.fin && (!maxF || p.fin > maxF)) maxF = p.fin;
        const w = Math.max(1, p.totalActividades);
        totalActs += p.totalActividades;
        sumWeight += w;
        sumReal += p.avancePct * w;
        sumProg += (p.avanceProgramadoPct ?? 0) * w;
        if (p.esCritica) isCrit = true;
      });

      const avancePct = sumWeight > 0 ? Number((sumReal / sumWeight).toFixed(1)) : 0;
      const avanceProgramadoPct = sumWeight > 0 ? Number((sumProg / sumWeight).toFixed(1)) : 0;
      const spi =
        avanceProgramadoPct > 0
          ? Number((avancePct / avanceProgramadoPct).toFixed(2))
          : 1.0;

      torres.push({
        id: `TORRE_GROUP::${torre}`,
        torre,
        comienPrev: minCPrev,
        finPrev: maxFPrev,
        comien: minC,
        fin: maxF,
        varComien: ScheduleService.diffDays(minC, minCPrev),
        varFin: ScheduleService.diffDays(maxF, maxFPrev),
        totalActividades: totalActs,
        avancePct,
        avanceProgramadoPct,
        spi,
        esCritica: isCrit,
        puntosControl: list,
      });
    }

    return { generalPuntosControl: general, torreGroups: torres };
  }, [rollup.hitosMacro]);

  const applyExpandPreset = (level: DrillLevel) => {
    if (level === 1) {
      setExpandedTorres(new Set());
      setExpandedHitos(new Set());
      setExpandedResumenes(new Set());
    } else if (level === 2) {
      setExpandedTorres(new Set(torreGroups.map((t) => t.id)));
      setExpandedHitos(new Set());
      setExpandedResumenes(new Set());
    } else if (level === 3) {
      setExpandedTorres(new Set(torreGroups.map((t) => t.id)));
      setExpandedHitos(new Set(rollup.hitosMacro.map((h) => h.id)));
      setExpandedResumenes(new Set());
    } else {
      setExpandedTorres(new Set(torreGroups.map((t) => t.id)));
      setExpandedHitos(new Set(rollup.hitosMacro.map((h) => h.id)));
      const allResIds = new Set<string>();
      rollup.hitosMacro.forEach((h) => h.resumenes.forEach((r) => allResIds.add(r.id)));
      setExpandedResumenes(allResIds);
    }
  };

  const toggleTorreGroup = (torreGroupId: string) => {
    setExpandedTorres((prev) => {
      const next = new Set(prev);
      if (next.has(torreGroupId)) next.delete(torreGroupId);
      else next.add(torreGroupId);
      return next;
    });
  };

  const toggleHito = (hitoId: string) => {
    setExpandedHitos((prev) => {
      const next = new Set(prev);
      if (next.has(hitoId)) next.delete(hitoId);
      else next.add(hitoId);
      return next;
    });
  };

  const toggleResumen = (resId: string) => {
    setExpandedResumenes((prev) => {
      const next = new Set(prev);
      if (next.has(resId)) next.delete(resId);
      else next.add(resId);
      return next;
    });
  };

  // 3. Construir filas planas visibles respetando la agrupación por Torre -> Punto de Control -> Tarea resumen -> Task
  type VisibleGanttRow =
    | { kind: 'TORRE'; level: 1; node: TorreGroupNode }
    | { kind: 'HITO'; level: 1 | 2; node: HitoMacroGroupNode; nestedUnderTorre?: boolean }
    | { kind: 'RESUMEN'; level: 2 | 3; node: TareaResumenCpcNode; parentId: string }
    | { kind: 'TASK'; level: 3 | 4; node: CpmTask; parentId: string };

  const visibleRows: VisibleGanttRow[] = useMemo(() => {
    const list: VisibleGanttRow[] = [];

    // 1) Agrupaciones generales (Preliminares y mov. tierra, Urbanismo, Zonas comunes esenciales, Zonas comunes no esenciales)
    for (const hito of generalPuntosControl) {
      list.push({ kind: 'HITO', level: 1, node: hito, nestedUnderTorre: false });
      if (expandedHitos.has(hito.id)) {
        for (const res of hito.resumenes) {
          list.push({ kind: 'RESUMEN', level: 2, node: res, parentId: hito.id });
          if (expandedResumenes.has(res.id)) {
            for (const task of res.tasks) {
              list.push({ kind: 'TASK', level: 3, node: task, parentId: res.id });
            }
          }
        }
      }
    }

    // 2) Torres agrupadas (1 línea por torre; al desplegar muestra sus Puntos de Control)
    for (const tg of torreGroups) {
      list.push({ kind: 'TORRE', level: 1, node: tg });
      if (expandedTorres.has(tg.id)) {
        for (const hito of tg.puntosControl) {
          list.push({ kind: 'HITO', level: 2, node: hito, nestedUnderTorre: true });
          if (expandedHitos.has(hito.id)) {
            for (const res of hito.resumenes) {
              list.push({ kind: 'RESUMEN', level: 3, node: res, parentId: hito.id });
              if (expandedResumenes.has(res.id)) {
                for (const task of res.tasks) {
                  list.push({ kind: 'TASK', level: 4, node: task, parentId: res.id });
                }
              }
            }
          }
        }
      }
    }

    return list;
  }, [generalPuntosControl, torreGroups, expandedTorres, expandedHitos, expandedResumenes]);

  // 4. Calcular ventana temporal global del cronograma incluyendo fechaCorteSemana
  const timelineBounds = useMemo(() => {
    let minMs = Infinity;
    let maxMs = -Infinity;

    const inspectDate = (iso?: string) => {
      const ms = parseMs(iso);
      if (ms !== null) {
        if (ms < minMs) minMs = ms;
        if (ms > maxMs) maxMs = ms;
      }
    };

    rollup.hitosMacro.forEach((h) => {
      inspectDate(h.comienPrev);
      inspectDate(h.finPrev);
      inspectDate(h.comien);
      inspectDate(h.fin);
    });
    inspectDate(fechaCorteSemana);

    if (minMs === Infinity) minMs = Date.now() - 86400000 * 60;
    if (maxMs === -Infinity) maxMs = Date.now() + 86400000 * 365;

    return {
      minTime: minMs - 86400000 * 25,
      maxTime: maxMs + 86400000 * 45,
    };
  }, [rollup.hitosMacro, fechaCorteSemana]);

  const timeSpan = Math.max(86400000, timelineBounds.maxTime - timelineBounds.minTime);

  const dateToPct = (ms: number) => {
    return Math.max(0, Math.min(100, ((ms - timelineBounds.minTime) / timeSpan) * 100));
  };

  const corteMs = parseMs(fechaCorteSemana) || Date.now();
  const cortePct = dateToPct(corteMs);

  // Encabezado temporal de años y trimestres/meses
  const timelineHeaderData = useMemo(() => {
    const start = new Date(timelineBounds.minTime);
    const end = new Date(timelineBounds.maxTime);
    const years: Array<{ year: number; leftPct: number; widthPct: number }> = [];
    const subTicks: Array<{ label: string; leftPct: number; widthPct: number }> = [];

    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      const yStartMs = Math.max(timelineBounds.minTime, new Date(y, 0, 1).getTime());
      const yEndMs = Math.min(timelineBounds.maxTime, new Date(y + 1, 0, 1).getTime());
      if (yEndMs > yStartMs) {
        const leftPct = dateToPct(yStartMs);
        const rightPct = dateToPct(yEndMs);
        years.push({ year: y, leftPct, widthPct: rightPct - leftPct });
      }
    }

    const stepMonths = timeZoom === 'MONTHS' ? 1 : timeZoom === 'QUARTERS' ? 3 : 6;
    const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / stepMonths) * stepMonths, 1);
    while (cursor <= end) {
      const curMs = Math.max(timelineBounds.minTime, cursor.getTime());
      const nextDate = new Date(cursor.getFullYear(), cursor.getMonth() + stepMonths, 1);
      const nextMs = Math.min(timelineBounds.maxTime, nextDate.getTime());
      if (nextMs > curMs) {
        const leftPct = dateToPct(curMs);
        const widthPct = dateToPct(nextMs) - leftPct;
        if (widthPct > 0.4) {
          subTicks.push({
            label: MESES_CORTOS[cursor.getMonth()],
            leftPct,
            widthPct,
          });
        }
      }
      cursor.setTime(nextDate.getTime());
    }

    return { years, subTicks };
  }, [timelineBounds, timeZoom]);

  const extractMetrics = (row: VisibleGanttRow) => {
    if (row.kind === 'TORRE') {
      const n = row.node;
      return {
        key: `TG-${n.id}`,
        title: n.torre,
        subtitle: `${n.puntosControl.length} Puntos de Control · ${n.totalActividades} act. · ${n.avancePct.toFixed(1).replace('.', ',')} % ejecutado`,
        spiText: `SPI ${n.spi.toFixed(2).replace('.', ',')} · Prog ${n.avanceProgramadoPct.toFixed(1).replace('.', ',')}%`,
        spi: n.spi,
        comienPrev: n.comienPrev,
        finPrev: n.finPrev,
        comien: n.comien,
        fin: n.fin,
        varComien: n.varComien,
        varFin: n.varFin,
        avancePct: n.avancePct,
        esCritica: n.esCritica,
        criticalForTorres: [] as string[],
        hasChildren: n.puntosControl.length > 0,
        isExpanded: expandedTorres.has(n.id),
        onToggle: () => toggleTorreGroup(n.id),
      };
    }
    if (row.kind === 'HITO') {
      const n = row.node;
      return {
        key: `H-${n.id}`,
        title: row.nestedUnderTorre ? n.puntoControlNombre || n.hitoMacro : n.hitoMacro,
        subtitle: `${n.totalActividades} actividad(es) · ${n.avancePct.toFixed(1).replace('.', ',')} % ejecutado`,
        spiText: `SPI ${n.spi.toFixed(2).replace('.', ',')} · Prog ${(n.avanceProgramadoPct ?? 0).toFixed(1).replace('.', ',')}%`,
        spi: n.spi,
        comienPrev: n.comienPrev,
        finPrev: n.finPrev,
        comien: n.comien,
        fin: n.fin,
        varComien: n.varComien,
        varFin: n.varFin,
        avancePct: n.avancePct,
        esCritica: n.esCritica,
        criticalForTorres: [] as string[],
        hasChildren: n.resumenes.length > 0,
        isExpanded: expandedHitos.has(n.id),
        onToggle: () => toggleHito(n.id),
      };
    }
    if (row.kind === 'RESUMEN') {
      const n = row.node;
      return {
        key: `R-${n.id}`,
        title: `[${n.edt}] ${n.nombre}`,
        subtitle: `CPC ${n.codigoCpc} · ${n.totalActividades} task · ${n.avancePct.toFixed(1).replace('.', ',')} % ejecutado`,
        spiText: `SPI ${n.spi.toFixed(2).replace('.', ',')}`,
        spi: n.spi,
        comienPrev: n.comienPrev,
        finPrev: n.finPrev,
        comien: n.comien,
        fin: n.fin,
        varComien: n.varComien,
        varFin: n.varFin,
        avancePct: n.avancePct,
        esCritica: n.esCritica,
        criticalForTorres: n.criticalForTorres || [],
        hasChildren: n.tasks.length > 0,
        isExpanded: expandedResumenes.has(n.id),
        onToggle: () => toggleResumen(n.id),
      };
    }
    const t = row.node;
    const cPrev = t.comienPrev || t.comien;
    const fPrev = t.finPrev || t.fin;
    const varC =
      t.varComien !== undefined && !isNaN(Number(t.varComien))
        ? Number(t.varComien)
        : ScheduleService.diffDays(t.comien, cPrev);
    const varF =
      t.varFin !== undefined && !isNaN(Number(t.varFin))
        ? Number(t.varFin)
        : ScheduleService.diffDays(t.fin, fPrev);
    const avPct = Math.round((t.w || 0) * 1000) / 10;

    return {
      key: `T-${t.idConsec}-${t.edt}`,
      title: `[${t.edt}] ${t.nombre}`,
      subtitle: `ID ${t.idConsec} · Dur: ${t.dura}d · ${avPct.toFixed(1).replace('.', ',')} % ejecutado`,
      spiText: `TF: ${t.tf} d`,
      spi: t.tf <= 3 ? 0.5 : 1.0,
      comienPrev: cPrev,
      finPrev: fPrev,
      comien: t.comien,
      fin: t.fin,
      varComien: varC,
      varFin: varF,
      avancePct: avPct,
      esCritica: t.esCritica,
      criticalForTorres: t.criticalForTorres || [],
      hasChildren: false,
      isExpanded: false,
      onToggle: undefined,
    };
  };

  return (
    <div className="space-y-4">
      {/* Barra de Estado Semanal con Fecha Fin de la Semana y Controles de Rollup */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Selector de Vista (Diagrama Gantt vs Hitos Proyecto) + Corte + Controles */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center bg-slate-900/5 p-0.5 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setGanttViewMode('GANTT')}
                className={`px-3 py-1 rounded-md font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  ganttViewMode === 'GANTT'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Diagrama Gantt</span>
              </button>
              <button
                type="button"
                onClick={() => setGanttViewMode('HITOS')}
                className={`px-3 py-1 rounded-md font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  ganttViewMode === 'HITOS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Milestone className="w-3.5 h-3.5" />
                <span>Hitos Proyecto</span>
              </button>
            </div>

            {ganttViewMode === 'GANTT' && (
              <>
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="font-bold text-indigo-900">Corte:</span>
                  <select
                    value={corteActivo?.id || ''}
                    onChange={(e) => setSelectedCorteId(e.target.value)}
                    className="bg-transparent font-extrabold text-indigo-950 focus:outline-none cursor-pointer"
                  >
                    {cortes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desglose Estandarizado: Torres agrupadas -> Punto de Control -> Tarea resumen -> Task */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => applyExpandPreset(1)}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      expandedTorres.size === 0 && expandedHitos.size === 0
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Torres / General
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExpandPreset(2)}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      expandedTorres.size > 0 && expandedHitos.size === 0
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. + Punto de Control
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExpandPreset(3)}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      expandedHitos.size > 0 && expandedResumenes.size === 0
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. + Tarea resumen
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExpandPreset(4)}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      expandedResumenes.size > 0
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    4. + Tareas Task
                  </button>
                </div>
              </>
            )}

            <select
              value={filtroAgrupacion}
              onChange={(e) => setFiltroAgrupacion(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700"
            >
              <option value="TODAS">Todos los Frentes / Agrupaciones</option>
              <option value="URBANISMO_GENERAL">Urbanismo y Zonas Comunes</option>
              {agrupaciones.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSoloCriticas(!soloCriticas)}
              className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                soloCriticas
                  ? 'bg-red-600 text-white border-red-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Solo Ruta Crítica</span>
            </button>

            {/* Filtro exclusivo Gantt: Ruta Crítica Línea Base vs Fechas Alistamiento Gerencia */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCpmTargetMode('LINEA_BASE')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  cpmTargetMode === 'LINEA_BASE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ver ruta crítica línea base
              </button>
              <button
                type="button"
                onClick={() => setCpmTargetMode('GERENCIA')}
                className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  cpmTargetMode === 'GERENCIA'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Ver ruta crítica Fechas alistamiento Gerencia</span>
                {!fechasAlistamiento && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-red-100 text-red-700 font-black">
                    Sin archivo
                  </span>
                )}
              </button>
            </div>

            {/* Filtro de horizonte temporal: Todo / 6 Semanas / 3 Meses */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[
                { id: 'TODOS' as const, label: 'Todo' },
                { id: '6_SEMANAS' as const, label: 'A 6 semanas' },
                { id: '3_MESES' as const, label: 'A 3 meses' },
              ].map((hOpt) => (
                <button
                  key={hOpt.id}
                  type="button"
                  onClick={() => setHorizonteFiltro(hOpt.id)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    horizonteFiltro === hOpt.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {hOpt.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar punto control, resumen o tarea..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
              />
            </div>
          </div>

          {/* Escala temporal (solo Diagrama Gantt) */}
          {ganttViewMode === 'GANTT' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Escala:</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {[
                  { id: 'MONTHS' as const, label: 'Meses' },
                  { id: 'QUARTERS' as const, label: 'Trimestres' },
                  { id: 'YEARS' as const, label: 'Años' },
                ].map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setTimeZoom(z.id)}
                    className={`px-2 py-1 rounded-md font-bold transition ${
                      timeZoom === z.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Estado Semanal Oficial */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Fecha Fin de Semana (Sábado de Corte):</span>
              <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black">
                {formatShortDateEs(fechaCorteSemana)}
              </span>
            </div>
            <span className="text-slate-600">
              <strong>Sábana:</strong> {corteActivo?.fileName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
            <span className="text-slate-700">
              {rollup.totalHitos} Puntos de Control · {rollup.totalResumenes} Tareas resumen · {rollup.totalActividades} Tareas
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>
                {rollup.hitosCriticos} Puntos de Control en Ruta Crítica (
                {cpmTargetMode === 'GERENCIA'
                  ? 'Alistamiento · Gerencia'
                  : 'Alistamiento · Línea Base'}
                )
              </span>
            </span>
            {cpmData.summary?.zonasNoEsencialesCpm && (
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${
                  cpmData.summary.zonasNoEsencialesCpm.activa
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="Regla Ley 675 (50%+1 inmuebles): activa Zonas Comunes No Esenciales en ruta crítica al alcanzar 100% de alistamiento en >=70% de las torres"
              >
                ZC No Esenciales:{' '}
                {cpmData.summary.zonasNoEsencialesCpm.activa
                  ? `ACTIVA (${cpmData.summary.zonasNoEsencialesCpm.torresAlistadas100}/${cpmData.summary.zonasNoEsencialesCpm.torresTotal} torres · +${cpmData.summary.zonasNoEsencialesCpm.tareasCriticasAgregadas} críticas)`
                  : `Inactiva (${cpmData.summary.zonasNoEsencialesCpm.torresAlistadas100}/${cpmData.summary.zonasNoEsencialesCpm.torresTotal} torres al 100% · activa al ≥70%)`}
              </span>
            )}
          </div>
        </div>

        {cpmTargetMode === 'GERENCIA' && !fechasAlistamiento && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Aún no se ha cargado el archivo de <strong>Fechas de Alistamiento Gerencia</strong>. Mostrando fechas de <strong>Línea Base</strong> como respaldo hasta cargar el archivo en Pestaña 1.
            </span>
          </div>
        )}
      </div>

      {/* Panel Indicador por Torre: Línea Base vs Fecha Alistamiento Confirmado Gerencia (C) */}
      {cpmData.summary?.alistamientoResumen && cpmData.summary.alistamientoResumen.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="font-extrabold text-slate-900">
                Fechas de Alistamiento por Torre · Indicador Adelanto / Atraso (Gerencia vs. Línea Base)
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Clic en una torre para filtrar el Gantt (incluye actividades vinculadas de Urbanismo, Zonas Comunes y otras torres)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {cpmData.summary.alistamientoResumen.map((item) => {
              const isSelected = filtroAgrupacion === item.torre;
              const diff = item.diffGerenciaVsLbDias;
              const diffBadge =
                diff === null
                  ? { label: 'Sin fecha Gerencia', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
                  : diff < 0
                    ? { label: `Adelanto ${Math.abs(diff)} d`, cls: 'bg-sky-100 text-sky-900 border-sky-300' }
                    : diff > 0
                      ? { label: `Atraso +${diff} d`, cls: 'bg-rose-100 text-rose-800 border-rose-300' }
                      : { label: '0 d · En fecha LB', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };

              return (
                <button
                  key={`${item.torre}-${item.milestoneId}`}
                  type="button"
                  onClick={() => setFiltroAgrupacion(isSelected ? 'TODAS' : item.torre)}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-200'
                      : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs text-slate-900">{item.torre}</span>
                    {item.etapa && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                        {item.etapa}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5">
                    <span
                      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border ${diffBadge.cls}`}
                    >
                      {diffBadge.label}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5 text-[10px] text-slate-600 tabular-nums">
                    <div className="flex justify-between gap-1">
                      <span>Línea Base:</span>
                      <strong className="text-slate-900">{formatShortDateEs(item.fechaLineaBase)}</strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>Gerencia (C):</span>
                      <strong className={item.fechaGerencia ? 'text-amber-800' : 'text-slate-400'}>
                        {item.fechaGerencia ? formatShortDateEs(item.fechaGerencia) : 'Sin cargar'}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span>Proyectado WP:</span>
                      <strong className={item.tfActivo <= 3 ? 'text-red-700' : 'text-slate-800'}>
                        {formatShortDateEs(item.fechaProyectada)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] tabular-nums">
                    <span className="text-slate-500">
                      <strong className="text-slate-800">{item.actividadesCriticasTorre}</strong> propias ·{' '}
                      <strong className="text-indigo-700">{item.actividadesCriticasExternas}</strong> ext.
                    </span>
                    <span
                      className={`font-extrabold ${
                        item.tfActivo <= 3 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      TF {item.tfActivo}d
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ganttViewMode === 'HITOS' ? (
        <WbsHitosProyectoView
          proyecto={proyecto}
          cortes={cortes}
          selectedCorteId={corteActivo?.id || selectedCorteId}
          onSelectCorteId={setSelectedCorteId}
          rollup={rollup}
          fechaCorteSemana={fechaCorteSemana}
          filtroAgrupacion={filtroAgrupacion}
          onSelectAgrupacion={setFiltroAgrupacion}
          cpmTargetMode={cpmTargetMode}
          fechasAlistamiento={fechasAlistamiento}
          alistamientoResumen={cpmData.summary?.alistamientoResumen}
        />
      ) : (
      /* Contenedor Diagrama Gantt Agrupado por Torres / Puntos de Control / Tareas resumen / Task */
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Título superior del Gantt */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <span className="font-extrabold text-slate-900">
              Diagrama Gantt · Puntos de Control, fechas planeadas, ejecutadas y proyectadas
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
            {visibleRows.length} fila(s) visibles
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1150px]">
            {/* Encabezado del Cronograma (Columna Izquierda + Línea Temporal Años/Meses + Desfases) */}
            <div className="flex border-b border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-600 sticky top-0 z-20">
              <div className="w-[310px] shrink-0 px-3 py-2 border-r border-slate-200 flex items-end">
                <span className="uppercase tracking-wider font-extrabold text-slate-700">
                  TORRE / PUNTO DE CONTROL / TAREA RESUMEN / TASK
                </span>
              </div>

              <div className="flex-1 min-w-[660px] relative border-r border-slate-200">
                {/* Fila superior de Años */}
                <div className="relative h-5 border-b border-slate-200/80">
                  {timelineHeaderData.years.map((y) => (
                    <div
                      key={y.year}
                      style={{ left: `${y.leftPct}%`, width: `${y.widthPct}%` }}
                      className="absolute top-0 bottom-0 border-l border-slate-300 pl-1.5 flex items-center font-extrabold text-[11px] text-slate-800"
                    >
                      {y.year}
                    </div>
                  ))}
                </div>

                {/* Fila inferior de Meses */}
                <div className="relative h-5">
                  {timelineHeaderData.subTicks.map((col, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                      className="absolute top-0 bottom-0 border-l border-slate-200 pl-1 flex items-center text-[10px] text-slate-500 lowercase"
                    >
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Etiqueta de línea vertical de Corte Semanal en el encabezado */}
                <div
                  style={{ left: `${cortePct}%` }}
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-amber-600 z-30 pointer-events-none"
                >
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100/95 text-amber-900 font-extrabold text-[10px] whitespace-nowrap shadow-xs">
                    Corte {formatShortDateEs(fechaCorteSemana)}
                  </span>
                </div>
              </div>

              <div className="w-[165px] shrink-0 px-3 py-2 flex items-end justify-end">
                <span className="uppercase tracking-wider font-extrabold text-slate-700">
                  VARIACIONES (DESFASES)
                </span>
              </div>
            </div>

            {/* Filas del Gantt (Nivel 1 Hito macro -> Nivel 2 Resumen CPC -> Nivel 3 Task) */}
            <div className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700">No hay hitos que cumplan los filtros actuales.</p>
                </div>
              ) : (
                visibleRows.slice(0, 250).map((row) => {
                  const m = extractMetrics(row);
                  const cPrevMs = parseMs(m.comienPrev);
                  const fPrevMs = parseMs(m.finPrev);
                  const cProyMs = parseMs(m.comien);
                  const fProyMs = parseMs(m.fin);

                  // Geometría Barra 1: Programado (ComienPrev -> FinPrev)
                  const lbStart = cPrevMs ?? fPrevMs ?? corteMs;
                  const lbEnd = Math.max(lbStart, fPrevMs ?? lbStart);
                  const lbLeftPct = dateToPct(lbStart);
                  const lbRightPct = Math.max(lbLeftPct + 0.7, dateToPct(lbEnd));
                  const lbWidthPct = lbRightPct - lbLeftPct;

                  // Geometría Barra 2: Avance Real + Pendiente Proyectado en la MISMA línea
                  const pStart = cProyMs ?? fProyMs ?? lbStart;
                  const pEnd = Math.max(pStart, fProyMs ?? pStart);
                  const pLeftPct = dateToPct(pStart);
                  const pRightPct = Math.max(pLeftPct + 0.7, dateToPct(pEnd));
                  const pWidthPct = pRightPct - pLeftPct;

                  const realPctNorm = Math.max(0, Math.min(100, m.avancePct || 0));
                  const tieneAvance = realPctNorm > 0;
                  const hasRealSegment = tieneAvance;
                  const realLeftPct = pLeftPct;
                  const realWidthPct = hasRealSegment
                    ? Math.max(0.5, (pWidthPct * realPctNorm) / 100)
                    : 0;

                  const hasRemainingSegment = realPctNorm < 100;
                  const remLeftPct = pLeftPct + realWidthPct;
                  const remWidthPct = hasRemainingSegment
                    ? Math.max(0.6, pWidthPct - realWidthPct)
                    : 0;

                  // Ventana punteada envolvente (marco punteado = ventana de comparación)
                  const winLeftPct = Math.min(lbLeftPct, pLeftPct);
                  const winRightPct = Math.max(lbRightPct, pRightPct);
                  const winWidthPct = Math.max(1, winRightPct - winLeftPct);

                  const isCritical = m.esCritica;
                  const rowBg =
                    row.level === 1
                      ? isCritical
                        ? 'bg-red-50/25 hover:bg-red-50/45'
                        : 'bg-white hover:bg-slate-50/80'
                      : row.level === 2
                        ? isCritical
                          ? 'bg-red-50/15 hover:bg-red-50/35'
                          : 'bg-slate-50/60 hover:bg-slate-100/70'
                        : isCritical
                          ? 'bg-rose-50/25 hover:bg-rose-50/40'
                          : 'bg-slate-50/30 hover:bg-blue-50/30';

                  const indentClass =
                    row.level === 1
                      ? 'pl-2.5'
                      : row.level === 2
                        ? 'pl-6'
                        : row.level === 3
                          ? 'pl-10'
                          : 'pl-14';

                  // Reglas exactas de color para porción Real y porción Pendiente
                  const adelantoInicio = tieneAvance && m.varComien < 0;
                  const atrasoFin = m.varFin > 0;
                  const adelantoFin = m.varFin < 0;

                  // Real (sólido): Verde si tiene adelanto en inicio o no tiene atraso en fin; Rojo sólido si tiene atraso en fin
                  const realSolidColor = adelantoInicio
                    ? '#16a34a'
                    : atrasoFin
                      ? '#dc2626'
                      : '#16a34a';

                  // Pendiente:
                  // - Amarillo si adelantó inicio pero tiene atraso en fin
                  // - Rojo trama diagonal si tiene atraso en fin o si tiene adelanto en fin
                  // - Gris trama diagonal si no tiene atraso ni adelanto en fin
                  const pendingMode: 'YELLOW' | 'RED_STRIPE' | 'GRAY_STRIPE' =
                    adelantoInicio && atrasoFin
                      ? 'YELLOW'
                      : atrasoFin || adelantoFin
                        ? 'RED_STRIPE'
                        : 'GRAY_STRIPE';

                  const pendingStripeStyle =
                    pendingMode === 'YELLOW'
                      ? {
                          backgroundColor: '#facc15',
                          borderColor: '#ca8a04',
                        }
                      : pendingMode === 'RED_STRIPE'
                        ? {
                            backgroundColor: 'rgba(254, 226, 226, 0.78)',
                            backgroundImage:
                              'repeating-linear-gradient(135deg, #dc2626 0px, #dc2626 1.5px, transparent 1.5px, transparent 5px)',
                            borderColor: '#dc2626',
                          }
                        : {
                            backgroundColor: 'rgba(241, 245, 249, 0.9)',
                            backgroundImage:
                              'repeating-linear-gradient(135deg, #64748b 0px, #64748b 1.5px, transparent 1.5px, transparent 5px)',
                            borderColor: '#64748b',
                          };

                  const endCapColor =
                    pendingMode === 'YELLOW'
                      ? '#a16207'
                      : pendingMode === 'RED_STRIPE'
                        ? '#b91c1c'
                        : '#475569';

                  return (
                    <div
                      key={m.key}
                      className={`flex items-stretch transition-colors ${rowBg}`}
                    >
                      {/* Columna Izquierda: Nombre + Nº actividades + % ejecutado + SPI */}
                      <div
                        onClick={m.hasChildren ? m.onToggle : undefined}
                        className={`w-[310px] shrink-0 py-2.5 pr-3 ${indentClass} border-r border-slate-200 flex flex-col justify-center ${
                          m.hasChildren ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-start gap-1">
                          {m.hasChildren ? (
                            <span className="mt-0.5 text-slate-500 shrink-0">
                              {m.isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                          ) : (
                            <span className="w-3.5 shrink-0 text-center text-slate-400 text-[10px]">
                              •
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span
                                className={`text-[11px] leading-tight truncate max-w-[215px] ${
                                  row.level === 1
                                    ? 'font-extrabold text-slate-900'
                                    : row.level === 2
                                      ? 'font-bold text-slate-800'
                                      : 'font-semibold text-slate-700'
                                }`}
                                title={m.title}
                              >
                                {row.kind === 'TORRE'
                                  ? `▣ ${m.title}`
                                  : row.kind === 'HITO'
                                    ? `◆ ${m.title}`
                                    : m.title}
                              </span>
                              {isCritical && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black shrink-0">
                                  <Flame className="w-2.5 h-2.5" />
                                  Crítica
                                </span>
                              )}
                              {row.kind === 'TASK' &&
                                isCritical &&
                                m.criticalForTorres &&
                                m.criticalForTorres.length > 0 && (
                                  <span
                                    className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold truncate max-w-[140px]"
                                    title={`Impacta Alistamiento de: ${m.criticalForTorres.join(', ')}`}
                                  >
                                    {m.criticalForTorres.join(', ')}
                                  </span>
                                )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{m.subtitle}</div>
                            <div
                              className={`text-[10px] font-bold ${
                                row.kind === 'TASK'
                                  ? isCritical
                                    ? 'text-red-700'
                                    : 'text-slate-600'
                                  : m.spi >= 0.95
                                    ? 'text-emerald-700'
                                    : m.spi >= 0.75
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                              }`}
                            >
                              {m.spiText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Área Central: 2 Barras (Planeado LB + Real/Faltante Proyectado en misma línea) */}
                      <div className="flex-1 min-w-[660px] relative py-2 border-r border-slate-200 overflow-hidden">
                        {/* Grilla de fondo */}
                        {timelineHeaderData.subTicks.map((col, idx) => (
                          <div
                            key={idx}
                            style={{ left: `${col.leftPct}%` }}
                            className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"
                          />
                        ))}

                        {/* Línea vertical de Corte Semanal */}
                        <div
                          style={{ left: `${cortePct}%` }}
                          className="absolute top-0 bottom-0 border-l-2 border-dotted border-amber-500 z-10 pointer-events-none"
                        />

                        {/* Marco punteado envolvente */}
                        <div
                          style={{ left: `${winLeftPct}%`, width: `${winWidthPct}%` }}
                          className="relative h-[38px] border border-dashed border-slate-300 rounded-xs bg-white/30"
                        />

                        {/* BARRA 1 (Superior): Programado (ComienPrev -> FinPrev) */}
                        <div
                          style={{ left: `${lbLeftPct}%`, width: `${lbWidthPct}%` }}
                          className="absolute top-[11px] h-[11px] bg-[#3b76a0] rounded-xs z-20"
                          title={`Programado (Progr.): ${m.comienPrev} → Fin Progr.: ${m.finPrev}`}
                        >
                          {/* Tope oscuro al final de Programado */}
                          <div className="absolute right-0 -top-[2px] -bottom-[2px] w-[2px] bg-slate-900" />
                        </div>

                        {/* Etiqueta de Programado en píldora de alto contraste */}
                        <div
                          style={
                            lbRightPct > 70
                              ? { right: `${Math.max(1, 100 - lbRightPct + 0.6)}%` }
                              : { left: `${lbRightPct + 0.6}%` }
                          }
                          className="absolute top-[7px] text-[10px] font-bold text-slate-900 bg-white/95 border border-slate-300/90 px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap pointer-events-none z-30"
                        >
                          {formatShortDateEs(m.comienPrev)} – Fin Progr.: {formatShortDateEs(m.finPrev)}
                        </div>

                        {/* BARRA 2 (Inferior): Porción Avance Real + Porción Avance Pendiente */}
                        {hasRealSegment && (
                          <div
                            style={{
                              left: `${realLeftPct}%`,
                              width: `${realWidthPct}%`,
                              backgroundColor: realSolidColor,
                            }}
                            className={`absolute top-[28px] h-[11px] z-20 ${
                              hasRemainingSegment ? 'rounded-l-xs' : 'rounded-xs'
                            }`}
                            title={`Avance real ejecutado (${realPctNorm.toFixed(1)}%): inició ${m.comien}`}
                          />
                        )}

                        {hasRemainingSegment && (
                          <div
                            style={{
                              left: `${remLeftPct}%`,
                              width: `${remWidthPct}%`,
                              ...pendingStripeStyle,
                            }}
                            className={`absolute top-[28px] h-[11px] z-20 border ${
                              hasRealSegment ? 'rounded-r-xs' : 'rounded-xs'
                            }`}
                            title={`Avance pendiente proyectado hasta Fin Proy: ${m.fin}`}
                          />
                        )}

                        {/* Tope vertical proyectado */}
                        <div
                          style={{ left: `${pRightPct}%`, backgroundColor: endCapColor }}
                          className="absolute top-[27px] h-[13px] w-[2px] z-20"
                        />

                        {/* Etiqueta Barra 2 en píldora de alto contraste */}
                        <div
                          style={
                            pRightPct > 68
                              ? { right: `${Math.max(1, 100 - pRightPct + 0.6)}%` }
                              : { left: `${pRightPct + 0.6}%` }
                          }
                          className="absolute top-[25px] text-[10px] font-extrabold text-slate-900 bg-white/95 border border-slate-300/90 px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap pointer-events-none z-30"
                        >
                          inició {formatShortDateEs(m.comien)} · {m.avancePct.toFixed(1).replace('.', ',')}% | fin proy: {formatShortDateEs(m.fin)}
                        </div>
                      </div>

                      {/* Columna Derecha: Variación Inicio y Variación Fin (Desfases) */}
                      <div className="w-[165px] shrink-0 px-3 py-2 flex flex-col justify-center text-[11px] tabular-nums">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Var. Inicio:</span>
                          <span
                            className={`font-extrabold ${
                              m.varComien > 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatSignedDays(m.varComien)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-slate-500">Var. Fin:</span>
                          <span
                            className={`font-extrabold ${
                              m.varFin > 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatSignedDays(m.varFin)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Leyenda Inferior Actualizada (Programado + 6 Reglas de Color de Desempeño + Sábado de Corte) */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-4 text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2.5 bg-[#3b76a0] inline-block rounded-2xs" />
            <span>Programado (Progr.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2.5 bg-[#16a34a] inline-block rounded-2xs" />
            <span>Avance real (Adelanto inicio / sin atraso fin)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2.5 bg-[#dc2626] inline-block rounded-2xs" />
            <span>Avance real (Con atraso en fin proyectado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-2.5 inline-block rounded-2xs border border-red-600"
              style={{
                backgroundColor: 'rgba(254, 226, 226, 0.78)',
                backgroundImage:
                  'repeating-linear-gradient(135deg, #dc2626 0px, #dc2626 1.5px, transparent 1.5px, transparent 4px)',
              }}
            />
            <span>Pendiente (Atraso o adelanto en fin proyectado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2.5 bg-[#facc15] border border-[#ca8a04] inline-block rounded-2xs" />
            <span>Pendiente (Inicio adelantado, fin atrasado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-2.5 inline-block rounded-2xs border border-slate-500"
              style={{
                backgroundColor: 'rgba(241, 245, 249, 0.9)',
                backgroundImage:
                  'repeating-linear-gradient(135deg, #64748b 0px, #64748b 1.5px, transparent 1.5px, transparent 4px)',
              }}
            />
            <span>Sin iniciar (Sin atraso ni adelanto en fin)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 border-l-2 border-dotted border-amber-600 inline-block" />
            <span className="font-semibold text-amber-800">
              Sábado de corte ({formatShortDateEs(fechaCorteSemana)})
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
