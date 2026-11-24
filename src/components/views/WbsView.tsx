import React, { useState, useEffect, useMemo } from 'react';
import {
  ListTree,
  Upload,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  TrendingDown,
  Calendar,
  CloudUpload,
  Building2,
  X,
  Info,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { WbsItem } from '../../types';
import {
  parseScheduleCsv,
  parseScheduleExcel,
  parseFechasAlistamientoExcel,
  parseFechasAlistamientoCsv,
} from '../../services/wbsParser';
import {
  ScheduleService,
  ScheduleMetadata,
  CorteProgramacion,
  WbsAssignmentsState,
  TowerNormalizationAudit,
  FechasAlistamientoState,
} from '../../services/scheduleService';
import { CpmEngine, CpmProjectSummary } from '../../services/cpmEngine';
import { BaselineService } from '../../services/baselineService';
import {
  WBS_HITOS_MACRO_OPTIONS,
  BASE_HITOS_MACRO_CPC_CATALOG,
  getHitoMacroDisplayLabel,
} from '../../services/macroMilestoneService';
import { SHAREPOINT_LISTS } from '../../services/sharepointService';
import { ProjectService } from '../../services/projectService';
import { AuthService } from '../../services/authService';
import { ContratistaSelector } from '../common/ContratistaSelector';
import { WbsGanttTab } from './wbs/WbsGanttTab';
import { WbsDesviacionesTab } from './wbs/WbsDesviacionesTab';
import { WbsMatrizTable } from './wbs/WbsMatrizTable';

interface WbsViewProps {
  selectedProject?: string;
  selectedTower?: string;
}

export const WbsView: React.FC<WbsViewProps> = ({
  selectedProject = '',
}) => {
  const projectObj = ProjectService.getProjectById(selectedProject);
  const projectLabel = projectObj?.nombreJde || selectedProject || 'Sin proyecto';

  const [activeSubTab, setActiveSubTab] = useState<'EDT' | 'GANTT' | 'DESVIACIONES'>('EDT');

  // Cortes y cronograma (exclusivamente sábanas reales cargadas por el usuario)
  const [cortes, setCortes] = useState<CorteProgramacion[]>(() =>
    ScheduleService.getCortes(selectedProject)
  );
  const [selectedCorteId, setSelectedCorteId] = useState<string>(() => {
    const list = ScheduleService.getCortes(selectedProject);
    return list[list.length - 1]?.id || '';
  });

  const [metadata, setMetadata] = useState<ScheduleMetadata>(() =>
    ScheduleService.getScheduleMetadata(selectedProject)
  );
  const [assignments, setAssignments] = useState<WbsAssignmentsState>(() =>
    ScheduleService.getWbsAssignments(selectedProject)
  );
  const [lbMap, setLbMap] = useState(() =>
    selectedProject ? BaselineService.getLineaBase(selectedProject) : null
  );
  const [fechasAlistamiento, setFechasAlistamiento] = useState<FechasAlistamientoState | null>(() =>
    ScheduleService.getFechasAlistamiento(selectedProject)
  );

  // Carga pendiente de Workplanner + auditoría de torres
  const [pendingUpload, setPendingUpload] = useState<{
    tasks: WbsItem[];
    fileName: string;
    audit: TowerNormalizationAudit;
  } | null>(null);
  const [fechaCargaRef, setFechaCargaRef] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [duplicateAlertMsg, setDuplicateAlertMsg] = useState<string | null>(null);
  const [lastTowerAudit, setLastTowerAudit] = useState<TowerNormalizationAudit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Selector Modal de Contratista (AN8 + Marval Ingeniería)
  const [contratistaModalTask, setContratistaModalTask] = useState<WbsItem | null>(null);
  const [contratistaTempVal, setContratistaTempVal] = useState<string>('');
  const [propagarContratistaHijas, setPropagarContratistaHijas] = useState<boolean>(true);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Corte visualizado actualmente en la tabla EDT
  const corteActivo = useMemo(() => {
    return cortes.find((c) => c.id === selectedCorteId) || cortes[cortes.length - 1] || null;
  }, [cortes, selectedCorteId]);

  // Si hay una primera sábana cargada en borrador sin congelar aún, permitir previsualizarla en la tabla
  const tasks: WbsItem[] = useMemo(() => {
    if (corteActivo?.tasks?.length) return corteActivo.tasks;
    if (pendingUpload?.tasks?.length && !metadata.tieneLineaBase) return pendingUpload.tasks;
    return ScheduleService.getActiveSchedule(selectedProject);
  }, [corteActivo, pendingUpload, metadata.tieneLineaBase, selectedProject]);

  // Re-auditar torres faltantes contra Parámetros del proyecto sobre las tareas actuales
  const liveTowerAudit = useMemo(() => {
    if (!selectedProject || tasks.length === 0) return null;
    return ScheduleService.normalizeAndAuditTowers(selectedProject, tasks);
  }, [selectedProject, tasks]);

  // CPM calculado sobre las tareas del corte actual
  const { cpmSummary, criticalEdtSet } = useMemo(() => {
    if (tasks.length === 0) {
      return { cpmSummary: null, criticalEdtSet: new Set<string>() };
    }
    try {
      const cpm = CpmEngine.computeSchedule(tasks as any[]);
      const critSet = new Set<string>();
      cpm.tasks.forEach((t) => {
        if (t.esCritica) {
          critSet.add(t.edt);
          if (t.edt && t.edt.includes('.')) {
            const parts = t.edt.split('.');
            for (let i = 1; i < parts.length; i++) {
              critSet.add(parts.slice(0, i).join('.'));
            }
          }
        }
      });
      return { cpmSummary: cpm.summary as CpmProjectSummary, criticalEdtSet: critSet };
    } catch (e) {
      console.error('Error calculando CPM en Programación & EDT:', e);
      return { cpmSummary: null, criticalEdtSet: new Set<string>() };
    }
  }, [tasks]);

  // Escuchar actualizaciones globales
  useEffect(() => {
    const refreshAll = () => {
      const latestCortes = ScheduleService.getCortes(selectedProject);
      setCortes(latestCortes);
      setSelectedCorteId((prev) =>
        latestCortes.some((c) => c.id === prev)
          ? prev
          : latestCortes[latestCortes.length - 1]?.id || ''
      );
      setMetadata(ScheduleService.getScheduleMetadata(selectedProject));
      setAssignments(ScheduleService.getWbsAssignments(selectedProject));
      setLbMap(selectedProject ? BaselineService.getLineaBase(selectedProject) : null);
      setFechasAlistamiento(ScheduleService.getFechasAlistamiento(selectedProject));
    };

    refreshAll();
    window.addEventListener('schedule_updated', refreshAll);
    window.addEventListener('marval_wbs_assignments_updated', refreshAll);
    window.addEventListener('marval_baseline_updated', refreshAll);
    window.addEventListener('marval_alistamiento_updated', refreshAll);
    window.addEventListener('marval_projects_updated', refreshAll);
    return () => {
      window.removeEventListener('schedule_updated', refreshAll);
      window.removeEventListener('marval_wbs_assignments_updated', refreshAll);
      window.removeEventListener('marval_baseline_updated', refreshAll);
      window.removeEventListener('marval_alistamiento_updated', refreshAll);
      window.removeEventListener('marval_projects_updated', refreshAll);
    };
  }, [selectedProject]);

  // Cobertura de los 15 Hitos Macro
  const hitosCoverage = useMemo(() => {
    const covered = new Set<string>();
    tasks.forEach((t) => {
      const tipoNorm = (t.tipo || '').toLowerCase();
      if (tipoNorm === 'task' || tipoNorm === 'milestone') {
        const h = assignments.hitoByEdt[t.edt];
        if (h) covered.add(getHitoMacroDisplayLabel(h));
      }
    });
    return {
      coveredCount: covered.size,
      totalHitos: WBS_HITOS_MACRO_OPTIONS.length,
      missing: WBS_HITOS_MACRO_OPTIONS.filter((h) => !covered.has(h)),
    };
  }, [tasks, assignments]);

  const semanaPreview = useMemo(
    () => BaselineService.getSemanaCorte(fechaCargaRef),
    [fechaCargaRef]
  );

  const duplicateInSelectedWeek = useMemo(() => {
    if (!selectedProject || !metadata.tieneLineaBase) return null;
    return ScheduleService.findCorteDuplicadoEnSemana(selectedProject, fechaCargaRef);
  }, [selectedProject, metadata.tieneLineaBase, fechaCargaRef, cortes]);

  // Carga de Excel/CSV Workplanner (ÚNICO punto de carga en toda la app)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setDuplicateAlertMsg(null);
    const reader = new FileReader();
    const processTasks = (parsedTasks: WbsItem[]) => {
      if (parsedTasks.length === 0) {
        showToast('No se pudieron extraer tareas válidas del archivo Workplanner.', 'error');
        return;
      }
      // Normalización preventiva de agrupaciones "TORRE" a 2 dígitos + detección de faltantes
      const audit = ScheduleService.normalizeAndAuditTowers(selectedProject, parsedTasks);
      setLastTowerAudit(audit);
      setPendingUpload({
        tasks: audit.normalizedTasks,
        fileName: file.name,
        audit,
      });

      // Si ya existe Línea Base, esta es la 2ª sábana en adelante -> validar duplicado o abrir confirmación preventiva
      if (metadata.tieneLineaBase) {
        const dup = ScheduleService.findCorteDuplicadoEnSemana(selectedProject, fechaCargaRef);
        if (dup) {
          setDuplicateAlertMsg(
            `Rechazo de carga duplicada: ya se registró una sábana para "${dup.etiqueta}". No es posible cargar más de una sábana en la misma semana.`
          );
          setShowConfirmModal(false);
        } else {
          setShowConfirmModal(true);
        }
      } else {
        // Primera sábana: mostrar confirmación preventiva para Congelar Línea Base
        setShowConfirmModal(true);
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          const parsed = parseScheduleExcel(arrayBuffer);
          processTasks(parsed.tasks);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const parsed = parseScheduleCsv(content);
          processTasks(parsed.tasks);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleConfirmSaveUpload = () => {
    if (!pendingUpload || !selectedProject) return;
    const esLineaBase = !metadata.tieneLineaBase;

    if (!esLineaBase) {
      const dup = ScheduleService.findCorteDuplicadoEnSemana(selectedProject, fechaCargaRef);
      if (dup) {
        setDuplicateAlertMsg(
          `Rechazo de carga duplicada: ya se registró una sábana para "${dup.etiqueta}". No se permite cargar más de una sábana en la misma semana.`
        );
        setShowConfirmModal(false);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      const res = ScheduleService.saveCorteProgramacion({
        proyecto: selectedProject,
        tasks: pendingUpload.tasks,
        fileName: pendingUpload.fileName,
        esLineaBase,
        fechaCorte: fechaCargaRef,
        usuario: currentUser?.nombre || 'Residente de Interventoría',
      });

      if (!res.success) {
        if (res.duplicateRejected) {
          setDuplicateAlertMsg(res.message);
        }
        showToast(res.message, 'error');
        setShowConfirmModal(false);
        return;
      }

      const updatedCortes = ScheduleService.getCortes(selectedProject);
      setCortes(updatedCortes);
      if (res.corte) {
        setSelectedCorteId(res.corte.id);
      }
      setMetadata(ScheduleService.getScheduleMetadata(selectedProject));
      setAssignments(ScheduleService.getWbsAssignments(selectedProject));
      setLbMap(BaselineService.getLineaBase(selectedProject));
      if (res.towerAudit) setLastTowerAudit(res.towerAudit);
      setPendingUpload(null);
      setShowConfirmModal(false);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(`Error al procesar: ${err.message || String(err)}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Carga del archivo de Fechas de Alistamiento confirmadas por Gerencia
  const handleFechasAlistamientoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    const currentUser = AuthService.getCurrentUser();
    const reader = new FileReader();
    const saveRecords = (records: ReturnType<typeof parseFechasAlistamientoExcel>) => {
      if (records.length === 0) {
        showToast(
          'No se detectaron filas válidas en el archivo. Verifique las columnas "AgrupacionWorkPlanner" y "AlistamientConfirmadoGerente(C)".',
          'error'
        );
        return;
      }
      const res = ScheduleService.saveFechasAlistamiento({
        proyecto: selectedProject,
        fileName: file.name,
        records,
        usuario: currentUser?.nombre || 'Residente de Interventoría',
      });
      if (res.success) {
        setFechasAlistamiento(res.state || null);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          saveRecords(parseFechasAlistamientoExcel(buffer));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          saveRecords(parseFechasAlistamientoCsv(content));
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const tieneAlistamiento = Boolean(fechasAlistamiento && fechasAlistamiento.records.length > 0);
  const paso2Completo = metadata.tieneLineaBase && tieneAlistamiento;

  // Cambio de Hito Macro inline
  const handleChangeHitoMacro = (row: WbsItem, nuevoHito: string) => {
    const { updatedCount, assignments: nextAssign } = ScheduleService.assignHitoMacroToEdt(
      selectedProject,
      row.edt,
      nuevoHito,
      tasks
    );
    setAssignments(nextAssign);
    const isSummary = (row.tipo || '').toLowerCase() !== 'task';
    if (isSummary && nuevoHito) {
      showToast(
        `Punto de Control "${getHitoMacroDisplayLabel(nuevoHito)}" asignado y propagado a ${updatedCount} tarea(s) tipo "task" de [${row.edt}].`,
        'success'
      );
    } else {
      showToast(`Punto de Control actualizado en [${row.edt}].`, 'success');
    }
  };

  // Modal de asignación de Contratista AN8
  const handleOpenContratistaModal = (row: WbsItem) => {
    const current = assignments.contratistaByEdt[row.edt] || row.responsable || '';
    setContratistaModalTask(row);
    setContratistaTempVal(current);
    setPropagarContratistaHijas((row.tipo || '').toLowerCase() !== 'task');
  };

  const handleConfirmContratistaModal = () => {
    if (!contratistaModalTask) return;
    const nextAssign = ScheduleService.assignContratistaToEdt(
      selectedProject,
      contratistaModalTask.edt,
      contratistaTempVal,
      tasks,
      propagarContratistaHijas
    );
    setAssignments(nextAssign);
    showToast(
      `Contratista actualizado en [${contratistaModalTask.edt}] (conectado con Bitácora Semanal).`,
      'success'
    );
    setContratistaModalTask(null);
  };

  const missingTorres =
    pendingUpload?.audit.missingTorresInParam ||
    liveTowerAudit?.missingTorresInParam ||
    lastTowerAudit?.missingTorresInParam ||
    [];

  const renamedGroups =
    pendingUpload?.audit.renamedGroups || lastTowerAudit?.renamedGroups || [];

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center space-x-3 text-xs font-bold max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Aviso Informativo Permanente de Operación Semanal (Viernes / Sábados) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold">Proceso de seguimiento semanal en la plataforma: </span>
          Este módulo es la <strong>única fuente de carga del Workplanner</strong> para todo el proyecto. Después de congelar la primera sábana como Línea Base, cargue semanalmente la sábana actualizada los días{' '}
          <strong>viernes o sábados</strong> para registrar los nuevos avances bajo la semana (ventana) correspondiente.
        </div>
      </div>

      {/* Tutorial Paso a Paso cuando aún falta Línea Base Congelada o Fechas de Alistamiento */}
      {!paso2Completo && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tutorial Paso 2 · Línea Base Workplanner + Fechas de Alistamiento Gerencia</span>
              </div>
              <h3 className="text-lg font-extrabold mt-0.5">
                Complete los 2 archivos obligatorios de {projectLabel} para habilitar la plataforma
              </h3>
              <p className="text-xs text-blue-100/85 mt-1 max-w-3xl">
                Para habilitar las Pestañas 2 y 3 de este módulo y todos los módulos operativos del Residente, cargue y congele la{' '}
                <strong>1ª sábana de Workplanner</strong> y adjunte el archivo de{' '}
                <strong>Fechas de Alistamiento (Gerencia)</strong>. Si ya cargó su Línea Base, puede subir las Fechas de Alistamiento sin perder los datos registrados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!metadata.tieneLineaBase && (
                <label className="inline-flex items-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-lg transition">
                  <Upload className="w-4 h-4" />
                  <span>1. Cargar 1ª sábana (.xlsx / .csv)</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {!tieneAlistamiento && (
                <label className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-lg transition">
                  <Calendar className="w-4 h-4" />
                  <span>2. Cargar Fechas de Alistamiento (.xlsx / .csv)</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFechasAlistamientoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-3 border-t border-white/15">
            <div className="p-3 rounded-xl bg-white/10 border border-white/15">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sky-300">2A · 1ª Sábana Workplanner</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    metadata.tieneLineaBase ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {metadata.tieneLineaBase ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80 mt-1">
                Congela la <strong>Línea Base Oficial</strong> (<code>ComienPrev / FinPrev</code>) y normaliza las torres a 2 dígitos.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 border border-white/15">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sky-300">2B · Fechas de Alistamiento</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    tieneAlistamiento ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {tieneAlistamiento ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/80 mt-1">
                Vincula la columna <code>AlistamientConfirmadoGerente(C)</code> por torre para el comparativo de Ruta Crítica en el Gantt.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 border border-white/15">
              <div className="font-extrabold text-sky-300">Paso 3 · Seguimiento semanal</div>
              <p className="text-[11px] text-blue-100/80 mt-1">
                Cargue semanalmente la sábana de Workplanner los días <strong>viernes o sábado</strong> y actualice las fechas de alistamiento si Gerencia realiza ajustes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aviso Preventivo: Agrupaciones TORRE no creadas en Parámetros del proyecto */}
      {missingTorres.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-950 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm">
                Pendiente crear agrupación en parametrización de proyecto
              </div>
              <p className="mt-0.5">
                Se detectaron agrupaciones con &laquo;TORRE&raquo; en el Workplanner que no están configuradas en{' '}
                <strong>Parámetros del proyecto</strong>:{' '}
                <strong className="font-mono">{missingTorres.join(', ')}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('marval_navigate_tab', { detail: 'parametros' }))
            }
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition cursor-pointer"
          >
            <span>Ir a Parámetros del proyecto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Aviso de Normalización Automática de Nombres TORRE ## */}
      {renamedGroups.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Normalización preventiva aplicada:</strong> se estandarizaron agrupaciones del Workplanner al formato de dos dígitos:{' '}
            {renamedGroups.map((r) => `${r.from} → ${r.to} (${r.count} filas)`).join(' · ')}.
          </span>
        </div>
      )}

      {/* Aviso de Rechazo por Carga Duplicada en la Misma Semana */}
      {duplicateAlertMsg && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-red-900 shadow-sm">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm">Carga rechazada · Semana ya registrada</div>
              <p className="mt-0.5">{duplicateAlertMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateAlertMsg(null)}
            className="p-1 text-red-500 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner Unificado y Navegación de 3 Pestañas (SIN palabra WBS) */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ListTree className="w-4 h-4" />
              <span>Módulo 2 · Programación &amp; EDT · Ruta Crítica CPM</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{projectLabel}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Control Maestro EDT, Gantt Ruta Crítica (3 Niveles) y Desviaciones
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Asignación automática de los <strong>{WBS_HITOS_MACRO_OPTIONS.length} Puntos de Control / {BASE_HITOS_MACRO_CPC_CATALOG.length} Códigos CPC</strong> y{' '}
              <strong>Contratistas (AN8 / Marval)</strong>. Las Pestañas 2 y 3 se alimentan directamente de las sábanas congeladas en la Pestaña 1.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {metadata.tieneLineaBase && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-semibold">Fecha carga:</span>
                <input
                  type="date"
                  value={fechaCargaRef}
                  onChange={(e) => {
                    setFechaCargaRef(e.target.value);
                    setDuplicateAlertMsg(null);
                  }}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                />
              </div>
            )}

            <label className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer shadow-sm transition">
              <Upload className="w-4 h-4" />
              <span>
                {metadata.tieneLineaBase
                  ? 'Cargar Sábana Semanal'
                  : 'Cargar 1ª Sábana Workplanner'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <label
              className={`flex items-center space-x-2 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer shadow-sm transition ${
                tieneAlistamiento
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
              title="Cargar o actualizar archivo Excel de Fechas de Alistamiento confirmadas por Gerencia"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {tieneAlistamiento
                  ? `Actualizar Fechas Alistamiento (${fechasAlistamiento?.records.length} torres)`
                  : 'Cargar Fechas de Alistamiento'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFechasAlistamientoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Pestañas del Módulo Unificado (3 Tabs) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('EDT')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'EDT'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListTree className="w-4 h-4" />
            <span>1. Matriz EDT, Línea Base &amp; Cortes</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">{tasks.length}</span>
          </button>

          <button
            disabled={!paso2Completo}
            onClick={() => setActiveSubTab('GANTT')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'GANTT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : paso2Completo
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
            title={
              paso2Completo
                ? 'Gantt Ruta Crítica alimentado desde Pestaña 1'
                : !metadata.tieneLineaBase
                  ? 'Congele la primera sábana en la Pestaña 1 para habilitar el Gantt'
                  : 'Cargue el archivo de Fechas de Alistamiento (Gerencia) en la Pestaña 1 para habilitar el Gantt'
            }
          >
            {paso2Completo ? <BarChart3 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            <span>2. Gantt Ruta Crítica (Punto de Control · Tarea Resumen · Task)</span>
          </button>

          <button
            disabled={!paso2Completo}
            onClick={() => setActiveSubTab('DESVIACIONES')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeSubTab === 'DESVIACIONES'
                ? 'bg-red-600 text-white shadow-sm'
                : paso2Completo
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
            title={
              paso2Completo
                ? 'Desviaciones entre cortes cargados en Pestaña 1'
                : !metadata.tieneLineaBase
                  ? 'Congele la primera sábana en la Pestaña 1 para habilitar Desviaciones'
                  : 'Cargue el archivo de Fechas de Alistamiento (Gerencia) en la Pestaña 1 para habilitar Desviaciones'
            }
          >
            {paso2Completo ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>3. Desviaciones entre Cortes</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: MATRIZ EDT */}
      {activeSubTab === 'EDT' && (
        <div className="space-y-4">
          {cortes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-700">Corte visualizado:</span>
                  <select
                    value={corteActivo?.id || ''}
                    onChange={(e) => setSelectedCorteId(e.target.value)}
                    className="px-2.5 py-1.5 border border-indigo-200 bg-indigo-50/70 rounded-lg font-extrabold text-indigo-950 focus:outline-none cursor-pointer"
                  >
                    {cortes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                    metadata.tieneLineaBase
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>{metadata.tieneLineaBase ? 'Línea Base Congelada' : 'Sin Congelar'}</span>
                </span>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <CloudUpload className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Base Oficial {BASE_HITOS_MACRO_CPC_CATALOG.length} Códigos CPC ·{' '}
                      {SHAREPOINT_LISTS.WBS_LINEA_BASE}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                    Puntos de Control asignados por CPC: {hitosCoverage.coveredCount} / {hitosCoverage.totalHitos}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                    hitosCoverage.coveredCount === hitosCoverage.totalHitos
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {hitosCoverage.coveredCount === hitosCoverage.totalHitos
                    ? `${hitosCoverage.totalHitos}/${hitosCoverage.totalHitos} Cubiertos`
                    : `Faltan ${hitosCoverage.missing.length}`}
                </span>
              </div>
            </div>
          )}

          {fechasAlistamiento && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-950">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Fechas de Alistamiento Gerencia cargadas:</strong> {fechasAlistamiento.fileName} (
                  {fechasAlistamiento.records.length} torres · cargado{' '}
                  {fechasAlistamiento.fechaCarga.split('T')[0]})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {fechasAlistamiento.records.map((r) => (
                  <span
                    key={r.agrupacion}
                    className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-900 font-bold text-[10px]"
                  >
                    {r.agrupacion}: {r.alistamientoConfirmadoGerente}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cpmSummary?.diagnosticos &&
            (cpmSummary.diagnosticos.predecesorasHuerfanas > 0 ||
              cpmSummary.diagnosticos.ciclosDetectados > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Validación Topológica CPM:</strong> Grafo DAG asegurado ({cpmSummary.tareasCriticas} actividades en ruta crítica calculada).
                  </span>
                </div>
              </div>
            )}

          {tasks.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                Aún no se ha cargado ninguna sábana de Workplanner para {projectLabel}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Utilice el botón <strong>&laquo;Cargar 1ª Sábana Workplanner&raquo;</strong> en la parte superior para importar el archivo Excel (<code>.xlsx</code>) o <code>.csv</code> y congelar la Línea Base del proyecto.
              </p>
            </div>
          ) : (
            <WbsMatrizTable
              tasks={tasks}
              assignments={assignments}
              lbMap={lbMap}
              criticalEdtSet={criticalEdtSet}
              resetKey={selectedCorteId}
              onChangeHito={handleChangeHitoMacro}
              onOpenContratista={handleOpenContratistaModal}
            />
          )}
        </div>
      )}

      {/* PESTAÑA 2: GANTT RUTA CRÍTICA (alimentado únicamente de la sábana congelada/cargada en Pestaña 1) */}
      {activeSubTab === 'GANTT' && paso2Completo && (
        <WbsGanttTab
          proyecto={selectedProject}
          cortes={cortes}
          initialCorteId={selectedCorteId}
        />
      )}

      {/* PESTAÑA 3: DESVIACIONES ENTRE CORTES (alimentado únicamente de los cortes reales cargados en Pestaña 1) */}
      {activeSubTab === 'DESVIACIONES' && paso2Completo && (
        <WbsDesviacionesTab proyecto={selectedProject} cortes={cortes} />
      )}

      {/* MODAL PREVENTIVO DE CONFIRMACIÓN ANTES DE REGISTRAR / CONGELAR SÁBANA */}
      {showConfirmModal && pendingUpload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Aviso Preventivo de Confirmación · Programación &amp; EDT
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {!metadata.tieneLineaBase
                    ? 'Confirmar Congelación de 1ª Sábana (Línea Base)'
                    : 'Confirmar Registro de Sábana Semanal'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingUpload(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Archivo detectado:</span>
                  <span className="font-bold text-slate-900">{pendingUpload.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total actividades:</span>
                  <span className="font-bold text-slate-900">{pendingUpload.tasks.length}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">Registro en &laquo;Corte visualizado&raquo;:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-extrabold">
                    {!metadata.tieneLineaBase
                      ? `Línea Base · ${semanaPreview.etiquetaSemana}`
                      : semanaPreview.etiquetaSemana}
                  </span>
                </div>
              </div>

              {metadata.tieneLineaBase && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">Fecha de referencia de la carga:</span>
                    <input
                      type="date"
                      value={fechaCargaRef}
                      onChange={(e) => setFechaCargaRef(e.target.value)}
                      className="px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px]">
                    Solo se permite <strong>una carga por semana</strong>. Verifique que la semana seleccionada (
                    <strong>{semanaPreview.etiquetaSemana}</strong>) sea la correcta antes de confirmar.
                  </p>
                  {duplicateInSelectedWeek && (
                    <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-red-900 font-bold">
                      ⛔ Ya existe un corte registrado para {duplicateInSelectedWeek.etiqueta}. Esta carga será rechazada.
                    </div>
                  )}
                </div>
              )}

              {pendingUpload.audit.renamedGroups.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                  <strong>Normalización automática de torres:</strong>{' '}
                  {pendingUpload.audit.renamedGroups
                    .map((r) => `${r.from} → ${r.to} (${r.count})`)
                    .join(' · ')}
                </div>
              )}

              {pendingUpload.audit.missingTorresInParam.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[11px]">
                  <strong>Aviso preventivo:</strong> Pendiente crear agrupación en parametrización de proyecto:{' '}
                  <strong className="font-mono">
                    {pendingUpload.audit.missingTorresInParam.join(', ')}
                  </strong>
                  .
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingUpload(null);
                }}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveUpload}
                disabled={isProcessing || Boolean(duplicateInSelectedWeek)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm cursor-pointer"
              >
                {!metadata.tieneLineaBase
                  ? 'Confirmar y Congelar Línea Base'
                  : 'Confirmar y Registrar Corte Semanal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación de Contratista (AN8 + Marval Ingeniería) */}
      {contratistaModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Asignar Contratista en EDT</span>
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  [{contratistaModalTask.edt}] {contratistaModalTask.nombre}
                </h3>
              </div>
              <button
                onClick={() => setContratistaModalTask(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">
                Contratista / Responsable (Base AN8 + Marval Ingeniería)
              </label>
              <ContratistaSelector
                value={contratistaTempVal}
                onChange={setContratistaTempVal}
              />

              {(contratistaModalTask.tipo || '').toLowerCase() !== 'task' && (
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propagarContratistaHijas}
                    onChange={(e) => setPropagarContratistaHijas(e.target.checked)}
                    className="rounded border-blue-300 text-blue-600"
                  />
                  <span>
                    Esta es una actividad resumen: propagar este contratista a todas sus tareas hijas tipo &quot;task&quot;.
                  </span>
                </label>
              )}

              <p className="text-[11px] text-slate-500">
                El contratista asignado aquí se reflejará automáticamente en la{' '}
                <strong>Bitácora Semanal</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setContratistaModalTask(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmContratistaModal}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
              >
                Guardar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
