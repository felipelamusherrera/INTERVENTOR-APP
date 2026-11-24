import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Flame,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  User,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { WbsItem } from '../../../types';
import { WbsAssignmentsState, ScheduleService } from '../../../services/scheduleService';
import { BaselineRecord } from '../../../services/baselineService';
import {
  WBS_HITOS_MACRO_OPTIONS,
  getHitoMacroDisplayLabel,
} from '../../../services/macroMilestoneService';

// ==========================================
// Definición de columnas (Workplanner -> Módulo WBS)
// ==========================================
type ColType = 'text' | 'number' | 'percent' | 'date';

type ColKey =
  | 'edt'
  | 'nivel'
  | 'nombre'
  | 'w'
  | 'duraPrev'
  | 'comienPrev'
  | 'finPrev'
  | 'comien'
  | 'fin'
  | 'varComien'
  | 'varFin'
  | 'idConsec'
  | 'predecesora'
  | 'agrupacion'
  | 'codigoPlaneacion'
  | 'etapa'
  | 'tipo'
  | 'hitoMacro'
  | 'contratista';

interface ColumnDef {
  key: ColKey;
  label: string;
  source: string; // Nombre original de la columna en el Workplanner
  type: ColType;
  minWidth?: number;
}

export const WBS_COLUMNS: ColumnDef[] = [
  { key: 'edt', label: 'CÓDIGO EDT', source: 'EDT', type: 'text', minWidth: 145 },
  { key: 'nombre', label: 'NOMBRE ACTIVIDAD', source: 'Nombre', type: 'text', minWidth: 320 },
  { key: 'nivel', label: 'NIVEL DETALLE', source: 'NivelEsquema', type: 'number', minWidth: 165 },
  { key: 'w', label: 'AVANCE %', source: 'W', type: 'percent', minWidth: 140 },
  { key: 'duraPrev', label: 'DURACIÓN PREVISTA', source: 'DuraPrev', type: 'number', minWidth: 195 },
  { key: 'comienPrev', label: 'INICIO LÍNEA BASE', source: 'ComienPrev', type: 'date', minWidth: 195 },
  { key: 'finPrev', label: 'FIN LÍNEA BASE', source: 'FinPrev', type: 'date', minWidth: 175 },
  { key: 'comien', label: 'INICIO PROYECTADO', source: 'Comien', type: 'date', minWidth: 195 },
  { key: 'fin', label: 'FIN PROYECTADO', source: 'Fin', type: 'date', minWidth: 175 },
  { key: 'varComien', label: 'VARIACIÓN INICIO', source: 'VarComien', type: 'number', minWidth: 185 },
  { key: 'varFin', label: 'VARIACIÓN FIN', source: 'VarFin', type: 'number', minWidth: 165 },
  { key: 'idConsec', label: 'ID ACTIVIDAD', source: 'idConsec', type: 'text', minWidth: 160 },
  { key: 'predecesora', label: 'ID ACT PREDECESORA', source: 'predecesora', type: 'text', minWidth: 205 },
  { key: 'agrupacion', label: 'FRENTE', source: 'agrupacion', type: 'text', minWidth: 145 },
  { key: 'codigoPlaneacion', label: 'CÓDIGO CPC', source: 'codigoPlaneacion', type: 'text', minWidth: 155 },
  { key: 'etapa', label: 'ETAPA', source: 'Etapa', type: 'text', minWidth: 135 },
  { key: 'tipo', label: 'TIPO', source: 'type', type: 'text', minWidth: 125 },
  { key: 'hitoMacro', label: 'PUNTO DE CONTROL', source: 'Asignación Interventoría', type: 'text', minWidth: 235 },
  { key: 'contratista', label: 'CONTRATISTA', source: 'AN8 / Bitácora', type: 'text', minWidth: 210 },
];

function computeDynamicColumnWidth(col: ColumnDef): number {
  return Math.max(col.minWidth || 120, Math.ceil(col.label.length * 8.5) + 64);
}

const TYPE_LABEL: Record<ColType, string> = {
  text: 'Texto',
  number: 'Número',
  percent: 'Porcentaje',
  date: 'Fecha',
};

