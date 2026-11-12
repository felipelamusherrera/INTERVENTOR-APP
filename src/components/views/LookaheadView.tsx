import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Calendar, 
  Layers, 
  ArrowRight,
  Flame,
  Search,
  Filter,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  User,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { LookaheadGate } from '../../types';
import { lookaheadGates as initialMockGates } from '../../data/mockData';
import { BaselineService } from '../../services/baselineService';

interface LookaheadViewProps {
  selectedProject?: string;
}

export const LookaheadView: React.FC<LookaheadViewProps> = ({
  selectedProject = 'Belaterra Pietra'
}) => {
  const [gatesList, setGatesList] = useState<LookaheadGate[]>([]);
  const [filterMode, setFilterMode] = useState<'TODOS' | 'CRITICOS' | 'BITACORA' | 'BLOQUEADOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Gestión / Detalle de Restricción
  const [selectedGateItem, setSelectedGateItem] = useState<LookaheadGate | null>(null);
  const [gestionNotas, setGestionNotas] = useState('');
  const [responsableGestion, setResponsableGestion] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cargar compuertas: Combina datos base con restricciones reales levantadas en Bitácora
  const cargarCompuertas = () => {
    // 1. Obtener restricciones levantadas en campo desde la Bitácora
    const bitacoraFeed = BaselineService.getRestriccionesLookaheadFeed(selectedProject);
    const bitacoraIds = new Set(bitacoraFeed.map(b => b.id));

    // 2. Obtener resoluciones guardadas
    const resoluciones = BaselineService.getResolucionesLookahead();

    // 3. Procesar datos base aplicando resoluciones
    const baseUpdated = initialMockGates.map(item => {
      const res = resoluciones[item.id];
      const finalGates = res?.gates ? { ...item.gates, ...res.gates } : item.gates;
      const trueCount = Object.values(finalGates).filter(Boolean).length;
      const ip = Math.round((trueCount / 7) * 100);
      return {
        ...item,
        origen: 'PLANIFICACION' as const,
        estadoGestion: res?.estadoGestion || (ip >= 85 ? 'LIBERADO' as const : 'PENDIENTE' as const),
        gates: finalGates,
        indicePreparacion: ip,
      };
    });

    // Unir: primero las restricciones de la Bitácora de campo, luego las base
    const merged = [
      ...bitacoraFeed,
      ...baseUpdated.filter(b => !bitacoraIds.has(b.id))
    ];

    setGatesList(merged);
  };

  useEffect(() => {
    cargarCompuertas();
    const handleUpdate = () => cargarCompuertas();
    window.addEventListener('marval_lookahead_updated', handleUpdate);
    window.addEventListener('marval_bitacora_reporte_cerrado', handleUpdate);
    return () => {
      window.removeEventListener('marval_lookahead_updated', handleUpdate);
      window.removeEventListener('marval_bitacora_reporte_cerrado', handleUpdate);
    };
  }, [selectedProject]);

  // Alternar compuerta individual (Toggle)
  const toggleGate = (itemId: string, gateKey: keyof LookaheadGate['gates']) => {
    setGatesList(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const newGates = { ...item.gates, [gateKey]: !item.gates[gateKey] };
      const trueCount = Object.values(newGates).filter(Boolean).length;
      const newIp = Math.round((trueCount / 7) * 100);

      // Guardar resolución persistente
      BaselineService.guardarResolucionLookahead(item.id, {
        gates: newGates,
        estadoGestion: newIp >= 85 ? 'LIBERADO' : 'PENDIENTE',
      });

      return {
        ...item,
        gates: newGates,
        indicePreparacion: newIp,
        estadoGestion: newIp >= 85 ? 'LIBERADO' : 'PENDIENTE',
      };
    }));
  };

  // Guardar gestión formal desde el Modal
  const handleGuardarGestion = () => {
    if (!selectedGateItem) return;

    BaselineService.guardarResolucionLookahead(selectedGateItem.id, {
      estadoGestion: 'EN_GESTION',
      notasGestion: gestionNotas,
    });

    showToast(`Acción de mitigación registrada para "${selectedGateItem.actividad}".`);
    setSelectedGateItem(null);
    setGestionNotas('');
    cargarCompuertas();
  };

  const handleLiberarTodas = (item: LookaheadGate) => {
    const allTrue: LookaheadGate['gates'] = {
      diseno: true,
      contratacion: true,
      predecesora: true,
      materiales: true,
      manoObra: true,
      equipos: true,
      sstAmbiental: true,
    };

    BaselineService.guardarResolucionLookahead(item.id, {
      gates: allTrue,
      estadoGestion: 'LIBERADO',
      notasGestion: 'Compuertas liberadas en comité de Lookahead.',
    });

    showToast(`¡Compuertas liberadas para ${item.actividad}!`);
    setSelectedGateItem(null);
    cargarCompuertas();
  };

  // Filtrado de Compuertas
  const filteredGates = useMemo(() => {
    return gatesList.filter(item => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = 
          item.actividad.toLowerCase().includes(term) ||
          item.frente.toLowerCase().includes(term) ||
          (item.edt && item.edt.toLowerCase().includes(term)) ||
          item.responsable.toLowerCase().includes(term);
        if (!match) return false;
      }

      if (filterMode === 'CRITICOS') return item.esCritica;
      if (filterMode === 'BITACORA') return item.origen === 'BITACORA_CAMPO';
      if (filterMode === 'BLOQUEADOS') return item.indicePreparacion < 75;

      return true;
    });
  }, [gatesList, searchTerm, filterMode]);

  // Métricas y KPIs
  const avgIp = gatesList.length > 0 
    ? Math.round(gatesList.reduce((acc, curr) => acc + curr.indicePreparacion, 0) / gatesList.length)
    : 100;
  
  const criticalGatesCount = gatesList.filter(g => g.indicePreparacion < 75).length;
  const bitacoraRestrictionsCount = gatesList.filter(g => g.origen === 'BITACORA_CAMPO').length;
  const rutaCriticaBloqueadaCount = gatesList.filter(g => g.esCritica && g.indicePreparacion < 75).length;

  // Conteo de bloqueos por tipo de compuerta
  const gateBreakdown = useMemo(() => {
    const counts = {
      diseno: 0,
      contratacion: 0,
      predecesora: 0,
      materiales: 0,
      manoObra: 0,
      equipos: 0,
      sstAmbiental: 0,
    };

    gatesList.forEach(g => {
      if (!g.gates.diseno) counts.diseno++;
      if (!g.gates.contratacion) counts.contratacion++;
      if (!g.gates.predecesora) counts.predecesora++;
      if (!g.gates.materiales) counts.materiales++;
      if (!g.gates.manoObra) counts.manoObra++;
      if (!g.gates.equipos) counts.equipos++;
      if (!g.gates.sstAmbiental) counts.sstAmbiental++;
    });

    return [
      { key: 'diseno', label: '1. Diseño / Planos', count: counts.diseno },
      { key: 'contratacion', label: '2. Contratos / Pólizas', count: counts.contratacion },
      { key: 'predecesora', label: '3. Predecesora / Frente', count: counts.predecesora },
      { key: 'materiales', label: '4. Materiales / Stock', count: counts.materiales },
      { key: 'manoObra', label: '5. Mano de Obra / Cuadrillas', count: counts.manoObra },
      { key: 'equipos', label: '6. Equipos / Formaletas', count: counts.equipos },
      { key: 'sstAmbiental', label: '7. SST / Permisos / Licencias', count: counts.sstAmbiental },
    ];
  }, [gatesList]);

  // Exportar plan de acción a CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'EDT', 'Actividad', 'Frente', 'Semana', 'Responsable', 'Criticidad', 'IP (%)', 'Diseño', 'Contrato', 'Predecesora', 'Materiales', 'ManoObra', 'Equipos', 'SST', 'Estado', 'Observaciones'];
    const rows = filteredGates.map(g => [
      g.id,
      g.edt || 'N/A',
      `"${g.actividad.replace(/"/g, '""')}"`,
      `"${g.frente.replace(/"/g, '""')}"`,
      g.semana,
      `"${g.responsable.replace(/"/g, '""')}"`,
      g.esCritica ? 'CRITICA' : 'HOLGURA',
      `${g.indicePreparacion}%`,
      g.gates.diseno ? 'OK' : 'BLOQUEO',
      g.gates.contratacion ? 'OK' : 'BLOQUEO',
      g.gates.predecesora ? 'OK' : 'BLOQUEO',
      g.gates.materiales ? 'OK' : 'BLOQUEO',
      g.gates.manoObra ? 'OK' : 'BLOQUEO',
      g.gates.equipos ? 'OK' : 'BLOQUEO',
      g.gates.sstAmbiental ? 'OK' : 'BLOQUEO',
      g.estadoGestion || 'PENDIENTE',
      `"${(g.observaciones || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lookahead_Plan_Accion_${selectedProject.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Plan de acción Lookahead exportado exitosamente a CSV.');
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl bg-slate-900 text-white flex items-center space-x-3 text-xs font-bold transition-all">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Gerencial */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Módulo 05 · Lookahead Preventivo de Restricciones (Lean Construction)</span>
            <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[11px]">
              {selectedProject}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Matriz de 7 Compuertas & Conexión con Bitácora de Campo
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            <strong>Anticipar antes de que ocurra el retraso:</strong> Audita los 7 prerrequisitos de obra.
            Las actividades que el residente marca como <strong>"No Inició"</strong> en la Bitácora semanal se reflejan aquí automáticamente con su restricción causante para gestionar la liberación inmediata de los frentes.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs tabular-nums">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Índice IP Promedio</span>
            <span className={`text-lg font-extrabold ${avgIp >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {avgIp}%
            </span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-red-600 font-semibold block uppercase">Frentes Bloqueados</span>
            <span className="text-lg font-extrabold text-red-600">{criticalGatesCount}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-blue-600 font-semibold block uppercase">Alerta Bitácora</span>
            <span className="text-lg font-extrabold text-blue-700">{bitacoraRestrictionsCount}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-rose-700 font-semibold block uppercase flex items-center justify-center space-x-1">
              <Flame className="w-3 h-3 text-rose-600" />
              <span>Ruta Crítica</span>
            </span>
            <span className="text-lg font-extrabold text-rose-800">{rutaCriticaBloqueadaCount}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de las 7 Compuertas con Conteo de Restricciones Activas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        {gateBreakdown.map((gate) => (
          <div 
            key={gate.key} 
            className={`border rounded-xl p-3 shadow-2xs transition-all ${
              gate.count > 0 
                ? 'bg-red-50/70 border-red-200' 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] truncate">{gate.label.split('.')[1]?.trim()}</span>
              {gate.count > 0 ? (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center">
                  {gate.count}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold">✓ OK</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {gate.count > 0 ? `${gate.count} frente(s) impedido(s)` : 'Sin restricciones'}
            </span>
          </div>
        ))}
      </div>

      {/* Barra de Filtros, Búsqueda y Exportación */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por actividad, EDT o frente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>

          {/* Filtros de Pestaña */}
          <div className="flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setFilterMode('TODOS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'TODOS'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({gatesList.length})
            </button>

            <button
              onClick={() => setFilterMode('CRITICOS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                filterMode === 'CRITICOS'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Ruta Crítica ({gatesList.filter(g => g.esCritica).length})</span>
            </button>

            <button
              onClick={() => setFilterMode('BITACORA')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                filterMode === 'BITACORA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span>Desde Bitácora ({bitacoraRestrictionsCount})</span>
            </button>

            <button
              onClick={() => setFilterMode('BLOQUEADOS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'BLOQUEADOS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Bloqueados (IP &lt; 75%)
            </button>
          </div>
        </div>

        {/* Botón de Exportar Plan de Acción */}
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-2xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          <span>Exportar Plan de Acción (CSV)</span>
        </button>
      </div>

      {/* TABLA PRINCIPAL DE MATRIZ DE 7 COMPUERTAS */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Ventana</th>
                <th className="py-2.5 px-3 min-w-[240px]">Actividad Próxima</th>
                <th className="py-2.5 px-2">Frente / Área</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 1: Planos y especificaciones técnicas aprobadas">1. Diseño</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 2: Contrato adjudicado, acta de inicio y pólizas">2. Contrato</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 3: Frente liberado por la actividad predecesora">3. Predec.</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 4: Materiales disponibles en obra o almacén">4. Material</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 5: Cuadrilla y mano de obra completa">5. Personal</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 6: Maquinaria, equipos y formaletas listos">6. Equipos</th>
                <th className="py-2.5 px-2 text-center" title="Compuerta 7: Seguridad, permisos de trabajo y licencias">7. SST/Amb.</th>
                <th className="py-2.5 px-3 text-center">Índice IP %</th>
                <th className="py-2.5 px-3 text-center">Dictamen</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGates.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-700 text-sm">No hay restricciones en esta categoría</div>
                    <p className="text-xs text-slate-400 mt-0.5">Todas las actividades en el filtro seleccionado están liberadas.</p>
                  </td>
                </tr>
              ) : (
                filteredGates.map((item) => {
                  const ip = item.indicePreparacion;
                  const isGreen = ip >= 85;
                  const isAmber = ip >= 70 && ip < 85;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.esCritica ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Ventana */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] block w-fit">
                          {item.semana}
                        </span>
                        {item.origen === 'BITACORA_CAMPO' && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded mt-1 inline-block">
                            Desde Bitácora
                          </span>
                        )}
                      </td>

                      {/* Actividad */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          {item.edt && (
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              {item.edt}
                            </span>
                          )}
                          <strong className="text-slate-900 block truncate max-w-[260px]" title={item.actividad}>
                            {item.actividad}
                          </strong>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Resp: <strong>{item.responsable}</strong></span>
                          {item.esCritica && (
                            <span className="text-red-600 font-extrabold flex items-center space-x-0.5">
                              <Flame className="w-3 h-3 text-red-600" />
                              <span>Ruta Crítica</span>
                            </span>
                          )}
                        </div>
                        {item.observaciones && (
                          <div className="text-[10px] text-slate-500 italic mt-1 line-clamp-1" title={item.observaciones}>
                            "{item.observaciones}"
                          </div>
                        )}
                      </td>

                      {/* Frente / Área */}
                      <td className="py-3 px-2 text-slate-600 font-medium">{item.frente}</td>

                      {/* 7 Interactive Check Buttons */}
                      {[
                        { key: 'diseno', val: item.gates.diseno, label: 'Diseño' },
                        { key: 'contratacion', val: item.gates.contratacion, label: 'Contrato' },
                        { key: 'predecesora', val: item.gates.predecesora, label: 'Predecesora' },
                        { key: 'materiales', val: item.gates.materiales, label: 'Materiales' },
                        { key: 'manoObra', val: item.gates.manoObra, label: 'Mano de Obra' },
                        { key: 'equipos', val: item.gates.equipos, label: 'Equipos' },
                        { key: 'sstAmbiental', val: item.gates.sstAmbiental, label: 'SST' },
                      ].map((g) => (
                        <td key={g.key} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleGate(item.id, g.key as keyof LookaheadGate['gates'])}
                            className={`p-1.5 rounded-lg transition-transform active:scale-95 ${
                              g.val
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-300 animate-pulse'
                            }`}
                            title={`Alternar compuerta de ${g.label}`}
                          >
                            {g.val ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                        </td>
                      ))}

                      {/* IP % Result */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-black ${
                            isGreen ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {ip}%
                          </span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isGreen ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${ip}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      {/* Dictamen Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isGreen
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAmber
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isGreen ? 'LIBERADO' : isAmber ? 'EN RIESGO' : 'DETENIDO'}
                        </span>
                      </td>

                      {/* Botón Gestionar */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGateItem(item);
                            setGestionNotas(item.observaciones || '');
                            setResponsableGestion(item.responsable);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / DRAWER DE GESTIÓN Y LIBERACIÓN DE COMPUERTA */}
      {selectedGateItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Plan de Acción Lookahead · {selectedGateItem.semana}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedGateItem.actividad}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGateItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-slate-700">
              <div><strong>Frente / Agrupación:</strong> {selectedGateItem.frente}</div>
              <div><strong>Responsable de Campo:</strong> {selectedGateItem.responsable}</div>
              <div><strong>Origen:</strong> {selectedGateItem.origen === 'BITACORA_CAMPO' ? 'Registrado por Residente en Bitácora de Campo' : 'Planificación Maestra'}</div>
              {selectedGateItem.restriccionPrincipal && (
                <div><strong>Restricción Principal Causal:</strong> <span className="text-red-700 font-bold">{selectedGateItem.restriccionPrincipal}</span></div>
              )}
            </div>

            {/* Estado de las 7 Compuertas */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                Estado de las 7 Compuertas (Haz clic para alternar):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  { key: 'diseno', label: '1. Diseño', val: selectedGateItem.gates.diseno },
                  { key: 'contratacion', label: '2. Contratos', val: selectedGateItem.gates.contratacion },
                  { key: 'predecesora', label: '3. Predecesora', val: selectedGateItem.gates.predecesora },
                  { key: 'materiales', label: '4. Materiales', val: selectedGateItem.gates.materiales },
                  { key: 'manoObra', label: '5. Mano de Obra', val: selectedGateItem.gates.manoObra },
                  { key: 'equipos', label: '6. Equipos', val: selectedGateItem.gates.equipos },
                  { key: 'sstAmbiental', label: '7. SST / Amb.', val: selectedGateItem.gates.sstAmbiental },
                ].map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      toggleGate(selectedGateItem.id, g.key as keyof LookaheadGate['gates']);
                      setSelectedGateItem(prev => prev ? {
                        ...prev,
                        gates: { ...prev.gates, [g.key]: !prev.gates[g.key as keyof LookaheadGate['gates']] }
                      } : null);
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                      g.val ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    <span className="font-semibold">{g.label}</span>
                    <span>{g.val ? '✓' : '✗'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas y Acciones de Mitigación */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Acción de Mitigación / Compromiso de Desbloqueo:
              </label>
              <textarea
                rows={3}
                value={gestionNotas}
                onChange={(e) => setGestionNotas(e.target.value)}
                placeholder="Especifique las gestiones realizadas para desatascar la restricción (ej: proveedor confirmó entrega, planos validados por estructurador)..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleLiberarTodas(selectedGateItem)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                Liberar Todas las Compuertas (100% OK)
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedGateItem(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarGestion}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
                >
                  Guardar Plan de Acción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
