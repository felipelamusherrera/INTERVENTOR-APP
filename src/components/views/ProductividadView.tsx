import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell 
} from 'recharts';
import { productivityData } from '../../data/mockData';

export const ProductividadView: React.FC = () => {
  // Tesla Quad Data Preparation
  const chartData = productivityData.map(p => ({
    name: p.actividad,
    productividad: p.productividad,
    unidades: p.unidadesPlaneadas,
    indicePersonal: p.indicePersonal,
    cuadrante: p.cuadrante,
    ritmoMensual: p.ritmoMensual
  }));

  const avgProductivity = Math.round(productivityData.reduce((acc, curr) => acc + curr.productividad, 0) / productivityData.length);
  const avgRitmo = (productivityData.reduce((acc, curr) => acc + curr.ritmoMensual, 0) / productivityData.length).toFixed(1);
  const totalPersonalARI = productivityData.reduce((acc, curr) => acc + curr.personalRealARI, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Módulo 06 · Productividad "Tesla" & Cuadrantes Luis Felipe</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tablero de Productividad por Cuadrantes (ARI vs. Rendimiento)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolución del modelo elogiado internamente como <em>"pasar de un Renault 4 a un Tesla"</em>: Cruce de personal real ingresado en <strong>ARI</strong>, cumplimiento de unidades y ritmo mensual (Regla Marval: <strong>4% a 7% mensual</strong>).
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-3 text-xs tabular-nums">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Productividad Global</span>
            <span className="text-lg font-extrabold text-blue-600">{avgProductivity}%</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Ritmo Mensual</span>
            <span className="text-lg font-extrabold text-emerald-600">{avgRitmo}% / mes</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Personal Total (ARI)</span>
            <span className="text-lg font-extrabold text-slate-800">{totalPersonalARI} operarios</span>
          </div>
        </div>
      </div>

      {/* Grid: Scatter Plot Cuadrantes (Left) & 4 Actividades Pareto (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot Cuadrantes Tesla (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Matriz de Cuadrantes (% Productividad vs. Volumen Planeado)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verde: Zona Tesla (&gt;90%) | Ámbar: Alerta (75-90%) | Rojo: Crítico (&lt;75%).
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Modelo LF
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="productividad" 
                  name="Productividad" 
                  unit="%" 
                  domain={[40, 110]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="unidades" 
                  name="Unidades Planeadas" 
                  domain={[0, 35]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <ZAxis type="number" dataKey="indicePersonal" range={[60, 240]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md text-xs space-y-1">
                          <strong className="text-slate-900 block">{data.name}</strong>
                          <div className="text-slate-600">Productividad: <strong className="text-blue-600">{data.productividad}%</strong></div>
                          <div className="text-slate-600">Unidades: <strong>{data.unidades}</strong></div>
                          <div className="text-slate-600">Índice ARI: <strong>{data.indicePersonal}x</strong></div>
                          <div className="text-slate-600">Ritmo: <strong>{data.ritmoMensual}% / mes</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Actividades" data={chartData}>
                  {chartData.map((entry, index) => {
                    const color = entry.productividad >= 90 ? '#10b981' : entry.productividad >= 75 ? '#f59e0b' : '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-center">
            <div className="p-2 bg-emerald-50 rounded text-emerald-800 font-semibold">
              Zona Tesla (&gt;90%): 3 frentes
            </div>
            <div className="p-2 bg-amber-50 rounded text-amber-800 font-semibold">
              Zona Alerta (75-90%): 1 frente
            </div>
            <div className="p-2 bg-red-50 rounded text-red-800 font-semibold">
              Zona Crítica (&lt;75%): 2 frentes
            </div>
          </div>
        </div>

        {/* Detalle de las 4 Actividades Pareto (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>4 Actividades Pareto en Ejecución</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">Torre 1</span>
          </div>

          <div className="space-y-3">
            {productivityData.slice(0, 4).map((p) => {
              const isTesla = p.cuadrante.includes('Tesla');
              const isAlert = p.cuadrante === 'Alerta';

              return (
                <div 
                  key={p.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-800">{p.actividad}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isTesla ? 'bg-emerald-100 text-emerald-800' : isAlert ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {p.productividad}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isTesla ? 'bg-emerald-500' : isAlert ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, p.productividad)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 tabular-nums pt-1">
                    <div>
                      <span>Plan / Real:</span>
                      <strong className="block text-slate-700">{p.unidadesPlaneadas} / {p.unidadesEjecutadas} unid</strong>
                    </div>
                    <div>
                      <span>Personal ARI:</span>
                      <strong className="block text-slate-700">{p.personalRealARI} op ({p.personalEsperado} esp)</strong>
                    </div>
                    <div>
                      <span>Ritmo 4 sem:</span>
                      <strong className={`block ${p.ritmoMensual >= 4 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {p.ritmoMensual}% / mes
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
