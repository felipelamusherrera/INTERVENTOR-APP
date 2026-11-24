import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
  Clock,
  TrendingUp,
  Filter,
  ClipboardCheck,
  Users,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  CalidadSelloMuestreo,
  SelloActivity,
  SelloInspection,
  HitoMacroCalidad,
  Sucursal,
} from '../../../types';
import { CalidadSellosEngine } from '../../../services/calidadSellosEngine';
import { ParametrizacionService, TorreParametrizacion } from '../../../services/parametrizacionService';
import { ProjectService } from '../../../services/projectService';

interface ResidenteCalidadViewProps {
  selectedProject?: string;
  selectedSucursal?: Sucursal;
}

interface FlatInspection extends SelloInspection {
  selloIdResolved: string;
  selloCodigo: string;
  selloNombreResolved: string;
  fase: 'Obra Gris' | 'Obra Blanca';
}

interface GroupAggRow {
  key: string;
  label: string;
  evaluadas: number;
  cumple0: number;
  noCumple1: number;
  externos2: number;
  pctCumplimiento: number;
}

const HITO_LABELS: Record<HitoMacroCalidad, string> = {
  ESTRUCTURA_VANOS: 'Vanos de Estructura / Mampostería',
  REDES_HIDROSANITARIAS: 'Redes Hidrosanitarias',
  MUROS_LIVIANOS: 'Drywall',
  AFINADO_PISO: 'Afinado',
  FRISOS_MUROS: 'Frisos y Mampostería',
  PISOS_ENCHAPES: 'Enchape / Pisos',
  ENCHAPES_MUROS: 'Enchape',
};

function normalizeTorreKey(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/\b0+(\d+)/g, '$1');
}

function buildGroupBreakdown(
  rows: FlatInspection[],
  keyFn: (ins: FlatInspection) => string
): GroupAggRow[] {
  const map = new Map<string, { cumple0: number; noCumple1: number; externos2: number }>();

  rows.forEach((r) => {
    if (r.resultado === 'NA') return;
    const k = keyFn(r) || 'Sin definir';
    if (!map.has(k)) {
      map.set(k, { cumple0: 0, noCumple1: 0, externos2: 0 });
    }
    const bucket = map.get(k)!;
    if (r.resultado === '0') bucket.cumple0 += 1;
    else if (r.resultado === '1') bucket.noCumple1 += 1;
    else if (r.resultado === '2') bucket.externos2 += 1;
  });

  return Array.from(map.entries())
    .map(([key, b]) => {
      const evaluadas = b.cumple0 + b.noCumple1 + b.externos2;
      const pctCumplimiento = evaluadas > 0 ? Math.round((b.cumple0 / evaluadas) * 100) : 0;
      return {
        key,
        label: key,
        evaluadas,
        cumple0: b.cumple0,
        noCumple1: b.noCumple1,
        externos2: b.externos2,
        pctCumplimiento,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true }));
}

