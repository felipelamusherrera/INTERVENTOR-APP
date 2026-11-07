import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Filter, 
  Search, 
  FileText, 
  Wrench,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { SelloActivity, SelloInspection, CriterioSello } from '../../types';
import { initialQualityActivities } from '../../data/mockData';

export const CalidadView: React.FC = () => {
  const [activities, setActivities] = useState<SelloActivity[]>(initialQualityActivities);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialQualityActivities[0].id);
  const [filterFase, setFilterFase] = useState<'TODAS' | 'Obra Gris' | 'Obra Blanca'>('TODAS');

  // New Inspection Form state
  const [apto, setApto] = useState('Apto 902');
  const [piso, setPiso] = useState(9);
  const [resultado, setResultado] = useState<CriterioSello>('0');
  const [medicionMm, setMedicionMm] = useState<number>(2);
  const [hallazgo, setHallazgo] = useState('');
  const [contratista, setContratista] = useState('');
  const [inspector, setInspector] = useState('Jefferson Ávila (Auditor)');
  const [showToast, setShowToast] = useState(false);

  const activeActivity = activities.find(a => a.id === selectedActivityId) || activities[0];

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();

    const newInsp: SelloInspection = {
      id: `insp-${Date.now()}`,
      apartamento: apto,
      piso,
      resultado,
      medicionMm: activeActivity.tolerancia.includes('mm') ? medicionMm : undefined,
      toleranciaTexto: activeActivity.tolerancia,
      hallazgo: resultado !== '0' ? hallazgo : undefined,
      contratistaResponsable: resultado !== '0' ? contratista : undefined,
      fecha: new Date().toISOString().split('T')[0],
      inspector
    };

    setActivities(prev => prev.map(a => {
      if (a.id !== selectedActivityId) return a;
      return {
        ...a,
        inspecciones: [newInsp, ...a.inspecciones]
      };
    }));

    setHallazgo('');
    setContratista('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Overall calculations across all activities
  const allInspections = activities.flatMap(a => a.inspecciones);
  const totalCount = allInspections.length;
  const approvedCount = allInspections.filter(i => i.resultado === '0').length;
  const failedInternalCount = allInspections.filter(i => i.resultado === '1').length;
  const failedExternalCount = allInspections.filter(i => i.resultado === '2').length;
  const naCount = allInspections.filter(i => i.resultado === 'NA').length;

  const validEvaluated = totalCount - naCount;
  const globalCompliance = validEvaluated > 0 ? Math.round((approvedCount / validEvaluated) * 100) : 100;

  const filteredActivities = activities.filter(a => {
    if (filterFase === 'TODAS') return true;
    return a.fase === filterFase;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Módulo 08 · Calidad: Sellos de Obra Gris y Blanca</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Manual de Toma de Sellos (Norma MA-SIG-CAL-001 v.003)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Inspección semanal y registro de cumplimiento técnico en obra para 13 actividades estándar (Vanos estructura y mampostería, Redes, Morteros, Pisos, Enchapes, Ventanería, Drywall, Puertas y Pintura).
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center space-x-3 text-xs tabular-nums">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cumplimiento Global</span>
            <span className="text-lg font-extrabold text-indigo-700">{globalCompliance}%</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Hallazgos Contratista (1)</span>
            <span className="text-lg font-extrabold text-red-600">{failedInternalCount}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Hallazgos Externos (2)</span>
            <span className="text-lg font-extrabold text-amber-600">{failedExternalCount}</span>
          </div>
        </div>
      </div>

      {/* Criterios de Evaluación Marval Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-xs">Criterio 0: Cumple</strong>
            <span className="text-[11px] text-emerald-700">Dentro de especificación y tolerancia geométrica.</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-red-200 bg-red-50/70 text-red-900 flex items-start space-x-2">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-xs">Criterio 1: No cumple</strong>
            <span className="text-[11px] text-red-700">Incumplimiento directo a cargo del contratista del frente.</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-xs">Criterio 2: No cumple por externos</strong>
            <span className="text-[11px] text-amber-700">Daño o desviación originado por otros gremios/contratistas.</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 flex items-start space-x-2">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-xs">Criterio NA: No aplica</strong>
            <span className="text-[11px] text-slate-500">Actividad no ejecutada o diferida a etapa posterior.</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: Activities Selector (Left), Active Inspection Form & Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activities List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              13 Actividades Estandarizadas
            </h3>
            <div className="flex space-x-1">
              {(['TODAS', 'Obra Gris', 'Obra Blanca'] as const).map(fase => (
                <button
                  key={fase}
                  onClick={() => setFilterFase(fase)}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                    filterFase === fase ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {fase}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredActivities.map((act) => {
              const isSelected = act.id === selectedActivityId;
              const count = act.inspecciones.length;
              const passed = act.inspecciones.filter(i => i.resultado === '0').length;
              const pct = count > 0 ? Math.round((passed / count) * 100) : 100;

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivityId(act.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.nombre}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      pct === 100 ? 'bg-emerald-100 text-emerald-800' :
                      pct >= 75 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{act.fase} · {act.codigo}</span>
                    <span>{count} inspecciones</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 font-medium truncate mt-0.5">
                    Tolerancia: {act.tolerancia}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Activity Details & Inspection Entry (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Activity Description Header */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {activeActivity.fase} · {activeActivity.codigo}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  Sello de Calidad: {activeActivity.nombre}
                </h3>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Tolerancia de Aceptación:</span>
                <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {activeActivity.tolerancia}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeActivity.descripcion}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="font-bold text-slate-700 flex items-center">
                <Wrench className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Herramientas reglamentarias:
              </span>
              {activeActivity.herramientas.map((h, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* New Inspection Form */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Registrar Nueva Inspección de Sello</span>
            </h4>

            {showToast && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>¡Inspección registrada con éxito! Calculando nuevo % de calidad...</span>
              </div>
            )}

            <form onSubmit={handleAddInspection} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Apartamento / Inmueble</label>
                  <input
                    type="text"
                    value={apto}
                    onChange={(e) => setApto(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Piso</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={piso}
                    onChange={(e) => setPiso(parseInt(e.target.value, 10))}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Inspector / Residente</label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Criterio selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Calificación del Criterio Oficial (Marval)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: '0', label: '0: Cumple', color: 'emerald' },
                    { id: '1', label: '1: No Cumple', color: 'red' },
                    { id: '2', label: '2: No Cumple Ext.', color: 'amber' },
                    { id: 'NA', label: 'NA: No Aplica', color: 'slate' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setResultado(c.id as CriterioSello)}
                      className={`py-2 px-3 rounded-lg font-bold border transition text-center ${
                        resultado === c.id
                          ? c.id === '0' ? 'bg-emerald-600 text-white border-emerald-600 shadow' :
                            c.id === '1' ? 'bg-red-600 text-white border-red-600 shadow' :
                            c.id === '2' ? 'bg-amber-600 text-white border-amber-600 shadow' :
                            'bg-slate-700 text-white border-slate-700 shadow'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra fields if not compliant */}
              {resultado !== '0' && resultado !== 'NA' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-red-50/50 border border-red-200 rounded-lg">
                  <div>
                    <label className="block text-red-900 font-bold mb-1">Descripción del Hallazgo</label>
                    <input
                      type="text"
                      placeholder="Ej. Desplome de 8 mm en muro divisorio"
                      value={hallazgo}
                      onChange={(e) => setHallazgo(e.target.value)}
                      className="w-full border border-red-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-red-900 font-bold mb-1">Contratista Responsable</label>
                    <input
                      type="text"
                      placeholder="Ej. Mampostería San Juan o Plomería (Externo)"
                      value={contratista}
                      onChange={(e) => setContratista(e.target.value)}
                      className="w-full border border-red-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Inspección en Sistema Analytics</span>
              </button>
            </form>
          </div>

          {/* Inspection Records Table */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Inspecciones Registradas para {activeActivity.nombre} ({activeActivity.inspecciones.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-2 px-3">Inmueble</th>
                    <th className="py-2 px-2 text-center">Piso</th>
                    <th className="py-2 px-2 text-center">Resultado</th>
                    <th className="py-2 px-2">Medición / Tolerancia</th>
                    <th className="py-2 px-3">Hallazgo / Observación</th>
                    <th className="py-2 px-2">Contratista</th>
                    <th className="py-2 px-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeActivity.inspecciones.map((insp) => (
                    <tr key={insp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{insp.apartamento}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{insp.piso}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          insp.resultado === '0' ? 'bg-emerald-100 text-emerald-800' :
                          insp.resultado === '1' ? 'bg-red-100 text-red-800' :
                          insp.resultado === '2' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {insp.resultado === '0' ? '0: Cumple' :
                           insp.resultado === '1' ? '1: No Cumple' :
                           insp.resultado === '2' ? '2: No C. Ext.' : 'NA'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 tabular-nums font-mono text-[11px]">
                        {insp.medicionMm !== undefined ? `${insp.medicionMm} mm (${insp.toleranciaTexto})` : insp.toleranciaTexto}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {insp.hallazgo || <span className="text-slate-400 italic">Conforme</span>}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 font-medium">
                        {insp.contratistaResponsable || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[10px] tabular-nums">
                        {insp.fecha}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
