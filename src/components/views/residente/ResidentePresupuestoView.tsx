import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Upload, 
  Search, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  DollarSign, 
  AlertCircle, 
  FileSpreadsheet, 
  Check, 
  CloudUpload,
  Layers,
  Calendar,
  User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BudgetService, BudgetItem, BudgetComment, BudgetChapterSummary } from '../../../services/budgetParser';
import { AuthService } from '../../../services/authService';

export const ResidentePresupuestoView: React.FC = () => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [comentarios, setComentarios] = useState<BudgetComment[]>([]);
  const [activeTab, setActiveTab] = useState<'estructura' | 'comentarios'>('estructura');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCapitulos, setExpandedCapitulos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Modal Comentario
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedCodigoCosto, setSelectedCodigoCosto] = useState('01000000');
  const [selectedCapituloDesc, setSelectedCapituloDesc] = useState('PRELIMINARES');
  const [tipoObs, setTipoObs] = useState<BudgetComment['tipoObservacion']>('Mayor Cantidad');
  const [cuentaContable, setCuentaContable] = useState('');
  const [textoComentario, setTextoComentario] = useState('');
  const [impactoCOP, setImpactoCOP] = useState('');

  // Carga inicial de datos de muestra
  useEffect(() => {
    // Generar estructura básica inicial inspirada en PIETRA E1
    const mockItems: BudgetItem[] = [
      { codigoCosto: '01000000', nd: 4, descripcion: 'PRELIMINARES', unidad: 'UN', cantidad: 1, valorUnitario: 17636670, valorTotal: 17636670 },
      { codigoCosto: '01001000', nd: 5, descripcion: 'LOCALIZACION Y REPLANTEO', unidad: 'UN', cantidad: 1, valorUnitario: 17636670, valorTotal: 17636670 },
      { codigoCosto: '01001001.1002', nd: 10, descripcion: 'PREL COMISION TOPOGRAFICA', tipo: 'T.C', unidad: 'UN', cantidad: 30, valorUnitario: 587889, valorTotal: 17636670 },

      { codigoCosto: '02000000', nd: 4, descripcion: 'CIMENTACION', unidad: 'UN', cantidad: 1, valorUnitario: 467675768, valorTotal: 467675768 },
      { codigoCosto: '02001000', nd: 5, descripcion: 'EXCAVACIONES Y RELLENOS', unidad: 'UN', cantidad: 1, valorUnitario: 17092861, valorTotal: 17092861 },
      { codigoCosto: '02001006.1001', nd: 10, descripcion: 'CIM RELLENOS MATERIAL SELECCIONADO', tipo: 'M.O', unidad: 'M3', cantidad: 160.58, valorUnitario: 105302, valorTotal: 16909396 },
      { codigoCosto: '02002000', nd: 5, descripcion: 'CIMENTACION SUPERFICIAL', unidad: 'UN', cantidad: 1, valorUnitario: 415020548, valorTotal: 415020548 },
      { codigoCosto: '02002003.1001', nd: 10, descripcion: 'CIM SOLADO LOSA CIMENTACION', tipo: 'M.O', unidad: 'M2', cantidad: 455.36, valorUnitario: 27775, valorTotal: 12647706 },

      { codigoCosto: '03000000', nd: 4, descripcion: 'ESTRUCTURA', unidad: 'UN', cantidad: 1, valorUnitario: 2854900000, valorTotal: 2854900000 },
      { codigoCosto: '03001000', nd: 5, descripcion: 'MUROS Y PANTALLAS EN CONCRETO', unidad: 'UN', cantidad: 1, valorUnitario: 1650000000, valorTotal: 1650000000 },
      { codigoCosto: '03002000', nd: 5, descripcion: 'LOSAS DE ENTREPISO', unidad: 'UN', cantidad: 1, valorUnitario: 1204900000, valorTotal: 1204900000 },

      { codigoCosto: '04000000', nd: 4, descripcion: 'MAMPOSTERIA Y DIVISIONES', unidad: 'UN', cantidad: 1, valorUnitario: 450000000, valorTotal: 450000000 },
      { codigoCosto: '05000000', nd: 4, descripcion: 'INSTALACIONES HIDRAULICAS Y SANITARIAS', unidad: 'UN', cantidad: 1, valorUnitario: 680000000, valorTotal: 680000000 },
      { codigoCosto: '06000000', nd: 4, descripcion: 'INSTALACIONES ELECTRICAS', unidad: 'UN', cantidad: 1, valorUnitario: 590000000, valorTotal: 590000000 },
      { codigoCosto: '07000000', nd: 4, descripcion: 'ACABADOS Y ENCHAPES', unidad: 'UN', cantidad: 1, valorUnitario: 1450000000, valorTotal: 1450000000 },
    ];

    setItems(mockItems);
    setComentarios(BudgetService.getComentarios());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const parsedItems = BudgetService.parseBudgetWorkbook(wb);
        if (parsedItems.length > 0) {
          setItems(parsedItems);
          alert(`Presupuesto importado con éxito: ${parsedItems.length} registros cargados.`);
        } else {
          alert('No se encontraron registros de presupuesto en la hoja. Verifica el formato Opus.');
        }
      } catch (err) {
        console.error('Error cargando presupuesto:', err);
        alert('Error al leer el archivo de presupuesto.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleCapitulo = (codigo: string) => {
    const next = new Set(expandedCapitulos);
    if (next.has(codigo)) next.delete(codigo);
    else next.add(codigo);
    setExpandedCapitulos(next);
  };

  const handleGuardarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoComentario) return;

    const current = AuthService.getCurrentUser();
    BudgetService.agregarComentario({
      codigoCosto: selectedCodigoCosto,
      capituloDescripcion: selectedCapituloDesc,
      usuarioResidente: current.nombre,
      tipoObservacion: tipoObs,
      cuentaContable: cuentaContable || undefined,
      comentario: textoComentario,
      impactoEstimadoCOP: impactoCOP ? parseFloat(impactoCOP) : undefined,
    });

    setComentarios(BudgetService.getComentarios());
    setShowCommentModal(false);
    setTextoComentario('');
    setCuentaContable('');
    setImpactoCOP('');
    setActiveTab('comentarios');
  };

  // KPIs
  const capitulos = items.filter(i => i.nd === 4);
  const totalPresupuesto = capitulos.reduce((acc, c) => acc + c.valorTotal, 0);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Seguimiento Presupuestal & Costos</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Opus ND 4 / 5 / 10
                </span>
              </div>
              <p className="text-sm text-slate-500">Mapeo de capítulos de costo con programación y registro de comentarios técnicos de campo</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Cargando...' : 'Cargar Presupuesto (.xlsx)'}</span>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={loading}
            />
          </label>

          <button
            onClick={() => {
              setSyncStatus('syncing');
              setTimeout(() => {
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 3000);
              }, 1200);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all"
          >
            <CloudUpload className="w-4 h-4 text-slate-600" />
            <span>{syncStatus === 'syncing' ? 'Enviando...' : syncStatus === 'synced' ? 'Sincronizado a SharePoint' : 'Sincronizar a SharePoint'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Presupuesto Base (COP)</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCOP(totalPresupuesto)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{capitulos.length} Capítulos mayores consolidados</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Capítulos Generales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{capitulos.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Nivel de Desglose 4</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Ítems & APUs</span>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{items.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Actividades de mano de obra y equipo</div>
        </div>

        <div 
          onClick={() => setActiveTab('comentarios')}
          className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm cursor-pointer hover:bg-amber-50 transition-all"
        >
          <span className="text-xs font-bold text-amber-800 uppercase">Observaciones de Campo</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{comentarios.length}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Desviaciones y notas registradas</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('estructura')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'estructura'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Estructura de Capítulos Opus ({capitulos.length})
        </button>

        <button
          onClick={() => setActiveTab('comentarios')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'comentarios'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Libreta de Comentarios y Desviaciones ({comentarios.length})
        </button>
      </div>

      {/* TAB 1: ESTRUCTURA OPUS */}
      {activeTab === 'estructura' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {capitulos.map(cap => {
                const isExpanded = expandedCapitulos.has(cap.codigoCosto);
                const subcapitulos = items.filter(i => i.nd === 5 && i.codigoCosto.startsWith(cap.codigoCosto.substring(0, 2)));
                const incidencia = totalPresupuesto > 0 ? ((cap.valorTotal / totalPresupuesto) * 100).toFixed(1) : '0';
                const capComentarios = comentarios.filter(c => c.codigoCosto === cap.codigoCosto);

                return (
                  <div key={cap.codigoCosto} className="transition-colors">
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCapitulo(cap.codigoCosto)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {cap.codigoCosto}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{cap.descripcion}</span>
                            {capComentarios.length > 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5" />
                                {capComentarios.length} notas
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {subcapitulos.length} subcapítulos desglosados
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-slate-900">{formatCOP(cap.valorTotal)}</div>
                          <div className="text-xs text-slate-400">{incidencia}% del presupuesto</div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCodigoCosto(cap.codigoCosto);
                            setSelectedCapituloDesc(cap.descripcion);
                            setShowCommentModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Nota Campo
                        </button>
                      </div>
                    </div>

                    {/* Subcapitulos Desglosados */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 p-4 border-t border-slate-100 space-y-2 pl-12">
                        {subcapitulos.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No hay subcapítulos registrados</div>
                        ) : (
                          subcapitulos.map(sub => (
                            <div key={sub.codigoCosto} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 font-semibold">{sub.codigoCosto}</span>
                                <span className="font-semibold text-slate-800">{sub.descripcion}</span>
                              </div>
                              <div className="font-bold text-slate-900">{formatCOP(sub.valorTotal)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIBRETA DE COMENTARIOS */}
      {activeTab === 'comentarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Historial de Observaciones Técnicas Registradas en Campo</h3>
            <button
              onClick={() => setShowCommentModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Observación
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comentarios.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700">{c.codigoCosto}</span>
                    <h4 className="text-sm font-bold text-slate-900">{c.capituloDescripcion}</h4>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    c.tipoObservacion === 'Reproceso'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : c.tipoObservacion === 'Mayor Cantidad'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {c.tipoObservacion}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                  "{c.comentario}"
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.usuarioResidente}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(c.fecha).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>

                {c.impactoEstimadoCOP !== undefined && c.impactoEstimadoCOP > 0 && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                    <span>Impacto Estimado en Costo:</span>
                    <span>{formatCOP(c.impactoEstimadoCOP)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL COMENTARIO */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Registrar Observación de Costo en Campo</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedCapituloDesc} ({selectedCodigoCosto})</p>

            <form onSubmit={handleGuardarComentario} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Observación *</label>
                <select
                  value={tipoObs}
                  onChange={e => setTipoObs(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Mayor Cantidad">Mayor Cantidad Ejecutada</option>
                  <option value="Obra Adicional">Obra Adicional No Prevista</option>
                  <option value="Reproceso">Reproceso / Reparación</option>
                  <option value="Ahorro">Ahorro / Optimización</option>
                  <option value="Nota Técnica">Nota Técnica de Interventoría</option>
                </select>
              </div>

              {tipoObs === 'Reproceso' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cuenta Contable (ej: 23090001)</label>
                  <input
                    type="text"
                    placeholder="23090001"
                    value={cuentaContable}
                    onChange={e => setCuentaContable(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Impacto Estimado en Costo (COP)</label>
                <input
                  type="number"
                  placeholder="Ej: 15000000"
                  value={impactoCOP}
                  onChange={e => setImpactoCOP(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalle de la Observación *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe la causa técnica, ubicación exacta en obra o justificación del cambio..."
                  value={textoComentario}
                  onChange={e => setTextoComentario(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Observación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