export const ResidenteCalidadView: React.FC<ResidenteCalidadViewProps> = ({
  selectedProject = '',
}) => {
  const projectObj = ProjectService.getProjectById(selectedProject);
  const projectLabel = projectObj?.nombreJde || selectedProject || 'Sin proyecto';

  const [lotes, setLotes] = useState<CalidadSelloMuestreo[]>(() =>
    CalidadSellosEngine.getMuestreosLotes(selectedProject)
  );
  const [activities, setActivities] = useState<SelloActivity[]>(() =>
    CalidadSellosEngine.getActivities(selectedProject)
  );
  const [torresConfig, setTorresConfig] = useState<TorreParametrizacion[]>(() =>
    ParametrizacionService.getTorresConfig(selectedProject)
  );

  const [filtroTorre, setFiltroTorre] = useState<string>('TODAS');
  const [filtroContratista, setFiltroContratista] = useState<string>('TODOS');
  const [filtroPiso, setFiltroPiso] = useState<string>('TODOS');
  const [filtroActividad, setFiltroActividad] = useState<string>('TODAS');
  const [filtroFase, setFiltroFase] = useState<'TODAS' | 'Obra Gris' | 'Obra Blanca'>('TODAS');
  const [timeScaleMode, setTimeScaleMode] = useState<'DIA' | 'MES'>('DIA');

  useEffect(() => {
    const refresh = () => {
      setLotes(CalidadSellosEngine.getMuestreosLotes(selectedProject));
      setActivities(CalidadSellosEngine.getActivities(selectedProject));
      setTorresConfig(ParametrizacionService.getTorresConfig(selectedProject));
    };

    refresh();
    window.addEventListener('marval_sellos_updated', refresh);
    window.addEventListener('marval_parametrizacion_updated', refresh);
    window.addEventListener('marval_projects_updated', refresh);
    return () => {
      window.removeEventListener('marval_sellos_updated', refresh);
      window.removeEventListener('marval_parametrizacion_updated', refresh);
      window.removeEventListener('marval_projects_updated', refresh);
    };
  }, [selectedProject]);

  const totalAptosProyecto = useMemo(() => {
    return torresConfig.reduce((acc, t) => acc + t.numeroPisos * t.series.length, 0) || 48;
  }, [torresConfig]);

  // Aplanar todas las inspecciones reales registradas desde Bitácora
  const flatInspections: FlatInspection[] = useMemo(() => {
    const list: FlatInspection[] = [];
    activities.forEach((act) => {
      act.inspecciones.forEach((ins) => {
        list.push({
          ...ins,
          selloIdResolved: act.id,
          selloCodigo: act.codigo,
          selloNombreResolved: act.nombre,
          fase: act.fase,
        });
      });
    });
    return list;
  }, [activities]);

  // Opciones dinámicas de Contratistas y Pisos presentes en los registros o parametrización
  const contratistasDisponibles = useMemo(() => {
    const set = new Set<string>();
    flatInspections.forEach((i) => {
      if (i.contratistaResponsable) set.add(i.contratistaResponsable);
    });
    lotes.forEach((l) => {
      if (l.contratistaEjecutor) set.add(l.contratistaEjecutor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [flatInspections, lotes]);

  const pisosDisponibles = useMemo(() => {
    const set = new Set<number>();
    torresConfig.forEach((t) => {
      for (let p = 1; p <= t.numeroPisos; p++) set.add(p);
    });
    flatInspections.forEach((i) => {
      if (i.piso) set.add(i.piso);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [torresConfig, flatInspections]);

  const filteredInspections = useMemo(() => {
    const normTorreFilter = filtroTorre === 'TODAS' ? null : normalizeTorreKey(filtroTorre);
    return flatInspections.filter((i) => {
      if (normTorreFilter && normalizeTorreKey(i.torre) !== normTorreFilter) return false;
      if (filtroContratista !== 'TODOS' && (i.contratistaResponsable || '') !== filtroContratista) {
        return false;
      }
      if (filtroPiso !== 'TODOS' && String(i.piso) !== filtroPiso) return false;
      if (filtroActividad !== 'TODAS' && i.selloIdResolved !== filtroActividad) return false;
      if (filtroFase !== 'TODAS' && i.fase !== filtroFase) return false;
      return true;
    });
  }, [flatInspections, filtroTorre, filtroContratista, filtroPiso, filtroActividad, filtroFase]);

  const lotesFiltrados = useMemo(() => {
    const normTorreFilter = filtroTorre === 'TODAS' ? null : normalizeTorreKey(filtroTorre);
    return lotes.filter((l) => {
      if (normTorreFilter && normalizeTorreKey(l.torre) !== normTorreFilter) return false;
      if (filtroContratista !== 'TODOS' && l.contratistaEjecutor !== filtroContratista) {
        return false;
      }
      return true;
    });
  }, [lotes, filtroTorre, filtroContratista]);

  // Métricas KPI principales (0% cuando no hay registros, sin datos ficticios)
  const metricas = useMemo(() => {
    const evaluadasInsp = filteredInspections.filter((i) => i.resultado !== 'NA');
    const cumple0Insp = evaluadasInsp.filter((i) => i.resultado === '0').length;
    const noCumple1Insp = evaluadasInsp.filter((i) => i.resultado === '1').length;
    const externos2Insp = evaluadasInsp.filter((i) => i.resultado === '2').length;

    let auditadasLote = 0;
    let aprobadasLote = 0;
    let retenciones = 0;
    let valorRetenciones = 0;

    lotesFiltrados.forEach((l) => {
      auditadasLote += l.unidadesAuditadasInterventoria;
      aprobadasLote += l.unidadesAprobadas;
      if (l.aplicaRetencion20 && l.estadoSubsanacion !== 'REINSPECCIONADO_APROBADO') {
        retenciones += 1;
        valorRetenciones += l.valorRetencionEstimado || 0;
      }
    });

    const tieneRegistros = evaluadasInsp.length > 0 || auditadasLote > 0;
    const indicePromedio =
      evaluadasInsp.length > 0
        ? Math.round((cumple0Insp / evaluadasInsp.length) * 100)
        : auditadasLote > 0
          ? Math.round((aprobadasLote / auditadasLote) * 100)
          : 0;

    return {
      tieneRegistros,
      totalInspecciones: evaluadasInsp.length,
      cumple0Insp,
      noCumple1Insp,
      externos2Insp,
      totalLotes: lotesFiltrados.length,
      indicePromedio,
      retenciones,
      valorRetenciones,
    };
  }, [filteredInspections, lotesFiltrados]);

  // Desgloses de comportamiento por Agrupación, Contratista y Piso
  const breakdownByTorre = useMemo(
    () => buildGroupBreakdown(filteredInspections, (i) => i.torre || 'Sin agrupación'),
    [filteredInspections]
  );

  const breakdownByContratista = useMemo(
    () => buildGroupBreakdown(filteredInspections, (i) => i.contratistaResponsable || 'Por asignar'),
    [filteredInspections]
  );

  const breakdownBySello = useMemo(
    () => buildGroupBreakdown(filteredInspections, (i) => i.selloNombreResolved || 'Sin actividad'),
    [filteredInspections]
  );

  // Serie temporal del comportamiento de los indicadores de sellos (por fecha de ejecución o mes)
  const timelineSellosData = useMemo(() => {
    const map = new Map<
      string,
      { periodo: string; evaluadas: number; cumple0: number; noCumple: number }
    >();

    filteredInspections.forEach((ins) => {
      if (ins.resultado === 'NA' || !ins.fecha) return;
      const key = timeScaleMode === 'MES' ? ins.fecha.slice(0, 7) : ins.fecha.slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { periodo: key, evaluadas: 0, cumple0: 0, noCumple: 0 });
      }
      const b = map.get(key)!;
      b.evaluadas += 1;
      if (ins.resultado === '0') b.cumple0 += 1;
      else b.noCumple += 1;
    });

    return Array.from(map.values())
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((row) => ({
        ...row,
        pctCumplimiento:
          row.evaluadas > 0 ? Math.round((row.cumple0 / row.evaluadas) * 1000) / 10 : 0,
      }));
  }, [filteredInspections, timeScaleMode]);

  // Avance e indicadores por cada una de las 6 actividades estandarizadas
  const avancePorSello = useMemo(() => {
    const normTorre = filtroTorre === 'TODAS' ? null : normalizeTorreKey(filtroTorre);

    return activities
      .filter((a) => (filtroFase === 'TODAS' || a.fase === filtroFase) && (filtroActividad === 'TODAS' || a.id === filtroActividad))
      .map((act) => {
        const insps = act.inspecciones.filter((i) => {
          if (normTorre && normalizeTorreKey(i.torre) !== normTorre) return false;
          if (filtroContratista !== 'TODOS' && (i.contratistaResponsable || '') !== filtroContratista) {
            return false;
          }
          if (filtroPiso !== 'TODOS' && String(i.piso) !== filtroPiso) return false;
          return true;
        });

        const evaluadas = insps.filter((i) => i.resultado !== 'NA');
        const cumple0 = evaluadas.filter((i) => i.resultado === '0').length;
        const noCumple1 = evaluadas.filter((i) => i.resultado === '1').length;
        const externos2 = evaluadas.filter((i) => i.resultado === '2').length;
        const pctCumplimiento = evaluadas.length > 0 ? Math.round((cumple0 / evaluadas.length) * 100) : 0;

        const baseAptos = normTorre
          ? (() => {
              const t = torresConfig.find((x) => normalizeTorreKey(x.nombreTorre) === normTorre);
              return t ? t.numeroPisos * t.series.length : 48;
            })()
          : totalAptosProyecto;
        const metaMuestreo50 = Math.max(5, Math.ceil(baseAptos * 0.5));
        const pctAvanceMuestreo = Math.min(100, Math.round((evaluadas.length / metaMuestreo50) * 100));

        return {
          ...act,
          totalInspecciones: evaluadas.length,
          cumple0,
          noCumple1,
          externos2,
          pctCumplimiento,
          metaMuestreo50,
          pctAvanceMuestreo,
        };
      });
  }, [
    activities,
    filtroTorre,
    filtroContratista,
    filtroPiso,
    filtroActividad,
    filtroFase,
    torresConfig,
    totalAptosProyecto,
  ]);

  const handleToggleSubsanado = (id: string) => {
    const updated = lotes.map((l) => {
      if (l.id !== id) return l;
      const aprobadoAhora = l.estadoSubsanacion !== 'REINSPECCIONADO_APROBADO';
      return {
        ...l,
        estadoSubsanacion: aprobadoAhora
          ? ('REINSPECCIONADO_APROBADO' as const)
          : ('PENDIENTE_CORRECCION_8D' as const),
        bloqueaSucesora: !aprobadoAhora,
        fechaCierreRealSubsanacion: aprobadoAhora ? new Date().toISOString().split('T')[0] : undefined,
      };
    });
    CalidadSellosEngine.saveMuestreosLotes(selectedProject, updated);
    setLotes(updated);
  };

  const renderBreakdownCard = (
    title: string,
    icon: React.ReactNode,
    rows: GroupAggRow[],
    emptyLabel: string
  ) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          <span>{title}</span>
        </h4>
        <span className="text-[10px] font-bold text-slate-400">{rows.length} grupo(s)</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">{emptyLabel}</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {rows.map((r) => (
            <div key={r.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800 truncate">{r.label}</span>
                <span
                  className={`px-2 py-0.5 rounded font-black text-[11px] shrink-0 ${
                    r.pctCumplimiento >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {r.pctCumplimiento}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${r.pctCumplimiento >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${r.pctCumplimiento}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{r.evaluadas} eval.</span>
                <span>0: {r.cumple0} · 1: {r.noCumple1} · 2: {r.externos2}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header del Módulo Independiente */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Módulo Residente · Indicadores de Sellos de Calidad (MA-SIG-CAL-001 v003)</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{projectLabel}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Tablero Indicadores Sellos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Seguimiento conectado directamente con los registros de sellos en Bitácora para las{' '}
              <strong>6 actividades estandarizadas</strong>: comportamiento de cumplimiento por{' '}
              <strong>Agrupación</strong>, <strong>Contratista</strong> y <strong>Sello (Actividad)</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('marval_navigate_tab', { detail: 'bitacora' }))}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start lg:self-center"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Registrar Sellos en Bitácora</span>
          </button>
        </div>

        {/* Barra de Filtros Cruzados: Agrupación / Contratista / Piso / Sello */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filtroTorre}
            onChange={(e) => setFiltroTorre(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="TODAS">Todas las Agrupaciones / Torres ({torresConfig.length})</option>
            {torresConfig.map((t) => (
              <option key={t.id} value={t.nombreTorre}>
                {t.nombreTorre}
              </option>
            ))}
          </select>

          <select
            value={filtroContratista}
            onChange={(e) => setFiltroContratista(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="TODOS">Todos los Contratistas ({contratistasDisponibles.length})</option>
            {contratistasDisponibles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filtroPiso}
            onChange={(e) => setFiltroPiso(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="TODOS">Todos los Pisos</option>
            {pisosDisponibles.map((p) => (
              <option key={p} value={String(p)}>
                Piso {String(p).padStart(2, '0')}
              </option>
            ))}
          </select>

          <select
            value={filtroActividad}
            onChange={(e) => setFiltroActividad(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="TODAS">Las 6 Actividades Estandarizadas</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 TARJETAS KPI PRINCIPALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Índice Calidad Proyecto
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black ${
                !metricas.tieneRegistros
                  ? 'text-slate-400'
                  : metricas.indicePromedio >= 80
                    ? 'text-emerald-700'
                    : 'text-red-700'
              }`}
            >
              {metricas.indicePromedio}%
            </span>
            <span className="text-xs text-slate-500">
              {metricas.tieneRegistros ? 'Meta ≥ 80%' : 'Sin registros'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            {metricas.cumple0Insp} conformes de {metricas.totalInspecciones} inspecciones
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Inspecciones Registradas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{metricas.totalInspecciones}</span>
            <span className="text-xs text-slate-500">inmuebles eval.</span>
          </div>
          <span className="text-[11px] text-blue-600 mt-1 inline-block">
            1: {metricas.noCumple1Insp} directos · 2: {metricas.externos2Insp} externos
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            Retenciones 20% Activas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-700">{metricas.retenciones}</span>
            <span className="text-xs text-red-500">lotes &lt; 80%</span>
          </div>
          <span className="text-[11px] text-red-600 mt-1 inline-block">
            {metricas.totalLotes} lotes consolidados
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Valor Retenido Estimado
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-900 tabular-nums">
              ${Math.round(metricas.valorRetenciones).toLocaleString('es-CO')}
            </span>
            <span className="text-xs text-slate-500">COP retenidos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Calculado por % incumplimiento de lote
          </span>
        </div>
      </div>

      {/* GRÁFICA TEMPORAL: COMPORTAMIENTO DE INDICADORES DE SELLOS EN EL TIEMPO */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Comportamiento de Indicadores de Sellos en el Tiempo</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evolución del % de cumplimiento de sellos de calidad según su fecha de ejecución registrada.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeScaleMode('DIA')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                timeScaleMode === 'DIA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Por Fecha de Ejecución
            </button>
            <button
              type="button"
              onClick={() => setTimeScaleMode('MES')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                timeScaleMode === 'MES' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Por Mes
            </button>
          </div>
        </div>

        {timelineSellosData.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Aún no hay inspecciones con fecha de ejecución registrada para graficar la tendencia temporal.
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={timelineSellosData}
                margin={{ top: 10, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#4f46e5', fontWeight: 700 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    name === '% Cumplimiento' ? `${value}%` : `${value} apto(s)`,
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
                <ReferenceLine
                  yAxisId="left"
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Meta 80%',
                    position: 'insideTopRight',
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="evaluadas"
                  name="Aptos Evaluados"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pctCumplimiento"
                  name="% Cumplimiento"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* DESGLOSE POR AGRUPACIÓN, CONTRATISTA Y SELLO (ACTIVIDAD) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderBreakdownCard(
          'Cumplimiento por Agrupación / Torre',
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />,
          breakdownByTorre,
          'Sin registros por agrupación aún.'
        )}
        {renderBreakdownCard(
          'Cumplimiento por Contratista',
          <Users className="w-3.5 h-3.5 text-blue-600" />,
          breakdownByContratista,
          'Sin registros por contratista aún.'
        )}
        {renderBreakdownCard(
          'Cumplimiento por Sello (Actividad)',
          <Award className="w-3.5 h-3.5 text-emerald-600" />,
          breakdownBySello,
          'Sin registros por sello (actividad) aún.'
        )}
      </div>

      {/* AVANCE A LA FECHA POR LAS 6 ACTIVIDADES ESTANDARIZADAS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Avance a la Fecha e Indicadores por Sello Estandarizado (6 Actividades)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Consolidado en vivo de todas las inspecciones de apartamentos registradas en Bitácora.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
            {(['TODAS', 'Obra Gris', 'Obra Blanca'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFase(f)}
                className={`px-2.5 py-1 rounded-md transition ${
                  filtroFase === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {avancePorSello.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">
                    {s.codigo} · {s.fase}
                  </span>
                  <div className="text-xs font-extrabold text-slate-900">{s.nombre}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-black ${
                    s.totalInspecciones === 0
                      ? 'bg-slate-100 text-slate-500'
                      : s.pctCumplimiento >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {s.totalInspecciones > 0 ? `${s.pctCumplimiento}%` : '0%'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
                  <span>Calidad (Meta &ge; 80%)</span>
                  <span>
                    0: {s.cumple0} · 1: {s.noCumple1} · 2: {s.externos2}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.totalInspecciones === 0
                        ? 'bg-transparent'
                        : s.pctCumplimiento >= 80
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${s.pctCumplimiento}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Avance Muestreo (Meta 50%: {s.metaMuestreo50} aptos)</span>
                  <span className="font-bold text-indigo-700">
                    {s.totalInspecciones}/{s.metaMuestreo50} ({s.pctAvanceMuestreo}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${s.pctAvanceMuestreo}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLA DETALLADA DE INSPECCIONES REGISTRADAS EN BITÁCORA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Registro Detallado de Sellos Tomados en Campo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold">
              {filteredInspections.length}
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Sincronizado en vivo con el módulo Bitácora Semanal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Actividad Sello</th>
                <th className="py-2.5 px-3">Agrupación / Piso / Apto</th>
                <th className="py-2.5 px-3">Criterio Manual</th>
                <th className="py-2.5 px-3">Resultado</th>
                <th className="py-2.5 px-3">Tolerancia &amp; Medición</th>
                <th className="py-2.5 px-3">Contratista</th>
                <th className="py-2.5 px-3">Hallazgo / Observación</th>
                <th className="py-2.5 px-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No existen registros de sellos en este proyecto para los filtros seleccionados. Registre las inspecciones desde Bitácora de Campo → Registro sellos de calidad.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {ins.selloNombreResolved}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {ins.torre || '—'} · P{String(ins.piso || 0).padStart(2, '0')} ·{' '}
                      <strong>{ins.apartamento}</strong>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {ins.criterioEvaluado || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ins.resultado === '0'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.resultado === '1'
                              ? 'bg-rose-100 text-rose-800'
                              : ins.resultado === '2'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ins.resultado === '0'
                          ? '0: Cumple'
                          : ins.resultado === '1'
                            ? '1: No Cumple'
                            : ins.resultado === '2'
                              ? '2: Ext.'
                              : 'NA'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {ins.medicionMm !== undefined ? `${ins.medicionMm} mm · ` : ''}
                      {ins.toleranciaTexto}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {ins.contratistaResponsable || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate" title={ins.hallazgo}>
                      {ins.hallazgo || 'Conforme'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 tabular-nums">{ins.fecha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA CONSOLIDADA DE AUDITORÍAS DE LOTES (SI HAY LOTES REGISTRADOS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Auditorías de Lotes Consolidadas</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold">
              {lotesFiltrados.length}
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Cruce automático de Calidad 80%, Retención 20% y Ritmo Workplanner
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Hito Calidad / Torre</th>
                <th className="py-3 px-4">Contratista Evaluado</th>
                <th className="py-3 px-4">Muestra y Calificación</th>
                <th className="py-3 px-4">Estado / Retención 20%</th>
                <th className="py-3 px-4">Ritmo vs. Workplanner (15d / 2m)</th>
                <th className="py-3 px-4">Hallazgos / Subsanación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lotesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Sin lotes consolidados registrados aún.
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {HITO_LABELS[ins.hitoMacroCalidad] || ins.hitoMacroCalidad}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>
                          {ins.torre} · Fecha: {ins.fechaAuditoria}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ins.contratistaEjecutor}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium inline-block mt-0.5">
                        {ins.tipoContrato === 'TODO_COSTO' ? 'Todo Costo' : 'Mano de Obra'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black ${
                            ins.indiceCumplimientoLote >= 80 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {ins.indiceCumplimientoLote}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({ins.unidadesAprobadas}/{ins.unidadesAuditadasInterventoria} aptos)
                        </span>
                      </div>
                      {ins.unidadesRechazadas > 0 && (
                        <div className="text-[10px] text-red-600 mt-0.5">
                          {ins.unidadesRechazadas} con inconformidad
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {ins.aprobado || ins.estadoSubsanacion === 'REINSPECCIONADO_APROBADO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> APROBADO
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[11px] border border-red-200">
                            <XCircle className="w-3 h-3" />{' '}
                            {ins.indiceCumplimientoLote < 80 ? 'RECHAZADO' : 'CON OBSERVACIÓN'}
                          </span>
                          <div className="text-[10px] text-red-700 font-bold flex items-center gap-1 tabular-nums">
                            <Lock className="w-3 h-3" /> Retención ({ins.porcentajeRetencionAplicado ?? 20}%):{' '}
                            {ins.valorRetencionEstimado
                              ? `-$${Math.round(ins.valorRetencionEstimado).toLocaleString('es-CO')} COP`
                              : 'Activa'}
                          </div>
                          {ins.valorContratoPorApto ? (
                            <div className="text-[10px] text-slate-500 tabular-nums">
                              Base apto: ${Math.round(ins.valorContratoPorApto).toLocaleString('es-CO')} COP
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500">
                              Bloqueo de frentes sucesores activo
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {ins.alertaDesfase === 'AL_DIA' || !ins.alertaDesfase ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Ritmo al Día
                        </span>
                      ) : ins.alertaDesfase === 'ATENCION_ATRASO_MUESTREO' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200">
                          <Clock className="w-3 h-3" /> Desfase &gt; 15d ({ins.desfaseDiasMuestreo}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-800 font-bold text-[11px] border border-red-200">
                          <ShieldAlert className="w-3 h-3" /> Desfase Crítico (&gt;2m)
                        </span>
                      )}
                      {ins.mensajeAlertaDesfase && (
                        <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                          {ins.mensajeAlertaDesfase}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {ins.espaciosIncumplimiento.length > 0 ? (
                        <div className="text-[11px] space-y-1">
                          <div className="text-slate-600">{ins.espaciosIncumplimiento.join(', ')}</div>
                          {!ins.aprobado && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] font-bold text-red-600">
                                Plazo 8d: {ins.fechaLimiteSubsanacion8d}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleSubsanado(ins.id)}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-300 text-[10px] font-bold"
                              >
                                {ins.estadoSubsanacion === 'REINSPECCIONADO_APROBADO'
                                  ? 'Reabrir'
                                  : 'Marcar Subsanado'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin observaciones</span>
                      )}
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
