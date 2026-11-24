import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  ShoppingCart,
  FileCheck,
  Compass,
  HardHat
} from 'lucide-react';
import { Sucursal, AreaResponsableSLA } from '../../types';
import { GerenciaService } from '../../services/gerenciaService';
import { MATERIAL_TRIGGER_MATRIX } from '../../services/acuerdosServicioEngine';

interface LookaheadViewProps {
  selectedProject?: string;
  selectedSucursal?: Sucursal;
}

const AREA_DISPLAY_CONFIG: Record<AreaResponsableSLA, { label: string; icon: any; color: string }> = {
  COMPRAS_INVENTORY: { label: 'Compras & Materiales (Inventory)', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  CONTRATACIONES: { label: 'Contrataciones', icon: FileCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  DISENO: { label: 'Diseño & Ingeniería', icon: Compass, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  SST: { label: 'SST & Licencias', icon: HardHat, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  OBRA_RESIDENCIA: { label: 'Obra & Residencia', icon: Building2, color: 'text-slate-600 bg-slate-50 border-slate-200' }
};

export const LookaheadView: React.FC<LookaheadViewProps> = ({
  selectedSucursal = 'TODAS'
}) => {
  const [selectedMes, setSelectedMes] = useState<string>('2026-11');
  const [filtroSucursal, setFiltroSucursal] = useState<Sucursal>(selectedSucursal);
  const [selectedEtapaFiltro, setSelectedEtapaFiltro] = useState<string>('TODAS');

  // Cargar consolidado gerencial mensual de SLAs
  const consolidadoSLA = useMemo(() => {
    return GerenciaService.getConsolidadoLookahead(selectedMes, filtroSucursal);
  }, [selectedMes, filtroSucursal]);

  // Cálculo de cumplimiento global SLA
  const pctSlaGlobal = Math.round(
    (consolidadoSLA.compuertasLiberadasATiempo / consolidadoSLA.compuertasTotales) * 100
  );

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Módulo 05 · Lookahead Preventivo de Restricciones &amp; Acuerdos de Servicio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Control de Restricciones de Arranque</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Tablero Ejecutivo de Restricciones
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Supervisión del cumplimiento de los Acuerdos de Servicio por áreas de soporte (<strong>Compras/Inventory, Contrataciones, Diseño, SST</strong>) y seguimiento a los plazos de contratación (Todo Costo 64d / Mano de Obra 22d + 15d buffer) y las 6 Etapas de Materiales.
          </p>
        </div>
      </div>

      {/* TABLERO EJECUTIVO DE SLAS Y ÁREAS DE SOPORTE */}
      <div className="space-y-6">
          {/* Filtros Gerenciales */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Mes de Análisis:</span>
                <select
                  value={selectedMes}
                  onChange={(e) => setSelectedMes(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2026-11">Noviembre 2026 (Mes Actual)</option>
                  <option value="2026-10">Octubre 2026</option>
                  <option value="2026-09">Septiembre 2026</option>
                  <option value="ACUMULADO_2026">Acumulado Anual 2026</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Sucursal / Regional:</span>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value as Sucursal)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODAS">Todas las Sucursales (Nacional)</option>
                  <option value="CALI">Sucursal Cali</option>
                  <option value="BUCARAMANGA">Sucursal Bucaramanga</option>
                  <option value="BOGOTA">Sucursal Bogotá</option>
                  <option value="BARRANQUILLA">Sucursal Barranquilla</option>
                  <option value="CARTAGENA">Sucursal Cartagena</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Restricciones Evaluadas: <strong>{consolidadoSLA.compuertasTotales}</strong></span>
              <span>·</span>
              <span>Cumplimiento Global: <strong className="text-blue-700">{pctSlaGlobal}%</strong></span>
            </div>
          </div>

          {/* 4 KPI Cards Ejecutivas de SLA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Compuertas Evaluadas
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {consolidadoSLA.compuertasTotales}
                </span>
                <span className="text-xs font-bold text-slate-500">Áreas de Soporte</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Requisitos de arranque auditados</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Liberadas en Plazo
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {consolidadoSLA.compuertasLiberadasATiempo}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {pctSlaGlobal}% a tiempo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Sin retraso de fecha acordada</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Compuertas Vencidas Críticas
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-red-600">
                  {consolidadoSLA.compuertasVencidasCriticas}
                </span>
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  &gt; 15d atraso
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Impactan inicio de hito sucesor</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Área de Soporte Más Crítica
              </span>
              <div className="mt-1">
                <span className="text-base font-black text-purple-700">
                  Contrataciones
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cumplimiento: <strong className="text-red-600">62%</strong> (+18d demora prom.)
              </p>
            </div>
          </div>

          {/* Cumplimiento de SLAs por Área de Soporte */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Desempeño y Cumplimiento de Acuerdos de Servicio por Área de Soporte</span>
              </h3>
              <p className="text-xs text-slate-400">
                Tiempos de respuesta y resolución de compuertas antes de la fecha límite contractual ({selectedMes}).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(consolidadoSLA.cumplimientoSlaPorArea) as AreaResponsableSLA[]).map((areaKey) => {
                const data = consolidadoSLA.cumplimientoSlaPorArea[areaKey];
                const config = AREA_DISPLAY_CONFIG[areaKey];
                const Icon = config.icon;
                const isCrit = data.porcentajeCumplimiento < 70;

                return (
                  <div key={areaKey} className={`p-4 rounded-xl border ${config.color} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-bold text-xs">{config.label}</span>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded ${
                        isCrit ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {data.porcentajeCumplimiento}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${isCrit ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${data.porcentajeCumplimiento}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block">A Tiempo:</span>
                        <strong className="text-emerald-700">{data.aTiempo} / {data.total}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Demora Prom.:</span>
                        <strong className={data.diasDemoraPromedio > 10 ? 'text-red-600' : 'text-slate-700'}>
                          +{data.diasDemoraPromedio} días
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grilla 2 Cols: Reglas de Contratación (Todo Costo / Mano Obra) + 6 Etapas de Materiales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reglas de Contratación: Todo Costo vs Mano de Obra */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    <span>Control de Plazos de Contratación (Estándar Marval)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead time de legalización contractual previo a la fecha de inicio del hito en obra.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-blue-900 block">
                        Modalidad: Contratos a Todo Costo
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Lead time: <strong>64 días calendario</strong> + 15 días buffer
                      </span>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      79 días total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Aplica para contratos de estructura, ventanería, carpintería metálica, ascensores y redes especiales. Exige pólizas, firma y anticipo 79 días antes del inicio programado.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-emerald-900 block">
                        Modalidad: Contratos de Mano de Obra
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Lead time: <strong>22 días calendario</strong> + 15 días buffer
                      </span>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      37 días total
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Aplica para mampostería, frisos, estuco, pintura, drywall y aseo. La adjudicación y afiliaciones de seguridad social deben cerrarse 37 días antes del inicio del hito.
                  </p>
                </div>
              </div>
            </div>

            {/* Monitoreo Unificado de las 6 Etapas de Materiales (Compras / Inventory) */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>Compras / 6 Etapas de Materiales (Plataforma Inventory)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Punto de Control Desencadenante (Trigger de solicitud) vs Punto de Control Restringido de Inicio en Lookahead.
                  </p>
                </div>

                {/* Filtro de Etapas */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {['TODAS', 'ETAPA_0', 'ETAPA_1', 'ETAPA_2', 'ETAPA_3', 'ETAPA_4', 'ETAPA_5'].map((et) => (
                    <button
                      key={et}
                      onClick={() => setSelectedEtapaFiltro(et)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        selectedEtapaFiltro === et
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {et === 'TODAS' ? 'Todas' : et.replace('ETAPA_', 'E')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner de Unificación Técnica */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-tight">
                <strong>Regla de Restricción:</strong> Compras e Inventory son la misma restricción. Cada material pedido en el hito desencadenante bloquea el inicio del hito sucesor si no llega al menos <strong>15 días antes</strong> a obra.
              </div>

              {/* Lista filtrada de reglas de materiales */}
              <div className="space-y-2.5 overflow-y-auto max-h-80 pr-1 text-xs">
                {MATERIAL_TRIGGER_MATRIX
                  .filter((r) => selectedEtapaFiltro === 'TODAS' || r.etapa === selectedEtapaFiltro)
                  .map((rule, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {rule.etapa.replace('_', ' ')} · {rule.item}
                          </span>
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[260px]" title={rule.materialNombre}>
                            {rule.materialNombre}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {rule.leadTimeDiasSuministro}d lead time
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10.5px]">
                        <div className="bg-amber-50/60 border border-amber-200/60 p-1.5 rounded">
                          <span className="text-amber-800 font-bold block">⚡ Hito Desencadenante:</span>
                          <span className="text-slate-700 font-semibold">{rule.hitoDesencadenante}</span>
                          <span className="text-[9.5px] text-slate-500 block truncate" title={rule.criterioSolicitud}>
                            {rule.criterioSolicitud}
                          </span>
                        </div>

                        <div className="bg-red-50/60 border border-red-200/60 p-1.5 rounded">
                          <span className="text-red-800 font-bold block">⛔ Restricción de Inicio para:</span>
                          <span className="text-slate-800 font-bold">{rule.hitoRestringidoInicio}</span>
                          <span className="text-[9.5px] text-slate-500 block truncate" title={rule.capituloOpus}>
                            Capítulo Opus: {rule.capituloOpus}
                          </span>
                        </div>
                      </div>

                      {/* Tareas Workplanner Restringidas */}
                      {rule.actividadesWorkplannerRestringidas.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">EDT Bloqueadas:</span>
                          {rule.actividadesWorkplannerRestringidas.map((act, aIdx) => (
                            <span 
                              key={aIdx} 
                              className="font-mono text-[9.5px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200"
                              title={act}
                            >
                              {act.split(' ')[0]} {act.split(' ').slice(1, 3).join(' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
