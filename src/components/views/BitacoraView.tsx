import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Smartphone, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  Flame, 
  Check, 
  Save, 
  Lock, 
  Unlock, 
  RefreshCw, 
  ChevronRight, 
  FileText, 
  Building2, 
  ArrowRight, 
  Clock, 
  Eye, 
  ShieldAlert,
  Send,
  SlidersHorizontal,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

import { CpmEngine, CpmTask } from '../../services/cpmEngine';
import { 
  BaselineService, 
  BaselineRecord, 
  ActividadSemanalBitacora, 
  CalificacionActividad, 
  ReporteSemanalBitacora,
  SemanaCorteInfo,
  RESTRICCIONES_LOOKAHEAD,
  CAUSAS_OPERATIVAS_NO_FIN
} from '../../services/baselineService';
import initialWbsData from '../../data/wbsBelaterraFull.json';

export const BitacoraView: React.FC = () => {
  const [tasks, setTasks] = useState<CpmTask[]>([]);
  const [proyecto, setProyecto] = useState('Belaterra Pietra');
  const [sucursal, setSucursal] = useState('CALI');
  const [residente, setResidente] = useState('Ing. Residente Interventoría');
  
  // Estado de Línea Base
  const [tieneLB, setTieneLB] = useState(false);
  const [metaLB, setMetaLB] = useState<any>(null);
  const [showLbModal, setShowLbModal] = useState(false);

  // Semanas y Selección de Corte
  const [semanasDisponibles, setSemanasDisponibles] = useState<SemanaCorteInfo[]>([]);
  const [fechaCorteSeleccionada, setFechaCorteSeleccionada] = useState<string>('2025-11-20');
  
  // Calificaciones temporales en borrador: Map de idConsec -> CalificacionActividad
  const [calificaciones, setCalificaciones] = useState<Record<number, CalificacionActividad>>({});
  
  // Filtro de lista
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'CRITICAS' | 'PENDIENTES' | 'ANTICIPADAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Notificaciones y Modales
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [faltantesCriticas, setFaltantesCriticas] = useState<ActividadSemanalBitacora[]>([]);
  const [faltantesObs, setFaltantesObs] = useState<ActividadSemanalBitacora[]>([]);

  // Pestaña activa (Calificación en Vivo vs Histórico de Reportes)
  const [activeTab, setActiveTab] = useState<'EVALUACION' | 'HISTORICO'>('EVALUACION');
  const [reportesHistoricos, setReportesHistoricos] = useState<ReporteSemanalBitacora[]>([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteSemanalBitacora | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Cargar Tareas y CPM
  useEffect(() => {
    try {
      const res = CpmEngine.computeSchedule(initialWbsData as any[]);
      setTasks(res.tasks);

      // Calcular semanas con actividades
      const semanas = BaselineService.listarSemanasConActividad(res.tasks);
      setSemanasDisponibles(semanas);

      // Si no hay fecha de corte fija, tomar la primera semana con tareas
      if (semanas.length > 0 && !fechaCorteSeleccionada) {
        setFechaCorteSeleccionada(semanas[0].lunesStr);
      }
    } catch (e) {
      console.error('Error calculando CPM en Bitácora:', e);
    }
  }, []);

  // 2. Comprobar Línea Base del Proyecto
  const verificarEstadoLB = () => {
    const existe = BaselineService.tieneLineaBase(proyecto);
    setTieneLB(existe);
    if (existe) {
      setMetaLB(BaselineService.getLineaBaseMetadata(proyecto));
    } else {
      setMetaLB(null);
    }
  };

  useEffect(() => {
    verificarEstadoLB();
    const handleLBUpdate = () => verificarEstadoLB();
    window.addEventListener('marval_baseline_updated', handleLBUpdate);
    return () => window.removeEventListener('marval_baseline_updated', handleLBUpdate);
  }, [proyecto]);

  // Cargar histórico de reportes
  const cargarHistorico = () => {
    const list = BaselineService.getReportesSemanales(proyecto);
    setReportesHistoricos(list);
  };

  useEffect(() => {
    cargarHistorico();
    const handleRepCerrado = () => cargarHistorico();
    window.addEventListener('marval_bitacora_reporte_cerrado', handleRepCerrado);
    return () => window.removeEventListener('marval_bitacora_reporte_cerrado', handleRepCerrado);
  }, [proyecto]);

  // 3. Obtener actividades de la semana seleccionada
  const { actividades, totalSemana, totalCriticas, infoSemana } = useMemo(() => {
    if (!tasks.length || !fechaCorteSeleccionada) {
      return { 
        actividades: [], 
        totalSemana: 0, 
        totalCriticas: 0, 
        infoSemana: BaselineService.getSemanaCorte(new Date()) 
      };
    }
    return BaselineService.filtrarActividadesSemana(tasks, fechaCorteSeleccionada, proyecto);
  }, [tasks, fechaCorteSeleccionada, proyecto, tieneLB]);

  // 4. Cargar borrador de calificaciones guardadas para esta semana
  useEffect(() => {
    if (!infoSemana) return;
    const semanaKey = `${infoSemana.anio}-W${infoSemana.numeroSemana}`;
    const guardadas = BaselineService.getCalificacionesTemp(proyecto, semanaKey);
    setCalificaciones(guardadas || {});
  }, [infoSemana, proyecto]);

  // Manejo de Línea Base
  const handleCongelarLB = () => {
    if (!tasks.length) return;
    BaselineService.guardarLineaBase(proyecto, tasks, residente);
    verificarEstadoLB();
    setShowLbModal(false);
    showToast('¡Línea Base congelada con éxito! Las fechas Comien y Fin se establecieron como marco contractual.', 'success');
  };

  const handleRestablecerLB = () => {
    if (window.confirm('¿Desea restablecer la Línea Base oficial? Deberá congelar una nueva sábana para auditar desvíos.')) {
      BaselineService.eliminarLineaBase(proyecto);
      verificarEstadoLB();
      showToast('Línea Base restablecida.', 'warning');
    }
  };

  // Manejo de Calificación de Actividad Individual
  const handleCalificar = (
    act: ActividadSemanalBitacora, 
    campo: 'cumpleInicio' | 'cumpleFin', 
    valor: boolean | null
  ) => {
    setCalificaciones(prev => {
      const actual = prev[act.idConsec] || {
        idConsec: act.idConsec,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        calificado: true,
        cumpleInicio: null,
        cumpleFin: null,
        observaciones: '',
        residente,
        fechaCalificacion: new Date().toISOString()
      };

      const updated = {
        ...actual,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        [campo]: valor,
        calificado: true,
        fechaCalificacion: new Date().toISOString()
      };

      const newState = { ...prev, [act.idConsec]: updated };
      // Guardar borrador en storage
      const semanaKey = `${infoSemana.anio}-W${infoSemana.numeroSemana}`;
      BaselineService.guardarCalificacionesTemp(proyecto, semanaKey, newState);
      return newState;
    });
  };

  const handleCausaChange = (act: ActividadSemanalBitacora, tipo: 'inicio' | 'fin', causa: string) => {
    setCalificaciones(prev => {
      const actual = prev[act.idConsec] || {
        idConsec: act.idConsec,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        calificado: true,
        cumpleInicio: null,
        cumpleFin: null,
        observaciones: '',
      };

      const updated = {
        ...actual,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        [tipo === 'inicio' ? 'causaNoInicio' : 'causaNoFin']: causa
      };

      const newState = { ...prev, [act.idConsec]: updated };
      const semanaKey = `${infoSemana.anio}-W${infoSemana.numeroSemana}`;
      BaselineService.guardarCalificacionesTemp(proyecto, semanaKey, newState);
      return newState;
    });
  };

  const handleObservacionChange = (act: ActividadSemanalBitacora, obs: string) => {
    setCalificaciones(prev => {
      const actual = prev[act.idConsec] || {
        idConsec: act.idConsec,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        calificado: true,
        cumpleInicio: null,
        cumpleFin: null,
        observaciones: '',
      };

      const updated = {
        ...actual,
        edt: act.edt,
        nombre: act.nombre,
        agrupacion: act.agrupacion,
        esCritica: act.esCritica,
        observaciones: obs
      };

      const newState = { ...prev, [act.idConsec]: updated };
      const semanaKey = `${infoSemana.anio}-W${infoSemana.numeroSemana}`;
      BaselineService.guardarCalificacionesTemp(proyecto, semanaKey, newState);
      return newState;
    });
  };

  // Filtrado de Actividades
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(act => {
      // Búsqueda por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = 
          act.nombre.toLowerCase().includes(term) ||
          act.edt.toLowerCase().includes(term) ||
          act.agrupacion.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Filtro por categoría
      if (filtroTipo === 'CRITICAS') return act.esCritica;
      if (filtroTipo === 'ANTICIPADAS') return act.esInicioAnticipado || act.esFinAnticipado;
      if (filtroTipo === 'PENDIENTES') {
        const cal = calificaciones[act.idConsec];
        const calificada = cal && (cal.cumpleInicio !== null || cal.cumpleFin !== null);
        return !calificada;
      }
      return true;
    });
  }, [actividades, searchTerm, filtroTipo, calificaciones]);

  // Estadísticas en Tiempo Real de la Semana
  const statsSemana = useMemo(() => {
    let criticasCalificadas = 0;
    let totalCalificadas = 0;
    let cumplieronInicio = 0;
    let evaluadasInicio = 0;
    let cumplieronFin = 0;
    let evaluadasFin = 0;

    actividades.forEach(a => {
      const cal = calificaciones[a.idConsec];
      const tieneCalif = cal && (cal.cumpleInicio !== null || cal.cumpleFin !== null);
      if (tieneCalif) {
        totalCalificadas++;
        if (a.esCritica) criticasCalificadas++;
      }

      if (cal && cal.cumpleInicio !== null) {
        evaluadasInicio++;
        if (cal.cumpleInicio) cumplieronInicio++;
      }

      if (cal && cal.cumpleFin !== null) {
        evaluadasFin++;
        if (cal.cumpleFin) cumplieronFin++;
      }
    });

    const criticasFaltantes = totalCriticas - criticasCalificadas;
    const ppcInicio = evaluadasInicio > 0 ? Math.round((cumplieronInicio / evaluadasInicio) * 100) : 100;
    const ppcFin = evaluadasFin > 0 ? Math.round((cumplieronFin / evaluadasFin) * 100) : 100;

    return {
      totalSemana,
      totalCriticas,
      criticasCalificadas,
      criticasFaltantes,
      totalCalificadas,
      ppcInicio,
      ppcFin,
      listoParaCierre: criticasFaltantes === 0 && totalCriticas > 0
    };
  }, [actividades, calificaciones, totalCriticas, totalSemana]);

  // Cierre Oficial del Reporte Semanal
  const handleIntentarCerrarReporte = () => {
    const val = BaselineService.validarCierreReporte(actividades, calificaciones);
    if (!val.valido) {
      setValidationErrors(val.errores);
      setFaltantesCriticas(val.faltantesCriticas);
      setFaltantesObs(val.faltantesObservaciones);
      setShowValidationModal(true);
      return;
    }

    // Construir Objeto Oficial de Reporte Semanal
    const reporte: ReporteSemanalBitacora = {
      idReporte: `REP-${proyecto.replace(/\s+/g, '')}-${infoSemana.anio}-W${infoSemana.numeroSemana}-${Date.now()}`,
      proyecto,
      sucursal,
      semana: infoSemana.numeroSemana,
      anio: infoSemana.anio,
      fechaCorte: fechaCorteSeleccionada,
      lunesSemana: infoSemana.lunesStr,
      domingoSemana: infoSemana.domingoStr,
      residente,
      fechaCierre: new Date().toISOString(),
      totalActividades: actividades.length,
      criticasTotales: totalCriticas,
      criticasEvaluadas: statsSemana.criticasCalificadas,
      noCriticasEvaluadas: statsSemana.totalCalificadas - statsSemana.criticasCalificadas,
      cumplimientoInicioPct: statsSemana.ppcInicio,
      cumplimientoFinPct: statsSemana.ppcFin,
      items: actividades.map(act => {
        const cal = calificaciones[act.idConsec] || {
          idConsec: act.idConsec,
          calificado: false,
          cumpleInicio: null,
          cumpleFin: null,
          observaciones: '',
        };
        return {
          ...act,
          ...cal,
        };
      })
    };

    BaselineService.cerrarReporteSemanal(reporte);
    showToast(`¡Reporte Semanal de la Semana ${infoSemana.numeroSemana} cerrado y emitido con éxito! Sincronizado a SharePoint.`, 'success');
    setActiveTab('HISTORICO');
  };

  // Datos para Pareto de Causas de No Cumplimiento
  const paretoData = useMemo(() => {
    const causaCounts: Record<string, { tipo: 'Lookahead (Inicio)' | 'Operativa (Fin)'; count: number }> = {};

    Object.values(calificaciones).forEach(c => {
      if (c.cumpleInicio === false && c.causaNoInicio) {
        const key = c.causaNoInicio;
        if (!causaCounts[key]) causaCounts[key] = { tipo: 'Lookahead (Inicio)', count: 0 };
        causaCounts[key].count += 1;
      }
      if (c.cumpleFin === false && c.causaNoFin) {
        const key = c.causaNoFin;
        if (!causaCounts[key]) causaCounts[key] = { tipo: 'Operativa (Fin)', count: 0 };
        causaCounts[key].count += 1;
      }
    });

    return Object.entries(causaCounts)
      .map(([causa, data]) => ({
        causa,
        count: data.count,
        tipo: data.tipo
      }))
      .sort((a, b) => b.count - a.count);
  }, [calificaciones]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-semibold transition-all duration-300 ${
          toastType === 'success' ? 'bg-emerald-600 text-white' :
          toastType === 'error' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
        }`}>
          {toastType === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Gerencial & Estado de Línea Base */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
              <CheckSquare className="w-4 h-4" />
              <span>Módulo 03 · Bitácora Semanal de Interventoría</span>
              <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[11px]">
                {sucursal} · {proyecto}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Calificación Semanal y Articulación con Ruta Crítica CPM
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Auditoría en campo para el residente de interventoría: califica el cumplimiento de inicio y fin de las actividades programadas en la ventana semanal. 
              <strong> La calificación de las actividades de Ruta Crítica es estrictamente obligatoria</strong> para emitir el reporte semanal.
            </p>
          </div>

          {/* Badge Estado Línea Base */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {tieneLB ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <span>Línea Base Oficial Congelada</span>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {metaLB?.totalTareas || tasks.length} tareas
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Congelada el: {metaLB ? new Date(metaLB.fechaCongelacion).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <button
                  onClick={handleRestablecerLB}
                  className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Restablecer Línea Base"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-900">Sin Línea Base Congelada</div>
                  <span className="text-[11px] text-amber-700 block">
                    Congele esta sábana como marco contractual
                  </span>
                </div>
                <button
                  onClick={() => setShowLbModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors"
                >
                  Congelar LB
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-6 -mb-5 pt-2">
          <button
            onClick={() => setActiveTab('EVALUACION')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'EVALUACION'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Calificación en Campo (Semana Actual)</span>
            <span className="bg-primary-100 text-primary-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {actividades.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORICO')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'HISTORICO'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Histórico de Reportes Cerrados</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {reportesHistoricos.length}
            </span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: EVALUACIÓN SEMANAL */}
      {activeTab === 'EVALUACION' && (
        <div className="space-y-6">
          {/* Barra de Filtro de Semana y Control de Cierre */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Semana de Corte:</span>
              </div>
              <select
                value={fechaCorteSeleccionada}
                onChange={(e) => setFechaCorteSeleccionada(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {semanasDisponibles.map((s, idx) => (
                  <option key={idx} value={s.lunesStr}>
                    {s.etiquetaSemana}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Ventana: <strong>{infoSemana.lunesStr}</strong> al <strong>{infoSemana.domingoStr}</strong>
              </span>
            </div>

            {/* Botón de Cierre de Reporte Semanal */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleIntentarCerrarReporte}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  statsSemana.listoParaCierre
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Cerrar y Emitir Reporte Semanal</span>
                {statsSemana.criticasFaltantes > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {statsSemana.criticasFaltantes} críticas pendientes
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tarjetas KPI de la Semana */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tareas en Ventana</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSemana}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Inician, finalizan o se anticipan
              </div>
            </div>

            <div className={`border rounded-xl p-4 shadow-sm ${
              statsSemana.criticasFaltantes === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={statsSemana.criticasFaltantes === 0 ? 'text-emerald-800' : 'text-red-800'}>
                  Ruta Crítica Obligatoria
                </span>
                <Flame className={`w-4 h-4 ${statsSemana.criticasFaltantes === 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className={`text-2xl font-black ${statsSemana.criticasFaltantes === 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  {statsSemana.criticasCalificadas} / {totalCriticas}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  ({totalCriticas > 0 ? Math.round((statsSemana.criticasCalificadas / totalCriticas) * 100) : 100}%)
                </span>
              </div>
              <div className={`text-[11px] font-semibold mt-0.5 ${statsSemana.criticasFaltantes === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {statsSemana.criticasFaltantes === 0 ? '✓ 100% Calificadas (Cierre Habilitado)' : `⛔ Faltan ${statsSemana.criticasFaltantes} por calificar`}
              </div>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>PPC Inicio (Lookahead)</span>
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {statsSemana.ppcInicio}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cumplimiento de arranques programados
              </div>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>PPC Fin (Operativo)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {statsSemana.ppcFin}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cumplimiento de cierres programados
              </div>
            </div>
          </div>

          {/* Filtros de la Lista de Tareas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-surface-border rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Buscar por EDT, actividad o torre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setFiltroTipo('TODAS')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filtroTipo === 'TODAS'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({actividades.length})
              </button>

              <button
                onClick={() => setFiltroTipo('CRITICAS')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                  filtroTipo === 'CRITICAS'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Ruta Crítica ({totalCriticas})</span>
              </button>

              <button
                onClick={() => setFiltroTipo('PENDIENTES')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filtroTipo === 'PENDIENTES'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Pendientes ({actividades.length - statsSemana.totalCalificadas})
              </button>

              <button
                onClick={() => setFiltroTipo('ANTICIPADAS')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filtroTipo === 'ANTICIPADAS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Anticipadas vs LB
              </button>
            </div>
          </div>

          {/* LISTA DE ACTIVIDADES A CALIFICAR */}
          <div className="space-y-4">
            {actividadesFiltradas.length === 0 ? (
              <div className="bg-white border border-surface-border rounded-xl p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <div className="text-base font-bold text-slate-800">No hay actividades para el filtro seleccionado</div>
                <p className="text-xs text-slate-500 mt-1">
                  En esta semana de corte no hay actividades que cumplan con la condición seleccionada.
                </p>
              </div>
            ) : (
              actividadesFiltradas.map((act) => {
                const cal = calificaciones[act.idConsec] || {
                  idConsec: act.idConsec,
                  calificado: false,
                  cumpleInicio: null,
                  cumpleFin: null,
                  observaciones: '',
                };

                const noCumpleCualquiera = cal.cumpleInicio === false || cal.cumpleFin === false;
                const obsInvalida = noCumpleCualquiera && (!cal.observaciones || cal.observaciones.trim().length < 5);

                return (
                  <div
                    key={act.idConsec}
                    className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all ${
                      act.esCritica
                        ? 'border-l-4 border-l-red-600 border-slate-200'
                        : 'border-l-4 border-l-emerald-500 border-slate-200'
                    }`}
                  >
                    {/* Header de la Actividad */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {act.edt}
                        </span>

                        <span className="bg-blue-50 text-blue-700 font-bold text-[11px] px-2 py-0.5 rounded">
                          {act.agrupacion}
                        </span>

                        {act.esCritica ? (
                          <span className="bg-red-100 text-red-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                            <Flame className="w-3 h-3 text-red-600" />
                            <span>RUTA CRÍTICA · OBLIGATORIA</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 font-semibold text-[11px] px-2 py-0.5 rounded">
                            Holgura: {act.tf} días
                          </span>
                        )}

                        {act.esInicioAnticipado && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            ⚡ Inicio Anticipado vs LB
                          </span>
                        )}
                        {act.esFinAnticipado && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            ⚡ Fin Anticipado vs LB
                          </span>
                        )}
                      </div>

                      {/* Avance WorkPlanner */}
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-slate-400">Avance WP:</span>
                        <div className="flex items-center space-x-1.5 font-black text-slate-900">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(act.w * 100))}%` }}
                            />
                          </div>
                          <span>{Math.round(act.w * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Nombre y Fechas Comparativas */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
                      <div className="lg:col-span-6">
                        <h3 className="text-sm md:text-base font-bold text-slate-900">
                          {act.nombre}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {act.motivoInclusion.map((m, mIdx) => (
                            <span key={mIdx} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                              • {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Caja de Comparación de Fechas: Línea Base vs WorkPlanner Reprogramado */}
                      <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-semibold block uppercase text-[9px]">Línea Base Contractual</span>
                            <div className="font-semibold text-slate-700 mt-0.5">
                              Inicio: <strong className="text-slate-900">{act.comienzoLineaBase || 'N/A'}</strong>
                            </div>
                            <div className="font-semibold text-slate-700">
                              Fin: <strong className="text-slate-900">{act.finLineaBase || 'N/A'}</strong> ({act.duraLineaBase}d)
                            </div>
                          </div>

                          <div>
                            <span className="text-blue-500 font-semibold block uppercase text-[9px]">WorkPlanner Actual</span>
                            <div className="font-semibold text-blue-900 mt-0.5">
                              Comien: <strong>{act.comien}</strong>
                            </div>
                            <div className="font-semibold text-blue-900">
                              Fin: <strong>{act.fin}</strong> ({act.dura}d)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN DE CALIFICACIÓN INTERACTIVA */}
                    <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/60 -mx-4 -mb-4 p-4 rounded-b-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CALIFICACIÓN DE INICIO */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <span>¿Inició en Campo según Programa?</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Programado: {act.comien}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleCalificar(act, 'cumpleInicio', true)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                                cal.cumpleInicio === true
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sí Inició</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCalificar(act, 'cumpleInicio', false)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                                cal.cumpleInicio === false
                                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>No Inició</span>
                            </button>
                          </div>

                          {/* Si NO inició: Selector obligatorio de las 7 Restricciones Lookahead */}
                          {cal.cumpleInicio === false && (
                            <div className="mt-3 pt-2 border-t border-slate-100">
                              <label className="text-[11px] font-bold text-red-700 block mb-1">
                                Causa No Inicio (Restricción Lookahead Lean):
                              </label>
                              <select
                                value={cal.causaNoInicio || ''}
                                onChange={(e) => handleCausaChange(act, 'inicio', e.target.value)}
                                className="w-full bg-red-50/50 border border-red-300 text-xs text-red-900 rounded-lg p-2 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                              >
                                <option value="">-- Seleccione Compuerta Fallida --</option>
                                {RESTRICCIONES_LOOKAHEAD.map((r, rIdx) => (
                                  <option key={rIdx} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* CALIFICACIÓN DE FIN */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <span>¿Finalizó en Campo según Programa?</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Programado: {act.fin}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleCalificar(act, 'cumpleFin', true)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                                cal.cumpleFin === true
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sí Finalizó</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCalificar(act, 'cumpleFin', false)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                                cal.cumpleFin === false
                                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>No Finalizó</span>
                            </button>
                          </div>

                          {/* Si NO finalizó: Selector de Causas Operativas de Fin */}
                          {cal.cumpleFin === false && (
                            <div className="mt-3 pt-2 border-t border-slate-100">
                              <label className="text-[11px] font-bold text-red-700 block mb-1">
                                Causa No Fin (Causa Operativa de Obra):
                              </label>
                              <select
                                value={cal.causaNoFin || ''}
                                onChange={(e) => handleCausaChange(act, 'fin', e.target.value)}
                                className="w-full bg-red-50/50 border border-red-300 text-xs text-red-900 rounded-lg p-2 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                              >
                                <option value="">-- Seleccione Causa Operativa --</option>
                                {CAUSAS_OPERATIVAS_NO_FIN.map((c, cIdx) => (
                                  <option key={cIdx} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Observaciones (OBLIGATORIAS si no cumple inicio o fin) */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-bold flex items-center space-x-1.5 ${
                            noCumpleCualquiera ? 'text-red-700' : 'text-slate-700'
                          }`}>
                            <span>Observaciones del Residente en Campo</span>
                            {noCumpleCualquiera && (
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-black">
                                * OBLIGATORIO POR INCUMPLIMIENTO
                              </span>
                            )}
                          </label>
                          {obsInvalida && (
                            <span className="text-[10px] text-red-600 font-semibold">
                              Debe justificar el motivo del atraso
                            </span>
                          )}
                        </div>

                        <textarea
                          rows={2}
                          placeholder={
                            noCumpleCualquiera
                              ? "Escriba detalladamente el motivo por el cual no se cumplió con el hito o actividad (mínimo 5 caracteres)..."
                              : "Observaciones de seguimiento o notas de obra (opcional)..."
                          }
                          value={cal.observaciones || ''}
                          onChange={(e) => handleObservacionChange(act, e.target.value)}
                          className={`w-full text-xs rounded-lg p-2.5 transition-all ${
                            obsInvalida
                              ? 'bg-red-50 border-2 border-red-500 text-red-900 placeholder-red-400 focus:outline-none ring-2 ring-red-200'
                              : 'bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Gráfico de Pareto de Causas CNC */}
          {paretoData.length > 0 && (
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Análisis de Causas de No Cumplimiento (Pareto CNC)</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Distribución de Restricciones Lookahead y Fallas Operativas
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Identificación de cuellos de botella para retroalimentar la planificación semanal y el módulo Lookahead.
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paretoData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="causa" 
                      angle={-20} 
                      textAnchor="end" 
                      interval={0} 
                      height={45} 
                      tick={{ fontSize: 10, fill: '#64748B' }} 
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#EF4444" radius={[6, 6, 0, 0]} name="Actividades Impactadas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: HISTÓRICO DE REPORTES SEMANALES CERRADOS */}
      {activeTab === 'HISTORICO' && (
        <div className="space-y-6">
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Histórico Oficial de Reportes Semanales Cerrados
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Consolidación de bitácoras semanales auditadas y emitidas por la interventoría con destino a la gerencia y sincronización a SharePoint / Fabric.
            </p>

            {reportesHistoricos.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">Aún no se han cerrado reportes semanales</div>
                <p className="text-xs text-slate-400 mt-1">
                  Califique las actividades de la semana en curso y presione "Cerrar y Emitir Reporte Semanal".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reportesHistoricos.map((rep) => (
                  <div key={rep.idReporte} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-0.5 rounded">
                          Semana {rep.semana} ({rep.anio})
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {rep.lunesSemana} al {rep.domingoSemana}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Cerrado Oficialmente
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Emitido por: <strong>{rep.residente}</strong> · Fecha de Cierre: {new Date(rep.fechaCierre).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Actividades</span>
                        <span className="font-extrabold text-slate-900 text-base">{rep.totalActividades}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Críticas</span>
                        <span className="font-extrabold text-red-600 text-base">{rep.criticasEvaluadas}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">PPC Inicio</span>
                        <span className="font-extrabold text-blue-600 text-base">{rep.cumplimientoInicioPct}%</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">PPC Fin</span>
                        <span className="font-extrabold text-emerald-600 text-base">{rep.cumplimientoFinPct}%</span>
                      </div>
                      <button
                        onClick={() => setReporteSeleccionado(rep)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Detalle de Reporte Histórico */}
          {reporteSeleccionado && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      Detalle de Reporte Semanal · Semana {reporteSeleccionado.semana} ({reporteSeleccionado.anio})
                    </h3>
                    <p className="text-xs text-slate-500">
                      {reporteSeleccionado.proyecto} · {reporteSeleccionado.sucursal} · Cierre: {new Date(reporteSeleccionado.fechaCierre).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setReporteSeleccionado(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1.5"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
                  {reporteSeleccionado.items.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{item.edt} - {item.nombre}</span>
                        <span className={item.esCritica ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {item.esCritica ? '🔴 Ruta Crítica' : '🟢 Holgura'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <strong>Inicio:</strong> {item.cumpleInicio === true ? '✓ Sí Inició' : item.cumpleInicio === false ? `✗ No Inició (${item.causaNoInicio || 'Sin causa'})` : 'No calificado'}
                        </div>
                        <div>
                          <strong>Fin:</strong> {item.cumpleFin === true ? '✓ Sí Finalizó' : item.cumpleFin === false ? `✗ No Finalizó (${item.causaNoFin || 'Sin causa'})` : 'No calificado'}
                        </div>
                      </div>
                      {item.observaciones && (
                        <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 italic">
                          " {item.observaciones} "
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button
                    onClick={() => setReporteSeleccionado(null)}
                    className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CONGELAR LÍNEA BASE */}
      {showLbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Fijar Sábana Actual como Línea Base Oficial
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Al congelar la Línea Base, el sistema guardará las columnas <strong>Comien</strong>, <strong>Fin</strong> y <strong>Dura</strong> de las {tasks.length} tareas del proyecto <strong>{proyecto}</strong> como marco contractual definitivo. 
                Las cargas semanales posteriores conservarán esta línea base para calcular desvíos e identificar inicios y fines anticipados.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-700">
              <div><strong>Proyecto:</strong> {proyecto}</div>
              <div><strong>Tareas a congelar:</strong> {tasks.length}</div>
              <div><strong>Residente Responsable:</strong> {residente}</div>
              <div><strong>Fecha de congelación:</strong> {new Date().toLocaleDateString()}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLbModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCongelarLB}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Confirmar y Congelar Línea Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BLOQUEO DE VALIDACIÓN DE CIERRE */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Bloqueo de Cierre: Calificación Incompleta
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                El reporte semanal de interventoría no puede emitirse porque no cumple con las reglas estrictas de control:
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto text-xs">
              {validationErrors.map((err, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 text-red-900 p-2.5 rounded-lg font-semibold flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}

              {faltantesCriticas.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    Actividades de Ruta Crítica pendientes ({faltantesCriticas.length}):
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {faltantesCriticas.map(f => (
                      <li key={f.idConsec}>
                        <strong>{f.edt}</strong>: {f.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {faltantesObs.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    Actividades con incumplimiento sin justificación ({faltantesObs.length}):
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {faltantesObs.map(f => (
                      <li key={f.idConsec}>
                        <strong>{f.edt}</strong>: {f.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Entendido, completar pendientes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
