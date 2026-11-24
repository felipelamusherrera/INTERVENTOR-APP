import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  Clock,
  CheckCircle2,
  Play,
  Flag,
  Calendar,
  ArrowRight,
  Search,
  Layers,
} from 'lucide-react';
import { CpmEngine, CpmTask } from '../../../services/cpmEngine';
import { CorteProgramacion, ScheduleService } from '../../../services/scheduleService';
import { BaselineService } from '../../../services/baselineService';
import { getHitoMacroDisplayLabel } from '../../../services/macroMilestoneService';

interface WbsDesviacionesTabProps {
  proyecto: string;
  cortes: CorteProgramacion[];
}

interface CutSnapshotMetric {
  atrasoAcum: number;
  fin: string;
  deltaVsPrev: number;
}

interface Desviacion4CortesItem {
  idConsec: number;
  edt: string;
  nombre: string;
  agrupacion: string;
  hitoMacro: string;
  contratista: string;
  wActual: number;
  esCritica: boolean;
  tf: number;
  comienLB: string;
  finLB: string;
  finActual: string;
  atrasoC1: number;
  c2VsC1: CutSnapshotMetric;
  c3VsC2: CutSnapshotMetric;
  c4VsC3: CutSnapshotMetric;
  deterioro4Cortes: number;
  incrementoConsecutivo4Cortes: boolean;
  debiaIniciar: boolean;
  debiaTerminar: boolean;
  enEjecucion: boolean;
}

function getTaskDelayDays(t: CpmTask | undefined, finLB: string): number {
  if (!t) return 0;
  if (t.varFin !== undefined && !isNaN(Number(t.varFin))) {
    return Number(t.varFin);
  }
  return ScheduleService.diffDays(t.fin, finLB);
}

