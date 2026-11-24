import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  AlertTriangle,
  ShieldCheck,
  Search,
  ArrowRight,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  CtoEstadoSupervisorTecnico,
  HitoMacro,
  Sucursal,
} from '../../../types';
import {
  CtoEngine,
  CtoEvaluacionAgrupacionItem,
} from '../../../services/ctoEngine';
import { ScheduleService } from '../../../services/scheduleService';
import {
  MacroMilestoneService,
  HITOS_MACRO_LIST,
  HITO_MACRO_LABELS,
} from '../../../services/macroMilestoneService';
import { ContratistaSelector } from '../../common/ContratistaSelector';

interface CtoComplianceTabProps {
  proyectoId: string;
  sucursal: Sucursal;
  residenteNombre: string;
}

export const CtoComplianceTab: React.FC<CtoComplianceTabProps> = ({
  proyectoId,
  sucursal,
  residenteNombre,
}) => {
  const agrupacionesConfig = useMemo(
    () => CtoEngine.getAgrupacionesConfig(proyectoId),
    [proyectoId]
  );

  const [agrupacionSel, setAgrupacionSel] = useState<string>(
    agrupacionesConfig[0]?.agrupacion || 'Torre 1'
  );

  const [criterios, setCriterios] = useState<CtoEvaluacionAgrupacionItem[]>(() =>
    CtoEngine.getEvaluacionesPorAgrupacion(proyectoId, agrupacionSel)
  );

  const [soloHitosActivos, setSoloHitosActivos] = useState<boolean>(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroHito, setFiltroHito] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Recargar evaluaciones al cambiar de proyecto o agrupación, o al actualizarse desde otra vista
  useEffect(() => {
    const refresh = () => {
      setCriterios(CtoEngine.getEvaluacionesPorAgrupacion(proyectoId, agrupacionSel));
    };
    refresh();
    window.addEventListener('marval_cto_updated', refresh);
    return () => window.removeEventListener('marval_cto_updated', refresh);
  }, [proyectoId, agrupacionSel]);

  // Detectar Hitos Macro que tienen actividades en ejecución o próximas (+60 días) en Workplanner
  const hitosActivosWorkplanner = useMemo(() => {
    const activeTasks = ScheduleService.getActiveSchedule(proyectoId);
    const savedMapping = MacroMilestoneService.loadProjectMapping(proyectoId);
    const hitosSet = new Set<HitoMacro>();
    const fechaLimiteProxima = '2027-01-15'; // Fecha de corte + ~60 días

    // Mapa inverso si el usuario ya congeló el mapeo EDT -> HitoMacro
    const edtToHito = new Map<string, HitoMacro>();
    if (savedMapping) {
      for (const [hito, edts] of Object.entries(savedMapping)) {
        if (Array.isArray(edts)) {
          edts.forEach((edt) => edtToHito.set(edt, hito as HitoMacro));
        }
      }
    }

    for (const t of activeTasks) {
      if (t.tipo && t.tipo !== 'task') continue;
      const enEjecucionOProximo =
        (t.w || 0) > 0 || (t.comien && t.comien <= fechaLimiteProxima);
      if (!enEjecucionOProximo) continue;

      const hito =
        edtToHito.get(t.edt) ||
        MacroMilestoneService.autoClassifyTask({
          edt: t.edt,
          nombre: t.nombre,
          nivel: t.nivel,
          agrupacion: t.agrupacion,
        });
      if (hito) hitosSet.add(hito);
    }

    if (hitosSet.size === 0) {
      hitosSet.add('URBANISMO');
      hitosSet.add('CIMENTACION');
      hitosSet.add('ESTRUCTURA');
    }

    return hitosSet;
  }, [proyectoId]);

  const activeConfig = useMemo(
    () =>
      agrupacionesConfig.find((c) => c.agrupacion === agrupacionSel) ||
      agrupacionesConfig[0],
    [agrupacionesConfig, agrupacionSel]
  );

  const categoriasUnicas = useMemo(
    () => Array.from(new Set(criterios.map((c) => c.categoriaCto))),
    [criterios]
  );

  // KPIs de madurez sobre los 56 criterios de la agrupación seleccionada
  const resumenAgrupacion = useMemo(() => {
    const total = criterios.length;
    const aprobados = criterios.filter(
      (c) => c.estadoFase === '3_APROBACION_SUPERVISOR_TECNICO'
    ).length;
    const revision = criterios.filter(
      (c) => c.estadoFase === '2_REVISION_SUPERVISOR_PENDIENTE'
    ).length;
    const pendiente = criterios.filter(
      (c) => c.estadoFase === '1_ENTREGA_RESPUESTA_INGENIERIA'
    ).length;
    const indiceMadurez = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    return { total, aprobados, revision, pendiente, indiceMadurez };
  }, [criterios]);

  const handleUpdateCriterion = (
    numGeneral: number,
    updates: Partial<
      Pick<
        CtoEvaluacionAgrupacionItem,
        'estadoFase' | 'responsableAsignado' | 'fechaCompromiso' | 'observaciones'
      >
    >
  ) => {
    const updatedList = CtoEngine.saveEvaluacionCriterio(
      proyectoId,
      agrupacionSel,
      numGeneral,
      updates
    );
    setCriterios(updatedList);
  };

  const criteriosFiltrados = useMemo(() => {
    return criterios.filter((c) => {
      if (soloHitosActivos && !hitosActivosWorkplanner.has(c.hitoMacro)) {
        return false;
      }
      if (filtroCategoria !== 'TODAS' && c.categoriaCto !== filtroCategoria) {
        return false;
      }
      if (filtroHito !== 'TODOS' && c.hitoMacro !== filtroHito) {
        return false;
      }
      if (filtroEstado !== 'TODOS' && c.estadoFase !== filtroEstado) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          c.criterioEvaluacion.toLowerCase().includes(q) ||
          c.categoriaCto.toLowerCase().includes(q) ||
          c.hitoRelacionadoTexto.toLowerCase().includes(q) ||
          c.responsableAsignado.toLowerCase().includes(q) ||
          String(c.numGeneral).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    criterios,
    soloHitosActivos,
    hitosActivosWorkplanner,
    filtroCategoria,
    filtroHito,
    filtroEstado,
    searchTerm,
  ]);

  const criteriosPendientesCriticos = useMemo(
    () =>
      criterios.filter(
        (c) =>
          hitosActivosWorkplanner.has(c.hitoMacro) &&
          c.estadoFase !== '3_APROBACION_SUPERVISOR_TECNICO'
      ),
    [criterios, hitosActivosWorkplanner]
  );

  return (
    <div className="space-y-6">
      {/* ESQUEMA VISUAL DE ARTICULACIÓN WORKPLANNER -> HITO MACRO -> CATÁLOGO CTO */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50/70 to-white border border-indigo-200 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-indigo-950">
            <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded">
              1. Tareas Workplanner (EDT Activas)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            <span className="bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded">
              2. Punto de Control (Puntos Estandarizados)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            <span className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded">
              3. Criterios Catálogo CTO (Consolidado SST y CTO CALI)
            </span>
          </div>
          <span className="text-[11px] text-indigo-800 font-semibold">
            {sucursal} · Auditor: {residenteNombre}
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Al vincular las actividades del Workplanner con su <strong>Punto de Control</strong>, los requerimientos de los <strong>56 criterios oficiales de Ley 1796</strong> cuya columna <em>Hito relacionado</em> coincide con los puntos de control en ejecución o próximos ({hitosActivosWorkplanner.size} puntos activos) se disparan automáticamente en esta bitácora semanal para definir <strong>Fase (1/2/3), Responsable y Fecha de Compromiso</strong>.
        </p>
      </div>

      {/* SELECTOR DE AGRUPACIÓN (TORRE / URBANISMO) Y KPIS DE MADUREZ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-sm col-span-2 md:col-span-1">
          <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            Agrupación Auditada
          </label>
          <select
            value={agrupacionSel}
            onChange={(e) => setAgrupacionSel(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-extrabold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {agrupacionesConfig.map((cfg) => (
              <option key={cfg.agrupacion} value={cfg.agrupacion}>
                {cfg.agrupacion} ({cfg.mesesRestantes}m)
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500 block mt-1.5">
            Alistamiento: <strong>{activeConfig?.fechaAlistamiento}</strong>
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Índice Madurez CTO</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{resumenAgrupacion.indiceMadurez}%</span>
            <span className="text-xs text-slate-500 font-medium">aprobado</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                resumenAgrupacion.indiceMadurez >= 85 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${resumenAgrupacion.indiceMadurez}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Fase 3: Aprobado Sup.</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{resumenAgrupacion.aprobados}</span>
            <span className="text-xs text-slate-500">de {resumenAgrupacion.total}</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 inline-block">Cumple Ley 1796</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Fase 2: Rev. Supervisor</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700">{resumenAgrupacion.revision}</span>
            <span className="text-xs text-slate-500">en revisión</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-1 inline-block">Radicado al STI</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Fase 1: Pend. Ingeniería</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-red-700">{resumenAgrupacion.pendiente}</span>
            <span className="text-xs text-slate-500">sin radicar</span>
          </div>
          <span className="text-[11px] text-red-600 mt-1 inline-block">Acción requerida obra</span>
        </div>
      </div>

      {/* ALERTA DE HITOS ACTIVOS CON CRITERIOS SIN CERRAR */}
      {criteriosPendientesCriticos.length > 0 && (
        <div className="p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>{criteriosPendientesCriticos.length} criterios CTO</strong> vinculados a los puntos de control actualmente en ejecución o próximos en Workplanner todavía están pendientes de aprobación del Supervisor Técnico en <strong>{agrupacionSel}</strong>.
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Toggle Alcance */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSoloHitosActivos(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                soloHitosActivos
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Criterios de Hitos Activos / Próximos
            </button>
            <button
              type="button"
              onClick={() => setSoloHitosActivos(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !soloHitosActivos
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los 56 Criterios
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Mostrando <strong className="text-slate-900">{criteriosFiltrados.length}</strong> de {criterios.length} criterios oficiales
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar N°, criterio o hito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="TODAS">Todas las Categorías CTO (6)</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filtroHito}
            onChange={(e) => setFiltroHito(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="TODOS">Todos los Puntos de Control</option>
            {HITOS_MACRO_LIST.map((h) => (
              <option key={h} value={h}>
                {HITO_MACRO_LABELS[h]}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="TODOS">Todas las Fases (1/2/3)</option>
            <option value="1_ENTREGA_RESPUESTA_INGENIERIA">Fase 1: Pendiente Ingeniería</option>
            <option value="2_REVISION_SUPERVISOR_PENDIENTE">Fase 2: Revisión Supervisor</option>
            <option value="3_APROBACION_SUPERVISOR_TECNICO">Fase 3: Aprobado Supervisor</option>
          </select>
        </div>
      </div>

      {/* LISTADO OPERATIVO DE CRITERIOS CTO PARA CALIFICACIÓN EN BITÁCORA */}
      <div className="space-y-3">
        {criteriosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
            No se encontraron criterios CTO con los filtros aplicados. Prueba activando &quot;Todos los 56 Criterios&quot;.
          </div>
        ) : (
          criteriosFiltrados.map((c) => {
            const isF1 = c.estadoFase === '1_ENTREGA_RESPUESTA_INGENIERIA';
            const isF2 = c.estadoFase === '2_REVISION_SUPERVISOR_PENDIENTE';
            const isF3 = c.estadoFase === '3_APROBACION_SUPERVISOR_TECNICO';
            const hitoActivo = hitosActivosWorkplanner.has(c.hitoMacro);

            return (
              <div
                key={`${agrupacionSel}-${c.numGeneral}`}
                className={`p-4 bg-white rounded-xl border shadow-sm space-y-3 transition ${
                  isF3
                    ? 'border-emerald-200'
                    : isF2
                    ? 'border-amber-200'
                    : 'border-red-200/80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* INFO DEL CRITERIO Y AMARRE CON HITO MACRO / WORKPLANNER */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white">
                        #{c.numGeneral}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {c.categoriaCto} (Ítem {c.itemCategoria})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {HITO_MACRO_LABELS[c.hitoMacro]}
                      </span>
                      {hitoActivo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Hito Activo en Workplanner
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      {c.criterioEvaluacion}
                    </p>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Hito relacionado (Catálogo):</span>{' '}
                        <strong className="text-slate-800">{c.hitoRelacionadoTexto}</strong>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-400">Marco Legal:</span>{' '}
                        <span className="text-slate-700">{c.marcoLegal}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Tareas EDT vinculadas:</span>
                        {c.tareasWorkplannerAsociadas.map((t, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[9.5px] bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BOTONERA DE LAS 3 FASES DE CALIFICACIÓN */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 shrink-0 min-w-[210px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-500" />
                      Estado Calificación CTO ({agrupacionSel}):
                    </span>
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCriterion(c.numGeneral, {
                            estadoFase: '1_ENTREGA_RESPUESTA_INGENIERIA',
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition ${
                          isF1
                            ? 'bg-red-600 border-red-700 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-red-50'
                        }`}
                      >
                        1. Pendiente Ing.
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCriterion(c.numGeneral, {
                            estadoFase: '2_REVISION_SUPERVISOR_PENDIENTE',
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition ${
                          isF2
                            ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                        2. Rev. Supervisor
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCriterion(c.numGeneral, {
                            estadoFase: '3_APROBACION_SUPERVISOR_TECNICO',
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition ${
                          isF3
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50'
                        }`}
                      >
                        3. Aprobado Sup.
                      </button>
                    </div>
                  </div>
                </div>

                {/* RESPONSABLE, FECHA COMPROMISO Y OBSERVACIONES */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Responsable Seguimiento (AN8 / Marval / Supervisión)
                    </label>
                    <ContratistaSelector
                      value={c.responsableAsignado || ''}
                      includeExtras={['A cargo de la Supervisión', 'A cargo del Proyecto']}
                      onChange={(val) =>
                        handleUpdateCriterion(c.numGeneral, { responsableAsignado: val })
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      Fecha de Compromiso
                    </label>
                    <input
                      type="date"
                      value={c.fechaCompromiso || ''}
                      onChange={(e) =>
                        handleUpdateCriterion(c.numGeneral, { fechaCompromiso: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Observaciones / Evidencia Radicado
                    </label>
                    <input
                      type="text"
                      value={c.observaciones || ''}
                      onChange={(e) =>
                        handleUpdateCriterion(c.numGeneral, { observaciones: e.target.value })
                      }
                      placeholder="Nota de soporte, folio de laboratorio o radicado..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
