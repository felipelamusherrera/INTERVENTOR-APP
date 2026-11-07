import React, { useState } from 'react';
import { 
  CheckSquare, 
  Smartphone, 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { WeeklyLog, CausaRaiz } from '../../types';
import { initialWeeklyLogs } from '../../data/mockData';

const CAUSAS_MARVAL: CausaRaiz[] = [
  'Contratos',
  'Contratistas / Personal',
  'Formaleta',
  'Equipos',
  'Materiales / Compras',
  'Clima / Lluvias',
  'Diseños',
  'Licencias / Permisos'
];

export const BitacoraView: React.FC = () => {
  const [logs, setLogs] = useState<WeeklyLog[]>(initialWeeklyLogs);
  const [selectedTorre, setSelectedTorre] = useState('Torre 1');
  const [selectedHito, setSelectedHito] = useState('Enchapes y Zonas Húmedas');
  const [actividad, setActividad] = useState('');
  const [cumplio, setCumplio] = useState(false);
  const [causaRaiz, setCausaRaiz] = useState<CausaRaiz>('Contratistas / Personal');
  const [diasImpacto, setDiasImpacto] = useState(3);
  const [observaciones, setObservaciones] = useState('');
  const [residente, setResidente] = useState('Juan Pablo Morales');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad) return;

    const newLog: WeeklyLog = {
      id: `log-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      semana: 45,
      proyecto: 'Belaterra Pietra',
      torre: selectedTorre,
      hitoNombre: selectedHito,
      actividad,
      cumplio,
      causaRaiz: cumplio ? undefined : causaRaiz,
      diasImpacto: cumplio ? 0 : diasImpacto,
      residente,
      observaciones
    };

    setLogs([newLog, ...logs]);
    setActividad('');
    setObservaciones('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Pareto CNC Data Calculation
  const paretoAgg: Record<string, { dias: number; incidentes: number }> = {};
  CAUSAS_MARVAL.forEach(c => {
    paretoAgg[c] = { dias: 0, incidentes: 0 };
  });

  logs.forEach(l => {
    if (!l.cumplio && l.causaRaiz) {
      if (!paretoAgg[l.causaRaiz]) {
        paretoAgg[l.causaRaiz] = { dias: 0, incidentes: 0 };
      }
      paretoAgg[l.causaRaiz].dias += l.diasImpacto;
      paretoAgg[l.causaRaiz].incidentes += 1;
    }
  });

  const paretoData = Object.entries(paretoAgg)
    .map(([causa, data]) => ({
      causa: causa.split('/')[0].trim(),
      fullName: causa,
      dias: data.dias,
      incidentes: data.incidentes
    }))
    .sort((a, b) => b.dias - a.dias);

  const totalDiasPerdidos = logs.reduce((acc, curr) => acc + (curr.cumplio ? 0 : curr.diasImpacto), 0);
  const complianceRate = Math.round((logs.filter(l => l.cumplio).length / logs.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Módulo 04 · Bitácora Semanal Móvil & Pareto CNC</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Registro Rápido de Obra y Análisis de 5 Causas Raíz
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <strong>Experiencia de 3 minutos en celular:</strong> El residente de interventoría audita el compromiso de la semana, clasifica los desvíos en las causas corporativas de Marval y alimenta el Pareto de Causas No Cumplidas (CNC).
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs tabular-nums">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Índice PPC Semanal</span>
            <span className="text-lg font-extrabold text-blue-600">{complianceRate}%</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Días Impacto Total</span>
            <span className="text-lg font-extrabold text-red-600">+{totalDiasPerdidos}d</span>
          </div>
        </div>
      </div>

      {/* Grid: Mobile Capture Form (Left) & Pareto Analytics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Móvil (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Captura Semanal (Check-in Móvil)</span>
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
              Semana 45
            </span>
          </div>

          {showSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>¡Registro de bitácora guardado exitosamente en el historial!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Torre Evaluada</label>
                <select
                  value={selectedTorre}
                  onChange={(e) => setSelectedTorre(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="Torre 1">Torre 1 (Pietra)</option>
                  <option value="Torre 2">Torre 2 (Pietra)</option>
                  <option value="Torre 4">Torre 4 (Areia)</option>
                  <option value="Urbanismo">Urbanismo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Residente Interventor</label>
                <input
                  type="text"
                  value={residente}
                  onChange={(e) => setResidente(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Macro-Hito Vinculado</label>
              <select
                value={selectedHito}
                onChange={(e) => setSelectedHito(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="Estructura Principal (Pisos 1-12)">H-03. Estructura Principal</option>
                <option value="Mampostería y Divisiones Internas">H-04. Mampostería y Divisiones</option>
                <option value="Redes Hidrosanitarias y Gas">H-05. Redes Hidrosanitarias</option>
                <option value="Morteros, Frisos y Pañetes">H-07. Morteros y Pañetes</option>
                <option value="Afinado y Pisos">H-08. Afinado y Pisos</option>
                <option value="Enchapes y Zonas Húmedas">H-09. Enchapes y Zonas Húmedas</option>
                <option value="Ventanería, Puertas y Barandas">H-10. Ventanería y Barandas</option>
                <option value="Pintura Segunda Mano y Alistamiento">H-11. Pintura y Alistamiento</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Frente / Actividad Específica</label>
              <input
                type="text"
                placeholder="Ej. Enchape piso 9 torre 1 o Muros Eje 13"
                value={actividad}
                onChange={(e) => setActividad(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* ¿Cumplió? Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <label className="block text-slate-700 font-bold mb-2">
                ¿Se cumplió el compromiso de la semana?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCumplio(true)}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-bold border transition ${
                    cumplio
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SÍ (Cumplió)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCumplio(false)}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-bold border transition ${
                    !cumplio
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>NO (Desvío)</span>
                </button>
              </div>
            </div>

            {/* If NOT complied: 5 Core Causes Selector */}
            {!cumplio && (
              <div className="space-y-3 bg-red-50/50 border border-red-200 rounded-lg p-3">
                <div>
                  <label className="block text-red-900 font-bold mb-1">
                    Causa Raíz Principal (Estándar Marval)
                  </label>
                  <select
                    value={causaRaiz}
                    onChange={(e) => setCausaRaiz(e.target.value as CausaRaiz)}
                    className="w-full border border-red-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium bg-white"
                  >
                    {CAUSAS_MARVAL.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-red-900 font-bold">Días de Atraso / Impacto:</label>
                    <span className="font-extrabold text-red-700 tabular-nums">+{diasImpacto} días</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={diasImpacto}
                    onChange={(e) => setDiasImpacto(parseInt(e.target.value, 10))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-medium mb-1">Observaciones de Campo</label>
              <textarea
                rows={2}
                placeholder="Detalle de motivos, contratista involucrado o plan de acción..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar en Bitácora</span>
            </button>
          </form>
        </div>

        {/* Pareto CNC & Historial (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pareto Chart */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  <span>Pareto de Causas Raíz (Días de Impacto Acumulados)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Totalización de retrasos atribuibles a factores contractuales, operativos y logísticos.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                CNC Acumulado
              </span>
            </div>

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="causa" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    angle={-25} 
                    textAnchor="end" 
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="d" />
                  <Tooltip 
                    formatter={(val: any) => [`${val} días`, 'Impacto']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="dias" name="Días Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historial de Bitácora */}
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Historial Reciente de Reportes ({logs.length})
            </h4>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.cumplio ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.cumplio ? 'CUMPLIÓ' : 'NO CUMPLIÓ'}
                      </span>
                      <strong className="text-slate-800">{log.actividad}</strong>
                      <span className="text-slate-400">· {log.torre}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {log.observaciones || 'Sin observaciones registradas.'}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-3">
                      <span>{log.fecha}</span>
                      <span>Resp: {log.residente}</span>
                      <span>Hito: {log.hitoNombre}</span>
                    </div>
                  </div>

                  {!log.cumplio && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-red-600 block tabular-nums">
                        +{log.diasImpacto}d
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.causaRaiz}
                      </span>
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
