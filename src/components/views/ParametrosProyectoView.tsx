import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Building2,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Layers,
  FolderPlus,
  Send,
  Info,
  Sparkles,
} from 'lucide-react';
import { SUCURSALES_OFICIALES, SucursalOperativa } from '../../types';
import { Usuario } from '../../types/auth';
import {
  ProjectService,
  ProyectoMaestro,
  ProyectoEstructuraRow,
  TORRE_OPTIONS,
  ETAPA_OPTIONS,
  normalizeEtapaStandard,
} from '../../services/projectService';
import {
  ParametrizacionService,
  TorreParametrizacion,
} from '../../services/parametrizacionService';

interface ParametrosProyectoViewProps {
  currentUser: Usuario;
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNavigateTab: (tabId: string) => void;
  isCreatingNew?: boolean;
  onCancelCreateNew?: () => void;
}

const createEmptyRow = (index: number): ProyectoEstructuraRow => ({
  id: `est-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
  hc: '',
  nombreHcJde: '',
  etapa: ETAPA_OPTIONS[Math.min(index, ETAPA_OPTIONS.length - 1)],
});

export const ParametrosProyectoView: React.FC<ParametrosProyectoViewProps> = ({
  currentUser,
  activeProjectId,
  onSelectProject,
  onNavigateTab,
  isCreatingNew = false,
  onCancelCreateNew,
}) => {
  const [subTab, setSubTab] = useState<'DATOS' | 'TORRES'>('DATOS');
  const [creatingDraft, setCreatingDraft] = useState<boolean>(isCreatingNew);

  const userProjects = ProjectService.getProjectsForUser(currentUser);
  const currentProject: ProyectoMaestro | null = creatingDraft
    ? null
    : ProjectService.getProjectById(activeProjectId);

  // Estado formulario Pestaña 1: Datos del proyecto
  const [sucursal, setSucursal] = useState<SucursalOperativa>(currentUser.sucursal || 'CALI');
  const [nombreJde, setNombreJde] = useState<string>('');
  const [an8DirectorObra, setAn8DirectorObra] = useState<string>('');
  const [nombreDirectorObra, setNombreDirectorObra] = useState<string>('');
  const [nombreGerenteProyectos, setNombreGerenteProyectos] = useState<string>('');
  const [estructura, setEstructura] = useState<ProyectoEstructuraRow[]>([createEmptyRow(0)]);
  const [datosDirty, setDatosDirty] = useState<boolean>(false);

  // Conflicto HC duplicado -> Solicitar asignación
  const [duplicateConflict, setDuplicateConflict] = useState<{
    hc: string;
    project: ProyectoMaestro;
  } | null>(null);

  // Estado formulario Pestaña 2: Parametrización Torres e inmuebles
  const [editedTorres, setEditedTorres] = useState<TorreParametrizacion[]>([]);
  const [seriesTextMap, setSeriesTextMap] = useState<Record<string, string>>({});
  const [torresDirty, setTorresDirty] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    setCreatingDraft(isCreatingNew);
    if (isCreatingNew) {
      setSubTab('DATOS');
    }
  }, [isCreatingNew]);

  // Sincronizar formulario al cambiar de proyecto activo o modo creación
  useEffect(() => {
    setDuplicateConflict(null);
    if (creatingDraft || !currentProject) {
      setSucursal(currentUser.sucursal || 'CALI');
      setNombreJde('');
      setAn8DirectorObra('');
      setNombreDirectorObra('');
      setNombreGerenteProyectos('');
      setEstructura([createEmptyRow(0)]);
      setDatosDirty(false);
      setEditedTorres([]);
      setSeriesTextMap({});
      setTorresDirty(false);
      return;
    }

    setSucursal(currentProject.sucursal);
    setNombreJde(currentProject.nombreJde);
    setAn8DirectorObra(currentProject.an8DirectorObra);
    setNombreDirectorObra(currentProject.nombreDirectorObra);
    setNombreGerenteProyectos(currentProject.nombreGerenteProyectos);
    setEstructura(
      currentProject.estructura.length > 0
        ? currentProject.estructura.map((r: any, idx) => ({
            id: r.id || `est-${idx}`,
            hc: r.hc || '',
            nombreHcJde: r.nombreHcJde || '',
            etapa:
              normalizeEtapaStandard(
                r.etapa || (r.torre ? String(r.torre).replace(/TORRE/i, 'ETAPA') : '')
              ) || ETAPA_OPTIONS[Math.min(idx, ETAPA_OPTIONS.length - 1)],
          }))
        : [createEmptyRow(0)]
    );
    setDatosDirty(false);

    const torres = ParametrizacionService.getTorresConfig(currentProject.id);
    setEditedTorres(torres);
    const sMap: Record<string, string> = {};
    torres.forEach((t) => {
      sMap[t.id] = t.series.join(', ');
    });
    setSeriesTextMap(sMap);
    setTorresDirty(false);
  }, [activeProjectId, creatingDraft, currentProject?.fechaActualizacion]);

  const onboarding = ProjectService.getOnboardingStatus(currentProject?.id);

  // Handlers Pestaña 1
  const handleAddEstructuraRow = () => {
    setEstructura((prev) => [...prev, createEmptyRow(prev.length)]);
    setDatosDirty(true);
  };

  const handleRemoveEstructuraRow = (id: string) => {
    if (estructura.length <= 1) {
      showToast('Debe existir al menos una fila en Estructura de proyecto.', 'error');
      return;
    }
    setEstructura((prev) => prev.filter((r) => r.id !== id));
    setDatosDirty(true);
  };

  const handleUpdateEstructuraRow = (
    id: string,
    field: keyof ProyectoEstructuraRow,
    value: string
  ) => {
    setEstructura((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setDatosDirty(true);
  };

  const handleGuardarDatos = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateConflict(null);

    const res = ProjectService.saveProjectDatos(
      {
        id: creatingDraft ? undefined : currentProject?.id,
        sucursal,
        nombreJde,
        an8DirectorObra,
        nombreDirectorObra,
        nombreGerenteProyectos,
        estructura,
      },
      currentUser
    );

    if (!res.success) {
      if (res.duplicateConflict) {
        setDuplicateConflict(res.duplicateConflict);
      }
      showToast(res.message, 'error');
      return;
    }

    setDatosDirty(false);
    setCreatingDraft(false);
    onCancelCreateNew?.();
    onSelectProject(res.project.id);

    // Cargar inmediatamente las torres generadas desde Estructura de proyecto en Pestaña 2
    const torres = ParametrizacionService.getTorresConfig(res.project.id);
    setEditedTorres(torres);
    const sMap: Record<string, string> = {};
    torres.forEach((t) => {
      sMap[t.id] = t.series.join(', ');
    });
    setSeriesTextMap(sMap);

    showToast(res.message, 'success');
    if (!res.project.torresGuardadas) {
      setSubTab('TORRES');
    }
  };

  const handleSolicitarAsignacion = () => {
    if (!duplicateConflict) return;
    const res = ProjectService.crearSolicitudAsignacion({
      proyecto: duplicateConflict.project,
      hcConflicto: duplicateConflict.hc,
      solicitante: currentUser,
    });
    if (res.success) {
      showToast(res.message, 'success');
      setDuplicateConflict(null);
    } else {
      showToast(res.message, 'info');
    }
  };

  // Handlers Pestaña 2 (Torres e inmuebles)
  const handleUpdateTorreField = (
    id: string,
    field: keyof TorreParametrizacion,
    value: string | number | boolean
  ) => {
    setTorresDirty(true);
    setEditedTorres((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (field === 'aptosPorPiso') {
          const count = Math.max(1, Math.min(20, Number(value) || 4));
          const genSeries = ParametrizacionService.generarSeriesPorCantidad(count);
          setSeriesTextMap((m) => ({ ...m, [id]: genSeries.join(', ') }));
          return { ...t, aptosPorPiso: count, series: genSeries };
        }
        return { ...t, [field]: value };
      })
    );
  };

  const handleSeriesTextChange = (id: string, text: string) => {
    setTorresDirty(true);
    setSeriesTextMap((prev) => ({ ...prev, [id]: text }));
    const parsed = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (/^\d+$/.test(s) ? s.padStart(2, '0') : s.toUpperCase()));

    setEditedTorres((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              series: parsed.length > 0 ? parsed : t.series,
              aptosPorPiso: parsed.length > 0 ? parsed.length : t.aptosPorPiso,
            }
          : t
      )
    );
  };

  const handleAddTorre = () => {
    if (!currentProject) return;
    const etapasProyecto = ProjectService.getEtapasEstructura(currentProject.id);
    const primeraEtapa = etapasProyecto[0]?.etapa || 'ETAPA 01';
    const usedNames = new Set(editedTorres.map((t) => t.nombreTorre.toUpperCase()));
    const nextTorre =
      TORRE_OPTIONS.find((opt) => !usedNames.has(opt.toUpperCase())) ||
      `TORRE ${String(editedTorres.length + 1).padStart(2, '0')}`;
    const newId = `torre-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    const nuevaTorre: TorreParametrizacion = {
      id: newId,
      nombreTorre: nextTorre,
      agrupacionWorkplanner: nextTorre,
      etapa: primeraEtapa,
      numeroPisos: 12,
      aptosPorPiso: 4,
      series: ['01', '02', '03', '04'],
      incluyeSotano: false,
    };

    setEditedTorres((prev) => [...prev, nuevaTorre]);
    setSeriesTextMap((prev) => ({ ...prev, [newId]: '01, 02, 03, 04' }));
    setTorresDirty(true);
  };

  const handleRemoveTorre = (id: string) => {
    if (editedTorres.length <= 1) {
      showToast('Debe existir al menos una torre configurada en el proyecto.', 'error');
      return;
    }
    setEditedTorres((prev) => prev.filter((t) => t.id !== id));
    setTorresDirty(true);
  };

  const handleGuardarTorres = () => {
    if (!currentProject) return;
    const seen = new Set<string>();
    for (const t of editedTorres) {
      const key = t.nombreTorre.trim().toUpperCase();
      if (seen.has(key)) {
        showToast(
          `La torre "${key}" está duplicada. Asigne un número distinto en cada tarjeta de torre.`,
          'error'
        );
        return;
      }
      seen.add(key);
    }
    const saved = ParametrizacionService.saveTorresConfig(currentProject.id, editedTorres);
    setEditedTorres(saved);
    setTorresDirty(false);
    showToast(
      `Parametrización de ${saved.length} torre(s) guardada. Se ha habilitado el Módulo 2 "Programación & EDT".`,
      'success'
    );
  };

  const handleIniciarNuevoProyecto = () => {
    setCreatingDraft(true);
    setSubTab('DATOS');
    setDuplicateConflict(null);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold max-w-md ${
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
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Guía Tutorial Inicial Obligatoria */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configuración Inicial Guiada · Módulo 1</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {creatingDraft || !currentProject
                ? 'Parámetros del proyecto · Nuevo Proyecto'
                : `Parámetros del proyecto · ${currentProject.nombreJde}`}
            </h2>
            <p className="text-xs text-blue-100/85 max-w-3xl">
              Complete y guarde los datos maestros y la parametrización de torres para habilitar el Módulo 2{' '}
              <strong>Programación &amp; EDT</strong> y el seguimiento de campo de este proyecto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {userProjects.length > 0 && !creatingDraft && (
              <button
                type="button"
                onClick={handleIniciarNuevoProyecto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-blue-600" />
                <span>Crear nuevo proyecto</span>
              </button>
            )}
            {creatingDraft && userProjects.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCreatingDraft(false);
                  onCancelCreateNew?.();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                Cancelar nuevo proyecto
              </button>
            )}
          </div>
        </div>

        {/* Stepper Visual del Tutorial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15">
          <div
            onClick={() => setSubTab('DATOS')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              onboarding.paso1DatosGuardados
                ? 'bg-emerald-500/20 border-emerald-400/50'
                : 'bg-white/10 border-sky-400/70 ring-1 ring-sky-400/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>Paso 1A · Datos del proyecto</span>
              {onboarding.paso1DatosGuardados ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-sky-400/30 text-[10px]">Pendiente</span>
              )}
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1">
              Sucursal, JDE, responsables y tabla HC / Etapas (ETAPA 01–50).
            </p>
          </div>

          <div
            onClick={() => {
              if (onboarding.paso1DatosGuardados) setSubTab('TORRES');
            }}
            className={`p-3 rounded-xl border transition ${
              onboarding.paso1TorresGuardadas
                ? 'bg-emerald-500/20 border-emerald-400/50 cursor-pointer'
                : onboarding.paso1DatosGuardados
                  ? 'bg-white/10 border-sky-400/70 ring-1 ring-sky-400/40 cursor-pointer'
                  : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>Paso 1B · Torres e inmuebles</span>
              {onboarding.paso1TorresGuardadas ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : onboarding.paso1DatosGuardados ? (
                <span className="px-1.5 py-0.5 rounded bg-sky-400/30 text-[10px]">Siguiente</span>
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1">
              Pisos e inmuebles por piso (12P × 4A por defecto) y guardar.
            </p>
          </div>

          <div
            onClick={() => {
              if (onboarding.paso1Completo) onNavigateTab('wbs');
            }}
            className={`p-3 rounded-xl border transition ${
              onboarding.paso2LineaBaseCongelada
                ? 'bg-emerald-500/20 border-emerald-400/50 cursor-pointer'
                : onboarding.paso1Completo
                  ? 'bg-sky-500/25 border-sky-300 ring-1 ring-sky-300/50 cursor-pointer hover:bg-sky-500/35'
                  : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>Paso 2 · Programación &amp; EDT</span>
              {onboarding.paso2LineaBaseCongelada ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : onboarding.paso1Completo ? (
                <ArrowRight className="w-4 h-4 text-sky-200" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
            <p className="text-[11px] text-blue-100/80 mt-1">
              Cargar y congelar 1ª sábana de Workplanner para habilitar toda la obra.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Subpestañas del Módulo 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('DATOS')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition ${
              subTab === 'DATOS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Datos del proyecto</span>
            {datosDirty && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px]">
                Sin guardar
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={!onboarding.paso1DatosGuardados || creatingDraft}
            onClick={() => setSubTab('TORRES')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition ${
              subTab === 'TORRES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : onboarding.paso1DatosGuardados && !creatingDraft
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
          >
            {onboarding.paso1DatosGuardados && !creatingDraft ? (
              <Layers className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>2. Parametrización Torres e inmuebles</span>
            {torresDirty && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px]">
                Sin guardar
              </span>
            )}
          </button>
        </div>

        {onboarding.paso1Completo && !onboarding.paso2LineaBaseCongelada && (
          <button
            type="button"
            onClick={() => onNavigateTab('wbs')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <span>Continuar al Paso 2: Programación &amp; EDT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* PESTAÑA 1: DATOS DEL PROYECTO */}
      {subTab === 'DATOS' && (
        <form onSubmit={handleGuardarDatos} className="space-y-5">
          {/* Aviso de conflicto por HC duplicado en SharePoint */}
          {duplicateConflict && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <div className="font-extrabold text-sm">
                    Proyecto ya existente en la base de datos (HC {duplicateConflict.hc})
                  </div>
                  <p>
                    El código HC <strong>{duplicateConflict.hc}</strong> ya fue registrado bajo el proyecto{' '}
                    <strong>{duplicateConflict.project.nombreJde}</strong> ({duplicateConflict.project.sucursal}) por{' '}
                    <strong>{duplicateConflict.project.creadoPorNombre}</strong>. No se permite duplicar el proyecto.
                  </p>
                  <p className="text-amber-800 font-semibold">
                    Si necesitas trabajar en este proyecto, envía una solicitud al usuario Administrador.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSolicitarAsignacion}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Solicitar asignación de proyecto</span>
              </button>
            </div>
          )}

          {/* Datos Generales */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Información General del Proyecto (JDE)
                </h3>
                <p className="text-xs text-slate-500">
                  Datos base registrados en la lista maestra de SharePoint para evitar duplicados por HC.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-semibold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Cada vez que realice un cambio, haga clic en &laquo;Guardar&raquo; para aplicarlo.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal *</label>
                <select
                  value={sucursal}
                  onChange={(e) => {
                    setSucursal(e.target.value as SucursalOperativa);
                    setDatosDirty(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {SUCURSALES_OFICIALES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proyecto (Nombre JDE) *
                </label>
                <input
                  type="text"
                  required
                  value={nombreJde}
                  onChange={(e) => {
                    setNombreJde(e.target.value);
                    setDatosDirty(true);
                  }}
                  placeholder="Ej. BELATERRA PIETRA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AN8 Director de obra *
                </label>
                <input
                  type="text"
                  required
                  value={an8DirectorObra}
                  onChange={(e) => {
                    setAn8DirectorObra(e.target.value);
                    setDatosDirty(true);
                  }}
                  placeholder="Ej. 104520"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre completo Director de obra *
                </label>
                <input
                  type="text"
                  required
                  value={nombreDirectorObra}
                  onChange={(e) => {
                    setNombreDirectorObra(e.target.value);
                    setDatosDirty(true);
                  }}
                  placeholder="Nombre y apellidos del Director de obra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre completo Gerente de proyectos *
                </label>
                <input
                  type="text"
                  required
                  value={nombreGerenteProyectos}
                  onChange={(e) => {
                    setNombreGerenteProyectos(e.target.value);
                    setDatosDirty(true);
                  }}
                  placeholder="Nombre y apellidos del Gerente de proyectos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Tabla Estructura de proyecto */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Estructura de proyecto (HC · Nombre HC JDE · ETAPA)
                </h3>
                <p className="text-xs text-slate-500">
                  Desglose cada HC y su etapa estandarizada (siempre a dos dígitos de <code>ETAPA 01</code> a{' '}
                  <code>ETAPA 50</code>). Un mismo HC puede asignarse a múltiples etapas del proyecto.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEstructuraRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar fila HC / Etapa</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-44">HC *</th>
                    <th className="py-2.5 px-3">Nombre HC JDE *</th>
                    <th className="py-2.5 px-3 w-52">ETAPA (ETAPA 01 – ETAPA 50) *</th>
                    <th className="py-2.5 px-3 w-16 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estructura.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5">
                        <input
                          type="text"
                          required
                          value={row.hc}
                          onChange={(e) => handleUpdateEstructuraRow(row.id, 'hc', e.target.value)}
                          placeholder="Ej. 007843351000"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          required
                          value={row.nombreHcJde}
                          onChange={(e) =>
                            handleUpdateEstructuraRow(row.id, 'nombreHcJde', e.target.value)
                          }
                          placeholder="Ej. BELATERRA PIETRA ETAPA 1"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.etapa}
                          onChange={(e) => handleUpdateEstructuraRow(row.id, 'etapa', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          {ETAPA_OPTIONS.map((et) => (
                            <option key={et} value={et}>
                              {et}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEstructuraRow(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                * Al presionar <strong>Guardar</strong>, se valida que ningún código <code>HC</code> exista previamente en SharePoint.
              </span>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos del Proyecto</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* PESTAÑA 2: PARAMETRIZACIÓN TORRES E INMUEBLES */}
      {subTab === 'TORRES' && currentProject && (() => {
        const etapasProyecto = ProjectService.getEtapasEstructura(currentProject.id);
        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Parametrización de Torres, Pisos e Inmuebles ({editedTorres.length} torre(s))
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agregue las torres del proyecto (<code>TORRE 01</code> a <code>TORRE 50</code>), asigne a qué <strong>Etapa</strong> pertenece cada una y defina pisos e inmuebles por piso (por defecto <strong>12 pisos</strong> y <strong>4 inmuebles por piso</strong>).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTorre}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Torre</span>
                </button>
                <button
                  type="button"
                  onClick={handleGuardarTorres}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            {editedTorres.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 space-y-3">
                <p>No hay torres parametrizadas aún. Haga clic en &laquo;Agregar Torre&raquo; para crear la primera torre.</p>
                <button
                  type="button"
                  onClick={handleAddTorre}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Torre</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {editedTorres.map((t) => {
                  const totalInmuebles = t.numeroPisos * t.series.length;
                  const etapaOptionsList =
                    etapasProyecto.length > 0
                      ? etapasProyecto
                      : [{ etapa: 'ETAPA 01', hc: '', nombreHcJde: '' }];
                  const etapaInList = etapaOptionsList.some((e) => e.etapa === t.etapa);

                  return (
                    <div
                      key={t.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <select
                              value={t.nombreTorre}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTorresDirty(true);
                                setEditedTorres((prev) =>
                                  prev.map((item) =>
                                    item.id === t.id
                                      ? { ...item, nombreTorre: val, agrupacionWorkplanner: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {TORRE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                              {totalInmuebles} inmuebles generados
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {t.etapa || 'ETAPA 01'}
                          </span>
                          {editedTorres.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTorre(t.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Eliminar torre"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Campo de Etapa a la que pertenece */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Etapa a la que pertenece *
                        </label>
                        <select
                          value={t.etapa || etapaOptionsList[0].etapa}
                          onChange={(e) => handleUpdateTorreField(t.id, 'etapa', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {etapaOptionsList.map((et) => (
                            <option key={et.etapa} value={et.etapa}>
                              {et.hc ? `${et.etapa} · HC ${et.hc} (${et.nombreHcJde})` : et.etapa}
                            </option>
                          ))}
                          {!etapaInList && t.etapa && (
                            <option value={t.etapa}>{t.etapa}</option>
                          )}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Número de Pisos
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={t.numeroPisos}
                            onChange={(e) =>
                              handleUpdateTorreField(t.id, 'numeroPisos', Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Inmuebles por Piso
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={t.aptosPorPiso}
                            onChange={(e) =>
                              handleUpdateTorreField(t.id, 'aptosPorPiso', Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Series de inmuebles (separadas por coma)
                        </label>
                        <input
                          type="text"
                          value={seriesTextMap[t.id] ?? t.series.join(', ')}
                          onChange={(e) => handleSeriesTextChange(t.id, e.target.value)}
                          placeholder="01, 02, 03, 04"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Ejemplo generado: <code>01{t.series[0] || '01'}</code> hasta{' '}
                          <code>
                            {String(t.numeroPisos).padStart(2, '0')}
                            {t.series[t.series.length - 1] || '04'}
                          </code>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Al guardar, la plataforma habilitará <strong>Programación &amp; EDT</strong> y validará las agrupaciones del Workplanner contra estas torres.
                </span>
              </div>
              {onboarding.paso1Completo && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('wbs')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <span>Ir a Programación &amp; EDT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
