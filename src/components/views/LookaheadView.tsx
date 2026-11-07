import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  HelpCircle, 
  Lock, 
  Unlock,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { LookaheadGate } from '../../types';
import { lookaheadGates } from '../../data/mockData';

export const LookaheadView: React.FC = () => {
  const [gatesList, setGatesList] = useState<LookaheadGate[]>(lookaheadGates);

  const toggleGate = (itemId: string, gateKey: keyof LookaheadGate['gates']) => {
    setGatesList(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const newGates = { ...item.gates, [gateKey]: !item.gates[gateKey] };
      const trueCount = Object.values(newGates).filter(Boolean).length;
      const newIp = Math.round((trueCount / 7) * 100);

      return {
        ...item,
        gates: newGates,
        indicePreparacion: newIp
      };
    }));
  };

  const avgIp = Math.round(gatesList.reduce((acc, curr) => acc + curr.indicePreparacion, 0) / gatesList.length);
  const criticalGatesCount = gatesList.filter(g => g.indicePreparacion < 75).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Módulo 05 · Lookahead Preventivo de Restricciones</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Matriz Preventiva de 7 Compuertas (Ventana 4 Semanas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <strong>Anticipar antes de que ocurra el retraso:</strong> Audita los 7 prerrequisitos críticos de obra y calcula automáticamente el <strong>Índice de Preparación (IP %)</strong> para autorizar el inicio de actividades.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-3 text-xs tabular-nums">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Índice IP Promedio</span>
            <span className={`text-lg font-extrabold ${avgIp >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {avgIp}%
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Frentes Bloqueados</span>
            <span className="text-lg font-extrabold text-red-600">{criticalGatesCount}</span>
          </div>
        </div>
      </div>

      {/* Explanatory Pills */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
        {[
          { name: '1. Diseño', desc: 'Planos aprobados' },
          { name: '2. Contratos', desc: 'Acta de inicio y póliza' },
          { name: '3. Predecesora', desc: 'Frente anterior liberado' },
          { name: '4. Materiales', desc: 'Stock en almacén JD' },
          { name: '5. Mano de Obra', desc: 'Personal ARI completo' },
          { name: '6. Equipos', desc: 'Maquinaria operativa' },
          { name: '7. SST / Amb.', desc: 'Permisos de trabajo seguro' },
        ].map((gate, idx) => (
          <div key={idx} className="bg-white border border-surface-border rounded-lg p-2.5 shadow-sm text-center">
            <span className="font-bold text-slate-800 text-[11px] block">{gate.name}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{gate.desc}</span>
          </div>
        ))}
      </div>

      {/* 7 Gates Matrix Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Ventana</th>
                <th className="py-2.5 px-3 min-w-[240px]">Actividad Próxima</th>
                <th className="py-2.5 px-2">Frente / Área</th>
                <th className="py-2.5 px-2 text-center">Diseño</th>
                <th className="py-2.5 px-2 text-center">Contrato</th>
                <th className="py-2.5 px-2 text-center">Predec.</th>
                <th className="py-2.5 px-2 text-center">Material</th>
                <th className="py-2.5 px-2 text-center">Personal</th>
                <th className="py-2.5 px-2 text-center">Equipos</th>
                <th className="py-2.5 px-2 text-center">SST/Amb.</th>
                <th className="py-2.5 px-3 text-center">Índice IP %</th>
                <th className="py-2.5 px-3 text-center">Dictamen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gatesList.map((item) => {
                const ip = item.indicePreparacion;
                const isGreen = ip >= 85;
                const isAmber = ip >= 70 && ip < 85;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        {item.semana}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 block">{item.actividad}</strong>
                      <span className="text-[10px] text-slate-400">Resp: {item.responsable}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{item.frente}</td>

                    {/* 7 Interactive Check Buttons */}
                    {[
                      { key: 'diseno', val: item.gates.diseno },
                      { key: 'contratacion', val: item.gates.contratacion },
                      { key: 'predecesora', val: item.gates.predecesora },
                      { key: 'materiales', val: item.gates.materiales },
                      { key: 'manoObra', val: item.gates.manoObra },
                      { key: 'equipos', val: item.gates.equipos },
                      { key: 'sstAmbiental', val: item.gates.sstAmbiental },
                    ].map((g) => (
                      <td key={g.key} className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleGate(item.id, g.key as keyof LookaheadGate['gates'])}
                          className={`p-1.5 rounded-md transition ${
                            g.val
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title={`Haga clic para alternar compuerta de ${g.key}`}
                        >
                          {g.val ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </td>
                    ))}

                    {/* IP % Result */}
                    <td className="py-3 px-3 text-center tabular-nums">
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className={`text-sm font-black ${
                          isGreen ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {ip}%
                        </span>
                      </div>
                    </td>

                    {/* Dictamen Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isGreen
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAmber
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isGreen ? 'LIBERADO' : isAmber ? 'EN RIESGO' : 'DETENIDO'}
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
  );
};
