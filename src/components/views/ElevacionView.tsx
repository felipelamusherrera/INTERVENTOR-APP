import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Award,
  Building2,
  Settings,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { FloorElevation, SelloActivity, SelloInspection } from '../../types';
import {
  ParametrizacionService,
  TorreParametrizacion,
  ApartamentoGenerado,
} from '../../services/parametrizacionService';
import { CalidadSellosEngine, extractAptoCode } from '../../services/calidadSellosEngine';
import { ProjectService } from '../../services/projectService';

interface ElevacionViewProps {
  selectedProject?: string;
  selectedTower?: string;
}

type AptoEstadoVisual = 'OBSERVADO' | 'APROBADO' | 'PARCIAL' | 'PENDIENTE';

export const ElevacionView: React.FC<ElevacionViewProps> = ({
  selectedProject = '',
  selectedTower = '',
}) => {
  const projectObj = ProjectService.getProjectById(selectedProject);
  const projectLabel = projectObj?.nombreJde || selectedProject || 'Sin proyecto';

  const [torresConfig, setTorresConfig] = useState<TorreParametrizacion[]>(() =>
    ParametrizacionService.getTorresConfig(selectedProject)
  );

  const [selectedTorreId, setSelectedTorreId] = useState<string>(() => {
    const found = ParametrizacionService.findTorre(selectedProject, selectedTower);
    return found?.id || '';
  });
  const [selectedPiso, setSelectedPiso] = useState<number>(1);
  const [selectedAptoCodigo, setSelectedAptoCodigo] = useState<string | null>(null);

  const [sellosActivities, setSellosActivities] = useState<SelloActivity[]>(() =>
    selectedProject ? CalidadSellosEngine.getActivities(selectedProject) : []
  );

  useEffect(() => {
    const refreshParam = () => {
      const latest = ParametrizacionService.getTorresConfig(selectedProject);
      setTorresConfig(latest);
      if (latest.length > 0) {
        const match = ParametrizacionService.findTorre(selectedProject, selectedTower);
        const chosen = match || latest[0];
        setSelectedTorreId((prev) =>
          latest.some((t) => t.id === prev) ? prev : chosen.id
        );
      } else {
        setSelectedTorreId('');
      }
    };

    const refreshSellos = () => {
      setSellosActivities(
        selectedProject ? CalidadSellosEngine.getActivities(selectedProject) : []
      );
    };

    refreshParam();
    refreshSellos();

    window.addEventListener('marval_parametrizacion_updated', refreshParam);
    window.addEventListener('marval_projects_updated', refreshParam);
    window.addEventListener('marval_sellos_updated', refreshSellos);
    return () => {
      window.removeEventListener('marval_parametrizacion_updated', refreshParam);
      window.removeEventListener('marval_projects_updated', refreshParam);
      window.removeEventListener('marval_sellos_updated', refreshSellos);
    };
  }, [selectedProject, selectedTower]);

  const activeTorre = useMemo(() => {
    return torresConfig.find((t) => t.id === selectedTorreId) || torresConfig[0];
  }, [torresConfig, selectedTorreId]);

  useEffect(() => {
    if (!activeTorre) return;
    if (selectedPiso > activeTorre.numeroPisos || selectedPiso < 1) {
      setSelectedPiso(1);
    }
    if (!selectedAptoCodigo) {
      setSelectedAptoCodigo(`01${activeTorre.series[0] || '01'}`);
    }
  }, [activeTorre, selectedPiso, selectedAptoCodigo]);

  // Indexar inspecciones de sellos por código de apartamento y torre
  const inspeccionesPorApto = useMemo(() => {
    const map = new Map<
      string,
      Array<SelloInspection & { selloCodigo: string; selloNombre: string; fase: string }>
    >();
    if (!activeTorre) return map;
    const torreNorm = activeTorre.nombreTorre.toLowerCase().replace(/\b0+(\d+)/g, '$1');

    sellosActivities.forEach((act) => {
      act.inspecciones.forEach((ins) => {
        const insTorreNorm = (ins.torre || '').toLowerCase().replace(/\b0+(\d+)/g, '$1');
        if (insTorreNorm !== torreNorm) return;

        const code = extractAptoCode(ins.apartamento);
        const list = map.get(code) || [];
        list.push({
          ...ins,
          selloCodigo: act.codigo,
          selloNombre: act.nombre,
          fase: act.fase,
        });
        map.set(code, list);
      });
    });

    return map;
  }, [sellosActivities, activeTorre]);

  const getEstadoVisualApto = (
    codigo: string
  ): { estado: AptoEstadoVisual; aprobados: number; hallazgos: number; total: number } => {
    const insps = inspeccionesPorApto.get(codigo) || [];
    if (insps.length === 0) {
      return { estado: 'PENDIENTE', aprobados: 0, hallazgos: 0, total: 0 };
    }
    const hallazgos = insps.filter((i) => i.resultado === '1' || i.resultado === '2').length;
    const aprobados = insps.filter((i) => i.resultado === '0').length;
    if (hallazgos > 0) {
      return { estado: 'OBSERVADO', aprobados, hallazgos, total: insps.length };
    }
    if (aprobados >= 3) {
      return { estado: 'APROBADO', aprobados, hallazgos: 0, total: insps.length };
    }
    return { estado: 'PARCIAL', aprobados, hallazgos: 0, total: insps.length };
  };

  // Apartamentos generados por piso (ordenados de piso superior al piso 1 para elevación vertical)
  const pisosConApartamentos = useMemo(() => {
    if (!activeTorre) return [];
    const filas: Array<{
      piso: number;
      apartamentos: ApartamentoGenerado[];
      gremios: FloorElevation['actividades'];
    }> = [];

    for (let p = activeTorre.numeroPisos; p >= 1; p--) {
      const aptos = ParametrizacionService.generarApartamentosPorTorre(activeTorre, p);
      // Estado limpio basado en inspecciones reales del piso (sin datos mock)
      let anyHallazgo = false;
      let anyAprobado = false;
      let allAprobados = aptos.length > 0;

      aptos.forEach((a) => {
        const est = getEstadoVisualApto(a.codigo);
        if (est.hallazgos > 0) anyHallazgo = true;
        if (est.aprobados > 0) anyAprobado = true;
        if (est.estado !== 'APROBADO') allAprobados = false;
      });

      const floorStatus: 'completado' | 'en_proceso' | 'pendiente' | 'observado' = anyHallazgo
        ? 'observado'
        : allAprobados
          ? 'completado'
          : anyAprobado
            ? 'en_proceso'
            : 'pendiente';

      const gremios: FloorElevation['actividades'] = {
        estructura: floorStatus,
        mamposteria: floorStatus,
        panete: floorStatus,
        enchape: floorStatus,
        redes: floorStatus,
      };

      filas.push({ piso: p, apartamentos: aptos, gremios });
    }
    return filas;
  }, [activeTorre, inspeccionesPorApto]);

  const getStatusBadge = (status: 'completado' | 'en_proceso' | 'pendiente' | 'observado') => {
    switch (status) {
      case 'completado':
        return <span className="w-3 h-3 rounded bg-emerald-500 inline-block" title="Completado" />;
      case 'en_proceso':
        return <span className="w-3 h-3 rounded bg-blue-500 inline-block animate-pulse" title="En Proceso" />;
      case 'observado':
        return <span className="w-3 h-3 rounded bg-red-500 inline-block" title="Observado" />;
      default:
        return <span className="w-3 h-3 rounded bg-slate-200 inline-block" title="Pendiente" />;
    }
  };

  const handleGoToParametros = () => {
    window.dispatchEvent(new CustomEvent('marval_navigate_tab', { detail: 'parametros' }));
  };

  const totalAptosTorreActiva = activeTorre ? activeTorre.numeroPisos * activeTorre.series.length : 0;
  const selectedFloorObj =
    pisosConApartamentos.find((f) => f.piso === selectedPiso) || pisosConApartamentos[0];
  const selectedAptoInspecciones = selectedAptoCodigo
    ? inspeccionesPorApto.get(selectedAptoCodigo) || []
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Módulo Residente · Matriz de Elevación 3D</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{projectLabel}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Estructura Vertical de Torres e Inmuebles · Elevación 3D
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Visualización vertical generada automáticamente desde la configuración guardada en{' '}
            <strong>Parámetros del proyecto → Parametrización Torres e inmuebles</strong> y cruzada con las inspecciones de Sellos de Calidad.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoToParametros}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editar en Parámetros del proyecto</span>
        </button>
      </div>

      {!activeTorre ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No hay torres parametrizadas para este proyecto
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Configure las torres, pisos e inmuebles por piso en el Módulo 1 <strong>Parámetros del proyecto</strong> para generar la Matriz de Elevación 3D.
          </p>
          <button
            type="button"
            onClick={handleGoToParametros}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Ir a Parámetros del proyecto</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selector de Torre y Leyenda */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">Torre:</span>
              {torresConfig.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTorreId(t.id);
                    const targetPiso = Math.min(selectedPiso, t.numeroPisos);
                    const firstApto = `${String(targetPiso).padStart(2, '0')}${t.series[0] || '01'}`;
                    setSelectedAptoCodigo(firstApto);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeTorre.id === t.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t.nombreTorre}</span>
                  {t.etapa && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        activeTorre.id === t.id
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {t.etapa}
                    </span>
                  )}
                  <span className="text-[10px] opacity-80">
                    ({t.numeroPisos}P × {t.series.length}A = {t.numeroPisos * t.series.length})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Sellos 0 (Aprobado)
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Muestreo Parcial
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Con Hallazgo (Sello 1/2)
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" /> Sin Sello
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Elevación 3D Torre + Celdas por Apartamento */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
                    <span>Elevación 3D · {activeTorre.nombreTorre}</span>
                    {activeTorre.etapa && (
                      <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        {activeTorre.etapa}
                      </span>
                    )}
                    <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      Estándar: {activeTorre.agrupacionWorkplanner}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeTorre.numeroPisos} pisos · Series {activeTorre.series.join(', ')} ·{' '}
                    {totalAptosTorreActiva} inmuebles parametrizados
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Piso 01 a Piso {String(activeTorre.numeroPisos).padStart(2, '0')}
                </span>
              </div>

              {/* Encabezado columnas series */}
              <div className="flex items-center gap-3 px-2.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-20 shrink-0">Nivel</div>
                <div
                  className="flex-1 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${activeTorre.series.length}, minmax(0, 1fr))` }}
                >
                  {activeTorre.series.map((s) => (
                    <div key={s} className="text-center">
                      Serie {s}
                    </div>
                  ))}
                </div>
                <div className="hidden sm:flex w-44 shrink-0 justify-end">Gremios Piso</div>
              </div>

              <div className="space-y-1.5">
                {pisosConApartamentos.map((fila) => {
                  const isFloorSelected = selectedPiso === fila.piso;
                  return (
                    <div
                      key={fila.piso}
                      onClick={() => setSelectedPiso(fila.piso)}
                      className={`p-2 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isFloorSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-20 shrink-0 flex items-center gap-1.5">
                        <span className="px-2 py-1 rounded bg-slate-800 text-white text-[11px] font-black tabular-nums shadow-sm">
                          P{String(fila.piso).padStart(2, '0')}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 hidden md:inline">
                          Piso {fila.piso}
                        </span>
                      </div>

                      <div
                        className="flex-1 grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${fila.apartamentos.length}, minmax(0, 1fr))` }}
                      >
                        {fila.apartamentos.map((apto) => {
                          const est = getEstadoVisualApto(apto.codigo);
                          const isAptoSelected = selectedAptoCodigo === apto.codigo;

                          const cellColor =
                            est.estado === 'OBSERVADO'
                              ? 'bg-red-50 border-red-400 text-red-900 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.28)]'
                              : est.estado === 'APROBADO'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.28)]'
                                : est.estado === 'PARCIAL'
                                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.28)]'
                                  : 'bg-white border-slate-300 text-slate-700 shadow-[2px_2px_0px_0px_rgba(148,163,184,0.25)]';

                          return (
                            <button
                              type="button"
                              key={apto.codigo}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedPiso(fila.piso);
                                setSelectedAptoCodigo(apto.codigo);
                              }}
                              className={`px-2 py-1.5 rounded-lg border text-left transition-transform hover:-translate-y-0.5 ${cellColor} ${
                                isAptoSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black tabular-nums">{apto.codigo}</span>
                                <span className="text-[10px] font-bold">
                                  {est.total > 0 ? `${est.aprobados}/${est.total}` : '—'}
                                </span>
                              </div>
                              <div className="text-[9px] font-semibold truncate opacity-85 mt-0.5">
                                {est.estado === 'OBSERVADO'
                                  ? `${est.hallazgos} hallazgo(s)`
                                  : est.estado === 'APROBADO'
                                    ? 'Sellos OK'
                                    : est.estado === 'PARCIAL'
                                      ? 'En muestreo'
                                      : 'Pendiente'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="hidden sm:flex w-44 shrink-0 items-center justify-end gap-2 text-[10px]">
                        <span className="flex items-center gap-0.5" title="Estructura">
                          <span className="text-slate-400">E</span>
                          {getStatusBadge(fila.gremios.estructura)}
                        </span>
                        <span className="flex items-center gap-0.5" title="Mampostería">
                          <span className="text-slate-400">M</span>
                          {getStatusBadge(fila.gremios.mamposteria)}
                        </span>
                        <span className="flex items-center gap-0.5" title="Pañete">
                          <span className="text-slate-400">P</span>
                          {getStatusBadge(fila.gremios.panete)}
                        </span>
                        <span className="flex items-center gap-0.5" title="Enchape">
                          <span className="text-slate-400">En</span>
                          {getStatusBadge(fila.gremios.enchape)}
                        </span>
                        <span className="flex items-center gap-0.5" title="Redes">
                          <span className="text-slate-400">R</span>
                          {getStatusBadge(fila.gremios.redes)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Derecho: Detalle del Apartamento y Piso Seleccionado */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    Inspector de Inmueble &amp; Piso ({activeTorre.nombreTorre})
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {selectedAptoCodigo ? `Inmueble ${selectedAptoCodigo}` : `Piso ${selectedPiso}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Piso {selectedPiso} · Serie {selectedAptoCodigo ? selectedAptoCodigo.slice(-2) : '01'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Sellos Inspeccionados en Inmueble {selectedAptoCodigo}</span>
                  </h4>

                  {selectedAptoInspecciones.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                      Aún no se registran inspecciones de sellos para el inmueble{' '}
                      <strong>{selectedAptoCodigo}</strong> en {activeTorre.nombreTorre}. Regístralas desde{' '}
                      <strong>Indicadores Sellos</strong> o <strong>Bitácora de Campo</strong>.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedAptoInspecciones.map((ins) => (
                        <div
                          key={ins.id}
                          className={`p-2.5 rounded-lg border text-xs ${
                            ins.resultado === '0'
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : ins.resultado === 'NA'
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-red-50/70 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">
                              {ins.selloCodigo} · {ins.selloNombre}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                ins.resultado === '0'
                                  ? 'bg-emerald-600 text-white'
                                  : ins.resultado === 'NA'
                                    ? 'bg-slate-600 text-white'
                                    : 'bg-red-600 text-white'
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
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {ins.hallazgo || ins.toleranciaTexto}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                            <span>{ins.contratistaResponsable || 'Residente'}</span>
                            <span>{ins.fecha}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFloorObj && (
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Estado Gremios · Piso {selectedFloorObj.piso}
                    </h4>
                    {[
                      { label: 'Estructura Principal', key: selectedFloorObj.gremios.estructura },
                      { label: 'Mampostería y Divisiones', key: selectedFloorObj.gremios.mamposteria },
                      { label: 'Pañetes / Frisos', key: selectedFloorObj.gremios.panete },
                      { label: 'Enchape Baños y Cocina', key: selectedFloorObj.gremios.enchape },
                      { label: 'Instalaciones y Redes', key: selectedFloorObj.gremios.redes },
                    ].map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                      >
                        <span className="text-slate-700 font-medium">{act.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            act.key === 'completado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.key === 'en_proceso'
                                ? 'bg-blue-100 text-blue-800'
                                : act.key === 'observado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {act.key.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
