import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Layers, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { HitoMacro, WbsItem } from '../../../types';
import { 
  MacroMilestoneService, 
  HITOS_MACRO_LIST, 
  HITO_MACRO_LABELS 
} from '../../../services/macroMilestoneService';

interface BaselineConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WbsItem[];
  proyectoId: string;
  residenteNombre: string;
  onConfirmBaseline: (mapping: Record<HitoMacro, string[]>) => void;
}

export const BaselineConfigModal: React.FC<BaselineConfigModalProps> = ({
  isOpen,
  onClose,
  tasks,
  proyectoId,
  residenteNombre,
  onConfirmBaseline
}) => {
  // Mapeo actual: HitoMacro -> lista de EDTs asignados
  const [mapping, setMapping] = useState<Record<HitoMacro, string[]>>(() => {
    const saved = MacroMilestoneService.loadProjectMapping(proyectoId);
    if (saved) return saved;
    return MacroMilestoneService.generateAutoMapping(tasks);
  });

  const [activeHito, setActiveHito] = useState<HitoMacro>('ESTRUCTURA');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [searchWbsQuery, setSearchWbsQuery] = useState('');

  // Sincronizar mapeo inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const saved = MacroMilestoneService.loadProjectMapping(proyectoId);
      if (saved) {
        setMapping(saved);
      } else {
        const auto = MacroMilestoneService.generateAutoMapping(tasks);
        setMapping(auto);
      }
    }
  }, [isOpen, proyectoId, tasks]);

  // Validación de la regla obligatoria de negocio
  const validation = useMemo(() => {
    return MacroMilestoneService.validateBaselineMapping(mapping);
  }, [mapping]);

  // Mapa de tareas por EDT para búsqueda rápida
  const taskMap = useMemo(() => {
    const map = new Map<string, WbsItem>();
    tasks.forEach(t => map.set(t.edt, t));
    return map;
  }, [tasks]);

  // Tareas asignadas al hito activo filtradas por buscador
  const tareasHitoActivo = useMemo(() => {
    const edts = mapping[activeHito] || [];
    return edts
      .map(edt => taskMap.get(edt))
      .filter((t): t is WbsItem => {
        if (!t) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return t.nombre.toLowerCase().includes(q) || t.edt.toLowerCase().includes(q);
      });
  }, [mapping, activeHito, taskMap, searchTerm]);

  // Tareas disponibles para agregar (que no estén en el hito activo)
  const tareasDisponiblesParaAgregar = useMemo(() => {
    const yaAsignadas = new Set(mapping[activeHito] || []);
    return tasks
      .filter(t => !yaAsignadas.has(t.edt))
      .filter(t => {
        if (!searchWbsQuery) return true;
        const q = searchWbsQuery.toLowerCase();
        return t.nombre.toLowerCase().includes(q) || t.edt.toLowerCase().includes(q);
      })
      .slice(0, 30); // Limitar a 30 resultados para agilidad
  }, [tasks, mapping, activeHito, searchWbsQuery]);

  // Desmarcar / eliminar tarea de un hito
  const handleRemoveTask = (edt: string) => {
    setMapping(prev => ({
      ...prev,
      [activeHito]: (prev[activeHito] || []).filter(item => item !== edt)
    }));
  };

  // Agregar tarea a un hito
  const handleAddTask = (edt: string) => {
    setMapping(prev => {
      const actuales = prev[activeHito] || [];
      if (actuales.includes(edt)) return prev;
      return {
        ...prev,
        [activeHito]: [...actuales, edt]
      };
    });
  };

  // Confirmar y congelar línea base
  const handleConfirm = () => {
    if (!validation.isValid) return;
    MacroMilestoneService.saveProjectMapping(proyectoId, mapping);
    onConfirmBaseline(mapping);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-500/40 text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Configurador de Línea Base y Mapeo de Puntos de Control
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                  {proyectoId}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                El residente debe asociar las tareas de Workplanner a cada punto de control. Regla obligatoria: los puntos de control deben tener tareas asignadas.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VALIDATION BANNER (CONTROL ESTRICTO 13/13 HITOS) */}
        <div className={`px-6 py-3 border-b flex items-center justify-between transition-colors ${
          validation.isValid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {validation.isValid ? 'Requisito de Línea Base Cumplido' : 'Validación Obligatoria Pendiente'}
              </p>
              <p className="text-xs">
                {validation.isValid
                  ? `Se han cubierto todos los Puntos de Control con ${validation.totalTareasAsignadas} tareas asociadas. La Línea Base puede ser establecida.`
                  : `Faltan tareas en ${validation.hitosFaltantes.length} Puntos de Control (${validation.hitosFaltantes.join(', ')}). No se puede establecer la línea base.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              validation.isValid
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}>
              {validation.hitosAsignados} / {validation.totalHitos} Hitos Asignados
            </span>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: 2 COLUMNAS */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: LISTA DE 13 HITOS MACRO */}
          <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Catálogo de Puntos de Control
            </p>
            {HITOS_MACRO_LIST.map(hito => {
              const count = (mapping[hito] || []).length;
              const isSelected = activeHito === hito;
              const hasTasks = count > 0;

              return (
                <button
                  key={hito}
                  onClick={() => setActiveHito(hito)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-sm'
                      : hasTasks
                      ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                      : 'bg-red-50/60 border-red-200 text-red-700 hover:bg-red-100/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {hasTasks ? (
                      <Check className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                    ) : (
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                    )}
                    <span className="truncate">{HITO_MACRO_LABELS[hito]}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : hasTasks
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {count} {count === 1 ? 'tarea' : 'tareas'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* COLUMNA DERECHA: TAREAS ASIGNADAS AL HITO ACTIVO */}
          <div className="w-2/3 flex flex-col overflow-hidden bg-white">
            
            {/* Header del Hito Activo */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{HITO_MACRO_LABELS[activeHito]}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({(mapping[activeHito] || []).length} tareas asociadas)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revise las tareas seleccionadas por el auto-mapeo. Puede desmarcar o agregar tareas de la EDT.
                </p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Vincular Tareas de la EDT
              </button>
            </div>

            {/* Buscador de tareas del hito */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar tareas por nombre o código EDT..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Lista de tareas asociadas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tareasHitoActivo.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-800">
                    No hay tareas asignadas a este punto de control
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Este hito se encuentra vacío. Utilice el botón <strong>"Vincular Tareas de la EDT"</strong> para asociar las actividades correspondientes.
                  </p>
                </div>
              ) : (
                tareasHitoActivo.map(t => (
                  <div
                    key={t.edt}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition group"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                          {t.edt}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {t.nombre}
                        </span>
                        {t.esHito && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium">
                            Hito
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                        <span>Duración: {t.dura || t.duraPrev || 0}d</span>
                        {t.comien && <span>Inicio: {t.comien}</span>}
                        {t.fin && <span>Fin: {t.fin}</span>}
                        {t.responsable && <span>Resp: {t.responsable}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTask(t.edt)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      title="Desasociar esta tarea del hito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Residente responsable: <span className="font-bold text-slate-700">{residenteNombre}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-white transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!validation.isValid}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                validation.isValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Lock className="w-4 h-4" />
              Establecer y Congelar Línea Base
            </button>
          </div>
        </div>

      </div>

      {/* SUB-MODAL: BUSCADOR PARA VINCULAR TAREAS DE LA EDT */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800">
                Vincular Tareas al Hito: {HITO_MACRO_LABELS[activeHito]}
              </h4>
              <button 
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                placeholder="Buscar tareas en la EDT completa (código o nombre)..."
                value={searchWbsQuery}
                onChange={e => setSearchWbsQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tareasDisponiblesParaAgregar.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">
                  No se encontraron tareas adicionales que coincidan con la búsqueda.
                </p>
              ) : (
                tareasDisponiblesParaAgregar.map(t => (
                  <div 
                    key={t.edt}
                    className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-700 mr-2">{t.edt}</span>
                      <span className="text-slate-900 font-medium">{t.nombre}</span>
                    </div>
                    <button
                      onClick={() => handleAddTask(t.edt)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Cerrar Buscador
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

