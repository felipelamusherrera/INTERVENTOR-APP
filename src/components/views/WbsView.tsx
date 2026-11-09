import React, { useState } from 'react';
import { 
  ListTree, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Database
} from 'lucide-react';
import { WbsItem } from '../../types';
import { wbsBelaterraData } from '../../data/mockData';
import { parseScheduleCsv, parseScheduleExcel } from '../../services/wbsParser';
import wbsBelaterraFullData from '../../data/wbsBelaterraFull.json';

export const WbsView: React.FC = () => {
  const [tasks, setTasks] = useState<WbsItem[]>(wbsBelaterraFullData as WbsItem[]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResp, setSelectedResp] = useState('TODOS');
  const [filterOnlyDelays, setFilterOnlyDelays] = useState(false);
  const [filterMilestonesOnly, setFilterMilestonesOnly] = useState(false);
  const [fileName, setFileName] = useState('PI_WORKPLANNER_OCT26.xlsx (2,980 tareas activas)');

  const uniqueResponsables = Array.from(new Set(tasks.map(t => t.responsable).filter(Boolean)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          const parsed = parseScheduleExcel(arrayBuffer);
          if (parsed.tasks.length > 0) {
            setTasks(parsed.tasks);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const parsed = parseScheduleCsv(content);
          if (parsed.tasks.length > 0) {
            setTasks(parsed.tasks);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const loadSampleDataset = (type: 'full' | 'summary') => {
    if (type === 'full') {
      setTasks(wbsBelaterraFullData as WbsItem[]);
      setFileName('PI_WORKPLANNER_OCT26.xlsx (2,980 tareas activas)');
    } else {
      setTasks(wbsBelaterraData);
      setFileName('Plantilla Resumida Belaterra (125 hitos/capítulos)');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.edt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResp = selectedResp === 'TODOS' || t.responsable === selectedResp;
    const matchesDelay = !filterOnlyDelays || t.varFin > 0;
    const matchesHito = !filterMilestonesOnly || t.esHito;
    return matchesSearch && matchesResp && matchesDelay && matchesHito;
  });

  const totalDelays = tasks.filter(t => t.varFin > 0).length;
  const milestonesCount = tasks.filter(t => t.esHito).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ListTree className="w-4 h-4" />
            <span>Módulo 03 · WBS Explorer & Ingesta Automática</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Estructura de Desglose de Trabajo (EDT / WBS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <strong>Principio Rector: Cero digitación manual.</strong> Ingesta directa de archivos exportados de WorkPlanner / Primavera con análisis jerárquico y cálculo de varianzas por frente.
          </p>
        </div>

        {/* Upload & Dataset selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => loadSampleDataset('full')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                fileName.includes('PI_WORKPLANNER')
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PI_WORKPLANNER (2,980)
            </button>
            <button
              onClick={() => loadSampleDataset('summary')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                !fileName.includes('PI_WORKPLANNER')
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumido (125)
            </button>
          </div>

          <label className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer shadow transition">
            <Upload className="w-4 h-4" />
            <span>Cargar Excel / CSV</span>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* Filter and stats toolbar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por EDT o actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 md:w-64 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedResp}
              onChange={(e) => setSelectedResp(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[180px]"
            >
              <option value="TODOS">Todos los Responsables</option>
              {uniqueResponsables.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilterOnlyDelays(!filterOnlyDelays)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition ${
              filterOnlyDelays 
                ? 'bg-red-50 border-red-300 text-red-700 font-bold' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solo con atraso ({totalDelays})
          </button>

          <button
            onClick={() => setFilterMilestonesOnly(!filterMilestonesOnly)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition ${
              filterMilestonesOnly 
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solo Hitos ({milestonesCount})
          </button>
        </div>

        <div className="flex items-center space-x-2 text-slate-500">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">{fileName}</span>
          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 tabular-nums">
            {filteredTasks.length} tareas
          </span>
        </div>
      </div>

      {/* WBS Tree Table */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Código EDT</th>
                <th className="py-2.5 px-3">Nivel</th>
                <th className="py-2.5 px-3 min-w-[280px]">Nombre de Actividad</th>
                <th className="py-2.5 px-2">Tipo</th>
                <th className="py-2.5 px-2 text-center">Avance (W)</th>
                <th className="py-2.5 px-2">Comienzo Plan</th>
                <th className="py-2.5 px-2">Fin Plan</th>
                <th className="py-2.5 px-2">Comienzo Real</th>
                <th className="py-2.5 px-2">Fin Real</th>
                <th className="py-2.5 px-2 text-center">VarFin (Días)</th>
                <th className="py-2.5 px-3">Responsable OBS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums font-mono text-[11px]">
              {filteredTasks.map((t, idx) => {
                const indent = Math.max(0, (t.nivel - 2) * 16);
                const isProject = t.tipo === 'project';
                const isMilestone = t.esHito;
                const isDelayed = t.varFin > 0;

                return (
                  <tr 
                    key={`${t.edt}-${idx}`}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      isProject ? 'bg-slate-50/70 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-500 font-medium">
                      {t.edt}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.nivel === 2 ? 'bg-indigo-100 text-indigo-800' :
                        t.nivel === 3 ? 'bg-blue-100 text-blue-800' :
                        t.nivel === 4 ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        N{t.nivel}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <div style={{ paddingLeft: `${indent}px` }} className="flex items-center space-x-1.5">
                        {isMilestone ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Hito"></span>
                        ) : isProject ? (
                          <Layers className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                        )}
                        <span className={`truncate ${isProject ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                          {t.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-500 font-sans text-[10px]">
                      {t.tipo}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${t.w >= 1 ? 'bg-emerald-500' : t.w > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                            style={{ width: `${Math.min(100, t.w * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700 text-[10px]">
                          {(t.w * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-600">{t.comienPrev}</td>
                    <td className="py-2 px-2 text-slate-600">{t.finPrev}</td>
                    <td className="py-2 px-2 text-slate-600">{t.comien || '-'}</td>
                    <td className="py-2 px-2 text-slate-600">{t.fin || '-'}</td>
                    <td className="py-2 px-2 text-center font-bold">
                      {isDelayed ? (
                        <span className="text-red-600 font-extrabold">+{t.varFin}d</span>
                      ) : t.varFin < 0 ? (
                        <span className="text-emerald-600">{t.varFin}d</span>
                      ) : (
                        <span className="text-slate-400">0d</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-sans font-medium">
                      {t.responsable || <span className="text-slate-300 italic">No asignado</span>}
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
