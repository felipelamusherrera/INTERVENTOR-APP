import React, { useState, useMemo } from 'react';
import { 
  Award, 
  ShieldAlert,
  Calendar,
  Building2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Sucursal, HitoMacroCalidad } from '../../types';
import { GerenciaService } from '../../services/gerenciaService';

const HITO_CALIDAD_NAMES: Record<HitoMacroCalidad, string> = {
  ESTRUCTURA_VANOS: 'Estructura & Vanos',
  REDES_HIDROSANITARIAS: 'Redes Hidrosanitarias',
  MUROS_LIVIANOS: 'Muros Livianos / Drywall',
  AFINADO_PISO: 'Afinado de Piso / Morteros',
  FRISOS_MUROS: 'Frisos de Muros',
  PISOS_ENCHAPES: 'Pisos Porcelanato / Cerámica',
  ENCHAPES_MUROS: 'Enchapes en Muros'
};

export const CalidadView: React.FC = () => {
  const [selectedMes, setSelectedMes] = useState<string>('2026-11');
  const [filtroSucursal, setFiltroSucursal] = useState<Sucursal>('TODAS');

  // Cargar consolidado gerencial mensual de Calidad
  const consolidadoCalidad = useMemo(() => {
    return GerenciaService.getConsolidadoCalidad(selectedMes, filtroSucursal);
  }, [selectedMes, filtroSucursal]);

  // Datos para el gráfico de barras por Hito Macro de Calidad
  const chartCalidadData = useMemo(() => {
    return Object.entries(consolidadoCalidad.calidadPorHitoMacro).map(([key, val]) => ({
      hitoKey: key,
      nombre: HITO_CALIDAD_NAMES[key as HitoMacroCalidad] || key,
      cumplimiento: val
    }));
  }, [consolidadoCalidad]);

  return (
    <div className="space-y-6">
      {/* Top Banner Gerencial */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Módulo 08 · Calidad: Sellos de Obra Gris y Blanca (Norma MA-SIG-CAL-001 v.003)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tablero Gerencial de Calidad y Sellos</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Consolidado Corporativo
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Inspección por muestreo técnico (50% de unidades, mínimo 5), umbral de aprobación del 80%, aplicación de <strong>retenciones del 20%</strong> con 8 días de subsanación y control de desfase respecto al avance de obra.
          </p>
        </div>
      </div>

      {/* VISTA EJECUTIVA GERENCIAL DE CALIDAD */}
      <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Mes de Análisis:</span>
                <select
                  value={selectedMes}
                  onChange={(e) => setSelectedMes(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <span>Unidades Auditadas: <strong>{consolidadoCalidad.totalUnidadesAuditadas}</strong></span>
              <span>·</span>
              <span>Retenciones Totales: <strong className="text-red-600">{consolidadoCalidad.totalRetenciones20Aplicadas} lotes</strong></span>
            </div>
          </div>

          {/* 4 KPI Cards Ejecutivas de Calidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Índice Calidad Corporativo
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-indigo-700">
                  {consolidadoCalidad.indiceCalidadCorporativo}%
                </span>
                <span className="text-xs font-bold text-slate-500">Umbral: &gt;= 80%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Promedio de aprobación nacional</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Retenciones del 20% Aplicadas
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-red-600">
                  {consolidadoCalidad.totalRetenciones20Aplicadas}
                </span>
                <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  Lotes &lt; 80%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Actas de obra con retención preventiva</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Valor Total Retenido (Est.)
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-700 tabular-nums">
                  ${(consolidadoCalidad.valorTotalRetencionesEstimado / 1000000).toFixed(1)}M
                </span>
                <span className="text-xs font-bold text-slate-500">COP</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Fondo de garantía por no conformidades</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Alertas Desfase de Muestreo
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-700">
                  {consolidadoCalidad.desfasesMuestreo.alertasCriticas2m}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  &gt; 2 meses
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Exigen validar avance real en LEAN</p>
            </div>
          </div>

          {/* Grilla 2 Columnas: Calidad por Hito Macro + Ranking Contratistas con Retenciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Calidad por Hito Macro */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Índice de Calidad por Punto de Control de Sellos</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Porcentaje de aprobación de sellos frente al umbral contractual (80%).
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Umbral: 80%
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCalidadData} margin={{ top: 10, right: 20, left: -10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis unit="%" domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Aprobación Sellos']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="cumplimiento" radius={[4, 4, 0, 0]}>
                      {chartCalidadData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.cumplimiento < 80 ? '#ef4444' : '#6366f1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-600">
                  Hito con menor desempeño: <strong className="text-red-600">Frisos de Muros (74%)</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  Aplica retención automática del 20%
                </span>
              </div>
            </div>

            {/* Ranking de Contratistas con Retenciones del 20% */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Contratistas con Retenciones del 20% Aplicadas</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lotes calificados por debajo del 80% con plazo perentorio de 8 días de rectificación.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  Regla 20% / 8d
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Contratista</th>
                      <th className="py-2.5 px-2">Sucursal</th>
                      <th className="py-2.5 px-2 text-center">Lotes Aud.</th>
                      <th className="py-2.5 px-2 text-center">Retenciones</th>
                      <th className="py-2.5 px-2 text-center">% Calidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidadoCalidad.rankingContratistasRetenciones.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {c.contratista}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {c.sucursal}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-slate-600">
                          {c.lotesAprobados} / {c.lotesAuditados}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-800">
                            {c.retencionesAplicadas} lotes
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="font-extrabold text-red-700">
                            {c.indiceCalidad}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Grilla: Pareto de Defectos Frecuentes + Auditoría de Desfase de Muestreo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto de Defectos Frecuentes */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Pareto de Defectos Técnicos Más Frecuentes</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Causas principales de no conformidad identificadas en la toma de sellos.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {consolidadoCalidad.paretoDefectos.map((def, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {def.defecto.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-slate-800">
                        {def.conteo} fallas ({def.porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${def.porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auditoría de Desfase entre Ejecución Workplanner vs Muestreo en Obra */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Control de Desfase de Muestreo (Workplanner vs Obra)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tolerancia máx. 15 días. Si supera 2 meses, se exige validar avance reportado en LEAN.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {consolidadoCalidad.desfasesMuestreo.detalleDesfases.map((d, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      d.estado === 'CRITICA_2M_VALIDAR_LEAN'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs">{d.proyecto} · {d.actividad}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        d.estado === 'CRITICA_2M_VALIDAR_LEAN' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {d.estado === 'CRITICA_2M_VALIDAR_LEAN' ? 'CRÍTICA > 2 MESES' : 'ALERTA > 15 DÍAS'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-90">
                      <span>Avance Workplanner: <strong>{d.avanceWorkplannerPct}%</strong> ({d.unidadesEjecutadas} un.)</span>
                      <span>Muestreadas: <strong>{d.unidadesMuestreadas} un.</strong></span>
                      <span>Desfase: <strong className="underline">+{d.desfaseDias} días</strong></span>
                    </div>
                    {d.estado === 'CRITICA_2M_VALIDAR_LEAN' && (
                      <p className="text-[10px] font-bold text-rose-800 pt-1 border-t border-rose-200/60">
                        ⚠ Acción requerida: El interventor debe validar en comité semanal LEAN si el % de obra es real o está desfasado.
                      </p>
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
