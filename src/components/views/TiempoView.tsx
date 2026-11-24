import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  ComposedChart
} from 'recharts';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  User, 
  ChevronRight,
  Info,
  Filter,
  Layers,
  Building2,
  TrendingDown,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { Sucursal, HitoMacro } from '../../types';
import { GerenciaService } from '../../services/gerenciaService';
import { macroMilestones, sCurveData, majorDelays } from '../../data/mockData';

interface TiempoViewProps {
  selectedProject?: string;
  selectedTower?: string;
  selectedSucursal?: Sucursal;
}

const HITO_DISPLAY_NAMES: Record<HitoMacro, string> = {
  URBANISMO: 'Urbanismo',
  CIMENTACION: 'Cimentación',
  ESTRUCTURA: 'Estructura',
  MAMPOSTERIA: 'Mampostería',
  FACHADAS: 'Fachadas',
  REDES_HIDROSANITARIAS: 'Redes Hidrosan.',
  REDES_ELECTRICAS_GAS: 'Redes Eléct./Gas',
  ACABADOS_OBRA_GRIS: 'Obra Gris (Mortero/Friso)',
  ACABADOS_OBRA_BLANCA: 'Obra Blanca (Piso/Estuco)',
  CARPINTERIAS: 'Carpinterías',
  EQUIPOS_ESPECIALES: 'Equipos Espec.',
  ZONAS_COMUNES_ESENCIALES: 'Zonas Comunes T1',
  CIERRE_ENTREGAS: 'Cierre y Entregas'
};