export const WbsDesviacionesTab: React.FC<WbsDesviacionesTabProps> = ({
  proyecto,
  cortes,
}) => {
  const [estadoFiltro, setEstadoFiltro] = useState<
    | 'INCREMENTO_4_CORTES'
    | 'CRITICAS_4_CORTES'
    | 'DEBIAN_INICIAR'
    | 'DEBIAN_TERMINAR'
    | 'EN_EJECUCION'
  >('INCREMENTO_4_CORTES');
  const [frenteFiltro, setFrenteFiltro] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assignments, setAssignments] = useState(() => ScheduleService.getWbsAssignments(proyecto));

  useEffect(() => {
    const refresh = () => setAssignments(ScheduleService.getWbsAssignments(proyecto));
    window.addEventListener('marval_wbs_assignments_updated', refresh);
    window.addEventListener('schedule_updated', refresh);
    return () => {
      window.removeEventListener('marval_wbs_assignments_updated', refresh);
      window.removeEventListener('schedule_updated', refresh);
    };
  }, [proyecto]);

  // Tomar los últimos 4 cortes de seguimiento cuando existen > 4 cortes ingresados
  const trackingCortes = useMemo(() => {
    const nonLb = cortes.filter((c) => !c.esLineaBase);
    return nonLb.length >= 4 ? nonLb : cortes;
  }, [cortes]);

  const ultimos4Cortes = useMemo(() => {
    return trackingCortes.slice(-4);
  }, [trackingCortes]);

  const tieneMasDe4Cortes = cortes.length > 4 && ultimos4Cortes.length === 4;

  const analisis = useMemo(() => {
    if (ultimos4Cortes.length < 4) {
      return {
        c1Label: '',
        c2Label: '',
        c3Label: '',
        c4Label: '',
        items: [] as Desviacion4CortesItem[],
        incremento4Cortes: [] as Desviacion4CortesItem[],
        criticas4Cortes: [] as Desviacion4CortesItem[],
        debiaIniciar: [] as Desviacion4CortesItem[],
        debiaTerminar: [] as Desviacion4CortesItem[],
        enEjecucion: [] as Desviacion4CortesItem[],
        frentes: [] as string[],
      };
    }

    const [c1, c2, c3, c4] = ultimos4Cortes;
    const cpm1 = CpmEngine.computeSchedule(c1.tasks as any[]);
    const cpm2 = CpmEngine.computeSchedule(c2.tasks as any[]);
    const cpm3 = CpmEngine.computeSchedule(c3.tasks as any[]);
    const cpm4 = CpmEngine.computeSchedule(c4.tasks as any[]);
    const lbMap = BaselineService.getLineaBase(proyecto);

    const map1 = new Map<number, CpmTask>(cpm1.tasks.map((t) => [t.idConsec, t]));
    const map2 = new Map<number, CpmTask>(cpm2.tasks.map((t) => [t.idConsec, t]));
    const map3 = new Map<number, CpmTask>(cpm3.tasks.map((t) => [t.idConsec, t]));

    const refDate = c4.fechaCorte || new Date().toISOString().split('T')[0];
    const items: Desviacion4CortesItem[] = [];
    const frentesSet = new Set<string>();

    // Evaluar TODAS las actividades tipo task (y hitos) para detectar evolución en los últimos 4 cortes
    cpm4.tasks.forEach((t4) => {
      if (t4.tipo === 'project') return;

      const t1 = map1.get(t4.idConsec);
      const t2 = map2.get(t4.idConsec);
      const t3 = map3.get(t4.idConsec);
      const lb = lbMap?.get(t4.idConsec);

      const comienLB = t4.comienPrev || lb?.comienzoLineaBase || t4.comien;
      const finLB = t4.finPrev || lb?.finLineaBase || t4.fin;

      const a1 = getTaskDelayDays(t1, finLB);
      const a2 = getTaskDelayDays(t2, finLB);
      const a3 = getTaskDelayDays(t3, finLB);
      const a4 = getTaskDelayDays(t4, finLB);

      const d21 = a2 - a1;
      const d32 = a3 - a2;
      const d43 = a4 - a3;

      // Regla: incremento de atraso consecutivo entre un corte y otro en los últimos 4 cortes
      const incrementoConsecutivo4Cortes = d21 > 0 && d32 > 0 && d43 > 0 && a4 > 0;

      const debiaIniciar = Boolean(comienLB && comienLB <= refDate && (t4.w < 1 || a4 > 0));
      const debiaTerminar = Boolean(finLB && finLB <= refDate && t4.w < 1);
      const enEjecucion = t4.w > 0 && t4.w < 1;

      const agrup = t4.agrupacion || 'PROYECTO';
      if (agrup !== 'NO APLICA') frentesSet.add(agrup);

      items.push({
        idConsec: t4.idConsec,
        edt: t4.edt,
        nombre: t4.nombre,
        agrupacion: agrup,
        hitoMacro: getHitoMacroDisplayLabel(assignments.hitoByEdt[t4.edt]),
        contratista: assignments.contratistaByEdt[t4.edt] || (t4 as any).responsable || 'Por asignar',
        wActual: Math.round((t4.w || 0) * 100),
        esCritica: t4.esCritica,
        tf: t4.tf,
        comienLB,
        finLB,
        finActual: t4.fin,
        atrasoC1: a1,
        c2VsC1: { atrasoAcum: a2, fin: t2?.fin || finLB, deltaVsPrev: d21 },
        c3VsC2: { atrasoAcum: a3, fin: t3?.fin || finLB, deltaVsPrev: d32 },
        c4VsC3: { atrasoAcum: a4, fin: t4.fin, deltaVsPrev: d43 },
        deterioro4Cortes: a4 - a1,
        incrementoConsecutivo4Cortes,
        debiaIniciar,
        debiaTerminar,
        enEjecucion,
      });
    });

    const sortByDeterioration = (arr: Desviacion4CortesItem[]) =>
      [...arr].sort((a, b) => {
        if (a.esCritica !== b.esCritica) return a.esCritica ? -1 : 1;
        if (b.deterioro4Cortes !== a.deterioro4Cortes) return b.deterioro4Cortes - a.deterioro4Cortes;
        return b.c4VsC3.atrasoAcum - a.c4VsC3.atrasoAcum;
      });

    const inc4 = sortByDeterioration(items.filter((i) => i.incrementoConsecutivo4Cortes));

    return {
      c1Label: c1.etiqueta.split('(')[0].trim() + ` (${c1.fechaCorte})`,
      c2Label: c2.etiqueta.split('(')[0].trim() + ` (${c2.fechaCorte})`,
      c3Label: c3.etiqueta.split('(')[0].trim() + ` (${c3.fechaCorte})`,
      c4Label: c4.etiqueta.split('(')[0].trim() + ` (${c4.fechaCorte})`,
      items,
      incremento4Cortes: inc4,
      criticas4Cortes: inc4.filter((i) => i.esCritica),
      debiaIniciar: sortByDeterioration(items.filter((i) => i.esCritica && i.debiaIniciar)),
      debiaTerminar: sortByDeterioration(items.filter((i) => i.esCritica && i.debiaTerminar)),
      enEjecucion: sortByDeterioration(items.filter((i) => i.esCritica && i.enEjecucion)),
      frentes: Array.from(frentesSet).sort(),
    };
  }, [ultimos4Cortes, proyecto, assignments]);

  const listaVisible = useMemo(() => {
    const base =
      estadoFiltro === 'INCREMENTO_4_CORTES'
        ? analisis.incremento4Cortes
        : estadoFiltro === 'CRITICAS_4_CORTES'
          ? analisis.criticas4Cortes
          : estadoFiltro === 'DEBIAN_INICIAR'
            ? analisis.debiaIniciar
            : estadoFiltro === 'DEBIAN_TERMINAR'
              ? analisis.debiaTerminar
              : analisis.enEjecucion;

    return base.filter((i) => {
      if (frenteFiltro !== 'TODAS' && i.agrupacion !== frenteFiltro) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          i.nombre.toLowerCase().includes(q) ||
          i.edt.toLowerCase().includes(q) ||
          i.contratista.toLowerCase().includes(q) ||
          i.hitoMacro.toLowerCase().includes(q) ||
          i.agrupacion.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analisis, estadoFiltro, frenteFiltro, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Banner de Ventana de Últimos 4 Cortes */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-extrabold text-slate-900 uppercase tracking-wider">
              Evaluación de Tendencia en Últimos 4 Cortes (Historial Total: {cortes.length} cortes)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={frenteFiltro}
              onChange={(e) => setFrenteFiltro(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <option value="TODAS">Todos los Frentes</option>
              {analisis.frentes.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar EDT, actividad, hito o contratista..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-64"
              />
            </div>
          </div>
        </div>

        {/* Línea de Tiempo de los 4 Cortes Comparados */}
        {ultimos4Cortes.length === 4 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {ultimos4Cortes.map((c, idx) => (
              <React.Fragment key={c.id}>
                <div
                  className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                    idx === 3
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    C{idx + 1}: {c.etiqueta}
                  </span>
                </div>
                {idx < 3 && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {!tieneMasDe4Cortes && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Este módulo requiere <strong>más de 4 cortes ingresados</strong> para calcular el deterioro consecutivo en los últimos 4 cortes. Cargue cortes semanales adicionales para activar la detección automática.
          </span>
        </div>
      )}

      {/* 4 TARJETAS KPI EJECUTIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setEstadoFiltro('INCREMENTO_4_CORTES')}
          className={`text-left p-4 rounded-xl border transition shadow-sm ${
            estadoFiltro === 'INCREMENTO_4_CORTES'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-200'
              : 'bg-white border-slate-200 hover:bg-red-50/40'
          }`}
        >
          <div className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incremento en Últimos 4 Cortes</span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-1 tabular-nums">
            {analisis.incremento4Cortes.length}
          </div>
          <div className="text-[11px] text-red-600 mt-0.5">
            {analisis.criticas4Cortes.length} en Ruta Crítica · Deterioro en C2, C3 y C4
          </div>
        </button>

        <button
          onClick={() => setEstadoFiltro('CRITICAS_4_CORTES')}
          className={`text-left p-4 rounded-xl border transition shadow-sm ${
            estadoFiltro === 'CRITICAS_4_CORTES'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>Críticas con Incremento (4 Cortes)</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {analisis.criticas4Cortes.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Actividades de Ruta Crítica empeorando corte tras corte
          </div>
        </button>

        <button
          onClick={() => setEstadoFiltro('DEBIAN_INICIAR')}
          className={`text-left p-4 rounded-xl border transition shadow-sm ${
            estadoFiltro === 'DEBIAN_INICIAR'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Play className="w-3.5 h-3.5 text-amber-600" />
            <span>Críticas Debían Iniciar</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {analisis.debiaIniciar.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Con ventana de inicio previa al último corte
          </div>
        </button>

        <button
          onClick={() => setEstadoFiltro('DEBIAN_TERMINAR')}
          className={`text-left p-4 rounded-xl border transition shadow-sm ${
            estadoFiltro === 'DEBIAN_TERMINAR'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-rose-600" />
            <span>Críticas Debían Terminar</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {analisis.debiaTerminar.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Fin Línea Base vencido sin cierre (W &lt; 100%)
          </div>
        </button>
      </div>

      {/* Selector de Sub-vista */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit text-xs font-bold">
        {[
          {
            id: 'INCREMENTO_4_CORTES' as const,
            label: `Todas con Incremento 4 Cortes (${analisis.incremento4Cortes.length})`,
          },
          {
            id: 'CRITICAS_4_CORTES' as const,
            label: `Críticas con Incremento (${analisis.criticas4Cortes.length})`,
          },
          { id: 'DEBIAN_INICIAR' as const, label: `Críticas Debían Iniciar (${analisis.debiaIniciar.length})` },
          { id: 'DEBIAN_TERMINAR' as const, label: `Críticas Debían Terminar (${analisis.debiaTerminar.length})` },
          { id: 'EN_EJECUCION' as const, label: `Críticas En Ejecución (${analisis.enEjecucion.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEstadoFiltro(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition ${
              estadoFiltro === tab.id
                ? tab.id === 'INCREMENTO_4_CORTES' || tab.id === 'CRITICAS_4_CORTES'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla Comparativa de Evolución en Últimos 4 Cortes */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>
              {estadoFiltro === 'INCREMENTO_4_CORTES'
                ? 'Actividades con Incremento Consecutivo de Atraso en los Últimos 4 Cortes'
                : estadoFiltro === 'CRITICAS_4_CORTES'
                  ? 'Actividades Críticas con Incremento Consecutivo de Atraso en los Últimos 4 Cortes'
                  : estadoFiltro === 'DEBIAN_INICIAR'
                    ? 'Actividades Críticas que Debían Iniciar al Corte Actual'
                    : estadoFiltro === 'DEBIAN_TERMINAR'
                      ? 'Actividades Críticas que Debían Terminar al Corte Actual'
                      : 'Actividades Críticas En Ejecución al Corte Actual'}
            </span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Mostrando {listaVisible.slice(0, 120).length} de {listaVisible.length} actividades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">EDT / Frente</th>
                <th className="py-2.5 px-3 min-w-[230px]">Actividad</th>
                <th className="py-2.5 px-3">Punto de Control / Contratista</th>
                <th className="py-2.5 px-2 text-center">Avance (W)</th>
                <th className="py-2.5 px-2 text-center">Corte 1<br />Atraso</th>
                <th className="py-2.5 px-2 text-center">Corte 2 vs Corte 1<br />Atraso Acum. / Δ</th>
                <th className="py-2.5 px-2 text-center">Corte 3 vs Corte 2<br />Atraso Acum. / Δ</th>
                <th className="py-2.5 px-2 text-center">Corte 4 vs Corte 3<br />Atraso Acum. / Δ</th>
                <th className="py-2.5 px-3 text-center">Incremento 4 Cortes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {listaVisible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No se detectan actividades con deterioro consecutivo bajo este filtro en los últimos 4 cortes.
                  </td>
                </tr>
              ) : (
                listaVisible.slice(0, 120).map((item) => (
                  <tr
                    key={`${item.idConsec}-${item.edt}`}
                    className={`hover:bg-slate-50 ${
                      item.esCritica && item.incrementoConsecutivo4Cortes ? 'bg-red-50/35' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-700">{item.edt}</div>
                      <div className="text-[10px] text-slate-500">{item.agrupacion}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{item.nombre}</span>
                        {item.esCritica && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black">
                            <Flame className="w-2.5 h-2.5" />
                            Ruta Crítica
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        LB Fin: {item.finLB} · Proy. Actual: {item.finActual} · TF: {item.tf}d
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="text-[10px] font-extrabold text-indigo-700">
                        {item.hitoMacro || 'Sin Hito'}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 truncate max-w-[180px]">
                        {item.contratista}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                      {item.wActual}%
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-slate-600">
                      {item.atrasoC1 > 0 ? `+${item.atrasoC1} d` : `${item.atrasoC1} d`}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span className="font-extrabold text-slate-800">
                        {item.c2VsC1.atrasoAcum} d
                      </span>
                      <div className="text-[10px] font-bold text-amber-700">
                        {item.c2VsC1.deltaVsPrev > 0
                          ? `+${item.c2VsC1.deltaVsPrev} d`
                          : `${item.c2VsC1.deltaVsPrev} d`}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span className="font-extrabold text-slate-900">
                        {item.c3VsC2.atrasoAcum} d
                      </span>
                      <div className="text-[10px] font-bold text-orange-700">
                        {item.c3VsC2.deltaVsPrev > 0
                          ? `+${item.c3VsC2.deltaVsPrev} d`
                          : `${item.c3VsC2.deltaVsPrev} d`}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <span className="font-extrabold text-red-700">
                        {item.c4VsC3.atrasoAcum} d
                      </span>
                      <div className="text-[10px] font-bold text-red-600">
                        {item.c4VsC3.deltaVsPrev > 0
                          ? `+${item.c4VsC3.deltaVsPrev} d`
                          : `${item.c4VsC3.deltaVsPrev} d`}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 border border-red-300 text-red-800 font-black text-[11px]">
                        <Clock className="w-3 h-3" />
                        +{item.deterioro4Cortes} d
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
