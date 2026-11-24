import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Building2,
  Sliders,
  BarChart3,
  Wrench,
  Calendar,
  Grid3X3,
  Check,
  Calculator,
} from 'lucide-react';
import {
  SelloActivity,
  CriterioSello,
  Sucursal,
} from '../../../types';
import {
  CalidadSellosEngine,
  SELLO_TO_HITO_MAP,
} from '../../../services/calidadSellosEngine';
import {
  ParametrizacionService,
  TorreParametrizacion,
  ApartamentoGenerado,
} from '../../../services/parametrizacionService';
import { ContratistaSelector } from '../../common/ContratistaSelector';

interface SellosCalidadTabProps {
  proyectoId: string;
  sucursal: Sucursal;
  residenteNombre: string;
}

function formatCop(val: number): string {
  return `$${Math.round(val).toLocaleString('es-CO')}`;
}

export const SellosCalidadTab: React.FC<SellosCalidadTabProps> = ({
  proyectoId,
  sucursal,
  residenteNombre,
}) => {
  const [activities, setActivities] = useState<SelloActivity[]>(() =>
    CalidadSellosEngine.getActivities(proyectoId)
  );
  const [selectedSelloId, setSelectedSelloId] = useState<string>(
    () => CalidadSellosEngine.getActivities(proyectoId)[0]?.id || 'sello-vanos-est'
  );
  const [phaseFilter, setPhaseFilter] = useState<'TODAS' | 'Obra Gris' | 'Obra Blanca'>('TODAS');

  // Parametrización de Torres -> Matriz Filas Piso x Columnas Serie
  const [torresConfig, setTorresConfig] = useState<TorreParametrizacion[]>(() =>
    ParametrizacionService.getTorresConfig(proyectoId)
  );
  const [formTorre, setFormTorre] = useState<string>(
    () => ParametrizacionService.getTorresConfig(proyectoId)[0]?.nombreTorre || 'TORRE 01'
  );
  const [rawSelectedAptos, setSelectedAptos] = useState<string[]>([]);

  // Campos de Registro de Inspección + Fecha de Ejecución + Cálculo de Retención
  const [formFechaEjecucion, setFormFechaEjecucion] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [formContratista, setFormContratista] = useState<string>('');
  const [formTolPosMm, setFormTolPosMm] = useState<string>(() =>
    String(activities[0]?.toleranciaPositivaMm ?? 5)
  );
  const [formTolNegMm, setFormTolNegMm] = useState<string>(() =>
    String(activities[0]?.toleranciaNegativaMm ?? 5)
  );
  const [formMedicionMm, setFormMedicionMm] = useState<string>('');
  const [formResultado, setFormResultado] = useState<CriterioSello>('0');
  const [formCriterio, setFormCriterio] = useState<string>(
    () => activities[0]?.criteriosManual?.[0] || 'Dimensiones'
  );
  const [formHallazgo, setFormHallazgo] = useState<string>('');
  const [formInspector, setFormInspector] = useState<string>(residenteNombre || 'Residente Interventoría');

  // Parámetros de cálculo automático de Retención por lote en la fecha
  const [formValorContratoApto, setFormValorContratoApto] = useState<number>(1500000);
  const [formPctRetencion, setFormPctRetencion] = useState<number>(20);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const refreshParam = () => {
      const cfg = ParametrizacionService.getTorresConfig(proyectoId);
      setTorresConfig(cfg);
      if (cfg.length > 0 && !cfg.some((t) => t.nombreTorre === formTorre)) {
        setFormTorre(cfg[0].nombreTorre);
      }
    };
    const refreshSellos = () => {
      setActivities(CalidadSellosEngine.getActivities(proyectoId));
    };

    window.addEventListener('marval_parametrizacion_updated', refreshParam);
    window.addEventListener('marval_sellos_updated', refreshSellos);
    return () => {
      window.removeEventListener('marval_parametrizacion_updated', refreshParam);
      window.removeEventListener('marval_sellos_updated', refreshSellos);
    };
  }, [proyectoId, formTorre]);

  const activeTorreObj = useMemo(() => {
    return torresConfig.find((t) => t.nombreTorre === formTorre) || torresConfig[0];
  }, [torresConfig, formTorre]);

  // Apartamentos estructurados de la Torre seleccionada
  const apartamentosTorre: ApartamentoGenerado[] = useMemo(() => {
    if (!activeTorreObj) return [];
    return ParametrizacionService.generarApartamentosPorTorre(activeTorreObj);
  }, [activeTorreObj]);

  // Matriz Filas (Pisos) x Columnas (Series)
  const { pisosList, seriesList, matrixByPisoSerie } = useMemo(() => {
    const pSet = new Set<number>();
    const sList =
      activeTorreObj?.series && activeTorreObj.series.length > 0
        ? activeTorreObj.series
        : ['01', '02', '03', '04'];
    const map = new Map<string, ApartamentoGenerado>();

    apartamentosTorre.forEach((ap) => {
      pSet.add(ap.piso);
      map.set(`${ap.piso}::${ap.serie}`, ap);
    });

    return {
      pisosList: Array.from(pSet).sort((a, b) => a - b),
      seriesList: sList,
      matrixByPisoSerie: map,
    };
  }, [apartamentosTorre, activeTorreObj]);

  // Filtrar selección válida frente a la parametrización activa de la torre
  const selectedAptos = useMemo(() => {
    const validCodes = new Set(apartamentosTorre.map((a) => a.codigo));
    return rawSelectedAptos.filter((c) => validCodes.has(c));
  }, [rawSelectedAptos, apartamentosTorre]);

  // % de avance = inmuebles seleccionados / total de apartamentos de la torre
  const avanceLotePct =
    apartamentosTorre.length > 0 ? (selectedAptos.length / apartamentosTorre.length) * 100 : 0;

  const filteredActivities = useMemo(() => {
    if (phaseFilter === 'TODAS') return activities;
    return activities.filter((a) => a.fase === phaseFilter);
  }, [activities, phaseFilter]);

  const selectedSello = useMemo(() => {
    return activities.find((a) => a.id === selectedSelloId) || activities[0];
  }, [activities, selectedSelloId]);

  const selloContratoInfo = useMemo(() => {
    return selectedSello
      ? CalidadSellosEngine.getSelloContratoInfo(selectedSello.id)
      : null;
  }, [selectedSello]);

  const handleSelectSello = (act: SelloActivity) => {
    setSelectedSelloId(act.id);
    const criterios = act.criteriosManual || [];
    if (criterios.length > 0) {
      setFormCriterio(criterios[0]);
    }
    setFormTolPosMm(String(act.toleranciaPositivaMm ?? 0));
    setFormTolNegMm(String(act.toleranciaNegativaMm ?? 0));
  };

  const getSelloCompliance = (act: SelloActivity) => {
    const valid = act.inspecciones.filter((i) => i.resultado !== 'NA');
    if (valid.length === 0) return 0;
    const ok = valid.filter((i) => i.resultado === '0').length;
    return Math.round((ok / valid.length) * 100);
  };

  // Último resultado registrado por apartamento en la torre + sello actual para referencia visual en la matriz
  const estadoPrevioPorApto = useMemo(() => {
    const map = new Map<string, { resultado: CriterioSello; fecha: string }>();
    if (!selectedSello) return map;
    selectedSello.inspecciones.forEach((ins) => {
      if (ins.torre !== (activeTorreObj?.nombreTorre || formTorre)) return;
      const code = ins.apartamento.replace(/[^\d]/g, '').padStart(4, '0');
      if (!map.has(code)) {
        map.set(code, { resultado: ins.resultado, fecha: ins.fecha });
      }
    });
    return map;
  }, [selectedSello, activeTorreObj, formTorre]);

  // Simulación en vivo del Lote automático para la Fecha de Ejecución seleccionada
  const previewLoteFecha = useMemo(() => {
    const torreName = activeTorreObj?.nombreTorre || formTorre;
    const prevSameDate = (selectedSello?.inspecciones || []).filter(
      (i) => i.torre === torreName && i.fecha === formFechaEjecucion
    );

    const byApto = new Map<string, CriterioSello>();
    prevSameDate.forEach((i) => {
      const code = i.apartamento.replace(/[^\d]/g, '').padStart(4, '0');
      byApto.set(code, i.resultado);
    });
    selectedAptos.forEach((code) => {
      byApto.set(code, formResultado);
    });

    const evalGrades = Array.from(byApto.values()).filter((r) => r !== 'NA');
    const auditadas = evalGrades.length;
    const aprobadas = evalGrades.filter((r) => r === '0').length;

    const ret = CalidadSellosEngine.calcularRetencionLote({
      unidadesAuditadas: auditadas,
      unidadesAprobadas: aprobadas,
      valorContratoPorApto: formValorContratoApto,
      porcentajeRetencion: formPctRetencion,
    });

    const evalStatus = CalidadSellosEngine.evaluateLotQuality({
      unidadesAuditadas: auditadas,
      unidadesAprobadas: aprobadas,
      fechaAuditoria: formFechaEjecucion,
    });

    return { ...ret, ...evalStatus };
  }, [
    activeTorreObj,
    formTorre,
    selectedSello,
    formFechaEjecucion,
    selectedAptos,
    formResultado,
    formValorContratoApto,
    formPctRetencion,
  ]);

  const toggleApto = (codigo: string) => {
    setSelectedAptos((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  };

  const togglePiso = (piso: number) => {
    const floorCodes = seriesList
      .map((s) => matrixByPisoSerie.get(`${piso}::${s}`)?.codigo)
      .filter((c): c is string => Boolean(c));
    if (floorCodes.length === 0) return;
    const allSelected = floorCodes.every((c) => selectedAptos.includes(c));
    setSelectedAptos((prev) =>
      allSelected
        ? prev.filter((c) => !floorCodes.includes(c))
        : Array.from(new Set([...prev, ...floorCodes]))
    );
  };

  const toggleSerie = (serie: string) => {
    const colCodes = pisosList
      .map((p) => matrixByPisoSerie.get(`${p}::${serie}`)?.codigo)
      .filter((c): c is string => Boolean(c));
    if (colCodes.length === 0) return;
    const allSelected = colCodes.every((c) => selectedAptos.includes(c));
    setSelectedAptos((prev) =>
      allSelected
        ? prev.filter((c) => !colCodes.includes(c))
        : Array.from(new Set([...prev, ...colCodes]))
    );
  };

  const handleSelectAllAptos = () => {
    setSelectedAptos(apartamentosTorre.map((a) => a.codigo));
  };

  const handleClearAptos = () => {
    setSelectedAptos([]);
  };

  const handleGuardarInspeccionLote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSello) return;

    if (selectedAptos.length === 0) {
      alert('Por favor seleccione al menos un apartamento en la matriz (Piso × Serie).');
      return;
    }

    if (!formFechaEjecucion) {
      alert('Por favor seleccione la fecha de ejecución del sello de calidad.');
      return;
    }

    if (!formContratista.trim()) {
      alert('Por favor seleccione el Contratista evaluado (base AN8 o Marval Ingeniería).');
      return;
    }

    const aptosPayload = selectedAptos.map((codigo) => {
      const found = apartamentosTorre.find((a) => a.codigo === codigo);
      return {
        codigo,
        piso: found?.piso || Number(codigo.slice(0, 2)) || 1,
      };
    });

    const totalUnidadesTorre = activeTorreObj
      ? activeTorreObj.numeroPisos * activeTorreObj.series.length
      : 48;

    const tolPosVal =
      formTolPosMm !== '' ? Number(formTolPosMm) : (selectedSello.toleranciaPositivaMm ?? 0);
    const tolNegVal =
      formTolNegMm !== '' ? Number(formTolNegMm) : (selectedSello.toleranciaNegativaMm ?? 0);

    const { updatedActivities, retencionCalculada } =
      CalidadSellosEngine.registrarInspeccionesLoteBatch({
        proyectoId,
        sucursal,
        selloId: selectedSello.id,
        torre: activeTorreObj?.nombreTorre || formTorre,
        apartamentos: aptosPayload,
        fechaEjecucion: formFechaEjecucion,
        resultado: formResultado,
        criterioEvaluado: formCriterio,
        toleranciaPositivaMm: isNaN(tolPosVal) ? 0 : tolPosVal,
        toleranciaNegativaMm: isNaN(tolNegVal) ? 0 : tolNegVal,
        unidadTolerancia: selectedSello.unidadTolerancia || 'mm',
        medicionMm: formMedicionMm ? Number(formMedicionMm) : undefined,
        hallazgo: formHallazgo,
        contratista: formContratista,
        inspector: formInspector || residenteNombre,
        valorContratoPorApto: formValorContratoApto,
        porcentajeRetencion: formPctRetencion,
        totalUnidadesTorre,
        porcentajeAvanceWP: avanceLotePct,
      });

    setActivities(updatedActivities);
    setSelectedAptos([]);
    setFormHallazgo('');
    setFormMedicionMm('');
    setToastMsg(
      `Registrados ${aptosPayload.length} apto(s) en ${selectedSello.codigo} (${selectedSello.nombre}) el ${formFechaEjecucion}. Lote del día: ${retencionCalculada.unidadesAprobadas}/${retencionCalculada.unidadesAuditadas} (${retencionCalculada.porcentajeCumplimiento}%) · Retención: ${formatCop(retencionCalculada.valorRetencionCalculado)} COP.`
    );
    setTimeout(() => setToastMsg(null), 6000);
  };

  const navigateToModule = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('marval_navigate_tab', { detail: tabId }));
  };

  const linkedHito = selectedSello ? SELLO_TO_HITO_MAP[selectedSello.id] : undefined;

  return (
    <div className="space-y-5">
      {toastMsg && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Norma MA-SIG-CAL-001 v003 · Registro de Sellos de Calidad en Obra</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Seleccione la actividad estandarizada, marque uno o varios apartamentos en la{' '}
            <strong>Matriz Piso × Serie</strong>, registre la fecha de ejecución y calcule
            automáticamente la retención del lote del día.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToModule('elevacion')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Parametrizar Torres ({torresConfig.length})</span>
          </button>
          <button
            type="button"
            onClick={() => navigateToModule('residente-calidad')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ver Tablero Indicadores Sellos</span>
          </button>
        </div>
      </div>

      {/* 4 TARJETAS DE CRITERIOS OFICIALES MARVAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Criterio 0: Cumple</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Dentro de especificación y tolerancia geométrica.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
          <div className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Criterio 1: No cumple</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-0.5">
            Incumplimiento directo a cargo del contratista del frente.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Criterio 2: No cumple por externos</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Daño o desviación originado por otros gremios contratistas.
          </p>
        </div>
      </div>

      {/* GRID PRINCIPAL REORGANIZADO: 6 ACTIVIDADES (IZQ) + FORMULARIO Y MATRIZ APTOS (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda: 6 Actividades Estandarizadas */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              6 Actividades Estandarizadas
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              {(['TODAS', 'Obra Gris', 'Obra Blanca'] as const).map((fase) => (
                <button
                  type="button"
                  key={fase}
                  onClick={() => setPhaseFilter(fase)}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    phaseFilter === fase
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {fase}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredActivities.map((act) => {
              const pct = getSelloCompliance(act);
              const isSelected = selectedSello?.id === act.id;
              const evalCount = act.inspecciones.filter((i) => i.resultado !== 'NA').length;
              const actContrato = CalidadSellosEngine.getSelloContratoInfo(act.id);

              return (
                <button
                  type="button"
                  key={act.id}
                  onClick={() => handleSelectSello(act)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{act.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {act.fase} · {act.codigo} · {actContrato.labelContrato}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded ${
                          evalCount === 0
                            ? 'bg-slate-100 text-slate-500'
                            : pct >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {pct}%
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                        {act.inspecciones.length}{' '}
                        {act.inspecciones.length === 1 ? 'registro' : 'registros'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 truncate">
                    Tolerancia: {act.tolerancia}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Encabezado Sello + Formulario Simplificado + Matriz Piso x Serie */}
        {selectedSello && (
          <div className="lg:col-span-8 space-y-4">
            {/* Tarjeta Encabezado del Sello Seleccionado */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {selectedSello.fase} · {selectedSello.codigo}
                    </span>
                    {linkedHito && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        Hito Calidad: {linkedHito.hitoLabel}
                      </span>
                    )}
                    {selloContratoInfo && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                        Contrato ({selloContratoInfo.codigoCpc}): {selloContratoInfo.labelContrato}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Sello de Calidad: {selectedSello.nombre}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedSello.descripcion}</p>
                </div>

                <div className="text-right bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl max-w-xs">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase">
                    Tolerancia de Aceptación
                  </div>
                  <div className="text-xs font-extrabold text-indigo-950 mt-0.5">
                    {selectedSello.tolerancia}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">Herramientas:</span>
                {selectedSello.herramientas.map((h) => (
                  <span
                    key={h}
                    className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Formulario Unificado */}
            <form
              onSubmit={handleGuardarInspeccionLote}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Registro por Lote de Apartamentos (Matriz Piso × Serie)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Torre:{' '}
                  <strong>
                    {activeTorreObj?.nombreTorre} ({activeTorreObj?.numeroPisos} pisos ×{' '}
                    {seriesList.length} series)
                  </strong>
                </span>
              </div>

              {/* Fila 1: Torre + Fecha de Ejecución + Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Torre / Agrupación *
                  </label>
                  <select
                    value={formTorre}
                    onChange={(e) => {
                      setFormTorre(e.target.value);
                      setSelectedAptos([]);
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    {torresConfig.map((t) => (
                      <option key={t.id} value={t.nombreTorre}>
                        {t.nombreTorre} ({t.numeroPisos * t.series.length} aptos)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Fecha de Ejecución del Sello *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formFechaEjecucion}
                    onChange={(e) => setFormFechaEjecucion(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg bg-indigo-50/40 font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspector</label>
                  <input
                    type="text"
                    value={formInspector}
                    onChange={(e) => setFormInspector(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* MATRIZ DE SELECCIÓN DE APARTAMENTOS (FILAS = PISO, COLUMNAS = SERIE) */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Grid3X3 className="w-4 h-4 text-indigo-600" />
                    <span>Matriz de Apartamentos ({activeTorreObj?.nombreTorre})</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                      {selectedAptos.length} seleccionado(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllAptos}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-indigo-50 text-slate-700 font-bold cursor-pointer"
                    >
                      Seleccionar toda la torre
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAptos}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold cursor-pointer"
                    >
                      Limpiar ({selectedAptos.length})
                    </button>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500">
                  Haga clic en cada caja para seleccionar múltiples inmuebles, en una{' '}
                  <strong>Serie</strong> para marcar toda la columna o en un <strong>Piso</strong>{' '}
                  para marcar toda la fila.
                </p>

                <div className="overflow-x-auto max-h-[260px] overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-center text-[11px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2 text-left text-[10px] font-extrabold text-slate-600 uppercase w-20">
                          Piso \ Serie
                        </th>
                        {seriesList.map((serie) => (
                          <th key={serie} className="py-1.5 px-1.5">
                            <button
                              type="button"
                              onClick={() => toggleSerie(serie)}
                              className="w-full px-2 py-1 rounded bg-white hover:bg-indigo-50 border border-slate-300 text-[10px] font-extrabold text-slate-800 transition cursor-pointer"
                              title={`Seleccionar / deseleccionar toda la Serie ${serie}`}
                            >
                              Serie {serie}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pisosList.map((piso) => (
                        <tr key={piso} className="hover:bg-slate-50/60">
                          <td className="py-1 px-2 text-left">
                            <button
                              type="button"
                              onClick={() => togglePiso(piso)}
                              className="w-full px-2 py-1 rounded bg-slate-100 hover:bg-indigo-100 text-[10px] font-extrabold text-slate-700 transition text-left cursor-pointer"
                              title={`Seleccionar / deseleccionar todo el Piso ${piso}`}
                            >
                              Piso {String(piso).padStart(2, '0')}
                            </button>
                          </td>
                          {seriesList.map((serie) => {
                            const apto = matrixByPisoSerie.get(`${piso}::${serie}`);
                            if (!apto) {
                              return (
                                <td key={serie} className="py-1 px-1.5 text-slate-300">
                                  —
                                </td>
                              );
                            }
                            const isChecked = selectedAptos.includes(apto.codigo);
                            const prev = estadoPrevioPorApto.get(apto.codigo);
                            const prevBadgeCls =
                              prev?.resultado === '0'
                                ? 'bg-emerald-500 text-white'
                                : prev?.resultado === '1'
                                  ? 'bg-rose-500 text-white'
                                  : prev?.resultado === '2'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-400 text-white';

                            return (
                              <td key={serie} className="py-1 px-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleApto(apto.codigo)}
                                  className={`w-full px-2 py-1.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer tabular-nums ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                                  }`}
                                  title={
                                    prev
                                      ? `${apto.label} · Último registro: ${prev.resultado} (${prev.fecha})`
                                      : apto.label
                                  }
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isChecked
                                        ? 'bg-white text-indigo-600 border-white'
                                        : 'border-slate-300 bg-slate-50'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                  <span>{apto.codigo}</span>
                                  {prev && (
                                    <span
                                      className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${prevBadgeCls}`}
                                    >
                                      {prev.resultado}
                                    </span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fila 2: Contratista, Tolerancias (+ / - mm), Medida real */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-end">
                <div className="md:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1">
                    Contratista Evaluado (Base AN8 / Marval) *
                  </label>
                  <ContratistaSelector value={formContratista} onChange={setFormContratista} />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tol. (+) {selectedSello.unidadTolerancia || 'mm'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={formTolPosMm}
                    onChange={(e) => setFormTolPosMm(e.target.value)}
                    className="w-full px-2.5 py-2 border border-indigo-200 rounded-lg bg-indigo-50/40 text-xs font-bold text-indigo-950"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tol. (-) {selectedSello.unidadTolerancia || 'mm'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={formTolNegMm}
                    onChange={(e) => setFormTolNegMm(e.target.value)}
                    className="w-full px-2.5 py-2 border border-indigo-200 rounded-lg bg-indigo-50/40 text-xs font-bold text-indigo-950"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Medida real ({selectedSello.unidadTolerancia || 'mm'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMedicionMm}
                    onChange={(e) => setFormMedicionMm(e.target.value)}
                    placeholder="Opcional (mm)"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* Fila 3: Botones de Calificación del Criterio Oficial (Marval) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Calificación aplicada a los {selectedAptos.length || 0} inmueble(s) seleccionado(s)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      code: '0' as CriterioSello,
                      label: '0: Cumple',
                      activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
                      idleClass: 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50',
                    },
                    {
                      code: '1' as CriterioSello,
                      label: '1: No Cumple',
                      activeClass: 'bg-rose-600 text-white border-rose-700 shadow-sm',
                      idleClass: 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50',
                    },
                    {
                      code: '2' as CriterioSello,
                      label: '2: No Cumple Ext.',
                      activeClass: 'bg-amber-600 text-white border-amber-700 shadow-sm',
                      idleClass: 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50',
                    },
                  ].map((btn) => (
                    <button
                      type="button"
                      key={btn.code}
                      onClick={() => setFormResultado(btn.code)}
                      className={`py-2 px-3 rounded-lg border text-xs font-extrabold transition cursor-pointer ${
                        formResultado === btn.code ? btn.activeClass : btn.idleClass
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 4: Criterio del Sello y Hallazgo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                <div className="md:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1">
                    Criterio del Sello (Manual MA-SIG-CAL-001) *
                  </label>
                  <select
                    value={formCriterio}
                    onChange={(e) => setFormCriterio(e.target.value)}
                    className={`w-full px-2.5 py-2 border rounded-lg font-semibold ${
                      formResultado === '1' || formResultado === '2'
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    {(selectedSello.criteriosManual || ['Criterio general']).map((crit) => (
                      <option key={crit} value={crit}>
                        {crit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-7">
                  <label className="block font-bold text-slate-700 mb-1">
                    Hallazgo / Observación Técnica (Espacio / Eje / Elemento)
                  </label>
                  <input
                    type="text"
                    value={formHallazgo}
                    onChange={(e) => setFormHallazgo(e.target.value)}
                    placeholder="Ej. Alcoba principal +12mm sobre referencia, o conforme según formato FT-ING-OBR-002..."
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* Fila 5: Cálculo Automático de Retención del Lote en la Misma Fecha */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>
                      Consolidación Automática de Lote y Retención ({formFechaEjecucion})
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${
                      previewLoteFecha.unidadesAuditadas === 0
                        ? 'bg-slate-200 text-slate-600'
                        : previewLoteFecha.valorRetencionCalculado > 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Lote del día: {previewLoteFecha.unidadesAprobadas}/
                    {previewLoteFecha.unidadesAuditadas} aptos · Cumplimiento:{' '}
                    {previewLoteFecha.porcentajeCumplimiento}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Valor Contrato por Apartamento (COP) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={formValorContratoApto}
                      onChange={(e) => setFormValorContratoApto(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      % Retención por Detallado *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formPctRetencion}
                      onChange={(e) =>
                        setFormPctRetencion(Math.min(100, Math.max(0, Number(e.target.value))))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      % Avance del lote (sobre {apartamentosTorre.length} aptos)
                    </label>
                    <div className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-100 font-bold tabular-nums text-slate-800">
                      {avanceLotePct.toFixed(1)}% ({selectedAptos.length}/{apartamentosTorre.length})
                    </div>
                  </div>
                </div>

                {/* Desglose transparente de la fórmula en vivo */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums">
                  <div className="text-slate-600">
                    <span className="font-bold text-slate-800">Fórmula: </span>
                    {previewLoteFecha.unidadesAuditadas} aptos × (1 -{' '}
                    {(previewLoteFecha.porcentajeCumplimiento / 100).toFixed(2)}) ×{' '}
                    {(formPctRetencion / 100).toFixed(2)} × {formatCop(formValorContratoApto)}
                  </div>
                  <div className="font-black text-xs">
                    <span className="text-slate-500 mr-1">Retención calculada:</span>
                    <span
                      className={
                        previewLoteFecha.valorRetencionCalculado > 0
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }
                    >
                      {formatCop(previewLoteFecha.valorRetencionCalculado)} COP
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Guardar Sello en {selectedAptos.length} Apartamento(s) ({formFechaEjecucion})
                </span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECCIÓN ANCHO COMPLETO: INSPECCIONES REGISTRADAS */}
      {selectedSello && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Inspecciones Registradas para {selectedSello.nombre} ({selectedSello.inspecciones.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              {selloContratoInfo?.labelContrato}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Inmueble</th>
                  <th className="py-2.5 px-3">Torre / Piso</th>
                  <th className="py-2.5 px-3">Resultado</th>
                  <th className="py-2.5 px-3">Criterio del Sello</th>
                  <th className="py-2.5 px-3">Medición / Tolerancia</th>
                  <th className="py-2.5 px-3">Hallazgo / Observación</th>
                  <th className="py-2.5 px-3">Contratista</th>
                  <th className="py-2.5 px-3">Fecha Ejecución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSello.inspecciones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aún no hay inspecciones registradas para {selectedSello.nombre}.
                    </td>
                  </tr>
                ) : (
                  selectedSello.inspecciones.map((ins) => (
                    <tr key={ins.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{ins.apartamento}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {ins.torre || 'TORRE 01'} · P{ins.piso}
                        </span>
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
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {ins.criterioEvaluado || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {ins.medicionMm !== undefined ? `${ins.medicionMm} mm · ` : ''}
                        {ins.toleranciaTexto}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 italic max-w-xs truncate" title={ins.hallazgo}>
                        {ins.hallazgo || 'Conforme'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {ins.contratistaResponsable || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 tabular-nums">{ins.fecha}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
