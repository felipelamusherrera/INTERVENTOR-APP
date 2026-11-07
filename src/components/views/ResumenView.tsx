import React, { useState } from 'react';
import { 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  Filter,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { PortfolioItem, Sucursal } from '../../types';
import { portfolioEjecucion, portfolioEntregados } from '../../data/mockData';

interface ResumenViewProps {
  selectedSucursal: Sucursal;
  onNavigateTab: (tabId: string) => void;
  onSelectProject: (proj: string) => void;
}

export const ResumenView: React.FC<ResumenViewProps> = ({
  selectedSucursal,
  onNavigateTab,
  onSelectProject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'P-EJECUCION' | 'P-ENTREGADOS'>('P-EJECUCION');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGerencia, setSelectedGerencia] = useState('TODAS');

  const rawList = activeSubTab === 'P-EJECUCION' ? portfolioEjecucion : portfolioEntregados;

  const filteredProjects = rawList.filter((item) => {
    const matchSucursal = selectedSucursal === 'TODAS' || item.sucursal === selectedSucursal;
    const matchGerencia = selectedGerencia === 'TODAS' || item.gerencia === selectedGerencia;
    const matchSearch = item.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.gerencia.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSucursal && matchGerencia && matchSearch;
  });

  const uniqueGerencias = Array.from(new Set(rawList.map((p) => p.gerencia)));

  // KPIs calculations
  const totalCount = filteredProjects.length;
  const criticalCount = filteredProjects.filter((p) => p.estado === 'Crítico').length;
  const inRiskCount = filteredProjects.filter((p) => p.estado === 'En riesgo').length;
  const onTrackCount = filteredProjects.filter((p) => p.estado === 'Al día' || p.estado === 'Entregado').length;

  const avgCalidad = totalCount > 0 
    ? Math.round(filteredProjects.reduce((acc, curr) => acc + curr.selloCalidad, 0) / totalCount) 
    : 85;

  const avgProductividad = totalCount > 0 
    ? Math.round(filteredProjects.reduce((acc, curr) => acc + curr.productividad, 0) / totalCount) 
    : 82;

  const avgCto = totalCount > 0 
    ? Math.round(filteredProjects.reduce((acc, curr) => acc + curr.ctoCumplimiento, 0) / totalCount) 
    : 78;

  return (
    <div className="space-y-6">
      {/* Top Banner: Vista Cero Gerencial */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-blue-900 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Módulo 00 · Consolidado Directivo Marval S.A.S.</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Vista Cero: Sábana Gerencial de Portafolio
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl">
            Control ejecutivo unificado por Sucursales y Gerencias para Alta Gerencia y Vicepresidencia.
            Monitoreo de compuertas a 12M, 6M y 3M, apertura presupuestal (VIV/URB/ADMINIS), Sellos de Calidad y CTO.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('reporte')}
            className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Generar Ficha Aconex</span>
          </button>
        </div>
      </div>

      {/* KPI Hero Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Proyectos Activos</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{totalCount}</span>
            <span className="text-xs text-blue-600 font-medium">{selectedSucursal}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Supervisión en obra</p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado Al Día</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{onTrackCount}</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
              {totalCount > 0 ? Math.round((onTrackCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumplimiento en plazo</p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">En Riesgo / Crítico</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-500 tabular-nums">
              {inRiskCount + criticalCount}
            </span>
            <span className="text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-bold">
              {criticalCount} Críticos
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">&gt;15d en compuerta 3M</p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sello Calidad</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">{avgCalidad}%</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">MA-SIG-CAL-001</p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Productividad Tesla</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-blue-600 tabular-nums">{avgProductividad}%</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cuadrante ARI / Avance</p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cumplimiento CTO</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">{avgCto}%</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ley 1796 / NSR-10</p>
        </div>
      </div>

      {/* Control Filters and Tabs */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sub-tabs: P-EJECUCION vs P-ENTREGADOS */}
        <div className="flex bg-slate-100 p-1 rounded-lg space-x-1">
          <button
            onClick={() => setActiveSubTab('P-EJECUCION')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubTab === 'P-EJECUCION'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            P-EJECUCIÓN ({portfolioEjecucion.length})
          </button>
          <button
            onClick={() => setActiveSubTab('P-ENTREGADOS')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubTab === 'P-ENTREGADOS'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            P-ENTREGADOS ({portfolioEntregados.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar proyecto o gerencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 md:w-64 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedGerencia}
              onChange={(e) => setSelectedGerencia(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[180px]"
            >
              <option value="TODAS">Todas las Gerencias</option>
              {uniqueGerencias.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Sábana Gerencial Matriz */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Proyecto / Gerencia</th>
                <th className="py-2.5 px-2">Sucursal</th>
                <th className="py-2.5 px-2">Próx. Torre</th>
                <th className="py-2.5 px-2">Fecha Prom.</th>
                <th className="py-2.5 px-2">Fecha Conf.</th>
                <th className="py-2.5 px-2 text-center">Cumpl.</th>
                <th className="py-2.5 px-2 text-center bg-blue-50/70 border-x border-blue-100" colSpan={3}>
                  Compuertas Pre-Alistamiento (Días Desvío)
                </th>
                <th className="py-2.5 px-2 text-center bg-slate-50/70 border-r border-slate-200" colSpan={4}>
                  Costos (% Presupuesto)
                </th>
                <th className="py-2.5 px-2 text-center">Sello Cal.</th>
                <th className="py-2.5 px-2 text-center">Prod.</th>
                <th className="py-2.5 px-2 text-center">CTO %</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-2 text-center">Acción</th>
              </tr>
              <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 border-b border-slate-200">
                <th colSpan={6}></th>
                <th className="py-1 px-1.5 text-center bg-blue-50/70 border-l border-blue-100">12 Meses</th>
                <th className="py-1 px-1.5 text-center bg-blue-50/70">6 Meses</th>
                <th className="py-1 px-1.5 text-center bg-blue-50/70 border-r border-blue-100">3 Meses</th>
                <th className="py-1 px-1.5 text-center bg-slate-50">Total</th>
                <th className="py-1 px-1.5 text-center bg-slate-50">VIV</th>
                <th className="py-1 px-1.5 text-center bg-slate-50">URB</th>
                <th className="py-1 px-1.5 text-center bg-slate-50 border-r border-slate-200">ADMINIS</th>
                <th colSpan={5}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {filteredProjects.map((item) => {
                const isCritical = item.estado === 'Crítico';
                const isRisk = item.estado === 'En riesgo';
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    onClick={() => {
                      onSelectProject(item.proyecto);
                      onNavigateTab('tiempo');
                    }}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5">
                        <span>{item.proyecto}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.gerencia}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {item.sucursal}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">{item.proximaTorre}</td>
                    <td className="py-2.5 px-2 text-slate-600">{item.fechaPrometida}</td>
                    <td className="py-2.5 px-2 text-slate-600">{item.fechaConfirmada}</td>
                    <td className={`py-2.5 px-2 text-center font-bold ${
                      item.cumplimiento > 15 ? 'text-red-600' : item.cumplimiento > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.cumplimiento > 0 ? `+${item.cumplimiento}d` : `${item.cumplimiento}d`}
                    </td>

                    {/* Compuertas 12M, 6M, 3M */}
                    <td className="py-2.5 px-2 text-center bg-blue-50/30 border-l border-blue-50 text-slate-700 font-medium">
                      {item.compuertas.m12}d
                    </td>
                    <td className="py-2.5 px-2 text-center bg-blue-50/30 text-slate-700 font-medium">
                      {item.compuertas.m6}d
                    </td>
                    <td className={`py-2.5 px-2 text-center bg-blue-50/30 border-r border-blue-50 font-bold ${
                      item.compuertas.m3 > 30 ? 'text-red-600' : item.compuertas.m3 > 10 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.compuertas.m3}d
                    </td>

                    {/* Costos apertura */}
                    <td className="py-2.5 px-1.5 text-center bg-slate-50/50 font-bold text-slate-800">
                      {(item.costos.totales * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-1.5 text-center bg-slate-50/50 text-slate-600">
                      {(item.costos.viv * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-1.5 text-center bg-slate-50/50 text-slate-600">
                      {(item.costos.urb * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-1.5 text-center bg-slate-50/50 border-r border-slate-200 text-slate-600">
                      {(item.costos.adminis * 100).toFixed(0)}%
                    </td>

                    {/* Calidad, Prod, CTO */}
                    <td className="py-2.5 px-2 text-center font-bold text-indigo-700">
                      {item.selloCalidad}%
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                      {item.productividad}%
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                      {item.ctoCumplimiento}%
                    </td>

                    {/* Estado badge */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : isRisk
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isCritical ? (
                          <AlertCircle className="w-2.5 h-2.5 mr-1" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        )}
                        {item.estado}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          title="Ver Tiempo y Curva S"
                          onClick={() => {
                            onSelectProject(item.proyecto);
                            onNavigateTab('tiempo');
                          }}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Ver Calidad y Sellos"
                          onClick={() => {
                            onSelectProject(item.proyecto);
                            onNavigateTab('calidad');
                          }}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Ver CTO"
                          onClick={() => {
                            onSelectProject(item.proyecto);
                            onNavigateTab('cto');
                          }}
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
