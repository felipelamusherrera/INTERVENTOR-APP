import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Flame,
  Building2,
  Layers,
  Milestone,
  Clock,
  BarChart3,
  Table2,
  Eye,
  Filter,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  CpmAlistamientoTorreSummary,
  CpmTargetMode,
  HitoMacroGroupNode,
  TareaResumenCpcNode,
  ThreeLevelRollupResult,
} from '../../../services/cpmEngine';
import {
  CorteProgramacion,
  FechasAlistamientoState,
  FechaAlistamientoTorreRecord,
} from '../../../services/scheduleService';
import { BaselineService } from '../../../services/baselineService';
import { WbsItem } from '../../../types';

interface WbsHitosProyectoViewProps {
  proyecto?: string;
  cortes: CorteProgramacion[];
  selectedCorteId: string;
  onSelectCorteId: (id: string) => void;
  rollup: ThreeLevelRollupResult;
  fechaCorteSemana: string;
  filtroAgrupacion: string;
  onSelectAgrupacion: (agrupacion: string) => void;
  cpmTargetMode: CpmTargetMode;
  fechasAlistamiento?: FechasAlistamientoState | null;
  alistamientoResumen?: CpmAlistamientoTorreSummary[];
}

interface StageMilestoneItem {
  id: string;
  edt?: string;
  nombre: string;
  subtitulo: string;
  etapaKey: string;
  etapaLabel: string;
  puntoControlNombre: string;
  agrupacionOrigen: string;
  esHitoAlistamientoTorre: boolean;
  comienPrev: string;
  finPrev: string;
  comien: string;
  fin: string;
  varComien: number;
  varFin: number;
  avanceProgramadoPct: number;
  avanceRealPct: number;
  esCritica: boolean;
  totalActividades: number;
}

interface StageChevronGroup {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  colorCls: string;
}

interface AlistamientoMatrixRow {
  torre: string;
  codigoCorto: string;
  nombreHito: string;
  etapa: string;
  inicioPrevisto: string;
  confirmadoGerente: string;
  tieneConfirmadoGerente: boolean;
  cambioConfirmadoVsPrevisto: boolean;
  proyectadoWp: string;
  alistadoPct: number;
  difVsPrevisto: number | null;
  difVsSemanaAnt: number | null;
  difVsGerente: number | null;
  tendenciaVsMesAnt: number | null;
  estadoLabel:
    | 'Cumplido'
    | 'Cumplido parcial'
    | 'Cumplido tarde'
    | 'A tiempo'
    | 'Riesgo leve'
    | 'Riesgo medio'
    | 'Riesgo alto'
    | 'Vencido'
    | 'Sin confirmar';
  estadoTone: 'emerald' | 'amber' | 'orange' | 'red' | 'rose' | 'slate';
  diasParaAlistamiento: number | null;
  subioNivelPor90Dias: boolean;
  gerente?: string;
  aprueba?: string;
  fechaConfirmacion?: string;
  ingresoRph?: string;
  salidaRph?: string;
  banderaRph?: string;
  alistamientoTramite?: string;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const TORRE_BAR_COLORS = [
  '#2563eb',
  '#dc2626',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4f46e5',
];

const CHEVRON_STAGE_PALETTE = [
  'from-emerald-600 to-emerald-500 text-white border-emerald-700',
  'from-lime-600 to-lime-500 text-white border-lime-700',
  'from-teal-600 to-teal-500 text-white border-teal-700',
  'from-sky-600 to-sky-500 text-white border-sky-700',
  'from-indigo-600 to-indigo-500 text-white border-indigo-700',
  'from-slate-700 to-slate-600 text-white border-slate-800',
];

const MAX_MILESTONES_PER_BAND = 10;

function parseMs(iso?: string): number | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = new Date(m ? `${m[1]}-${m[2]}-${m[3]}T12:00:00` : iso);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

function diffDaysIso(a?: string, b?: string): number {
  const ma = parseMs(a);
  const mb = parseMs(b);
  if (ma === null || mb === null) return 0;
  return Math.round((ma - mb) / 86400000);
}

function diffDaysNullable(a?: string, b?: string): number | null {
  const ma = parseMs(a);
  const mb = parseMs(b);
  if (ma === null || mb === null) return null;
  return Math.round((ma - mb) / 86400000);
}

function formatShortDateEs(iso?: string): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const monthIdx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
  return `${parseInt(m[3], 10)} ${MESES_CORTOS[monthIdx]} ${m[1]}`;
}

function formatSignedDays(d: number): string {
  if (d > 0) return `+${d} d`;
  return `${d} d`;
}

