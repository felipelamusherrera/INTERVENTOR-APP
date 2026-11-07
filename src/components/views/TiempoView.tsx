import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
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
  Info
} from 'lucide-react';
import { macroMilestones, sCurveData, majorDelays } from '../../data/mockData';
import { MacroMilestone } from '../../types';

interface TiempoViewProps {
  selectedProject: string;
  selectedTower: string;
}

export const TiempoView: React.FC<TiempoViewProps> = ({
  selectedProject,
  selectedTower
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<MacroMilestone | null>(macroMilestones[2]);

  // Overall statistics
  const completedMilestones = macroMilestones.filter(m => m.estado === 'Cumplido').length;
  const delayedMilestones = macroMilestones.filter(m => m.estado === 'Atrasado' || m.estado === 'En riesgo').length;
  const avgDeviationE = Math.round(macroMilestones.reduce((acc, curr) => acc + curr.desviacionFin, 0) / macroMilestones.length);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Módulo 02 · Control de Plazo y Macro-Hitos</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tablero de Tiempo: {selectedProject} ({selectedTower})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metodología ejecutiva estandarizada: 12 Macro-Hitos con control dual <strong>`I` (Desviación de Inicio)</strong> y <strong>`E` (Desviación de Ejecución)</strong>, Curva S y Top 5 Mayores Atrasos.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Hitos Cumplidos</span>
            <span className="text-lg font-extrabold text-emerald-600 tabular-nums">
              {completedMilestones} / {macroMilestones.length}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Hitos en Riesgo</span>
            <span className="text-lg font-extrabold text-amber-600 tabular-nums">{delayedMilestones}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Desvío Promedio (E)</span>
            <span className="text-lg font-extrabold text-red-600 tabular-nums">+{avgDeviationE} días</span>
          </div>
        </div>
      </div>

      {/* 12 Macro-Hitos Interactive Timeline */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span>Línea de Tiempo de los 12 Macro-Hitos Estandarizados (Marval)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Haga clic sobre un hito para inspeccionar las desviaciones duales <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">I</code> y <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">E</code>.
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

        {/* Milestone Steps Timeline */}
        <div className="relative pt-2 pb-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center min-w-[850px] relative">
            {/* Background line */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0"></div>

            {macroMilestones.map((m) => {
              const isSelected = selectedMilestone?.id === m.id;
              const isDone = m.estado === 'Cumplido';
              const isRisk = m.estado === 'En riesgo';
              const isDelayed = m.estado === 'Atrasado';

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

      {/* Grid: Curva S + Mayores Atrasos (Top 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curva S (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Curva S de Avance Físico: Planificado (PV) vs Real (EV)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Proyección ajustada con el ritmo real de avance de las últimas 4 semanas (Regla de oro Marval: <strong>4% a 7% mensual</strong>).
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Ritmo Actual: 5.8% / mes
              </span>
            </div>
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
                <Line
                  type="monotone"
                  dataKey="pv"
                  name="Planificado (PV)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="ev"
                  name="Real Ejecutado (EV)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="proyeccion"
                  name="Pronóstico (Ritmo 5.8%)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2 bg-slate-50 rounded">
              <span className="text-slate-500 text-[10px] block">Avance Planificado (PV):</span>
              <span className="font-extrabold text-blue-700 text-sm">92.0%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <span className="text-slate-500 text-[10px] block">Avance Real Ejecutado (EV):</span>
              <span className="font-extrabold text-emerald-700 text-sm">79.0%</span>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <span className="text-slate-500 text-[10px] block">Desviación Neta:</span>
              <span className="font-extrabold text-red-600 text-sm">-13.0 pt (-42 días)</span>
            </div>
          </div>
        </div>

        {/* Mayores Atrasos Card (1 col) */}
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
  );
};