interface ColumnFilter {
  text?: string;
  values?: string[]; // undefined = todos los valores
  min?: string;
  max?: string;
  from?: string;
  to?: string;
}

interface SortState {
  key: ColKey;
  dir: 'asc' | 'desc';
}

const EMPTY_LABEL = '(Vacías)';
const PAGE_SIZE = 100;

function isFilterActive(f?: ColumnFilter): boolean {
  if (!f) return false;
  return Boolean(f.text || f.values || f.min || f.max || f.from || f.to);
}

function formatDateDisplay(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function sortLabels(type: ColType): { asc: string; desc: string } {
  if (type === 'date') return { asc: 'Más antigua → Más reciente', desc: 'Más reciente → Más antigua' };
  if (type === 'number' || type === 'percent') return { asc: 'Menor → Mayor', desc: 'Mayor → Menor' };
  return { asc: 'Ordenar A → Z', desc: 'Ordenar Z → A' };
}

interface WbsMatrizTableProps {
  tasks: WbsItem[];
  assignments: WbsAssignmentsState;
  lbMap: Map<number, BaselineRecord> | null;
  criticalEdtSet: Set<string>;
  resetKey?: string;
  onChangeHito: (row: WbsItem, hito: string) => void;
  onOpenContratista: (row: WbsItem) => void;
}

export const WbsMatrizTable: React.FC<WbsMatrizTableProps> = ({
  tasks,
  assignments,
  lbMap,
  criticalEdtSet,
  resetKey,
  onChangeHito,
  onOpenContratista,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [onlyDelays, setOnlyDelays] = useState(false);
  const [onlyWithHitoMacro, setOnlyWithHitoMacro] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState<Partial<Record<ColKey, ColumnFilter>>>({});
  const [sort, setSort] = useState<SortState | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Ancho dinámico según el largo del título de cada columna (ajustable manualmente)
  const initialWidths = useMemo(() => {
    const m: Partial<Record<ColKey, number>> = {};
    WBS_COLUMNS.forEach((c) => {
      m[c.key] = computeDynamicColumnWidth(c);
    });
    return m as Record<ColKey, number>;
  }, []);

  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(initialWidths);

  const handleResizeStart = (key: ColKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[key] ?? 100;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColWidths((prev) => ({ ...prev, [key]: newWidth }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Popover de filtro por columna (posición fija para no recortarse con el scroll de la tabla)
  const [openFilter, setOpenFilter] = useState<{ key: ColKey; top: number; left: number } | null>(null);
  const [popoverSearch, setPopoverSearch] = useState('');

  // ==========================================
  // Obtención del valor crudo de cada celda
  // ==========================================
  const getRawValue = (t: WbsItem, key: ColKey): string | number => {
    const lb = lbMap?.get(t.idConsec || 0);
    switch (key) {
      case 'edt':
        return t.edt || '';
      case 'nivel':
        return Number(t.nivel) || 0;
      case 'nombre':
        return t.nombre || '';
      case 'w':
        return Math.round((Number(t.w) || 0) * 1000) / 10;
      case 'duraPrev':
        return Number(t.duraPrev) || 0;
      case 'comienPrev':
        return t.comienPrev || lb?.comienzoLineaBase || '';
      case 'finPrev':
        return t.finPrev || lb?.finLineaBase || '';
      case 'comien':
        return t.comien || '';
      case 'fin':
        return t.fin || '';
      case 'varComien':
        return Number.isFinite(Number(t.varComien))
          ? Number(t.varComien)
          : ScheduleService.diffDays(t.comien, t.comienPrev || lb?.comienzoLineaBase);
      case 'varFin':
        return Number.isFinite(Number(t.varFin))
          ? Number(t.varFin)
          : ScheduleService.diffDays(t.fin, t.finPrev || lb?.finLineaBase);
      case 'idConsec':
        return t.idConsec !== undefined && t.idConsec !== null ? String(t.idConsec) : '';
      case 'predecesora':
        return t.predecesora || '';
      case 'agrupacion':
        return t.agrupacion || '';
      case 'codigoPlaneacion':
        return t.codigoPlaneacion || '';
      case 'etapa':
        return t.etapa || '';
      case 'tipo':
        return (t.tipo || 'task').toLowerCase();
      case 'hitoMacro': {
        const h = assignments.hitoByEdt[t.edt];
        return getHitoMacroDisplayLabel(h);
      }
      case 'contratista':
        return assignments.contratistaByEdt[t.edt] || t.responsable || '';
      default:
        return '';
    }
  };

  const colByKey = useMemo(() => {
    const map = new Map<ColKey, ColumnDef>();
    WBS_COLUMNS.forEach((c) => map.set(c.key, c));
    return map;
  }, []);

  const activeFilterKeys = useMemo(
    () => (Object.keys(colFilters) as ColKey[]).filter((k) => isFilterActive(colFilters[k])),
    [colFilters]
  );

  const isTreeMode =
    !searchTerm.trim() &&
    !onlyCritical &&
    !onlyDelays &&
    !onlyWithHitoMacro &&
    activeFilterKeys.length === 0 &&
    !sort;

  // Nodos con hijos (para árbol expandible)
  const hasChildrenSet = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.edt && t.edt.includes('.')) {
        const parts = t.edt.split('.');
        for (let i = 1; i < parts.length; i++) {
          set.add(parts.slice(0, i).join('.'));
        }
      }
    });
    return set;
  }, [tasks]);

  // ==========================================
  // Filtrado + Ordenamiento
  // ==========================================
  const processedTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const matchesColumnFilter = (t: WbsItem, key: ColKey, f: ColumnFilter): boolean => {
      const col = colByKey.get(key);
      if (!col) return true;
      const raw = getRawValue(t, key);
      const strVal = raw === '' ? EMPTY_LABEL : String(raw);

      if (f.values && !f.values.includes(strVal)) return false;

      if (col.type === 'text') {
        if (f.text && !String(raw).toLowerCase().includes(f.text.toLowerCase())) return false;
      } else if (col.type === 'number' || col.type === 'percent') {
        const num = Number(raw);
        if (f.min !== undefined && f.min !== '' && !(num >= Number(f.min))) return false;
        if (f.max !== undefined && f.max !== '' && !(num <= Number(f.max))) return false;
      } else if (col.type === 'date') {
        const d = String(raw);
        if (f.from && (!d || d < f.from)) return false;
        if (f.to && (!d || d > f.to)) return false;
      }
      return true;
    };

    let result = tasks.filter((t) => {
      if (term) {
        const cont = assignments.contratistaByEdt[t.edt] || t.responsable || '';
        const haystack = `${t.edt} ${t.nombre} ${cont} ${t.idConsec ?? ''} ${t.codigoPlaneacion || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (onlyCritical && !criticalEdtSet.has(t.edt)) return false;
      if (onlyDelays && Number(getRawValue(t, 'varFin')) <= 0) return false;
      if (onlyWithHitoMacro && !getRawValue(t, 'hitoMacro')) return false;

      for (const key of activeFilterKeys) {
        const f = colFilters[key];
        if (f && !matchesColumnFilter(t, key, f)) return false;
      }

      // Modo filtro combinado: si hay otros filtros/orden activos junto con Nivel X, filtrar exactamente ese nivel
      if (selectedLevelFilter !== null) {
        if (!isTreeMode) {
          if (Number(t.nivel) !== selectedLevelFilter) return false;
        } else if (Number(t.nivel) > selectedLevelFilter) {
          return false;
        }
      }

      // Árbol colapsado (solo cuando no hay filtros ni orden)
      if (isTreeMode && t.edt && t.edt.includes('.')) {
        const parts = t.edt.split('.');
        for (let i = 1; i < parts.length; i++) {
          if (collapsedNodes.has(parts.slice(0, i).join('.'))) return false;
        }
      }
      return true;
    });

    if (sort) {
      const col = colByKey.get(sort.key);
      const factor = sort.dir === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const va = getRawValue(a, sort.key);
        const vb = getRawValue(b, sort.key);
        if (col?.type === 'number' || col?.type === 'percent') {
          return (Number(va) - Number(vb)) * factor;
        }
        if (col?.type === 'date') {
          const sa = String(va);
          const sb = String(vb);
          if (!sa && !sb) return 0;
          if (!sa) return 1; // vacías siempre al final
          if (!sb) return -1;
          return sa.localeCompare(sb) * factor;
        }
        const sa = String(va);
        const sb = String(vb);
        if (!sa && sb) return 1;
        if (sa && !sb) return -1;
        return sa.localeCompare(sb, 'es', { numeric: true, sensitivity: 'base' }) * factor;
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tasks,
    assignments,
    lbMap,
    searchTerm,
    onlyCritical,
    onlyDelays,
    onlyWithHitoMacro,
    selectedLevelFilter,
    colFilters,
    activeFilterKeys,
    sort,
    criticalEdtSet,
    collapsedNodes,
    isTreeMode,
    colByKey,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, onlyCritical, onlyDelays, onlyWithHitoMacro, selectedLevelFilter, colFilters, sort, resetKey]);

  const totalPages = Math.max(1, Math.ceil(processedTasks.length / PAGE_SIZE));
  const pagedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedTasks.slice(start, start + PAGE_SIZE);
  }, [processedTasks, currentPage]);

  // ==========================================
  // Valores únicos para el checklist del popover
  // ==========================================
  const popoverCol = openFilter ? colByKey.get(openFilter.key) : undefined;

  const uniqueValues = useMemo(() => {
    if (!popoverCol || popoverCol.type === 'date') return [] as Array<{ value: string; count: number }>;
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      const raw = getRawValue(t, popoverCol.key);
      const v = raw === '' ? EMPTY_LABEL : String(raw);
      counts.set(v, (counts.get(v) || 0) + 1);
    });
    const arr = Array.from(counts.entries()).map(([value, count]) => ({ value, count }));
    if (popoverCol.type === 'number' || popoverCol.type === 'percent') {
      arr.sort((a, b) => Number(a.value) - Number(b.value));
    } else {
      arr.sort((a, b) => a.value.localeCompare(b.value, 'es', { numeric: true, sensitivity: 'base' }));
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popoverCol, tasks, assignments, lbMap]);

  const visibleUniqueValues = useMemo(() => {
    const q = popoverSearch.trim().toLowerCase();
    const list = q ? uniqueValues.filter((u) => u.value.toLowerCase().includes(q)) : uniqueValues;
    return list.slice(0, 300);
  }, [uniqueValues, popoverSearch]);

  // ==========================================
  // Handlers
  // ==========================================
  const updateColFilter = (key: ColKey, patch: Partial<ColumnFilter>) => {
    setColFilters((prev) => {
      const next = { ...prev, [key]: { ...(prev[key] || {}), ...patch } };
      const merged = next[key]!;
      (Object.keys(merged) as Array<keyof ColumnFilter>).forEach((k) => {
        if (merged[k] === '' || merged[k] === undefined) delete merged[k];
      });
      if (!isFilterActive(merged)) delete next[key];
      return next;
    });
  };

  const clearColFilter = (key: ColKey) => {
    setColFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleCheckValue = (key: ColKey, value: string) => {
    const current = colFilters[key]?.values;
    const all = uniqueValues.map((u) => u.value);
    const base = new Set(current ?? all);
    if (base.has(value)) base.delete(value);
    else base.add(value);
    updateColFilter(key, { values: base.size === all.length ? undefined : Array.from(base) });
  };

  const cycleSort = (key: ColKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const openFilterPopover = (key: ColKey, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = 290;
    const left = Math.max(8, Math.min(rect.left - 10, window.innerWidth - width - 12));
    const top = Math.min(rect.bottom + 6, window.innerHeight - 420);
    setPopoverSearch('');
    setOpenFilter({ key, top: Math.max(8, top), left });
  };

  const handleToggleNode = (edt: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(edt)) next.delete(edt);
      else next.add(edt);
      return next;
    });
  };

  const handleCollapseToLevel = (lvl: number | 'ALL') => {
    if (lvl === 'ALL') {
      setSelectedLevelFilter(null);
      setCollapsedNodes(new Set());
      return;
    }
    setSelectedLevelFilter((prev) => (prev === lvl ? null : lvl));
    const next = new Set<string>();
    tasks.forEach((t) => {
      if (t.nivel >= lvl && hasChildrenSet.has(t.edt)) next.add(t.edt);
    });
    setCollapsedNodes(next);
  };

  const handleClearAll = () => {
    setColFilters({});
    setSort(null);
    setSearchTerm('');
    setOnlyCritical(false);
    setOnlyDelays(false);
    setOnlyWithHitoMacro(false);
    setSelectedLevelFilter(null);
    setCollapsedNodes(new Set());
  };

  const describeFilter = (key: ColKey, f: ColumnFilter): string => {
    const parts: string[] = [];
    if (f.text) parts.push(`contiene "${f.text}"`);
    if (f.values) parts.push(`${f.values.length} valor(es)`);
    if (f.min) parts.push(`≥ ${f.min}`);
    if (f.max) parts.push(`≤ ${f.max}`);
    if (f.from) parts.push(`desde ${formatDateDisplay(f.from)}`);
    if (f.to) parts.push(`hasta ${formatDateDisplay(f.to)}`);
    return `${colByKey.get(key)?.label}: ${parts.join(', ')}`;
  };

  // ==========================================
  // Render de celdas
  // ==========================================
  const renderCell = (t: WbsItem, col: ColumnDef) => {
    const raw = getRawValue(t, col.key);
    const tipoNorm = (t.tipo || 'task').toLowerCase();
    const isProject = tipoNorm === 'project';

    switch (col.key) {
      case 'nombre': {
        const indent = isTreeMode ? Math.max(0, (t.nivel - 2) * 14) : 0;
        const hasChildren = hasChildrenSet.has(t.edt);
        const isCollapsed = collapsedNodes.has(t.edt);
        return (
          <div style={{ paddingLeft: `${indent}px` }} className="flex items-center gap-1.5 font-sans">
            {isTreeMode && hasChildren ? (
              <button
                onClick={() => handleToggleNode(t.edt)}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-600 shrink-0"
                title={isCollapsed ? 'Expandir rama' : 'Contraer rama'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4 inline-block shrink-0" />
            )}
            {criticalEdtSet.has(t.edt) && (
              <span title="Ruta Crítica" className="inline-flex shrink-0">
                <Flame className="w-3 h-3 text-red-600" />
              </span>
            )}
            <span
              className={`truncate min-w-0 flex-1 ${isProject ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}
              title={t.nombre}
            >
              {t.nombre}
            </span>
          </div>
        );
      }
      case 'nivel':
        return (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">{raw}</span>
        );
      case 'w': {
        const pct = Number(raw);
        return (
          <div className="flex items-center gap-1.5 justify-center">
            <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <span className="font-bold text-slate-800">{pct.toFixed(0)}%</span>
          </div>
        );
      }
      case 'varComien':
      case 'varFin': {
        const n = Number(raw);
        return (
          <span
            className={`font-bold ${n > 0 ? 'text-red-600' : n < 0 ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            {n}
          </span>
        );
      }
      case 'tipo':
        return (
          <span
            className={`px-1.5 py-0.5 rounded font-bold text-[10px] font-sans ${
              tipoNorm === 'task'
                ? 'bg-slate-900 text-white'
                : tipoNorm === 'milestone'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {tipoNorm}
          </span>
        );
      case 'hitoMacro': {
        const hitoActual = assignments.hitoByEdt[t.edt] || '';
        return (
          <select
            value={hitoActual}
            onChange={(e) => onChangeHito(t, e.target.value)}
            className={`w-full px-2 py-1 rounded border text-[11px] font-semibold font-sans text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              hitoActual
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <option value="">-- Punto de Control --</option>
            {WBS_HITOS_MACRO_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        );
      }
      case 'contratista': {
        const c = String(raw);
        return (
          <button
            type="button"
            onClick={() => onOpenContratista(t)}
            className={`w-full text-center px-2 py-1 rounded border text-[11px] font-sans flex items-center justify-center gap-1.5 transition ${
              c
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
            title="Clic para asignar o cambiar contratista AN8 / Marval Ingeniería"
          >
            <span className="truncate max-w-[160px]">{c || 'Asignar AN8 / Marval...'}</span>
            <User className="w-3 h-3 shrink-0 opacity-70" />
          </button>
        );
      }
      default:
        if (col.type === 'date') {
          return <span className="text-slate-700 whitespace-nowrap">{formatDateDisplay(String(raw))}</span>;
        }
        if (col.type === 'number') {
          return <span className="text-slate-700">{raw}</span>;
        }
        return (
          <span className="text-slate-700 truncate inline-block max-w-full align-middle" title={String(raw)}>
            {String(raw)}
          </span>
        );
    }
  };

  const cellAlign = (col: ColumnDef) =>
    col.key === 'edt' || col.key === 'nombre' ? 'text-left' : 'text-center';

  const popoverFilter = openFilter ? colFilters[openFilter.key] || {} : {};

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Árbol EDT / Nivel:</span>
            <button
              onClick={() => handleCollapseToLevel('ALL')}
              className={`px-2.5 py-1 rounded font-bold border transition ${
                selectedLevelFilter === null && collapsedNodes.size === 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              Expandir Todo
            </button>
            {[3, 4, 5, 6].map((lv) => (
              <button
                key={lv}
                onClick={() => handleCollapseToLevel(lv)}
                className={`px-2.5 py-1 rounded font-semibold border transition ${
                  selectedLevelFilter === lv
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Nivel {lv}
              </button>
            ))}
            {(!isTreeMode || selectedLevelFilter !== null) && (
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded ml-1">
                {selectedLevelFilter !== null && !isTreeMode
                  ? `Filtros combinados · Nivel ${selectedLevelFilter}`
                  : selectedLevelFilter !== null
                    ? `Árbol hasta Nivel ${selectedLevelFilter}`
                    : 'Vista plana (filtros u orden activos)'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar EDT, nombre, ID, CPC o contratista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 text-xs"
              />
            </div>
            <button
              onClick={() => setOnlyCritical(!onlyCritical)}
              className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                onlyCritical
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Ruta Crítica</span>
            </button>
            <button
              onClick={() => setOnlyDelays(!onlyDelays)}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition ${
                onlyDelays
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Variación Fin &gt; 0
            </button>
            <button
              onClick={() => setOnlyWithHitoMacro(!onlyWithHitoMacro)}
              className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                onlyWithHitoMacro
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Punto de Control</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={isTreeMode && selectedLevelFilter === null && collapsedNodes.size === 0}
              className="px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1 bg-white text-slate-700 border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros y orden</span>
            </button>
          </div>
        </div>

        {/* Chips de filtros / orden activos */}
        {(activeFilterKeys.length > 0 || sort) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            {sort && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-[11px]">
                {sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                Orden: {colByKey.get(sort.key)?.label} (
                {sort.dir === 'asc'
                  ? sortLabels(colByKey.get(sort.key)!.type).asc
                  : sortLabels(colByKey.get(sort.key)!.type).desc}
                )
                <button onClick={() => setSort(null)} className="ml-0.5 hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeFilterKeys.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]"
              >
                <Filter className="w-3 h-3" />
                {describeFilter(k, colFilters[k]!)}
                <button onClick={() => clearColFilter(k)} className="ml-0.5 hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr>
                {WBS_COLUMNS.map((col, colIndex) => {
                  const isSorted = sort?.key === col.key;
                  const filtered = isFilterActive(colFilters[col.key]);
                  const labels = sortLabels(col.type);
                  const isCol0 = colIndex === 0;
                  const isCol1 = colIndex === 1;
                  const col0Width = colWidths['edt'] ?? 120;
                  const w = colWidths[col.key] ?? col.minWidth ?? 100;

                  return (
                    <th
                      key={col.key}
                      style={{
                        width: `${w}px`,
                        minWidth: `${w}px`,
                        maxWidth: `${w}px`,
                        ...(isCol0 ? { left: 0 } : {}),
                        ...(isCol1 ? { left: `${col0Width}px` } : {}),
                      }}
                      className={`sticky top-0 py-2 px-2 align-top select-none group border-b border-slate-300 ${
                        isCol0
                          ? 'left-0 z-30 bg-slate-100'
                          : isCol1
                            ? 'z-30 bg-slate-100 border-r-2 border-slate-300 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]'
                            : 'z-10 bg-slate-100'
                      } ${isSorted || filtered ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1.5 pr-1 min-h-[26px]">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider text-slate-700 leading-tight whitespace-nowrap ${
                            colIndex > 1 ? 'flex-1 text-center' : ''
                          }`}
                          title={col.label}
                        >
                          {col.label}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => cycleSort(col.key)}
                            className={`p-0.5 rounded hover:bg-white ${isSorted ? 'text-indigo-700' : 'text-slate-400'}`}
                            title={
                              !isSorted
                                ? labels.asc
                                : sort?.dir === 'asc'
                                  ? labels.desc
                                  : 'Quitar orden'
                            }
                          >
                            {isSorted ? (
                              sort?.dir === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => openFilterPopover(col.key, e)}
                            className={`p-0.5 rounded hover:bg-white ${
                              filtered ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-slate-400'
                            }`}
                            title={`Filtrar ${col.label}`}
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Agarrador para redimensionar columna arrastrando con el ratón */}
                      <div
                        onMouseDown={(e) => handleResizeStart(col.key, e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-600 transition-colors z-40 select-none"
                        title="Arrastrar para ajustar ancho de columna"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="tabular-nums font-mono text-[11px]">
              {pagedTasks.length === 0 ? (
                <tr>
                  <td colSpan={WBS_COLUMNS.length} className="py-10 text-center text-slate-500 font-sans">
                    No hay actividades que cumplan los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                pagedTasks.map((t, idx) => {
                  const isProject = (t.tipo || '').toLowerCase() === 'project';
                  const col0Width = colWidths['edt'] ?? 120;
                  return (
                    <tr
                      key={`${t.edt}-${t.idConsec}-${idx}`}
                      className={`group hover:bg-blue-50/40 transition-colors ${
                        isProject ? 'bg-slate-50/80 font-bold' : ''
                      }`}
                    >
                      {WBS_COLUMNS.map((col, colIndex) => {
                        const isCol0 = colIndex === 0;
                        const isCol1 = colIndex === 1;
                        const w = colWidths[col.key] ?? col.minWidth ?? 100;
                        return (
                          <td
                            key={col.key}
                            style={{
                              width: `${w}px`,
                              minWidth: `${w}px`,
                              maxWidth: `${w}px`,
                              ...(isCol0 ? { left: 0 } : {}),
                              ...(isCol1 ? { left: `${col0Width}px` } : {}),
                            }}
                            className={`py-1.5 px-2 border-b border-slate-100 ${cellAlign(col)} ${
                              isCol0
                                ? `sticky left-0 z-20 ${
                                    isProject
                                      ? 'bg-slate-100 font-bold'
                                      : 'bg-white group-hover:bg-blue-50'
                                  }`
                                : isCol1
                                  ? `sticky z-20 border-r-2 border-slate-300 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)] ${
                                      isProject
                                        ? 'bg-slate-100 font-bold'
                                        : 'bg-white group-hover:bg-blue-50'
                                    }`
                                  : ''
                            }`}
                          >
                            {renderCell(t, col)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            {processedTasks.length === 0
              ? '0 actividades'
              : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(
                  currentPage * PAGE_SIZE,
                  processedTasks.length
                )} de ${processedTasks.length} actividades (total corte: ${tasks.length})`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-white border border-slate-300 font-bold disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="font-semibold text-slate-600">
                Pág. {currentPage}/{totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-white border border-slate-300 font-bold disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Popover de filtro por columna */}
      {openFilter && popoverCol && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} />
          <div
            className="fixed z-50 w-[290px] bg-white border border-slate-200 rounded-xl shadow-2xl text-xs"
            style={{ top: openFilter.top, left: openFilter.left }}
          >
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900">{popoverCol.label}</div>
                <div className="text-[10px] text-slate-500">
                  Workplanner: {popoverCol.source} · {TYPE_LABEL[popoverCol.type]}
                </div>
              </div>
              <button onClick={() => setOpenFilter(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ordenamiento según tipo de dato */}
            <div className="p-2 border-b border-slate-100 space-y-1">
              {(['asc', 'desc'] as const).map((dir) => {
                const active = sort?.key === popoverCol.key && sort.dir === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => setSort({ key: popoverCol.key, dir })}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg font-semibold transition ${
                      active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    <span>{dir === 'asc' ? sortLabels(popoverCol.type).asc : sortLabels(popoverCol.type).desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 space-y-2.5">
              {/* Texto: contiene */}
              {popoverCol.type === 'text' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contiene el texto</label>
                  <input
                    type="text"
                    value={popoverFilter.text || ''}
                    onChange={(e) => updateColFilter(popoverCol.key, { text: e.target.value })}
                    placeholder="Escriba para filtrar..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Número / %: rango */}
              {(popoverCol.type === 'number' || popoverCol.type === 'percent') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Rango {popoverCol.type === 'percent' ? '(%)' : ''}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={popoverFilter.min || ''}
                      onChange={(e) => updateColFilter(popoverCol.key, { min: e.target.value })}
                      placeholder="Mínimo"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-400">a</span>
                    <input
                      type="number"
                      value={popoverFilter.max || ''}
                      onChange={(e) => updateColFilter(popoverCol.key, { max: e.target.value })}
                      placeholder="Máximo"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Fecha: rango */}
              {popoverCol.type === 'date' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Rango de fechas</label>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500">Desde</span>
                    <input
                      type="date"
                      value={popoverFilter.from || ''}
                      onChange={(e) => updateColFilter(popoverCol.key, { from: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500">Hasta</span>
                    <input
                      type="date"
                      value={popoverFilter.to || ''}
                      onChange={(e) => updateColFilter(popoverCol.key, { to: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Lista de valores (texto y número) */}
              {popoverCol.type !== 'date' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Valores ({uniqueValues.length})
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <button
                        onClick={() => updateColFilter(popoverCol.key, { values: undefined })}
                        className="text-blue-700 hover:underline"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => updateColFilter(popoverCol.key, { values: [] })}
                        className="text-slate-600 hover:underline"
                      >
                        Ninguno
                      </button>
                      {popoverSearch.trim() && (
                        <button
                          onClick={() =>
                            updateColFilter(popoverCol.key, {
                              values: visibleUniqueValues.map((v) => v.value),
                            })
                          }
                          className="text-indigo-700 hover:underline"
                        >
                          Solo visibles
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={popoverSearch}
                    onChange={(e) => setPopoverSearch(e.target.value)}
                    placeholder="Buscar en la lista..."
                    className="w-full px-2 py-1 border border-slate-200 rounded-md text-[11px] mb-1.5"
                  />
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-50">
                    {visibleUniqueValues.map((u) => {
                      const checked = !popoverFilter.values || popoverFilter.values.includes(u.value);
                      const display =
                        popoverCol.type === 'percent' && u.value !== EMPTY_LABEL ? `${u.value}%` : u.value;
                      return (
                        <label
                          key={u.value}
                          className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheckValue(popoverCol.key, u.value)}
                              className="rounded border-slate-300 text-blue-600"
                            />
                            <span className="truncate" title={display}>
                              {display}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{u.count}</span>
                        </label>
                      );
                    })}
                    {uniqueValues.length > visibleUniqueValues.length && (
                      <div className="px-2 py-1 text-[10px] text-slate-400 italic">
                        Mostrando 300 de {uniqueValues.length}. Use la búsqueda para acotar.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  clearColFilter(popoverCol.key);
                  if (sort?.key === popoverCol.key) setSort(null);
                }}
                className="text-[11px] font-bold text-slate-600 hover:text-red-600"
              >
                Limpiar columna
              </button>
              <button
                onClick={() => setOpenFilter(null)}
                className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