function getSaturdayIso(fechaIso?: string): string {
  const sem = BaselineService.getSemanaCorte(fechaIso || new Date());
  const dt = new Date(`${sem.lunesStr}T12:00:00`);
  dt.setDate(dt.getDate() + 5);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function resolveTorreStandardKey(raw?: string): string | null {
  if (!raw) return null;
  const m = String(raw).toUpperCase().match(/(?:TORRE|ALISTAMIENTO\s*T|\bT)\s*0*(\d{1,2})\b/i);
  if (!m) return null;
  return `TORRE ${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

function extractEtapaNum(raw?: string): number | null {
  if (!raw) return null;
  const m = String(raw).match(/0*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function lookupFechaAlistamientoRecord(
  byTorre: Record<string, FechaAlistamientoTorreRecord> | undefined,
  torreKey: string
): FechaAlistamientoTorreRecord | null {
  if (!byTorre) return null;
  if (byTorre[torreKey]) return byTorre[torreKey];
  for (const [k, rec] of Object.entries(byTorre)) {
    if (resolveTorreStandardKey(k) === torreKey) return rec;
  }
  return null;
}

function inferEtapaFromResumen(
  res: Pick<TareaResumenCpcNode, 'edt' | 'nombre' | 'agrupacion' | 'tasks'>,
  fechasAlistamiento?: FechasAlistamientoState | null,
  torreEtapaMap?: Map<string, number>
): { etapaKey: string; etapaLabel: string; etapaOrder: number } {
  const explicitTaskEtapa = res.tasks?.find(
    (t) => t.etapa && t.etapa !== 'NO APLICA' && /etapa\s*0*\d+/i.test(t.etapa)
  )?.etapa;
  if (explicitTaskEtapa) {
    const n = extractEtapaNum(explicitTaskEtapa);
    if (n) return { etapaKey: `ETAPA_${n}`, etapaLabel: `ETAPA ${n}`, etapaOrder: n };
  }

  const torreKey = resolveTorreStandardKey(res.agrupacion) || resolveTorreStandardKey(res.nombre);
  if (torreKey) {
    const mapped = torreEtapaMap?.get(torreKey);
    if (mapped) {
      return { etapaKey: `ETAPA_${mapped}`, etapaLabel: `ETAPA ${mapped}`, etapaOrder: mapped };
    }
    if (fechasAlistamiento?.byTorre) {
      const rec = lookupFechaAlistamientoRecord(fechasAlistamiento.byTorre, torreKey);
      const n = extractEtapaNum(rec?.etapa);
      if (n) return { etapaKey: `ETAPA_${n}`, etapaLabel: `ETAPA ${n}`, etapaOrder: n };
    }
  }

  const nameMatch = String(res.nombre || '').match(/\bE0*(\d)\b/i);
  if (nameMatch) {
    const n = parseInt(nameMatch[1], 10);
    return { etapaKey: `ETAPA_${n}`, etapaLabel: `ETAPA ${n}`, etapaOrder: n };
  }

  const edtMatch = String(res.edt || '').match(/^1\.7\.(\d)\b/);
  if (edtMatch) {
    const n = parseInt(edtMatch[1], 10);
    return { etapaKey: `ETAPA_${n}`, etapaLabel: `ETAPA ${n}`, etapaOrder: n };
  }

  if (torreKey) {
    const n = extractEtapaNum(torreKey);
    if (n) return { etapaKey: `ETAPA_${n}`, etapaLabel: `ETAPA ${n}`, etapaOrder: n };
  }

  return { etapaKey: 'ETAPA_1', etapaLabel: 'ETAPA 1', etapaOrder: 1 };
}

function findAlistamientoTasksByTorre(
  tasks: WbsItem[]
): Map<string, { task: WbsItem; finPrev: string; finProy: string; avancePct: number }> {
  const map = new Map<
    string,
    { task: WbsItem; finPrev: string; finProy: string; avancePct: number }
  >();

  for (const t of tasks) {
    const cpc = String(t.codigoPlaneacion || '').trim();
    const isAlist =
      cpc === '603510' || (t.tipo === 'milestone' && /alistamiento/i.test(t.nombre || ''));
    if (!isAlist) continue;
    const tKey =
      resolveTorreStandardKey(t.agrupacion) || resolveTorreStandardKey(t.nombre);
    if (!tKey) continue;
    const finPrev = t.finPrev || t.comienPrev || t.fin || t.comien;
    const finProy = t.fin || t.comien || finPrev;
    const rawW = Number(t.w || 0);
    const avancePct = Math.round((rawW <= 1 ? rawW * 100 : rawW) * 10) / 10;
    map.set(tKey, { task: t, finPrev, finProy, avancePct });
  }

  return map;
}

/**
 * Divide un arreglo en bloques equilibrados de máximo `maxPerBand` hitos por fila
 * para asegurar que todos los hitos y sus tarjetas quepan al 100% en el ancho de pantalla.
 */
function chunkIntoBalancedBands<T>(items: T[], maxPerBand: number): T[][] {
  if (items.length === 0) return [];
  if (items.length <= maxPerBand) return [items];
  const bandCount = Math.ceil(items.length / maxPerBand);
  const perBand = Math.ceil(items.length / bandCount);
  const bands: T[][] = [];
  for (let i = 0; i < items.length; i += perBand) {
    bands.push(items.slice(i, i + perBand));
  }
  return bands;
}

export const WbsHitosProyectoView: React.FC<WbsHitosProyectoViewProps> = ({
  cortes,
  selectedCorteId,
  onSelectCorteId,
  rollup,
  fechaCorteSemana,
  filtroAgrupacion,
  onSelectAgrupacion,
  cpmTargetMode: _cpmTargetMode,
  fechasAlistamiento,
  alistamientoResumen,
}) => {
  const [periodoModo, setPeriodoModo] = useState<'VENTANA' | 'MES'>('VENTANA');
  const [selectedAgrupaciones, setSelectedAgrupaciones] = useState<string[]>(() =>
    filtroAgrupacion && filtroAgrupacion !== 'TODAS' ? [filtroAgrupacion] : []
  );
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('TODAS');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [mostrarColumnasExtraAlistamiento, setMostrarColumnasExtraAlistamiento] =
    useState<boolean>(false);
  const [torreFiltroGrafica, setTorreFiltroGrafica] = useState<string>('TODAS');

  const toggleAgrupacionFilter = (key: string) => {
    setSelectedStageFilter('TODAS');
    setSelectedAgrupaciones((prev) => {
      const exists = prev.includes(key);
      const next = exists ? prev.filter((k) => k !== key) : [...prev, key];
      if (next.length === 1) {
        onSelectAgrupacion(next[0]);
      } else {
        onSelectAgrupacion('TODAS');
      }
      return next;
    });
  };

  const resetToVistaGeneral = () => {
    setSelectedAgrupaciones([]);
    setSelectedStageFilter('TODAS');
    onSelectAgrupacion('TODAS');
  };

  // Agrupar cortes por Mes tomando la ÚLTIMA ventana cargada de cada mes como cierre oficial del mes
  const mesesDisponibles = useMemo(() => {
    const byMonth = new Map<
      string,
      { monthKey: string; label: string; corte: CorteProgramacion; sabadoIso: string }
    >();
    const sortedCortes = [...cortes].sort((a, b) => {
      if (a.fechaCorte !== b.fechaCorte) return a.fechaCorte.localeCompare(b.fechaCorte);
      return a.numeroCorte - b.numeroCorte;
    });

    for (const c of sortedCortes) {
      const sabIso = getSaturdayIso(c.fechaCorte);
      const m = sabIso.match(/^(\d{4})-(\d{2})/);
      if (!m) continue;
      const monthKey = `${m[1]}-${m[2]}`;
      const monthName = MESES_LARGOS[Math.max(0, Math.min(11, parseInt(m[2], 10) - 1))];
      byMonth.set(monthKey, {
        monthKey,
        label: `${monthName} ${m[1]} (Últ. ventana: ${c.etiqueta})`,
        corte: c,
        sabadoIso: sabIso,
      });
    }

    return Array.from(byMonth.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [cortes]);

  const activeMonthKey = useMemo(() => {
    const hit = mesesDisponibles.find((m) => m.corte.id === selectedCorteId);
    if (hit) return hit.monthKey;
    const corteSel = cortes.find((c) => c.id === selectedCorteId);
    if (corteSel) {
      const sab = getSaturdayIso(corteSel.fechaCorte);
      return sab.slice(0, 7);
    }
    return mesesDisponibles[mesesDisponibles.length - 1]?.monthKey || '';
  }, [mesesDisponibles, selectedCorteId, cortes]);

  const handleChangePeriodoModo = (mode: 'VENTANA' | 'MES') => {
    setPeriodoModo(mode);
    if (mode === 'MES' && mesesDisponibles.length > 0) {
      const target =
        mesesDisponibles.find((m) => m.monthKey === activeMonthKey) ||
        mesesDisponibles[mesesDisponibles.length - 1];
      if (target && target.corte.id !== selectedCorteId) {
        onSelectCorteId(target.corte.id);
      }
    }
  };

  // Mapa oficial Torre -> Etapa (desde resumen CPM de alistamiento y archivo de fechas de alistamiento)
  const torreToEtapaNumMap = useMemo(() => {
    const map = new Map<string, number>();
    if (alistamientoResumen) {
      for (const a of alistamientoResumen) {
        const tk = resolveTorreStandardKey(a.torre);
        const n = extractEtapaNum(a.etapa);
        if (tk && n) map.set(tk, n);
      }
    }
    if (fechasAlistamiento?.byTorre) {
      for (const [k, rec] of Object.entries(fechasAlistamiento.byTorre)) {
        const tk = resolveTorreStandardKey(k);
        const n = extractEtapaNum(rec.etapa);
        if (tk && n && !map.has(tk)) map.set(tk, n);
      }
    }
    return map;
  }, [alistamientoResumen, fechasAlistamiento]);

  // Lista completa de agrupaciones disponibles en el proyecto (para multi-selección)
  const agrupacionesDisponibles = useMemo(() => {
    const torresSet = new Set<string>();
    let hasGeneral = false;

    for (const h of rollup.hitosMacro) {
      if (!h.agrupacion) hasGeneral = true;
      else torresSet.add(h.agrupacion);
    }

    const activeCorte =
      cortes.find((c) => c.id === selectedCorteId) || cortes[cortes.length - 1];
    if (activeCorte) {
      for (const t of activeCorte.tasks) {
        if (t.agrupacion && t.agrupacion !== 'NO APLICA') {
          const norm = resolveTorreStandardKey(t.agrupacion);
          if (norm) torresSet.add(norm);
        } else {
          hasGeneral = true;
        }
      }
    }

    if (fechasAlistamiento?.byTorre) {
      Object.keys(fechasAlistamiento.byTorre).forEach((k) => {
        const norm = resolveTorreStandardKey(k);
        if (norm) torresSet.add(norm);
      });
    }

    const sortedTorres = Array.from(torresSet).sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );
    return {
      hasGeneral,
      torres: sortedTorres,
    };
  }, [rollup.hitosMacro, cortes, selectedCorteId, fechasAlistamiento]);

  // ============================================================================
  // 1. CONSTRUCCIÓN DE NODOS DEL DIAGRAMA DE HITOS DE VARIAS ETAPAS
  // - Vista General por Etapas (selectedAgrupaciones.length === 0):
  //   Muestra las Tareas Resumen SOLO del Punto de Control "Zonas comunes esenciales"
  //   asociadas a la Etapa de la Torre en la cual hacen parte de la ruta crítica del
  //   milestone "Alistamiento" + el milestone "Alistamiento" de cada Torre.
  // - Vista Desglosada (1 o más agrupaciones seleccionadas en multi-filtro):
  //   Muestra las Tareas Resumen con Puntos de Control asignados de las agrupaciones
  //   seleccionadas (ej. Urbanismo + TORRE 01).
  // ============================================================================
  const { allStageItems, stageChevrons, visibleStageItems, isDetailedAgrupacionView } =
    useMemo(() => {
      const isDetailed = selectedAgrupaciones.length > 0;
      const generalNodes: HitoMacroGroupNode[] = [];
      const torreBuckets = new Map<string, HitoMacroGroupNode[]>();

      for (const h of rollup.hitosMacro) {
        if (!h.agrupacion) {
          generalNodes.push(h);
        } else {
          if (!torreBuckets.has(h.agrupacion)) torreBuckets.set(h.agrupacion, []);
          torreBuckets.get(h.agrupacion)!.push(h);
        }
      }

      const rawItems: Array<StageMilestoneItem & { etapaOrder: number; sortFinMs: number }> = [];

      if (!isDetailed) {
        // 1) Tareas resumen SOLO del Punto de Control "Zonas comunes esenciales"
        // asociadas a la Etapa donde son parte de la ruta crítica del milestone "Alistamiento" de cada torre
        const zceNodes = generalNodes.filter(
          (g) => g.puntoControlNombre.toLowerCase() === 'zonas comunes esenciales'
        );
        const zceResumenes = zceNodes.flatMap((g) => g.resumenes);
        const hasCriticalByTorre = zceResumenes.some(
          (r) => (r.criticalForTorres?.length ?? 0) > 0
        );

        for (const r of zceResumenes) {
          const critTorres = r.criticalForTorres || [];
          if (hasCriticalByTorre && critTorres.length === 0) continue;
          if (!hasCriticalByTorre && !r.esCritica) continue;

          // Asociar a la Etapa más temprana entre las torres para las cuales es ruta crítica
          let etapaOrder: number | null = null;
          const sortedCritTorres = [...critTorres].sort((a, b) =>
            a.localeCompare(b, 'es', { numeric: true })
          );
          for (const tk of sortedCritTorres) {
            const ord =
              torreToEtapaNumMap.get(tk) ?? extractEtapaNum(tk) ?? null;
            if (ord !== null && (etapaOrder === null || ord < etapaOrder)) {
              etapaOrder = ord;
            }
          }
          if (etapaOrder === null) {
            etapaOrder = inferEtapaFromResumen(r, fechasAlistamiento, torreToEtapaNumMap).etapaOrder;
          }

          const etapaKey = `ETAPA_${etapaOrder}`;
          const etapaLabel = `ETAPA ${etapaOrder}`;
          const critLabel =
            sortedCritTorres.length > 0
              ? `Ruta crítica Alistamiento: ${sortedCritTorres.join(', ')}`
              : 'Zonas comunes esenciales';

          rawItems.push({
            id: `ZCE_CRIT::${r.id}`,
            edt: r.edt,
            nombre: r.nombre,
            subtitulo: critLabel,
            etapaKey,
            etapaLabel,
            puntoControlNombre: 'Zonas comunes esenciales',
            agrupacionOrigen: sortedCritTorres.join(', ') || 'Zonas comunes esenciales',
            esHitoAlistamientoTorre: false,
            comienPrev: r.comienPrev,
            finPrev: r.finPrev,
            comien: r.comien,
            fin: r.fin,
            varComien: r.varComien,
            varFin: r.varFin,
            avanceProgramadoPct: r.avanceProgramadoPct ?? 0,
            avanceRealPct: r.avancePct,
            esCritica: true,
            totalActividades: r.totalActividades,
            etapaOrder,
            sortFinMs: parseMs(r.fin || r.finPrev) ?? 0,
          });
        }

        // 2) Milestones de Alistamiento de cada Torre asociados a su Etapa
        const sortedTorres = Array.from(torreBuckets.keys()).sort((a, b) =>
          a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
        );
        for (const torre of sortedTorres) {
          const tNodes = torreBuckets.get(torre) || [];
          const alistNode = tNodes.find(
            (n) =>
              /alistamiento/i.test(n.puntoControlNombre) ||
              n.resumenes.some((r) => String(r.codigoCpc || '').trim() === '603510')
          );
          if (alistNode && alistNode.resumenes.length > 0) {
            const r = alistNode.resumenes[0];
            const etOrder =
              torreToEtapaNumMap.get(torre) ??
              inferEtapaFromResumen(r, fechasAlistamiento, torreToEtapaNumMap).etapaOrder;
            const etapaKey = `ETAPA_${etOrder}`;
            const etapaLabel = `ETAPA ${etOrder}`;

            rawItems.push({
              id: `ALIST_TORRE::${torre}`,
              edt: r.edt,
              nombre: `${r.nombre} (${torre})`,
              subtitulo: `Milestone Alistamiento · ${etapaLabel}`,
              etapaKey,
              etapaLabel,
              puntoControlNombre: 'Alistamiento y entrega',
              agrupacionOrigen: torre,
              esHitoAlistamientoTorre: true,
              comienPrev: r.comienPrev,
              finPrev: r.finPrev,
              comien: r.comien,
              fin: r.fin,
              varComien: r.varComien,
              varFin: r.varFin,
              avanceProgramadoPct: r.avanceProgramadoPct ?? 0,
              avanceRealPct: r.avancePct,
              esCritica: r.esCritica,
              totalActividades: r.totalActividades,
              etapaOrder: etOrder,
              sortFinMs: parseMs(r.fin || r.finPrev) ?? 0,
            });
          }
        }

        // Ordenar por Etapa y dentro de cada etapa cronológicamente por fecha fin proyectada (Alistamiento al cierre de su etapa)
        rawItems.sort((a, b) => {
          if (a.etapaOrder !== b.etapaOrder) return a.etapaOrder - b.etapaOrder;
          if (a.esHitoAlistamientoTorre !== b.esHitoAlistamientoTorre) {
            return a.esHitoAlistamientoTorre ? 1 : -1;
          }
          return a.sortFinMs - b.sortFinMs;
        });
      } else {
        // VISTA DETALLADA MULTI-SELECCIÓN (1 o más agrupaciones seleccionadas):
        // Coloca las Tareas Resumen con sus Puntos de Control asignados para cada agrupación seleccionada
        const pcOrderMap = new Map<string, number>();
        let nextPcOrd = 1;

        const addResumenNodeList = (nodes: HitoMacroGroupNode[], originLabel: string) => {
          for (const node of nodes) {
            const pcName = node.puntoControlNombre;
            if (!pcOrderMap.has(pcName)) {
              pcOrderMap.set(pcName, nextPcOrd++);
            }
            const pcOrd = pcOrderMap.get(pcName)!;
            for (const r of node.resumenes) {
              const isAlist =
                String(r.codigoCpc || '').trim() === '603510' ||
                /alistamiento/i.test(pcName) ||
                /alistamiento/i.test(r.nombre);

              rawItems.push({
                id: `DET_RES::${originLabel}::${r.id}`,
                edt: r.edt,
                nombre: selectedAgrupaciones.length > 1 ? `[${originLabel}] ${r.nombre}` : r.nombre,
                subtitulo: `${originLabel} · Punto de Control: ${pcName}`,
                etapaKey: `PC_${pcName}`,
                etapaLabel: pcName,
                puntoControlNombre: pcName,
                agrupacionOrigen: originLabel,
                esHitoAlistamientoTorre: isAlist,
                comienPrev: r.comienPrev,
                finPrev: r.finPrev,
                comien: r.comien,
                fin: r.fin,
                varComien: r.varComien,
                varFin: r.varFin,
                avanceProgramadoPct: r.avanceProgramadoPct ?? 0,
                avanceRealPct: r.avancePct,
                esCritica: r.esCritica,
                totalActividades: r.totalActividades,
                etapaOrder: pcOrd,
                sortFinMs: parseMs(r.fin || r.finPrev) ?? 0,
              });
            }
          }
        };

        if (selectedAgrupaciones.includes('URBANISMO_GENERAL')) {
          addResumenNodeList(generalNodes, 'Urbanismo / Zonas Comunes');
        }
        for (const sel of selectedAgrupaciones) {
          if (sel === 'URBANISMO_GENERAL') continue;
          const nodes = torreBuckets.get(sel) || [];
          addResumenNodeList(nodes, sel);
        }

        // Ordenar cronológicamente para permitir línea de corte exacta y lectura progresiva en pantalla
        rawItems.sort((a, b) => {
          if (a.sortFinMs !== b.sortFinMs) return a.sortFinMs - b.sortFinMs;
          return a.etapaOrder - b.etapaOrder;
        });
      }

      // Construir bloques Chevron inferiores por Etapa o Punto de Control
      const chevronsMap = new Map<
        string,
        { key: string; label: string; count: number; order: number }
      >();
      rawItems.forEach((it) => {
        const existing = chevronsMap.get(it.etapaKey);
        if (!existing) {
          chevronsMap.set(it.etapaKey, {
            key: it.etapaKey,
            label: it.etapaLabel,
            count: 1,
            order: it.etapaOrder,
          });
        } else {
          existing.count++;
        }
      });

      const chevrons: StageChevronGroup[] = Array.from(chevronsMap.values())
        .sort((a, b) => a.order - b.order)
        .map((c, i) => ({
          key: c.key,
          label: c.label,
          sublabel: `${c.count} hito(s)`,
          count: c.count,
          colorCls: CHEVRON_STAGE_PALETTE[i % CHEVRON_STAGE_PALETTE.length],
        }));

      const filtered =
        selectedStageFilter === 'TODAS' ||
        !chevrons.some((c) => c.key === selectedStageFilter)
          ? rawItems
          : rawItems.filter((it) => it.etapaKey === selectedStageFilter);

      return {
        allStageItems: rawItems,
        stageChevrons: chevrons,
        visibleStageItems: filtered,
        isDetailedAgrupacionView: isDetailed,
      };
    }, [
      rollup.hitosMacro,
      selectedAgrupaciones,
      fechasAlistamiento,
      selectedStageFilter,
      torreToEtapaNumMap,
    ]);

  // ============================================================================
  // 2. MATRIZ DE SEGUIMIENTO DE FECHAS DE ALISTAMIENTO (FORMATO CLARO APP)
  // ============================================================================
  const { alistamientoRows, alistamientoSummary, activeCorteObj } = useMemo(() => {
    const sortedCortes = [...cortes].sort((a, b) => {
      if (a.fechaCorte !== b.fechaCorte) return a.fechaCorte.localeCompare(b.fechaCorte);
      return a.numeroCorte - b.numeroCorte;
    });

    const activeIdx = Math.max(
      0,
      sortedCortes.findIndex((c) => c.id === selectedCorteId)
    );
    const currentCorte = sortedCortes[activeIdx] || sortedCortes[sortedCortes.length - 1];
    const prevWeekCorte = activeIdx > 0 ? sortedCortes[activeIdx - 1] : null;

    const currentMonthKey = currentCorte
      ? getSaturdayIso(currentCorte.fechaCorte).slice(0, 7)
      : '';
    let prevMonthCorte: CorteProgramacion | null = null;
    for (let i = activeIdx - 1; i >= 0; i--) {
      const mk = getSaturdayIso(sortedCortes[i].fechaCorte).slice(0, 7);
      if (mk && mk < currentMonthKey) {
        prevMonthCorte = sortedCortes[i];
        break;
      }
    }

    const currentMap = currentCorte
      ? findAlistamientoTasksByTorre(currentCorte.tasks)
      : new Map();
    const prevWeekMap = prevWeekCorte
      ? findAlistamientoTasksByTorre(prevWeekCorte.tasks)
      : new Map();
    const prevMonthMap = prevMonthCorte
      ? findAlistamientoTasksByTorre(prevMonthCorte.tasks)
      : new Map();

    const allTorreKeys = new Set<string>();
    currentMap.forEach((_, k) => allTorreKeys.add(k));
    if (fechasAlistamiento?.byTorre) {
      Object.keys(fechasAlistamiento.byTorre).forEach((k) => {
        const norm = resolveTorreStandardKey(k);
        if (norm) allTorreKeys.add(norm);
      });
    }

    const sortedTorres = Array.from(allTorreKeys).sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );

    const rows: AlistamientoMatrixRow[] = [];
    let cumplidasCount = 0;
    let enRiesgoCount = 0;
    let aTiempoCount = 0;
    let leveCount = 0;
    let medioCount = 0;
    let altoCount = 0;
    let conCambioConfirmadaCount = 0;

    for (const torreKey of sortedTorres) {
      const wpCurr = currentMap.get(torreKey);
      const wpPrevWeek = prevWeekMap.get(torreKey);
      const wpPrevMonth = prevMonthMap.get(torreKey);
      const fileRec = lookupFechaAlistamientoRecord(fechasAlistamiento?.byTorre, torreKey);

      const numMatch = torreKey.match(/\d+/);
      const numNum = numMatch ? parseInt(numMatch[0], 10) : 1;
      const codigoCorto = `T${numNum}`;
      const nombreHito = wpCurr?.task.nombre || `Alistamiento ${codigoCorto}`;
      const etapa = fileRec?.etapa || wpCurr?.task.etapa || `ETAPA 0${numNum}`;

      const inicioPrevisto =
        wpCurr?.finPrev || fileRec?.alistamientoPrevisto || '';
      const confirmadoGerente =
        fileRec?.alistamientoConfirmadoGerente || inicioPrevisto;
      const tieneConfirmadoGerente = Boolean(
        fileRec?.alistamientoConfirmadoGerente || inicioPrevisto
      );
      const proyectadoWp =
        wpCurr?.finProy || fileRec?.alistamientoProyectadoWp || confirmadoGerente;
      const alistadoPct = wpCurr?.avancePct ?? 0;

      const difVsPrevisto = diffDaysNullable(proyectadoWp, inicioPrevisto);
      const difVsSemanaAnt =
        wpCurr && wpPrevWeek ? diffDaysNullable(wpCurr.finProy, wpPrevWeek.finProy) : null;
      const difVsGerente = tieneConfirmadoGerente
        ? diffDaysNullable(proyectadoWp, confirmadoGerente)
        : null;

      let tendenciaVsMesAnt: number | null = null;
      if (difVsGerente !== null && wpPrevMonth && tieneConfirmadoGerente) {
        const prevMonthBrecha = diffDaysNullable(wpPrevMonth.finProy, confirmadoGerente);
        if (prevMonthBrecha !== null) {
          tendenciaVsMesAnt = difVsGerente - prevMonthBrecha;
        }
      }

      const cambioConfirmadoVsPrevisto =
        Boolean(fileRec?.alistamientoConfirmadoGerente && inicioPrevisto) &&
        diffDaysIso(fileRec!.alistamientoConfirmadoGerente, inicioPrevisto) !== 0;
      if (cambioConfirmadoVsPrevisto) conCambioConfirmadaCount++;

      const diasParaAlistamiento = tieneConfirmadoGerente
        ? diffDaysNullable(confirmadoGerente, fechaCorteSemana)
        : null;

      let estadoLabel: AlistamientoMatrixRow['estadoLabel'] = 'Sin confirmar';
      let estadoTone: AlistamientoMatrixRow['estadoTone'] = 'slate';
      let subioNivelPor90Dias = false;

      if (alistadoPct >= 100) {
        cumplidasCount++;
        const d = difVsGerente ?? 0;
        if (d <= 0) {
          estadoLabel = 'Cumplido';
          estadoTone = 'emerald';
        } else if (d <= 15) {
          estadoLabel = 'Cumplido parcial';
          estadoTone = 'amber';
        } else {
          estadoLabel = 'Cumplido tarde';
          estadoTone = 'red';
        }
      } else if (!tieneConfirmadoGerente || difVsGerente === null) {
        estadoLabel = 'Sin confirmar';
        estadoTone = 'slate';
      } else if (diasParaAlistamiento !== null && diasParaAlistamiento < 0) {
        estadoLabel = 'Vencido';
        estadoTone = 'rose';
        enRiesgoCount++;
        altoCount++;
      } else if (difVsGerente <= 0) {
        estadoLabel = 'A tiempo';
        estadoTone = 'emerald';
        aTiempoCount++;
      } else if (difVsGerente <= 15) {
        if (diasParaAlistamiento !== null && diasParaAlistamiento < 90) {
          estadoLabel = 'Riesgo medio';
          estadoTone = 'orange';
          subioNivelPor90Dias = true;
          medioCount++;
        } else {
          estadoLabel = 'Riesgo leve';
          estadoTone = 'amber';
          leveCount++;
        }
        enRiesgoCount++;
      } else if (difVsGerente <= 30) {
        if (diasParaAlistamiento !== null && diasParaAlistamiento < 90) {
          estadoLabel = 'Riesgo alto';
          estadoTone = 'red';
          subioNivelPor90Dias = true;
          altoCount++;
        } else {
          estadoLabel = 'Riesgo medio';
          estadoTone = 'orange';
          medioCount++;
        }
        enRiesgoCount++;
      } else {
        estadoLabel = 'Riesgo alto';
        estadoTone = 'red';
        enRiesgoCount++;
        altoCount++;
      }

      rows.push({
        torre: torreKey,
        codigoCorto,
        nombreHito,
        etapa,
        inicioPrevisto,
        confirmadoGerente,
        tieneConfirmadoGerente,
        cambioConfirmadoVsPrevisto,
        proyectadoWp,
        alistadoPct,
        difVsPrevisto,
        difVsSemanaAnt,
        difVsGerente,
        tendenciaVsMesAnt,
        estadoLabel,
        estadoTone,
        diasParaAlistamiento,
        subioNivelPor90Dias,
        gerente: fileRec?.gerente,
        aprueba: fileRec?.aprueba,
        fechaConfirmacion: fileRec?.fechaConfirmacion,
        ingresoRph: fileRec?.ingresoRph,
        salidaRph: fileRec?.salidaRph,
        banderaRph: fileRec?.banderaRph,
        alistamientoTramite: fileRec?.alistamientoTramite,
      });
    }

    return {
      activeCorteObj: currentCorte,
      alistamientoRows: rows,
      alistamientoSummary: {
        total: rows.length,
        cumplidasCount,
        enRiesgoCount,
        aTiempoCount,
        leveCount,
        medioCount,
        altoCount,
        conCambioConfirmadaCount,
      },
    };
  }, [cortes, selectedCorteId, fechasAlistamiento, fechaCorteSemana]);

  // ============================================================================
  // 3. SERIE HISTÓRICA POR SÁBANA CARGADA: VARIACIÓN FIN PROY VS FIN LÍNEA BASE
  // ============================================================================
  const { chartDataBySabana, torresListForChart } = useMemo(() => {
    const sourceCortes =
      periodoModo === 'MES' && mesesDisponibles.length > 0
        ? mesesDisponibles.map((m) => m.corte)
        : [...cortes].sort((a, b) => {
            if (a.fechaCorte !== b.fechaCorte) return a.fechaCorte.localeCompare(b.fechaCorte);
            return a.numeroCorte - b.numeroCorte;
          });

    const allTorresSet = new Set<string>();
    const perCorteData = sourceCortes.map((c) => {
      const tMap = findAlistamientoTasksByTorre(c.tasks);
      const sabIso = getSaturdayIso(c.fechaCorte);
      const entry: Record<string, string | number> = {
        corteId: c.id,
        tiempoLabel: `${c.etiqueta} (${formatShortDateEs(sabIso)})`,
        archivo: c.fileName,
      };
      tMap.forEach((val, torreKey) => {
        allTorresSet.add(torreKey);
        entry[torreKey] = diffDaysIso(val.finProy, val.finPrev);
      });
      return entry;
    });

    const sortedTorres = Array.from(allTorresSet).sort((a, b) =>
      a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' })
    );

    return { chartDataBySabana: perCorteData, torresListForChart: sortedTorres };
  }, [cortes, periodoModo, mesesDisponibles]);

  const corteMs = useMemo(() => parseMs(fechaCorteSemana) ?? 1795194000000, [fechaCorteSemana]);

  // ============================================================================
  // 4. RENDERIZADOR DEL DIAGRAMA DE HITOS DE VARIAS ETAPAS (100% EN ANCHO PANTALLA)
  // - Divide en bandas equilibradas (máx 10 hitos por banda) para cero recorte lateral
  // - Cada banda tiene eje horizontal central + tarjetas alternadas arriba / abajo (4 carriles)
  // - Línea vertical punteada de Fecha de Corte en su posición cronológica exacta
  // ============================================================================
  const renderMultiStageMilestoneDiagram = () => {
    const total = visibleStageItems.length;
    if (total === 0) {
      return (
        <div className="p-8 text-center text-xs text-slate-500">
          No hay hitos disponibles para el filtro seleccionado.
        </div>
      );
    }

    const bands = chunkIntoBalancedBands(visibleStageItems, MAX_MILESTONES_PER_BAND);
    let globalCounter = 0;

    return (
      <div className="p-4 space-y-4">
        {bands.map((bandItems, bandIdx) => {
          const bandCount = bandItems.length;
          const startNum = globalCounter + 1;
          const endNum = globalCounter + bandCount;
          const startOffset = globalCounter;
          globalCounter += bandCount;

          const getSlotPosition = (localIdx: number) => {
            const xPct =
              bandCount === 1 ? 50 : 6.5 + (localIdx / (bandCount - 1)) * 87;
            const lane = localIdx % 4;
            const isTop = lane === 0 || lane === 2;
            const isOuterTier = lane === 2 || lane === 3;
            const stemHeightPx = isOuterTier ? 120 : 18;
            return { xPct, isTop, isOuterTier, stemHeightPx };
          };

          // Calcular posición de la línea vertical punteada de Fecha de Corte dentro de esta banda
          const bandFinTimes = bandItems.map(
            (it) => parseMs(it.fin || it.finPrev) ?? corteMs
          );
          const minBandFin = Math.min(...bandFinTimes);
          const maxBandFin = Math.max(...bandFinTimes);
          let corteXPct: number | null = null;

          if (bandIdx === 0 && corteMs <= minBandFin) {
            corteXPct = 2.5;
          } else if (corteMs >= minBandFin && corteMs <= maxBandFin) {
            for (let i = 0; i < bandCount - 1; i++) {
              const tA = bandFinTimes[i];
              const tB = bandFinTimes[i + 1];
              if (corteMs >= tA && corteMs <= tB) {
                const xA = getSlotPosition(i).xPct;
                const xB = getSlotPosition(i + 1).xPct;
                const ratio = tB > tA ? (corteMs - tA) / (tB - tA) : 0.5;
                corteXPct = xA + ratio * (xB - xA);
                break;
              }
            }
            if (corteXPct === null) {
              corteXPct = getSlotPosition(0).xPct;
            }
          } else if (bandIdx === bands.length - 1 && corteMs > maxBandFin) {
            corteXPct = 97.5;
          }

          return (
            <div key={`band-${bandIdx}`} className="space-y-1.5">
              {bands.length > 1 && (
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                  <span>
                    Bloque {bandIdx + 1} de {bands.length} · Hitos {startNum} al {endNum}
                  </span>
                  <span>
                    {formatShortDateEs(bandItems[0].fin)} →{' '}
                    {formatShortDateEs(bandItems[bandCount - 1].fin)}
                  </span>
                </div>
              )}

              {/* Contenedor ajustado estrictamente al 100% del ancho disponible (sin cortes) */}
              <div className="relative w-full h-[476px] bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 border border-slate-200 rounded-xl select-none overflow-hidden">
                {/* Guías verticales sutiles */}
                {bandItems.map((it, localIdx) => {
                  const { xPct } = getSlotPosition(localIdx);
                  return (
                    <div
                      key={`guide-${it.id}`}
                      style={{ left: `${xPct}%` }}
                      className="absolute top-0 bottom-0 border-l border-dashed border-slate-100 pointer-events-none"
                    />
                  );
                })}

                {/* Línea vertical punteada con la Fecha de Corte de la ventana seleccionada */}
                {corteXPct !== null && (
                  <div
                    style={{ left: `${corteXPct}%` }}
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-amber-500 z-40 pointer-events-none"
                  >
                    <span
                      style={{
                        transform:
                          corteXPct > 82
                            ? 'translateX(-100%)'
                            : corteXPct > 15
                              ? 'translateX(-50%)'
                              : 'translateX(4px)',
                      }}
                      className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-black text-[9.5px] whitespace-nowrap shadow-xs"
                    >
                      Corte: {formatShortDateEs(fechaCorteSemana)}
                    </span>
                  </div>
                )}

                {/* EJE CENTRAL HORIZONTAL (FLECHA MULTICOLOR DE ETAPAS) */}
                <div className="absolute left-3 right-6 top-1/2 -translate-y-1/2 h-3.5 rounded-l-full bg-gradient-to-r from-emerald-500 via-teal-500 to-slate-700 shadow-xs z-10" />
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-slate-700 z-10"
                  aria-hidden="true"
                />

                {/* NODOS + TALLOS + TARJETAS ALTERNADAS */}
                {bandItems.map((item, localIdx) => {
                  const globalNum = startOffset + localIdx + 1;
                  const { xPct, isTop, stemHeightPx } = getSlotPosition(localIdx);
                  const isHovered = hoveredItemId === item.id;
                  const isDimmed = hoveredItemId !== null && !isHovered;

                  const statusTone =
                    item.varFin > 30
                      ? {
                          nodeBg: 'bg-red-600 ring-red-200 text-white',
                          cardBorder: 'border-red-300',
                          headerBg: item.esHitoAlistamientoTorre
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-900 border-b border-red-200',
                          stemBorder: 'border-red-400',
                          varBadge: 'bg-red-50 text-red-700 border-red-200',
                        }
                      : item.varFin > 0
                        ? {
                            nodeBg: 'bg-amber-500 ring-amber-200 text-white',
                            cardBorder: 'border-amber-300',
                            headerBg: item.esHitoAlistamientoTorre
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-50 text-amber-950 border-b border-amber-200',
                            stemBorder: 'border-amber-400',
                            varBadge: 'bg-amber-50 text-amber-800 border-amber-200',
                          }
                        : {
                            nodeBg: 'bg-emerald-600 ring-emerald-200 text-white',
                            cardBorder: 'border-emerald-300',
                            headerBg: item.esHitoAlistamientoTorre
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-950 border-b border-emerald-200',
                            stemBorder: 'border-emerald-400',
                            varBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          };

                  return (
                    <React.Fragment key={item.id}>
                      {/* Tallo vertical punteado desde el eje central hasta la tarjeta */}
                      <div
                        style={{
                          left: `${xPct}%`,
                          height: `${stemHeightPx}px`,
                          ...(isTop
                            ? { bottom: 'calc(50% + 12px)' }
                            : { top: 'calc(50% + 12px)' }),
                        }}
                        className={`absolute -translate-x-1/2 border-l-2 border-dotted pointer-events-none transition-all ${
                          statusTone.stemBorder
                        } ${isHovered ? 'z-40 border-solid' : isDimmed ? 'opacity-35 z-10' : 'z-20'}`}
                      />

                      {/* Círculo numerado sobre el eje central */}
                      <div
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        style={{ left: `${xPct}%` }}
                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                          isHovered ? 'z-50 scale-125' : isDimmed ? 'z-20 opacity-45' : 'z-30'
                        }`}
                        title={`${item.nombre} · Fin Proyectado: ${formatShortDateEs(item.fin)}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ring-4 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black ${statusTone.nodeBg}`}
                        >
                          {globalNum}
                        </div>
                      </div>

                      {/* Etiqueta rápida de Fin Proyectado opuesta al tallo */}
                      <div
                        style={{
                          left: `${xPct}%`,
                          transform: `translateX(-${xPct}%)`,
                          ...(isTop
                            ? { top: 'calc(50% + 14px)' }
                            : { bottom: 'calc(50% + 14px)' }),
                        }}
                        className={`absolute px-1.5 py-0.2 rounded bg-white/90 text-[9px] font-extrabold text-slate-600 whitespace-nowrap pointer-events-none tabular-nums ${
                          isDimmed ? 'opacity-35' : 'z-20'
                        }`}
                      >
                        {formatShortDateEs(item.fin)}
                      </div>

                      {/* TARJETA DEL HITO (Anclada proporcionalmente con translateX(-xPct%) para cero recorte lateral) */}
                      <div
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        style={{
                          left: `${xPct}%`,
                          transform: `translateX(-${xPct}%)`,
                          ...(isTop
                            ? { bottom: `calc(50% + ${stemHeightPx + 12}px)` }
                            : { top: `calc(50% + ${stemHeightPx + 12}px)` }),
                        }}
                        className={`absolute w-[214px] rounded-xl border bg-white shadow-xs overflow-hidden transition-all cursor-pointer ${
                          isHovered
                            ? 'z-50 w-[244px] border-indigo-600 ring-2 ring-indigo-200 shadow-xl'
                            : isDimmed
                              ? 'z-10 border-slate-200 opacity-40'
                              : `z-30 ${statusTone.cardBorder} hover:border-indigo-400 hover:shadow-md`
                        }`}
                      >
                        {/* Encabezado con nombre + etapa / crítico */}
                        <div
                          className={`px-2.5 py-1 flex items-center justify-between gap-1 ${statusTone.headerBg}`}
                        >
                          <span
                            className="text-[10px] font-extrabold truncate"
                            title={`${item.nombre} (${item.subtitulo})`}
                          >
                            {item.nombre}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`px-1 py-0.1 rounded text-[8px] font-black uppercase ${
                                item.esHitoAlistamientoTorre
                                  ? 'bg-white/25 text-white'
                                  : 'bg-slate-900/10 text-current'
                              }`}
                            >
                              {item.esHitoAlistamientoTorre ? 'Hito' : item.etapaLabel}
                            </span>
                            {item.esCritica && (
                              <span title="Ruta Crítica">
                                <Flame
                                  className={`w-3 h-3 ${
                                    item.esHitoAlistamientoTorre ? 'text-white' : 'text-red-600'
                                  }`}
                                />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cuerpo con etiquetas completas solicitadas */}
                        <div className="px-2.5 py-1.5 space-y-0.5 text-[9.5px] tabular-nums bg-white">
                          <div className="flex items-center justify-between gap-1 text-slate-700">
                            <span className="text-slate-500 font-semibold">Inicio Proyectado:</span>
                            <strong className="text-slate-800">
                              {formatShortDateEs(item.comien)}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-slate-700">
                            <span className="text-slate-500 font-semibold">Fin Proyectado:</span>
                            <strong className="text-slate-900">
                              {formatShortDateEs(item.fin)}
                            </strong>
                          </div>

                          <div className="pt-0.5">
                            <span
                              className={`inline-flex w-full items-center justify-between px-1.5 py-0.2 rounded border text-[9px] font-extrabold ${statusTone.varBadge}`}
                              title={`Línea Base: ${formatShortDateEs(item.comienPrev)} → ${formatShortDateEs(item.finPrev)}`}
                            >
                              <span>Δ Inicio: {formatSignedDays(item.varComien)}</span>
                              <span>Δ Fin: {formatSignedDays(item.varFin)}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-0.5 border-t border-slate-100 text-[9px]">
                            <span className="font-bold text-blue-700">
                              Programado: {item.avanceProgramadoPct.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              Real: {item.avanceRealPct.toFixed(1).replace('.', ',')}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* BARRA INFERIOR DE ETAPAS / PUNTOS DE CONTROL */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stageChevrons.map((stg, idx) => {
            const isSelected = selectedStageFilter === stg.key;
            return (
              <button
                key={stg.key}
                type="button"
                onClick={() =>
                  setSelectedStageFilter((prev) => (prev === stg.key ? 'TODAS' : stg.key))
                }
                className={`relative px-3.5 py-2 rounded-xl border bg-gradient-to-r ${stg.colorCls} shadow-xs flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-offset-1 ring-slate-900 scale-[1.01]'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="text-left min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                    {isDetailedAgrupacionView ? `Punto de Control ${idx + 1}` : `Fase ${idx + 1}`}
                  </div>
                  <div className="text-xs font-black truncate" title={stg.label}>
                    {stg.label}
                  </div>
                </div>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black shrink-0">
                  {stg.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Barra de Control Superior: Periodo (Ventana / Mes) + Multi-filtro de Agrupación */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
              <Milestone className="w-4 h-4 text-indigo-600" />
              <span>Hitos Proyecto · Diagrama de Hitos por Etapas</span>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleChangePeriodoModo('VENTANA')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  periodoModo === 'VENTANA'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Ventana (Semanal)
              </button>
              <button
                type="button"
                onClick={() => handleChangePeriodoModo('MES')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  periodoModo === 'MES'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Mes (Última ventana)
              </button>
            </div>

            {periodoModo === 'VENTANA' ? (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                <select
                  value={selectedCorteId}
                  onChange={(e) => onSelectCorteId(e.target.value)}
                  className="bg-transparent font-extrabold text-indigo-950 focus:outline-none cursor-pointer"
                >
                  {cortes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <select
                  value={activeMonthKey}
                  onChange={(e) => {
                    const hit = mesesDisponibles.find((m) => m.monthKey === e.target.value);
                    if (hit) onSelectCorteId(hit.corte.id);
                  }}
                  className="bg-transparent font-extrabold text-emerald-950 focus:outline-none cursor-pointer"
                >
                  {mesesDisponibles.map((m) => (
                    <option key={m.monthKey} value={m.monthKey}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            Fecha de corte ventana: <strong>{formatShortDateEs(fechaCorteSemana)}</strong>
          </span>
        </div>

        {/* Filtro Multi-Selección de Agrupaciones (ej. Urbanismo + TORRE 01) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nivel de desglose (Selección múltiple):</span>
          </span>
          <button
            type="button"
            onClick={resetToVistaGeneral}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
              selectedAgrupaciones.length === 0
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {selectedAgrupaciones.length === 0 && <Check className="w-3 h-3" />}
            <span>Vista General por Etapas</span>
          </button>
          {agrupacionesDisponibles.hasGeneral && (
            <button
              type="button"
              onClick={() => toggleAgrupacionFilter('URBANISMO_GENERAL')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                selectedAgrupaciones.includes('URBANISMO_GENERAL')
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
              }`}
            >
              {selectedAgrupaciones.includes('URBANISMO_GENERAL') && (
                <Check className="w-3 h-3" />
              )}
              <span>Urbanismo y Zonas Comunes</span>
            </button>
          )}
          {agrupacionesDisponibles.torres.map((torre) => {
            const active = selectedAgrupaciones.includes(torre);
            return (
              <button
                key={torre}
                type="button"
                onClick={() => toggleAgrupacionFilter(torre)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                }`}
              >
                {active && <Check className="w-3 h-3" />}
                <span>{torre}</span>
              </button>
            );
          })}
          {selectedAgrupaciones.length > 1 && (
            <span className="ml-1 text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {selectedAgrupaciones.length} agrupaciones combinadas
            </span>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TARJETA PRINCIPAL: DIAGRAMA DE HITOS DE VARIAS ETAPAS                 */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isDetailedAgrupacionView ? (
                <Building2 className="w-4 h-4 text-indigo-600" />
              ) : (
                <Layers className="w-4 h-4 text-emerald-600" />
              )}
              <h3 className="text-sm font-black text-slate-900">
                {isDetailedAgrupacionView
                  ? `Diagrama de Hitos Desglosado · ${selectedAgrupaciones
                      .map((k) => (k === 'URBANISMO_GENERAL' ? 'Urbanismo y Zonas Comunes' : k))
                      .join(' + ')}`
                  : 'Vista General por Etapas · Zonas Comunes Esenciales (Ruta Crítica) & Alistamiento Torres'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10.5px] font-extrabold">
                {visibleStageItems.length} de {allStageItems.length} hitos visibles
              </span>
              {selectedStageFilter !== 'TODAS' && (
                <button
                  type="button"
                  onClick={() => setSelectedStageFilter('TODAS')}
                  className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold cursor-pointer"
                >
                  Ver todas las etapas / puntos
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isDetailedAgrupacionView
                ? 'Mostrando todas las Tareas Resumen con su Punto de Control asignado para las agrupaciones seleccionadas.'
                : 'Tareas resumen de Zonas comunes esenciales asociadas a la etapa en la cual son parte de la ruta crítica del milestone Alistamiento de cada torre, junto con los milestones de Alistamiento por torre.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              En fecha / Adelanto (Δ Fin ≤ 0d)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Desfase 1–30 d
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              Atraso &gt; 30 d
            </span>
          </div>
        </div>

        {renderMultiStageMilestoneDiagram()}
      </div>

      {/* ==================================================================== */}
      {/* MATRIZ DE SEGUIMIENTO DE FECHAS DE ALISTAMIENTO (FORMATO CLARO APP)  */}
      {/* ==================================================================== */}
      {alistamientoRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Table2 className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold tracking-tight uppercase text-slate-900">
                  Seguimiento frente a la fecha confirmada por el gerente
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                {activeCorteObj && (
                  <span>
                    Programación (Workplanner):{' '}
                    <strong className="text-slate-800">{activeCorteObj.fileName}</strong> · Corte{' '}
                    {formatShortDateEs(fechaCorteSemana)}
                  </span>
                )}
                <span>·</span>
                <span>
                  Archivo Fechas de Alistamiento:{' '}
                  <strong className="text-indigo-700">
                    {fechasAlistamiento
                      ? `${fechasAlistamiento.fileName} (cargado ${fechasAlistamiento.fechaCarga.slice(0, 10)})`
                      : 'Línea Base Workplanner (sin archivo de Gerencia cargado)'}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarColumnasExtraAlistamiento((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {mostrarColumnasExtraAlistamiento
                  ? 'Ocultar columnas RPH / Trámite'
                  : 'Ver todas las columnas del archivo (RPH / Trámite / Gerente)'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs tabular-nums">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900">
                {alistamientoSummary.cumplidasCount} / {alistamientoSummary.total}
              </span>
              <div className="text-[11px] leading-tight">
                <span className="font-extrabold text-slate-800 block">cumplidas</span>
                <span className="text-slate-500">al 100 % de avance</span>
              </div>
            </div>

            <div className="bg-red-50/50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span
                className={`text-2xl font-black ${
                  alistamientoSummary.enRiesgoCount > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {alistamientoSummary.enRiesgoCount} / {alistamientoSummary.total}
              </span>
              <div className="text-[11px] leading-tight">
                <span className="font-extrabold text-slate-800 block">en riesgo</span>
                <span className="text-slate-600">
                  {alistamientoSummary.aTiempoCount} a tiempo · {alistamientoSummary.leveCount} leve ·{' '}
                  {alistamientoSummary.medioCount} medio · {alistamientoSummary.altoCount} alto
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl font-black text-indigo-900">
                {alistamientoSummary.conCambioConfirmadaCount}
              </span>
              <div className="text-[11px] leading-tight">
                <span className="font-extrabold text-slate-800 block">torres con cambio</span>
                <span className="text-slate-500">de fecha confirmada (C) vs. previsto</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse tabular-nums">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">Torre</th>
                  <th className="py-2.5 px-3">Inicio Previsto</th>
                  <th className="py-2.5 px-3">Confirmado Gerente (C)</th>
                  <th className="py-2.5 px-3">Proyectado Programación (WP)</th>
                  <th className="py-2.5 px-2.5 text-right">Alistado</th>
                  <th className="py-2.5 px-3 text-right">
                    Dif. vs Previsto
                    <span className="block text-[9px] font-normal text-slate-400">días cal.</span>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    Dif. vs Semana Ant.
                    <span className="block text-[9px] font-normal text-slate-400">días cal.</span>
                  </th>
                  <th className="py-2.5 px-3 text-right bg-indigo-50/70 border-x border-indigo-200 text-indigo-950">
                    Dif. vs Gerente (C)
                    <span className="block text-[9px] font-bold text-indigo-600">
                      ► define el estado
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-center">Tendencia vs Mes Ant.</th>
                  <th className="py-2.5 px-3 text-center">
                    Estado
                    <span className="block text-[9px] font-normal text-slate-400">
                      vs confirmado gerente (C)
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">Días para Alistamiento</th>
                  {mostrarColumnasExtraAlistamiento && (
                    <>
                      <th className="py-2.5 px-2.5">Etapa</th>
                      <th className="py-2.5 px-2.5">Gerente / Aprueba</th>
                      <th className="py-2.5 px-2.5">Fecha Confirm.</th>
                      <th className="py-2.5 px-2.5">Ingreso / Salida RPH</th>
                      <th className="py-2.5 px-2.5">Bandera RPH</th>
                      <th className="py-2.5 px-2.5">Alistamiento Trámite</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {alistamientoRows.map((row) => {
                  const toneBadge =
                    row.estadoTone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : row.estadoTone === 'amber'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : row.estadoTone === 'orange'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : row.estadoTone === 'red' || row.estadoTone === 'rose'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300';

                  return (
                    <tr key={row.torre} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-black text-slate-900 mr-1.5">{row.codigoCorto}</span>
                        <span className="text-indigo-700 font-bold">{row.nombreHito}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {formatShortDateEs(row.inicioPrevisto)}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                        {formatShortDateEs(row.confirmadoGerente)}
                        {row.cambioConfirmadoVsPrevisto && (
                          <span
                            className="ml-1.5 text-[10px] text-amber-600 font-bold"
                            title={`Cambió frente al previsto original (${formatShortDateEs(row.inicioPrevisto)})`}
                          >
                            ↻
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold whitespace-nowrap">
                        {formatShortDateEs(row.proyectadoWp)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-slate-700">
                        {row.alistadoPct.toFixed(0)}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-extrabold ${
                          row.difVsPrevisto === null
                            ? 'text-slate-400'
                            : row.difVsPrevisto > 0
                              ? 'text-red-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {row.difVsPrevisto === null
                          ? '—'
                          : row.difVsPrevisto > 0
                            ? `+${row.difVsPrevisto}`
                            : `${row.difVsPrevisto}`}
                      </td>
                      <td
                        className="py-2.5 px-3 text-right text-slate-500"
                        title={
                          row.difVsSemanaAnt === null
                            ? 'Aún no hay carga de la semana anterior'
                            : `Variación vs corte anterior: ${row.difVsSemanaAnt} días`
                        }
                      >
                        {row.difVsSemanaAnt === null
                          ? '—'
                          : row.difVsSemanaAnt > 0
                            ? `+${row.difVsSemanaAnt}`
                            : `${row.difVsSemanaAnt}`}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-black bg-indigo-50/40 border-x border-indigo-100 ${
                          row.difVsGerente === null
                            ? 'text-slate-400'
                            : row.difVsGerente > 0
                              ? 'text-red-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {row.difVsGerente === null
                          ? '—'
                          : row.difVsGerente > 0
                            ? `+${row.difVsGerente}`
                            : `${row.difVsGerente}`}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {row.tendenciaVsMesAnt === null
                          ? '—'
                          : row.tendenciaVsMesAnt > 0
                            ? `+${row.tendenciaVsMesAnt} d`
                            : `${row.tendenciaVsMesAnt} d`}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-extrabold ${toneBadge}`}
                        >
                          <span>{row.estadoLabel}</span>
                          {row.subioNivelPor90Dias && (
                            <span title="Subió un nivel porque faltan menos de 90 días">▲</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 whitespace-nowrap">
                        {row.diasParaAlistamiento === null ? (
                          '—'
                        ) : row.diasParaAlistamiento >= 0 ? (
                          <>
                            <span className="text-slate-400">faltan </span>
                            <strong className="text-slate-900">{row.diasParaAlistamiento}</strong>
                          </>
                        ) : (
                          <span className="text-red-600 font-bold">
                            vencido {Math.abs(row.diasParaAlistamiento)} d
                          </span>
                        )}
                      </td>
                      {mostrarColumnasExtraAlistamiento && (
                        <>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {row.etapa || '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {row.gerente || '—'}
                            {row.aprueba ? ` / ${row.aprueba}` : ''}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {formatShortDateEs(row.fechaConfirmacion)}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {formatShortDateEs(row.ingresoRph)} → {formatShortDateEs(row.salidaRph)}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {row.banderaRph || '—'}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                            {formatShortDateEs(row.alistamientoTramite)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10.5px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Cumplido:</strong> Alistada (100 %) en la fecha confirmada por el gerente (C) o antes ·{' '}
            <strong className="text-slate-800">Cumplido parcial:</strong> Alistada hasta 15 días calendario después de C ·{' '}
            <strong className="text-slate-800">Cumplido tarde:</strong> Alistada más de 15 días calendario después de C ·{' '}
            <strong className="text-slate-800">A tiempo:</strong> El proyectado actual llega antes o el mismo día de C ·{' '}
            <strong className="text-slate-800">Riesgo leve:</strong> El proyectado actual se pasa de 1 a 15 días de C ·{' '}
            <strong className="text-slate-800">Riesgo medio:</strong> El proyectado actual se pasa de 16 a 30 días de C ·{' '}
            <strong className="text-slate-800">Riesgo alto:</strong> El proyectado actual se pasa más de 30 días de C ·{' '}
            <strong className="text-slate-800">Vencido:</strong> Pasó la fecha confirmada y la torre no está al 100 % ·{' '}
            <strong className="text-slate-800">▲</strong> = subió un nivel porque faltan menos de 90 días ·{' '}
            <strong className="text-slate-800">↻</strong> = la fecha confirmada cambió respecto al previsto original.
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GRÁFICA DE COLUMNAS: VARIACIÓN DE FIN PROYECTADO VS LÍNEA BASE       */}
      {/* ==================================================================== */}
      {chartDataBySabana.length > 0 && torresListForChart.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>
                  Evolución de Variación en Días (Fin Proyectado vs. Fin Línea Base) por Torre en cada Sábana Cargada
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Eje X: Sábanas de Workplanner cargadas en el tiempo · Eje Y: Variación de fin en días calendario (+ atraso / - adelanto)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[10.5px]">
              <button
                type="button"
                onClick={() => setTorreFiltroGrafica('TODAS')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  torreFiltroGrafica === 'TODAS'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todas las Torres
              </button>
              {torresListForChart.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTorreFiltroGrafica(t)}
                  className={`px-2 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    torreFiltroGrafica === t
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataBySabana}
                margin={{ top: 12, right: 18, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="tiempoLabel"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                  unit=" d"
                  label={{
                    value: 'Variación Fin (días)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#475569', fontWeight: 700 },
                  }}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    `${Number(value) > 0 ? `+${value}` : value} días`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                {torresListForChart
                  .filter((t) => torreFiltroGrafica === 'TODAS' || t === torreFiltroGrafica)
                  .map((torre) => {
                    const colorIdx =
                      torresListForChart.indexOf(torre) % TORRE_BAR_COLORS.length;
                    return (
                      <Bar
                        key={torre}
                        dataKey={torre}
                        name={torre}
                        fill={TORRE_BAR_COLORS[colorIdx]}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                    );
                  })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
