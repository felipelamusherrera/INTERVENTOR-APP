import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  GitBranch, 
  Layers, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Maximize2, 
  Minimize2, 
  Building2, 
  HelpCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { CpmEngine, CpmTask } from '../../services/cpmEngine';
import initialWbsData from '../../data/wbsBelaterraFull.json';

interface GanttGerencialViewProps {
  selectedProject?: string;
}

export const GanttGerencialView: React.FC<GanttGerencialViewProps> = ({
  selectedProject = 'Belaterra Pietra'
}) => {
  const [allTasks, setAllTasks] = useState<CpmTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroAgrupacion, setFiltroAgrupacion] = useState<string>('TODAS');
  const [filtroCriticidad, setFiltroCriticidad] = useState<'TODAS' | 'CRITICAS' | 'HOLGURA'>('TODAS');
  const [filtroNivelMax, setFiltroNivelMax] = useState<'DEFAULT' | 'NIVEL3'>('DEFAULT');
  const [searchTerm, setSearchTerm] = useState('');

  // Nodos Expandidos en el Árbol
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Tarea seleccionada para el inspector lateral
  const [selectedTask, setSelectedTask] = useState<CpmTask | null>(null);

  // Escala Temporal de Visualización
  const [timeZoom, setTimeZoom] = useState<'MONTHS' | 'QUARTERS' | 'YEARS'>('QUARTERS');

  // 1. Cargar y procesar CPM de tareas
  useEffect(() => {
    try {
      const res = CpmEngine.computeSchedule(initialWbsData as any[]);
      setAllTasks(res.tasks);

      // Expandir por defecto los primeros 3 niveles para que el árbol se visualice ordenado
      const defaultExpanded = new Set<string>();
      res.tasks.forEach(t => {
        const nivel = t.nivel || (t.edt ? t.edt.split('.').length : 1);
        if (nivel <= 3) {
          defaultExpanded.add(t.edt);
        }
      });
      setExpandedNodes(defaultExpanded);
    } catch (e) {
      console.error('Error calculando CPM en Gantt:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lista única de agrupaciones disponibles
  const agrupacionesDisponibles = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach(t => {
      if (t.agrupacion && t.agrupacion !== 'NO APLICA') {
        set.add(t.agrupacion);
      }
    });
    return Array.from(set).sort();
  }, [allTasks]);

  // 2. Filtro de Nivel Jerárquico:
  // Máximo Nivel 6 EDT para agrupaciones "TORRE", máximo Nivel 5 EDT para las demás
  const tareasPermitidasPorNivel = useMemo(() => {
    return allTasks.filter(t => {
      const nivel = t.nivel || (t.edt ? t.edt.split('.').length : 1);
      const isTorre = (t.agrupacion || '').toUpperCase().includes('TORRE');

      if (filtroNivelMax === 'NIVEL3') {
        return nivel <= 3;
      }

      // Regla de Negocio Gerencial
      if (isTorre) {
        return nivel <= 6;
      }
      return nivel <= 5;
    });
  }, [allTasks, filtroNivelMax]);

  // Mapa de hijos para detectar quién tiene ramas colapsables
  const hasChildrenMap = useMemo(() => {
    const map = new Map<string, boolean>();
    tareasPermitidasPorNivel.forEach(t => {
      if (t.edt) {
        const parts = t.edt.split('.');
        if (parts.length > 1) {
          const parentEdt = parts.slice(0, -1).join('.');
          map.set(parentEdt, true);
        }
      }
    });
    return map;
  }, [tareasPermitidasPorNivel]);

  // 3. Filtrar según estado de colapso y búsqueda
  const visibleTasks = useMemo(() => {
    return tareasPermitidasPorNivel.filter(t => {
      // Filtro de Agrupación
      if (filtroAgrupacion !== 'TODAS' && t.agrupacion !== filtroAgrupacion) {
        return false;
      }

      // Filtro de Criticidad
      if (filtroCriticidad === 'CRITICAS' && !t.esCritica) return false;
      if (filtroCriticidad === 'HOLGURA' && t.esCritica) return false;

      // Filtro de Búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = 
          t.nombre.toLowerCase().includes(term) ||
          t.edt.toLowerCase().includes(term) ||
          (t.agrupacion && t.agrupacion.toLowerCase().includes(term));
        if (!match) return false;
        // Si coincide con búsqueda, se muestra aunque su ancestro esté colapsado
        return true;
      }

      // Comprobar si algún ancestro está colapsado en el árbol
      if (t.edt) {
        const parts = t.edt.split('.');
        for (let i = 1; i < parts.length; i++) {
          const ancestorEdt = parts.slice(0, i).join('.');
          if (!expandedNodes.has(ancestorEdt)) {
            return false; // Uno de sus padres está colapsado
          }
        }
      }

      return true;
    });
  }, [tareasPermitidasPorNivel, filtroAgrupacion, filtroCriticidad, searchTerm, expandedNodes]);

  // 4. Cálculo de Escala Temporal (Inicio y Fin Global)
  const timelineBounds = useMemo(() => {
    if (!visibleTasks.length) {
      const now = new Date();
      return { minTime: now.getTime(), maxTime: now.getTime() + 86400000 * 365, totalDays: 365 };
    }

    let min = Infinity;
    let max = -Infinity;

    visibleTasks.forEach(t => {
      if (t.comien) {
        const c = new Date(t.comien).getTime();
        if (c < min) min = c;
      }
      if (t.fin) {
        const f = new Date(t.fin).getTime();
        if (f > max) max = f;
      }
    });

    if (min === Infinity) min = Date.now();
    if (max === -Infinity) max = min + 86400000 * 365;

    // Margen de 15 días a cada lado
    const minTime = min - 86400000 * 15;
    const maxTime = max + 86400000 * 15;
    const totalDays = Math.max(1, Math.round((maxTime - minTime) / 86400000));

    return { minTime, maxTime, totalDays };
  }, [visibleTasks]);

  // Generar columnas temporales para el encabezado del Gantt
  const timelineColumns = useMemo(() => {
    const { minTime, maxTime } = timelineBounds;
    const start = new Date(minTime);
    const end = new Date(maxTime);
    const cols: Array<{ label: string; subLabel: string; leftPct: number; widthPct: number }> = [];

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const totalDuration = maxTime - minTime;

    while (cursor <= end) {
      const currentStart = cursor.getTime();
      let nextCursor: Date;

      if (timeZoom === 'MONTHS') {
        nextCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      } else if (timeZoom === 'QUARTERS') {
        nextCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
      } else {
        nextCursor = new Date(cursor.getFullYear() + 1, 0, 1);
      }

      const currentEnd = nextCursor.getTime();
      const leftPct = Math.max(0, ((currentStart - minTime) / totalDuration) * 100);
      const rightPct = Math.min(100, ((currentEnd - minTime) / totalDuration) * 100);
      const widthPct = Math.max(0, rightPct - leftPct);

      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const qNum = Math.floor(cursor.getMonth() / 3) + 1;

      let label = '';
      let subLabel = '';

      if (timeZoom === 'MONTHS') {
        label = `${meses[cursor.getMonth()]}`;
        subLabel = `${cursor.getFullYear()}`;
      } else if (timeZoom === 'QUARTERS') {
        label = `T${qNum} ${cursor.getFullYear()}`;
        subLabel = `${meses[cursor.getMonth()]} - ${meses[(cursor.getMonth() + 2) % 12]}`;
      } else {
        label = `${cursor.getFullYear()}`;
        subLabel = 'Año Fiscal';
      }

      if (widthPct > 0) {
        cols.push({ label, subLabel, leftPct, widthPct });
      }

      cursor.setTime(nextCursor.getTime());
    }

    return cols;
  }, [timelineBounds, timeZoom]);

  // Toggle de Nodo
  const toggleNode = (edt: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(edt)) {
        next.delete(edt);
      } else {
        next.add(edt);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    tareasPermitidasPorNivel.forEach(t => {
      if (t.edt) all.add(t.edt);
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    // Colapsar a nivel 2
    const n2 = new Set<string>();
    tareasPermitidasPorNivel.forEach(t => {
      const nivel = t.nivel || (t.edt ? t.edt.split('.').length : 1);
      if (nivel <= 2 && t.edt) n2.add(t.edt);
    });
    setExpandedNodes(n2);
  };

  // KPIs
  const totalCriticas = visibleTasks.filter(t => t.esCritica).length;
  const totalHolgura = visibleTasks.filter(t => !t.esCritica).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Diagrama de Gantt Gerencial & Ruta Crítica CPM</span>
              <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[11px]">
                {selectedProject}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Cronograma Ejecutivo Desplegable por EDT
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Estructura desglosada con tope normativo: <strong>Máximo Nivel 6 EDT en agrupación "TORRE"</strong> y <strong>Máximo Nivel 5 EDT en las demás agrupaciones</strong>. 
              Coloreado de alta visibilidad: <strong className="text-red-600">🔴 Tareas Críticas (TF ≤ 0)</strong> y <strong className="text-emerald-600">🟢 Tareas con Holgura (TF &gt; 0)</strong>.
            </p>
          </div>

          {/* Acciones de Expansión Global */}
          <div className="flex items-center space-x-2 text-xs font-bold">
            <button
              onClick={expandAll}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expandir Todos</span>
            </button>

            <button
              onClick={collapseAll}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Colapsar a Nivel 2</span>
            </button>
          </div>
        </div>

        {/* KPIs Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Tareas Visibles en Gantt</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{visibleTasks.length}</span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="text-red-700 font-semibold block uppercase text-[10px] flex items-center space-x-1">
              <Flame className="w-3 h-3 text-red-600" />
              <span>En Ruta Crítica (TF ≤ 0)</span>
            </span>
            <span className="text-xl font-black text-red-900 mt-0.5 block">{totalCriticas}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <span className="text-emerald-700 font-semibold block uppercase text-[10px]">Con Holgura Positiva (TF &gt; 0)</span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">{totalHolgura}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Horizonte Temporal</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">
              {visibleTasks.length > 0 ? `${new Date(timelineBounds.minTime).toLocaleDateString()} al ${new Date(timelineBounds.maxTime).toLocaleDateString()}` : 'Sin datos'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Zoom Temporal */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por EDT o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
            />
          </div>

          {/* Filtro de Agrupación */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-bold text-slate-600">Agrupación:</span>
            <select
              value={filtroAgrupacion}
              onChange={(e) => setFiltroAgrupacion(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="TODAS">Todas las Agrupaciones</option>
              {agrupacionesDisponibles.map((a, idx) => (
                <option key={idx} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Criticidad */}
          <div className="flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setFiltroCriticidad('TODAS')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                filtroCriticidad === 'TODAS'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroCriticidad('CRITICAS')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                filtroCriticidad === 'CRITICAS'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Ruta Crítica 🔴</span>
            </button>
            <button
              onClick={() => setFiltroCriticidad('HOLGURA')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                filtroCriticidad === 'HOLGURA'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Con Holgura 🟢
            </button>
          </div>

          {/* Filtro de Profundidad */}
          <div className="flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setFiltroNivelMax(filtroNivelMax === 'DEFAULT' ? 'NIVEL3' : 'DEFAULT')}
              className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                filtroNivelMax === 'NIVEL3'
                  ? 'bg-primary-50 text-primary-800 border-primary-300 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              {filtroNivelMax === 'NIVEL3' ? 'Vista: Nivel 3 (Resumen)' : 'Vista: Nivel 6 Torre / 5 Otras'}
            </button>
          </div>
        </div>

        {/* Zoom de Escala Temporal */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-500">Zoom:</span>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 font-bold">
            <button
              onClick={() => setTimeZoom('MONTHS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeZoom === 'MONTHS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Meses
            </button>
            <button
              onClick={() => setTimeZoom('QUARTERS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeZoom === 'QUARTERS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trimestres
            </button>
            <button
              onClick={() => setTimeZoom('YEARS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeZoom === 'YEARS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Años
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DEL GANTT: ÁRBOL JERÁRQUICO A LA IZQUIERDA Y BARRAS A LA DERECHA */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Contenedor con Scroll Horizontal */}
        <div className="overflow-x-auto">
          <div className="min-w-[1100px] flex flex-col">
            {/* Header del Gantt: Columnas Fijas y Eje Temporal */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20 text-xs font-bold text-slate-700 select-none">
              {/* Columnas Fijas (440px) */}
              <div className="w-[440px] flex-shrink-0 flex items-center border-r border-slate-200 px-4 py-3">
                <span className="w-24">EDT</span>
                <span className="flex-1">Actividad / Hito</span>
                <span className="w-16 text-center">Avance</span>
                <span className="w-16 text-right">TF (Días)</span>
              </div>

              {/* Encabezado Temporal (Timeline Columns) */}
              <div className="flex-1 relative h-12 overflow-hidden">
                {timelineColumns.map((col, idx) => (
                  <div
                    key={idx}
                    style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                    className="absolute top-0 bottom-0 border-r border-slate-200/80 px-2 py-1.5 flex flex-col justify-center text-[11px] overflow-hidden"
                  >
                    <span className="font-bold text-slate-800 truncate">{col.label}</span>
                    <span className="text-[9px] text-slate-400 font-normal truncate">{col.subLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filas del Gantt */}
            <div className="divide-y divide-slate-100">
              {visibleTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <div className="font-bold text-slate-700 text-sm">No hay actividades visibles</div>
                  <p className="text-xs text-slate-400 mt-0.5">Pruebe ajustando los filtros de búsqueda o agrupación.</p>
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const nivel = task.nivel || (task.edt ? task.edt.split('.').length : 1);
                  const isExpanded = expandedNodes.has(task.edt);
                  const hasChildren = hasChildrenMap.get(task.edt) || false;
                  const isSelected = selectedTask?.idConsec === task.idConsec;

                  // Cálculo de posición en el Timeline
                  const { minTime, maxTime } = timelineBounds;
                  const totalDuration = maxTime - minTime;

                  const taskStart = task.comien ? new Date(task.comien).getTime() : minTime;
                  const taskEnd = task.fin ? new Date(task.fin).getTime() : taskStart + (task.dura * 86400000);

                  const leftPct = Math.max(0, Math.min(100, ((taskStart - minTime) / totalDuration) * 100));
                  const rightPct = Math.max(0, Math.min(100, ((taskEnd - minTime) / totalDuration) * 100));
                  const widthPct = Math.max(0.6, rightPct - leftPct);

                  // Indentación según nivel
                  const indentPx = Math.min(80, (nivel - 1) * 14);

                  return (
                    <div
                      key={task.idConsec}
                      onClick={() => setSelectedTask(task)}
                      className={`flex items-center hover:bg-slate-50/80 transition-colors cursor-pointer group text-xs ${
                        isSelected ? 'bg-blue-50/70' : ''
                      } ${task.type === 'project' ? 'font-bold bg-slate-50/40' : ''}`}
                    >
                      {/* Columna Izquierda: Información de Tarea */}
                      <div className="w-[440px] flex-shrink-0 flex items-center border-r border-slate-200 px-3 py-2">
                        {/* EDT y Botón de Toggle Expand/Collapse */}
                        <div className="w-24 flex items-center space-x-1 flex-shrink-0">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(task.edt);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <div className="w-5" />
                          )}
                          <span className="font-mono text-[11px] text-slate-500 font-semibold truncate">
                            {task.edt}
                          </span>
                        </div>

                        {/* Nombre con sangría jerárquica */}
                        <div 
                          className="flex-1 truncate pr-2 flex items-center space-x-1.5"
                          style={{ paddingLeft: `${indentPx}px` }}
                        >
                          <span className={`truncate ${task.esCritica ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                            {task.nombre}
                          </span>
                          {task.agrupacion && task.agrupacion !== 'NO APLICA' && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded flex-shrink-0">
                              {task.agrupacion}
                            </span>
                          )}
                        </div>

                        {/* Avance */}
                        <div className="w-16 text-center text-[11px] font-mono font-semibold text-slate-600">
                          {Math.round(task.w * 100)}%
                        </div>

                        {/* Holgura Total (TF) */}
                        <div className="w-16 text-right pr-2">
                          {task.esCritica ? (
                            <span className="inline-block bg-red-100 text-red-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              {task.tf} d
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              +{task.tf} d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Columna Derecha: Barra de Gantt en el Timeline */}
                      <div className="flex-1 relative h-9 flex items-center overflow-hidden">
                        {/* Líneas guía de fondo coincidentes con las columnas */}
                        {timelineColumns.map((col, idx) => (
                          <div
                            key={idx}
                            style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                            className="absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none"
                          />
                        ))}

                        {/* Render de Barra de Gantt */}
                        {task.esHito || task.dura === 0 ? (
                          // Rombo de Hito
                          <div
                            style={{ left: `${leftPct}%` }}
                            className="absolute transform -translate-x-1/2 flex items-center justify-center"
                            title={`${task.nombre} (Hito: ${task.fin})`}
                          >
                            <div className={`w-3.5 h-3.5 rotate-45 border shadow-xs ${
                              task.esCritica ? 'bg-red-600 border-red-700' : 'bg-emerald-600 border-emerald-700'
                            }`} />
                          </div>
                        ) : task.type === 'project' ? (
                          // Barra Resumen Estilo Project (Corchete Superior)
                          <div
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className="absolute h-3.5 rounded-xs flex items-center overflow-hidden shadow-2xs"
                            title={`${task.nombre} (${task.comien} al ${task.fin})`}
                          >
                            <div className={`w-full h-full flex flex-col justify-between ${
                              task.esCritica ? 'bg-red-800' : 'bg-slate-700'
                            }`}>
                              <div className="w-full h-1 bg-white/30" />
                              <div 
                                className="h-1.5 bg-white/50" 
                                style={{ width: `${Math.min(100, Math.round(task.w * 100))}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          // Barra de Tarea Estándar
                          <div
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute h-5 rounded-md flex items-center px-1 overflow-hidden shadow-xs transition-all group-hover:ring-2 ${
                              task.esCritica
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white group-hover:ring-red-400'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white group-hover:ring-emerald-400'
                            }`}
                            title={`${task.nombre} (${task.comien} al ${task.fin}) | Holgura: ${task.tf}d`}
                          >
                            {/* Barra interna de progreso */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-black/25 pointer-events-none rounded-l-md"
                              style={{ width: `${Math.min(100, Math.round(task.w * 100))}%` }}
                            />
                            <span className="relative z-10 text-[10px] font-bold text-white/95 truncate">
                              {task.dura}d
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INSPECTOR LATERAL / MODAL DE DETALLES DE ACTIVIDAD SELECCIONADA */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                  {selectedTask.edt}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                  {selectedTask.agrupacion}
                </span>
                {selectedTask.esCritica ? (
                  <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-red-600" />
                    <span>RUTA CRÍTICA</span>
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Holgura: +{selectedTask.tf} días
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{selectedTask.nombre}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nivel EDT: <strong>{selectedTask.nivel}</strong> · Tipo: <strong>{selectedTask.type}</strong>
              </p>
            </div>

            {/* Cuadro de Fechas y CPM */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Fechas Oficiales WorkPlanner</span>
                <div className="text-slate-700 mt-1">
                  Comien: <strong className="text-slate-900">{selectedTask.comien}</strong>
                </div>
                <div className="text-slate-700">
                  Fin: <strong className="text-slate-900">{selectedTask.fin}</strong>
                </div>
                <div className="text-slate-700">
                  Duración: <strong className="text-slate-900">{selectedTask.dura} días</strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Métricas CPM Calculadas</span>
                <div className="text-slate-700 mt-1">
                  Fin Tardío (LF): <strong>{selectedTask.lateFinishDate || 'N/A'}</strong>
                </div>
                <div className="text-slate-700">
                  Holgura Total (TF): <strong className={selectedTask.esCritica ? 'text-red-600' : 'text-emerald-600'}>{selectedTask.tf} días</strong>
                </div>
                <div className="text-slate-700">
                  Holgura Libre (FF): <strong>{selectedTask.ff} días</strong>
                </div>
              </div>
            </div>

            {/* Precedencias */}
            <div className="text-xs">
              <span className="font-bold text-slate-700 block mb-1">Predecesoras en Red:</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                {selectedTask.predecesoraRaw || 'Ninguna (Inicio de red)'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Avance actual: <strong>{Math.round(selectedTask.w * 100)}%</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