export const TiempoView: React.FC<TiempoViewProps> = ({
  selectedProject = 'Belaterra Pietra',
  selectedTower = 'Torre 1',
  selectedSucursal = 'TODAS'
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLIDADO_GERENCIAL' | 'DETALLE_PROYECTO'>('CONSOLIDADO_GERENCIAL');
  const [selectedMes, setSelectedMes] = useState<string>('2026-11');
  const [filtroSucursal, setFiltroSucursal] = useState<Sucursal>(selectedSucursal);
  const [selectedMilestone, setSelectedMilestone] = useState(macroMilestones[2]);

  // Cargar consolidado mensual multi-proyecto desde el servicio gerencial
  const consolidado = useMemo(() => {
    return GerenciaService.getConsolidadoTiempos(selectedMes, filtroSucursal);
  }, [selectedMes, filtroSucursal]);

  // Datos para el gráfico de barras por Hito Macro
  const chartHitosData = useMemo(() => {
    return Object.entries(consolidado.diasAtrasoPorHitoMacro)
      .map(([key, dias]) => ({
        hitoKey: key,
        nombre: HITO_DISPLAY_NAMES[key as HitoMacro] || key,
        diasAtraso: dias
      }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
  }, [consolidado]);

  return (
    <div className="space-y-6">
      {/* Top Banner Gerencial */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Módulo 02 · Control de Plazo, Programación y Puntos de Control</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tablero Gerencial de Tiempos</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {activeTab === 'CONSOLIDADO_GERENCIAL' ? 'Consolidado Multi-Proyecto' : selectedProject}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Monitoreo gerencial mensual y acumulado multi-proyecto por <strong>Puntos de Control Estandarizados</strong>, diagnóstico dual de fuga de tiempo <strong>(VarComien vs VarFin)</strong>, ranking de contratistas y Pareto de causas raíz.
          </p>
        </div>

        {/* Selector de Nivel de Visualización */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold self-start md:self-center">
          <button
            onClick={() => setActiveTab('CONSOLIDADO_GERENCIAL')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'CONSOLIDADO_GERENCIAL'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consolidado Gerencial
          </button>
          <button
            onClick={() => setActiveTab('DETALLE_PROYECTO')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'DETALLE_PROYECTO'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detalle Proyecto ({selectedProject})
          </button>
        </div>
      </div>

      {activeTab === 'CONSOLIDADO_GERENCIAL' ? (
        <>
          {/* Barra de Filtros Gerenciales: Mes y Sucursal */}
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Proyectos Evaluados: <strong>{consolidado.proyectosEvaluados}</strong></span>
              <span>·</span>
              <span>PPC Promedio: <strong className="text-blue-700">{consolidado.ppcPromedioMes}%</strong></span>
            </div>
          </div>

          {/* 4 KPI Cards Ejecutivas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Hito Macro Más Crítico */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Punto de Control Más Crítico
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-red-600">
                  {HITO_DISPLAY_NAMES[consolidado.hitoMacroMayorImpacto]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aporte a Ruta Crítica: <strong className="text-red-700">+{consolidado.diasAtrasoPorHitoMacro[consolidado.hitoMacroMayorImpacto]} días</strong>
              </p>
            </div>

            {/* KPI 2: Peor Contratista */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Menor Cumplimiento (PPC)
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-amber-600 truncate max-w-[200px]" title={consolidado.rankingContratistas[0]?.contratista}>
                  {consolidado.rankingContratistas[0]?.contratista || 'Sin datos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PPC: <strong className="text-amber-700">{consolidado.rankingContratistas[0]?.porcentajeCumplimiento}%</strong> (+{consolidado.rankingContratistas[0]?.diasAtrasoTotal}d atraso)
              </p>
            </div>

            {/* KPI 3: Causa Raíz #1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Causa Raíz Predominante
              </span>
              <div className="mt-1">
                <span className="text-xs font-bold text-purple-700 block truncate" title={consolidado.paretoCausas[0]?.causa}>
                  {consolidado.paretoCausas[0]?.causa || 'Sin desviaciones'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Representa el <strong className="text-purple-700">{consolidado.paretoCausas[0]?.porcentaje}%</strong> de todas las no conformidades
              </p>
            </div>

            {/* KPI 4: Momento Predominante */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Momento de Desviación
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-black text-blue-700">
                  {consolidado.ratioInicioVsFin.momentoPredominante === 'EJECUCION_OBRA'
                    ? 'VarFin (Ejecución)'
                    : consolidado.ratioInicioVsFin.momentoPredominante === 'INICIO_RESTRICCIONES'
                    ? 'VarComien (Inicio)'
                    : 'Equilibrado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                VarFin: <strong className="text-slate-800">{consolidado.ratioInicioVsFin.porcentajeDesviacionFin}%</strong> vs VarComien: <strong className="text-slate-800">{consolidado.ratioInicioVsFin.porcentajeDesviacionInicio}%</strong>
              </p>
            </div>
          </div>

          {/* Grid de 2 Columnas: Días por Hito Macro + Fuga de Tiempo (VarComien vs VarFin) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Barras: Atraso por Hito Macro (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span>Días de Atraso Transferidos a Ruta Crítica por Punto de Control (Multi-Proyecto)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consolidado de los puntos de control estandarizados en el portafolio ({selectedMes} - {filtroSucursal}).
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  Ruta Crítica
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartHitosData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis unit=" d" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val} días acumulados`, 'Atraso Crítico']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="diasAtraso" radius={[4, 4, 0, 0]}>
                      {chartHitosData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            index === 0 ? '#ef4444' : index <= 2 ? '#f97316' : index <= 5 ? '#3b82f6' : '#94a3b8'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Hito con mayor impacto nacional: <strong className="text-red-700">{HITO_DISPLAY_NAMES[consolidado.hitoMacroMayorImpacto]}</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  Total días desviados: {Object.values(consolidado.diasAtrasoPorHitoMacro).reduce((a, b) => a + b, 0)} días
                </span>
              </div>
            </div>

            {/* Cuadrante de Fuga de Tiempo: VarComien vs VarFin (1 col) */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Fuga de Tiempo: ¿Dónde se Pierden los Días?</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose de días de atraso en el arranque vs ejecución física.
                </p>
              </div>

              {/* Comparador Visual VarComien vs VarFin */}
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase">
                      Desviación de Inicio (VarComien)
                    </span>
                    <span className="text-sm font-black text-amber-700">
                      {consolidado.ratioInicioVsFin.porcentajeDesviacionInicio}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/60 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ width: `${consolidado.ratioInicioVsFin.porcentajeDesviacionInicio}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-800">
                    <span>Atraso por compuertas / restricciones</span>
                    <strong>+{consolidado.ratioInicioVsFin.totalDiasAtrasoInicio} días</strong>
                  </div>
                </div>

                <div className="p-4 bg-red-50/60 border border-red-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900 uppercase">
                      Desviación de Término (VarFin)
                    </span>
                    <span className="text-sm font-black text-red-700">
                      {consolidado.ratioInicioVsFin.porcentajeDesviacionFin}%
                    </span>
                  </div>
                  <div className="w-full bg-red-200/60 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${consolidado.ratioInicioVsFin.porcentajeDesviacionFin}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-red-800">
                    <span>Atraso por bajo rendimiento en obra</span>
                    <strong>+{consolidado.ratioInicioVsFin.totalDiasAtrasoFin} días</strong>
                  </div>
                </div>

                {/* Dictamen Ejecutivo */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-blue-900 block flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Dictamen Gerencial:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {consolidado.ratioInicioVsFin.momentoPredominante === 'EJECUCION_OBRA'
                      ? 'El 70% de la fuga de tiempo ocurre en obra (VarFin). La causa no son las compras ni los contratos, sino el rendimiento diario de cuadrillas y retrabajos en campo.'
                      : 'El mayor volumen de atraso surge al arranque de las tareas por compuertas bloqueadas (VarComien). Se requiere exigir cumplimiento de SLAs a compras y contrataciones.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fila Inferior: Ranking de Contratistas + Pareto 80/20 de Causas Raíz */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking de Contratistas con Menor Cumplimiento */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Ranking de Contratistas con Menor Cumplimiento (PPC)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Contratistas críticos filtrados por {filtroSucursal} ({selectedMes}).
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {consolidado.rankingContratistas.length} Contratistas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Contratista</th>
                      <th className="py-2.5 px-2">Sucursal</th>
                      <th className="py-2.5 px-2">Tipo</th>
                      <th className="py-2.5 px-2 text-center">Prog / Cump</th>
                      <th className="py-2.5 px-2 text-center">% PPC</th>
                      <th className="py-2.5 px-2 text-right">Atraso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidado.rankingContratistas.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {c.contratista}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {c.sucursal}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.tipoContrato === 'TODO_COSTO' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {c.tipoContrato === 'TODO_COSTO' ? 'Todo Costo' : 'Mano Obra'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-slate-600">
                          {c.tareasCumplidas} / {c.tareasProgramadas}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            c.porcentajeCumplimiento < 60
                              ? 'bg-red-100 text-red-800'
                              : c.porcentajeCumplimiento < 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.porcentajeCumplimiento}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-red-600 tabular-nums">
                          +{c.diasAtrasoTotal}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pareto 80/20 de Causas Raíz */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>Pareto 80/20 de Causas Raíz de No Cumplimiento</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    El 20% de las causas raíz que generan el 80% del atraso nacional.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Regla 80/20
                </span>
              </div>

              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={consolidado.paretoCausas} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="causa" 
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={(val) => val.split('.')[0]}
                    />
                    <YAxis yAxisId="left" unit=" un" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any, name: any) => [
                        name === 'Porcentaje Acumulado' ? `${val}%` : `${val} eventos`,
                        name || ''
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar yAxisId="left" dataKey="frecuencia" name="Frecuencia" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="porcentajeAcumulado" 
                      name="Porcentaje Acumulado" 
                      stroke="#ef4444" 
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Lista Detallada de Causas Top */}
              <div className="space-y-1.5 pt-1">
                {consolidado.paretoCausas.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50">
                    <span className="font-semibold text-slate-700 truncate max-w-[280px]">
                      {item.causa}
                    </span>
                    <div className="flex items-center space-x-2 tabular-nums">
                      <span className="text-slate-500">{item.frecuencia} casos ({item.porcentaje}%)</span>
                      <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                        Acum: {item.porcentajeAcumulado}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* DETALLE POR PROYECTO (Belaterra Pietra - Vista Tradicional Zoom-In) */
        <div className="space-y-6">
          {/* Timeline de Macro-Hitos del Proyecto */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <span>Línea de Tiempo de Puntos de Control: {selectedProject} ({selectedTower})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Haga clic sobre un hito para inspeccionar las desviaciones duales <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">I (Inicio)</code> y <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">E (Ejecución)</code>.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Cumplido</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">En riesgo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">Atrasado</span>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="relative pt-2 pb-4 overflow-x-auto scrollbar-none">
              <div className="flex items-center min-w-[850px] relative">
                <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0"></div>

                {macroMilestones.map((m) => {
                  const isSelected = selectedMilestone?.id === m.id;
                  const isDone = m.estado === 'Cumplido';
                  const isRisk = m.estado === 'En riesgo';

                  const badgeColor = isDone
                    ? 'bg-emerald-500 text-white ring-emerald-200'
                    : isRisk
                    ? 'bg-amber-500 text-white ring-amber-200'
                    : 'bg-red-500 text-white ring-red-200';

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMilestone(m)}
                      className="flex-1 flex flex-col items-center relative z-10 cursor-pointer group transition-transform hover:-translate-y-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 transition ${badgeColor} ${
                          isSelected ? 'ring-blue-500 scale-110 shadow-md' : ''
                        }`}
                      >
                        {m.order}
                      </div>

                      <div className="mt-2 text-center max-w-[70px]">
                        <span className="block text-[11px] font-bold text-slate-800 truncate" title={m.name}>
                          {m.code}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate leading-tight" title={m.name}>
                          {m.name.split(' ')[0]}
                        </span>
                        <span className={`inline-block text-[9px] font-bold px-1 rounded mt-0.5 ${
                          m.desviacionFin > 15 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          +{m.desviacionFin}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Milestone Detail Box */}
            {selectedMilestone && (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-4 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      {selectedMilestone.code} · {selectedMilestone.fase}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {selectedMilestone.name}
                    </h4>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      selectedMilestone.estado === 'Cumplido'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedMilestone.estado === 'En riesgo'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedMilestone.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center space-x-3">
                    <span className="flex items-center">
                      <User className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      Responsable: <strong className="ml-1 text-slate-800">{selectedMilestone.responsable}</strong>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      Plan: {selectedMilestone.fechaPlan} | Real: {selectedMilestone.fechaReal}
                    </span>
                  </p>
                </div>

                {/* Dual Metrics: I y E */}
                <div className="flex items-center space-x-3 tabular-nums">
                  <div className="bg-white border border-blue-200 rounded-lg p-2.5 text-center min-w-[110px] shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      Métrica `I` (Inicio)
                    </span>
                    <span className="text-lg font-black text-amber-600">
                      +{selectedMilestone.desviacionInicio} días
                    </span>
                    <span className="text-[10px] text-slate-400 block">Desvío arranque</span>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-lg p-2.5 text-center min-w-[110px] shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      Métrica `E` (Ejecución)
                    </span>
                    <span className={`text-lg font-black ${
                      selectedMilestone.desviacionFin > 30 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      +{selectedMilestone.desviacionFin} días
                    </span>
                    <span className="text-[10px] text-slate-400 block">Desvío término</span>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-lg p-2.5 text-center min-w-[100px] shadow-sm">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">
                      Avance Físico
                    </span>
                    <span className="text-lg font-black text-blue-700">
                      {selectedMilestone.avance}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Completitud</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid Curva S + Mayores Atrasos Top 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Curva S de Avance Físico: Planificado (PV) vs Real (EV)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Proyección ajustada con el ritmo real de avance de las últimas 4 semanas (Regla Marval: <strong>4% a 7% mensual</strong>).
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Ritmo: 5.8% / mes
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sCurveData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="pv" name="Planificado (PV)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ev" name="Real Ejecutado (EV)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="proyeccion" name="Pronóstico (Ritmo 5.8%)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mayores Atrasos Top 5 */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Mayores Atrasos (Top 5)</span>
                </h3>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  VarFin Crítica
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Frentes críticos que impactan la fecha de entrega y alistamiento.
              </p>

              <div className="space-y-2.5 mt-2">
                {majorDelays.map((d, idx) => (
                  <div 
                    key={d.id} 
                    className="p-3 rounded-lg border border-red-100 bg-red-50/30 hover:bg-red-50/60 transition space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 leading-tight">
                        {idx + 1}. {d.tarea}
                      </span>
                      <span className="text-xs font-extrabold text-red-600 whitespace-nowrap tabular-nums">
                        +{d.diasAtraso}d
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Resp: <strong className="text-slate-700">{d.responsable}</strong></span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {d.causaRaiz}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-red-100/50">
                      <span>Previsto: {d.finPrevisto}</span>
                      <span className="font-medium text-red-700">Proyectado: {d.finProyectado}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
