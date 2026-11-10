import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Upload, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  CloudUpload,
  Check,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CpmEngine, CpmTask, CpmProjectSummary } from '../../../services/cpmEngine';
import initialWbsData from '../../../data/wbsBelaterraFull.json';

export const ResidenteProgramacionView: React.FC = () => {
  const [tasks, setTasks] = useState<CpmTask[]>([]);
  const [summary, setSummary] = useState<CpmProjectSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'TODAS' | 'CRITICAS' | 'RIESGO' | 'HOLGURA' | 'RESUMEN'>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<CpmTask | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Cargar datos iniciales directamente del JSON enriquecido
  useEffect(() => {
    try {
      const res = CpmEngine.computeSchedule(initialWbsData as any[]);
      setTasks(res.tasks);
      setSummary(res.summary);
    } catch (e) {
      console.error('Error calculando CPM inicial:', e);
    }
  }, []);

  // Procesar archivo Excel cargado directamente por el residente
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json<any>(ws);

        const parsedRows = json.map((row: any, idx: number) => ({
          idConsec: Number(row.idConsec || row.IdConsec || idx + 1),
          edt: String(row.EDT || row.edt || ''),
          nombre: String(row.Nombre || row.nombre || `Tarea ${idx + 1}`),
          dura: Number(row.Dura !== undefined ? row.Dura : (row.dura || 0)),
          duraPrev: Number(row.DuraPrev || row.duraPrev || 0),
          w: row.W !== undefined ? row.W : (row.w || 0),
          type: String(row.type || (row.NivelEsquema <= 3 ? 'project' : 'task')),
          esHito: Boolean(row.Hito === 'Si' || row.esHito),
          predecesora: String(row.predecesora || row.Predecesora || ''),
          comien: row.Comien || row.comien,
          fin: row.Fin || row.fin,
          comienPrev: row.ComienPrev || row.comienPrev,
          finPrev: row.FinPrev || row.finPrev,
          varFin: row.VarFin !== undefined ? Number(row.VarFin) : undefined,
        }));

        const res = CpmEngine.computeSchedule(parsedRows);
        setTasks(res.tasks);
        setSummary(res.summary);
        setSyncStatus('idle');
      } catch (err) {
        console.error('Error procesando archivo Excel:', err);
        alert('Error al leer el archivo Excel. Verifica que sea un archivo WorkPlanner válido.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSyncToSharepoint = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }, 1200);
  };

  // Filtrado
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.edt.includes(searchTerm) ||
      String(t.idConsec).includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterMode === 'CRITICAS') return t.esCritica;
    if (filterMode === 'RIESGO') return t.tf > 0 && t.tf <= 5;
    if (filterMode === 'HOLGURA') return t.tf > 5;
    if (filterMode === 'RESUMEN') return t.type === 'project';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Programación de Obra & Ruta Crítica CPM</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Fechas Reprogramadas Reales (Comien / Fin)
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Análisis de la ruta crítica según las fechas oficiales proyectadas por el software y su red de precedencias
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Calculando...' : 'Cargar Sábana (.xlsx)'}</span>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={loading}
            />
          </label>

          <button
            onClick={handleSyncToSharepoint}
            disabled={syncStatus === 'syncing'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : syncStatus === 'synced' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloudUpload className="w-4 h-4 text-slate-600" />
            )}
            <span>
              {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Sincronizado a SharePoint' : 'Sincronizar a SharePoint'}
            </span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Actividades</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalTareas}</div>
            <div className="text-xs text-slate-400 mt-0.5">En la red de precedencias</div>
          </div>

          <div 
            onClick={() => setFilterMode('CRITICAS')}
            className="bg-red-50/70 p-5 rounded-2xl border border-red-200 shadow-sm cursor-pointer hover:bg-red-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800 uppercase">Ruta Crítica (TF &le; 0)</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-extrabold text-red-700 mt-1">{summary.tareasCriticas}</div>
            <div className="text-xs text-red-600 font-medium mt-0.5">{summary.porcentajeCriticidad}% de la red de obra</div>
          </div>

          <div 
            onClick={() => setFilterMode('RIESGO')}
            className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm cursor-pointer hover:bg-amber-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">En Riesgo (TF &le; 5d)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{summary.tareasEnRiesgo}</div>
            <div className="text-xs text-amber-600 font-medium mt-0.5">Holgura menor a 1 semana</div>
          </div>

          <div 
            onClick={() => setFilterMode('HOLGURA')}
            className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Con Holgura (TF &gt; 5d)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {summary.totalTareas - summary.tareasCriticas - summary.tareasEnRiesgo}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">Margen cómodo de holgura</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fecha Fin Proyectada</span>
            <div className="text-xl font-extrabold text-blue-700 mt-1">{summary.fechaFinEstimada}</div>
            <div className="text-xs text-slate-400 mt-0.5">Inicio: {summary.fechaInicioEstimada}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID consec, EDT o nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setFilterMode('TODAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'TODAS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setFilterMode('CRITICAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'CRITICAS' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              🔴 Ruta Crítica ({summary?.tareasCriticas || 0})
            </button>
            <button
              onClick={() => setFilterMode('RIESGO')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'RIESGO' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              🟡 En Riesgo ({summary?.tareasEnRiesgo || 0})
            </button>
            <button
              onClick={() => setFilterMode('HOLGURA')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'HOLGURA' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              🟢 Holgura OK
            </button>
            <button
              onClick={() => setFilterMode('RESUMEN')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                filterMode === 'RESUMEN' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumen
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Mostrando <strong>{filteredTasks.length}</strong> de {tasks.length} actividades
        </div>
      </div>

      {/* CPM Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 font-bold w-14">Id</th>
                <th className="py-3 px-3 font-bold w-24">EDT</th>
                <th className="py-3 px-4 font-bold min-w-[240px]">Descripción Actividad</th>
                <th className="py-3 px-3 font-bold text-center w-16">Dura</th>
                <th className="py-3 px-3 font-bold text-center w-16">% W</th>
                <th className="py-3 px-3 font-bold min-w-[140px]">Predecesora</th>
                <th className="py-3 px-3 font-bold text-center">Comienzo (Comien)</th>
                <th className="py-3 px-3 font-bold text-center">Fin (Fin)</th>
                <th className="py-3 px-3 font-bold text-center">Fin Tardío (LF)</th>
                <th className="py-3 px-3 font-bold text-center w-20">Holgura (TF)</th>
                <th className="py-3 px-3 font-bold text-center w-24">Estado CPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.slice(0, 300).map(task => {
                const isSummary = task.type === 'project';
                return (
                  <tr 
                    key={task.idConsec}
                    onClick={() => setSelectedTask(task)}
                    className={`cursor-pointer transition-colors ${
                      task.esCritica 
                        ? 'bg-red-50/40 hover:bg-red-50/80 font-medium' 
                        : isSummary 
                        ? 'bg-slate-50/60 hover:bg-slate-100/70 font-semibold' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-600">{task.idConsec}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{task.edt}</td>
                    <td className="py-2.5 px-4 text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {isSummary && <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                        <span className={task.esCritica ? 'text-red-900 font-bold' : ''}>
                          {task.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-slate-700">{task.dura}d</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        task.w >= 1 ? 'bg-emerald-100 text-emerald-800' : task.w > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {(task.w * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[160px]" title={task.predecesoraRaw}>
                      {task.predecesoraRaw || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">{task.comien}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">{task.fin}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{task.lateFinishDate || '-'}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        task.tf <= 0 
                          ? 'bg-red-100 text-red-800' 
                          : task.tf <= 5 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {task.tf}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {task.esCritica ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                          CRÍTICA
                        </span>
                      ) : task.tf <= 5 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          RIESGO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          HOLGURA
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predecessor/Successor Inspector Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500">ID Consec #{selectedTask.idConsec} • EDT {selectedTask.edt}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTask.nombre}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-center">
              <div>
                <span className="text-slate-500">Comienzo:</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.comien}</div>
              </div>
              <div>
                <span className="text-slate-500">Fin Reprog:</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.fin}</div>
              </div>
              <div>
                <span className="text-slate-500">Duración:</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.dura} días</div>
              </div>
              <div>
                <span className="text-slate-500">Holgura Total:</span>
                <div className={`font-bold mt-0.5 ${selectedTask.tf <= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {selectedTask.tf} días
                </div>
              </div>
            </div>

            {/* Predecesores */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Predecesoras ({selectedTask.predecesores.length})
              </h4>
              {selectedTask.predecesores.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tiene tareas predecesoras (Inicio de cadena)</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedTask.predecesores.map((p, idx) => {
                    const predTask = tasks.find(t => t.idConsec === p.idConsec);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="truncate mr-2">
                          <span className="font-mono font-bold text-blue-600">#{p.idConsec}</span>
                          <span className="text-slate-700 ml-1.5 font-medium">{predTask?.nombre || 'Tarea externa'}</span>
                        </div>
                        <span className="text-[11px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          {p.tipo}{p.lagDias !== 0 ? (p.lagDias > 0 ? `+${p.lagDias}d` : `${p.lagDias}d`) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sucesores */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Sucesores / Actividades que dependen de esta ({selectedTask.sucesores.length})
              </h4>
              {selectedTask.sucesores.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tiene sucesores directos (Fin de cadena)</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedTask.sucesores.map((s, idx) => {
                    const succTask = tasks.find(t => t.idConsec === s.idConsec);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="truncate mr-2">
                          <span className="font-mono font-bold text-purple-600">#{s.idConsec}</span>
                          <span className="text-slate-700 ml-1.5 font-medium">{succTask?.nombre || 'Tarea sucesora'}</span>
                        </div>
                        <span className="text-[11px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                          {s.tipo}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
