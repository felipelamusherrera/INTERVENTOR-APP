import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Calendar,
  BookOpen,
  Table2,
  Search,
  Eye,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  CtoEngine,
  CtoEvaluacionAgrupacionItem,
} from '../../../services/ctoEngine';
import { CATALOGO_CRITERIOS_CTO } from '../../../data/catalogoCriteriosCto';
import {
  HITO_MACRO_LABELS,
  HITOS_MACRO_LIST,
} from '../../../services/macroMilestoneService';

interface ResidenteCtoViewProps {
  selectedProject?: string;
}

const FASE_BADGE_MAP = {
  '3_APROBACION_SUPERVISOR_TECNICO': {
    label: 'Fase 3 · Aprobado Sup.',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  '2_REVISION_SUPERVISOR_PENDIENTE': {
    label: 'Fase 2 · Rev. Supervisor',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  '1_ENTREGA_RESPUESTA_INGENIERIA': {
    label: 'Fase 1 · Pend. Ingeniería',
    cls: 'bg-red-100 text-red-800 border-red-200',
  },
} as const;

export const ResidenteCtoView: React.FC<ResidenteCtoViewProps> = ({
  selectedProject = 'Belaterra Pietra',
}) => {
  const [activeTab, setActiveTab] = useState<'MATRIZ_AGRUPACIONES' | 'CATALOGO_INFORMATIVO'>(
    'MATRIZ_AGRUPACIONES'
  );

  const agrupacionesConfig = useMemo(
    () => CtoEngine.getAgrupacionesConfig(selectedProject),
    [selectedProject]
  );

  const [allEvaluaciones, setAllEvaluaciones] = useState<
    Record<string, CtoEvaluacionAgrupacionItem[]>
  >(() => CtoEngine.getAllEvaluacionesProyecto(selectedProject));

  const [agrupacionDetalle, setAgrupacionDetalle] = useState<string>(
    agrupacionesConfig[0]?.agrupacion || 'Urbanismo'
  );

  // Filtros de desglose y catálogo
  const [searchDesglose, setSearchDesglose] = useState('');
  const [filtroCatDesglose, setFiltroCatDesglose] = useState('TODAS');
  const [filtroEstadoDesglose, setFiltroEstadoDesglose] = useState('TODOS');

  const [searchCatalogo, setSearchCatalogo] = useState('');
  const [filtroCatCatalogo, setFiltroCatCatalogo] = useState('TODAS');
  const [filtroHitoCatalogo, setFiltroHitoCatalogo] = useState('TODOS');

  useEffect(() => {
    const refresh = () => {
      setAllEvaluaciones(CtoEngine.getAllEvaluacionesProyecto(selectedProject));
    };
    refresh();
    window.addEventListener('marval_cto_updated', refresh);
    return () => window.removeEventListener('marval_cto_updated', refresh);
  }, [selectedProject]);

  const categoriasUnicas = useMemo(
    () => Array.from(new Set(CATALOGO_CRITERIOS_CTO.map((c) => c.categoriaCto))),
    []
  );

  // Consolidado matricial por cada Agrupación (ordenado por meses de alistamiento)
  const matrizPorAgrupacion = useMemo(() => {
    return agrupacionesConfig.map((cfg) => {
      const lista = allEvaluaciones[cfg.agrupacion] || [];
      const total = lista.length || 56;
      const aprobados = lista.filter(
        (c) => c.estadoFase === '3_APROBACION_SUPERVISOR_TECNICO'
      ).length;
      const revision = lista.filter(
        (c) => c.estadoFase === '2_REVISION_SUPERVISOR_PENDIENTE'
      ).length;
      const pendiente = lista.filter(
        (c) => c.estadoFase === '1_ENTREGA_RESPUESTA_INGENIERIA'
      ).length;
      const pctGlobal = total > 0 ? Math.round((aprobados / total) * 100) : 0;

      const porCategoria: Record<string, number> = {};
      for (const cat of categoriasUnicas) {
        const sub = lista.filter((c) => c.categoriaCto === cat);
        const subOk = sub.filter(
          (c) => c.estadoFase === '3_APROBACION_SUPERVISOR_TECNICO'
        ).length;
        porCategoria[cat] = sub.length > 0 ? Math.round((subOk / sub.length) * 100) : 0;
      }

      return {
        ...cfg,
        total,
        aprobados,
        revision,
        pendiente,
        pctGlobal,
        porCategoria,
      };
    });
  }, [agrupacionesConfig, allEvaluaciones, categoriasUnicas]);

  // Criterios de la agrupación seleccionada para el Desglose
  const criteriosDesgloseFiltrados = useMemo(() => {
    const lista = allEvaluaciones[agrupacionDetalle] || [];
    return lista.filter((c) => {
      if (filtroCatDesglose !== 'TODAS' && c.categoriaCto !== filtroCatDesglose) {
        return false;
      }
      if (filtroEstadoDesglose !== 'TODOS' && c.estadoFase !== filtroEstadoDesglose) {
        return false;
      }
      if (searchDesglose) {
        const q = searchDesglose.toLowerCase();
        const match =
          c.criterioEvaluacion.toLowerCase().includes(q) ||
          c.hitoRelacionadoTexto.toLowerCase().includes(q) ||
          c.responsableAsignado.toLowerCase().includes(q) ||
          String(c.numGeneral).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    allEvaluaciones,
    agrupacionDetalle,
    filtroCatDesglose,
    filtroEstadoDesglose,
    searchDesglose,
  ]);

  // Catálogo Maestro (56 criterios) filtrado
  const catalogoFiltrado = useMemo(() => {
    return CATALOGO_CRITERIOS_CTO.filter((item) => {
      if (filtroCatCatalogo !== 'TODAS' && item.categoriaCto !== filtroCatCatalogo) {
        return false;
      }
      if (filtroHitoCatalogo !== 'TODOS' && item.hitoMacro !== filtroHitoCatalogo) {
        return false;
      }
      if (searchCatalogo) {
        const q = searchCatalogo.toLowerCase();
        const match =
          item.criterioEvaluacion.toLowerCase().includes(q) ||
          item.hitoRelacionadoTexto.toLowerCase().includes(q) ||
          item.marcoLegal.toLowerCase().includes(q) ||
          item.responsableDocumentacion.toLowerCase().includes(q) ||
          String(item.numGeneral).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filtroCatCatalogo, filtroHitoCatalogo, searchCatalogo]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Principal */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Estado CTO del Proyecto · Matriz por Agrupación
              </h1>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                {selectedProject} · Ley 1796 de 2016
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Consolidado operativo por torre y urbanismo según los meses restantes para alistamiento, alimentado directamente desde las calificaciones registradas por el residente en la Bitácora Semanal.
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('MATRIZ_AGRUPACIONES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'MATRIZ_AGRUPACIONES'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Matriz por Agrupación &amp; Desglose</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CATALOGO_INFORMATIVO')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'CATALOGO_INFORMATIVO'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Catálogo Criterios (56)</span>
          </button>
        </div>
      </div>

      {activeTab === 'MATRIZ_AGRUPACIONES' ? (
        <div className="space-y-6">
          {/* TABLA MATRICIAL DE AGRUPACIONES ORDENADA POR MESES DE ALISTAMIENTO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Matriz de Alistamiento CTO por Torre y Urbanismo (Ordenada por Prioridad Temporal)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Haz clic en &quot;Ver Desglose&quot; en cualquier fila para inspeccionar criterios, responsables y fechas de compromiso.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                56 Criterios · 6 Categorías NSR-10
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Agrupación</th>
                    <th className="py-3 px-3">Alistamiento</th>
                    <th className="py-3 px-3 text-center">Meses Rest.</th>
                    <th className="py-3 px-3 text-center">% Cumplim.</th>
                    <th className="py-3 px-3 text-center">Fases (F1 / F2 / F3)</th>
                    {categoriasUnicas.map((cat) => (
                      <th key={cat} className="py-3 px-2 text-center max-w-[95px] truncate" title={cat}>
                        {cat}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrizPorAgrupacion.map((row) => {
                    const isSelected = agrupacionDetalle === row.agrupacion;
                    const urgenciaAlta = row.mesesRestantes <= 3;
                    const urgenciaMedia = row.mesesRestantes > 3 && row.mesesRestantes <= 6;

                    return (
                      <tr
                        key={row.agrupacion}
                        className={`transition ${
                          isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{row.agrupacion}</span>
                            {row.esPrimeraTorre && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                Torre 1
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{row.fechaAlistamiento}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                              urgenciaAlta
                                ? 'bg-red-100 text-red-800'
                                : urgenciaMedia
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {row.mesesRestantes} meses
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`font-black text-sm ${
                              row.pctGlobal >= 85
                                ? 'text-emerald-700'
                                : row.pctGlobal >= 50
                                ? 'text-amber-700'
                                : 'text-red-700'
                            }`}
                          >
                            {row.pctGlobal}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-bold text-[11px]">
                          <span className="text-red-600">{row.pendiente}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-amber-600">{row.revision}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-emerald-700">{row.aprobados}</span>
                        </td>

                        {categoriasUnicas.map((cat) => {
                          const val = row.porCategoria[cat] ?? 0;
                          return (
                            <td key={cat} className="py-3.5 px-2 text-center tabular-nums">
                              <span
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  val >= 80
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : val > 0
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {val}%
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setAgrupacionDetalle(row.agrupacion)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Desglose</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL DE DESGLOSE DE CRITERIOS DE LA AGRUPACIÓN SELECCIONADA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/40">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Desglose Detallado de Criterios · {agrupacionDetalle}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Muestra el estado de las 3 fases, hito relacionado, responsable y fecha de compromiso establecida en la bitácora semanal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar criterio o responsable..."
                    value={searchDesglose}
                    onChange={(e) => setSearchDesglose(e.target.value)}
                    className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-52 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filtroCatDesglose}
                  onChange={(e) => setFiltroCatDesglose(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="TODAS">Todas las Categorías</option>
                  {categoriasUnicas.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroEstadoDesglose}
                  onChange={(e) => setFiltroEstadoDesglose(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="TODOS">Todas las Fases</option>
                  <option value="1_ENTREGA_RESPUESTA_INGENIERIA">Fase 1: Pendiente Ing.</option>
                  <option value="2_REVISION_SUPERVISOR_PENDIENTE">Fase 2: Rev. Supervisor</option>
                  <option value="3_APROBACION_SUPERVISOR_TECNICO">Fase 3: Aprobado Sup.</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">N°</th>
                    <th className="py-2.5 px-3">Categoría &amp; Criterio CTO</th>
                    <th className="py-2.5 px-3">Hito Relacionado &amp; Workplanner</th>
                    <th className="py-2.5 px-3">Responsable Asignado</th>
                    <th className="py-2.5 px-3">Fecha Compromiso</th>
                    <th className="py-2.5 px-3">Estado Bitácora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criteriosDesgloseFiltrados.map((c) => {
                    const badge = FASE_BADGE_MAP[c.estadoFase];
                    return (
                      <tr key={c.numGeneral} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 align-top">
                          #{c.numGeneral}
                        </td>
                        <td className="py-3 px-3 align-top max-w-[360px]">
                          <span className="text-[10px] font-bold text-indigo-700 block">
                            {c.categoriaCto} · Ítem {c.itemCategoria}
                          </span>
                          <span className="font-semibold text-slate-900 block mt-0.5">
                            {c.criterioEvaluacion}
                          </span>
                          {c.observaciones && (
                            <span className="text-[10px] text-slate-500 italic block mt-1">
                              Obs: {c.observaciones}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                            <Layers className="w-2.5 h-2.5" />
                            {HITO_MACRO_LABELS[c.hitoMacro]}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {c.hitoRelacionadoTexto}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top font-semibold text-slate-800">
                          {c.responsableAsignado || c.responsableDocumentacion}
                        </td>
                        <td className="py-3 px-3 align-top font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {c.fechaCompromiso || '-'}
                        </td>
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.cls}`}
                          >
                            {c.estadoFase === '3_APROBACION_SUPERVISOR_TECNICO' && <CheckCircle2 className="w-3 h-3" />}
                            {c.estadoFase === '2_REVISION_SUPERVISOR_PENDIENTE' && <Clock className="w-3 h-3" />}
                            {c.estadoFase === '1_ENTREGA_RESPUESTA_INGENIERIA' && <AlertTriangle className="w-3 h-3" />}
                            <span>{badge.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================================================================= */
        /* PESTAÑA 2: CATÁLOGO MAESTRO DE CRITERIOS (56 CRITERIOS - INFO)     */
        /* ================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Catálogo Maestro Oficial de Criterios CTO (Consolidado SST y CTO CALI · Hoja Catalogo_Criterios)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Base normativa informativa con los 56 criterios documentales exigidos bajo la Ley 1796 de 2016 y el Reglamento NSR-10.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar criterio, norma o responsable..."
                  value={searchCatalogo}
                  onChange={(e) => setSearchCatalogo(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filtroCatCatalogo}
                onChange={(e) => setFiltroCatCatalogo(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="TODAS">Todas las Categorías</option>
                {categoriasUnicas.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filtroHitoCatalogo}
                onChange={(e) => setFiltroHitoCatalogo(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="TODOS">Todos los Puntos de Control</option>
                {HITOS_MACRO_LIST.map((h) => (
                  <option key={h} value={h}>
                    {HITO_MACRO_LABELS[h]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">N° Gen.</th>
                  <th className="py-3 px-3">Categoría CTO</th>
                  <th className="py-3 px-2 text-center">Ítem</th>
                  <th className="py-3 px-3">Criterio de Evaluación / Requisito Documental</th>
                  <th className="py-3 px-3">Responsable Doc.</th>
                  <th className="py-3 px-3">Hito Relacionado (Catálogo)</th>
                  <th className="py-3 px-3">Punto de Control (Workplanner)</th>
                  <th className="py-3 px-3">Marco Legal / Normativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogoFiltrado.map((item) => (
                  <tr key={item.numGeneral} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {item.numGeneral}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {item.categoriaCto}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                      {item.itemCategoria}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[320px]">
                      {item.criterioEvaluacion}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.responsableDocumentacion}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[220px]">
                      {item.hitoRelacionadoTexto}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                        {HITO_MACRO_LABELS[item.hitoMacro]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-[200px]">
                      {item.marcoLegal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
