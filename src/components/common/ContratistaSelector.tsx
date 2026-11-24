import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronDown, Building2, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import {
  ContratistasService,
  ContratistaAN8,
  OPCION_MARVAL_INGENIERIA,
} from '../../services/contratistasService';

export interface ContratistaSelectorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  includeExtras?: string[];
  disabled?: boolean;
}

/**
 * Selector inteligente de contratistas con autocompletado en tiempo real sobre el
 * catálogo oficial AN8 (18,027+ registros) y la opción corporativa "Marval Ingeniería".
 * Muestra inmediatamente los resultados coincidentes mientras el usuario escribe el AN8 o nombre.
 */
export const ContratistaSelector: React.FC<ContratistaSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Buscar o escribir AN8 / Nombre del contratista...',
  className = '',
  includeExtras = [],
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carga asíncrona en segundo plano del maestro completo de 18,027 contratistas
  useEffect(() => {
    let mounted = true;
    ContratistasService.loadAllContratistas().then(() => {
      if (mounted) setCatalogLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sincronizar texto de búsqueda si cambia el valor externo
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  // Cerrar desplegable al hacer clic fuera del componente
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value || '');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [value]);

  // Búsqueda en tiempo real
  const resultados: ContratistaAN8[] = useMemo(() => {
    const query = isOpen ? searchTerm : '';
    const raw = ContratistasService.searchContratistas(query, 120);
    return raw;
  }, [searchTerm, isOpen, catalogLoaded]);

  const extrasFiltered = useMemo(() => {
    if (!searchTerm.trim()) return includeExtras;
    const q = searchTerm.trim().toLowerCase();
    return includeExtras.filter((e) => e.toLowerCase().includes(q));
  }, [includeExtras, searchTerm]);

  const handleSelect = (itemLabel: string) => {
    onChange(itemLabel);
    setSearchTerm(itemLabel);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Caja de entrada con autocompletado */}
      <div
        className={`relative flex items-center bg-white border rounded-lg shadow-2xs transition ${
          disabled
            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full py-2 px-2.5 text-xs text-slate-800 placeholder:text-slate-400 border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 bg-transparent font-medium"
        />

        <div className="flex items-center gap-1 pr-2 shrink-0">
          {!catalogLoaded && (
            <span title="Cargando base AN8..." className="text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </span>
          )}

          {Boolean(searchTerm || value) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) setIsOpen(!isOpen);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            title={isOpen ? 'Cerrar lista' : 'Abrir lista'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menú flotante de resultados en vivo */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Barra informativa superior */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {searchTerm.trim() ? (
                <>
                  Buscando &quot;<strong>{searchTerm}</strong>&quot;
                </>
              ) : (
                'Catálogo AN8 Oficial (18,027 registros)'
              )}
            </span>
            <span className="font-semibold text-slate-600">
              {resultados.length} opción(es)
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 divide-dotted">
            {/* Opción Corporativa: Marval Ingeniería */}
            {(!searchTerm.trim() ||
              'marval'.includes(searchTerm.toLowerCase()) ||
              'ingenieria'.includes(searchTerm.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelect(OPCION_MARVAL_INGENIERIA.label)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-indigo-50/70 transition ${
                  value === OPCION_MARVAL_INGENIERIA.label ? 'bg-indigo-50 font-bold text-indigo-900' : 'text-slate-800'
                }`}
              >
                <div className="p-1 rounded bg-indigo-100 text-indigo-700 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-indigo-900">
                    🏢 Marval Ingeniería (Gestión Interna)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ejecución directa constructora / Equipo propio
                  </div>
                </div>
                {value === OPCION_MARVAL_INGENIERIA.label && (
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
              </button>
            )}

            {/* Extras del proyecto */}
            {extrasFiltered.map((extra) => (
              <button
                key={`extra-${extra}`}
                type="button"
                onClick={() => handleSelect(extra)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-amber-50/70 transition ${
                  value === extra ? 'bg-amber-50 font-bold text-amber-900' : 'text-slate-800'
                }`}
              >
                <span className="truncate">★ {extra}</span>
                {value === extra && <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>
            ))}

            {/* Lista de Contratistas AN8 */}
            {resultados
              .filter((c) => !c.esCorporativo)
              .map((c) => {
                const isSelected = value === c.label;
                const an8Str = String(c.an8);
                return (
                  <button
                    key={an8Str}
                    type="button"
                    onClick={() => handleSelect(c.label)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-blue-50/60 transition ${
                      isSelected ? 'bg-blue-50 font-bold text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold shrink-0">
                        AN8: {an8Str}
                      </span>
                      <span className="truncate text-xs font-semibold text-slate-900" title={c.nombre}>
                        {c.nombre}
                      </span>
                    </div>
                    {isSelected && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}

            {resultados.length === 0 && extrasFiltered.length === 0 && (
              <div className="p-4 text-center text-slate-500 space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-amber-500" />
                <p className="font-semibold text-slate-700">No se encontraron contratistas</p>
                <p className="text-[11px] text-slate-400">
                  Pruebe escribiendo parte del nombre o los números del código AN8.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
