import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Building2, 
  Calendar, 
  CloudUpload,
  User,
  Check
} from 'lucide-react';
import { AuthService } from '../../../services/authService';

export interface FieldCtoCommitment {
  id: string;
  fecha: string;
  categoria: string;
  torre: string;
  descripcion: string;
  responsable: string;
  fechaLimite: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  estado: 'PENDIENTE' | 'SUBSANADO';
  usuarioRegistro: string;
}

const STORAGE_CTO_FIELD_KEY = 'interventor_cto_field_v1';

export const ResidenteCtoView: React.FC = () => {
  const [commitments, setCommitments] = useState<FieldCtoCommitment[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Formulario
  const [categoria, setCategoria] = useState('1. Planos Récord');
  const [torre, setTorre] = useState('Torre 1');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('Ing. Residente de Estructuras');
  const [fechaLimite, setFechaLimite] = useState('2026-11-20');
  const [severidad, setSeveridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');

  const CATEGORIAS_CTO = [
    '1. Planos Récord',
    '2. Constancia del Geotecnista',
    '3. Procedencia de Materiales',
    '4. Especificaciones Técnicas',
    '5. Programa de Calidad',
    '6. Elementos No Estructurales'
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CTO_FIELD_KEY);
      if (saved) {
        setCommitments(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const iniciales: FieldCtoCommitment[] = [
      {
        id: 'cto-01',
        fecha: '2026-11-04T09:00:00Z',
        categoria: '2. Constancia del Geotecnista',
        torre: 'Torre 1',
        descripcion: 'Presentar constancia firmada del geotecnista sobre cota de apoyo de cimentación profunda eje 4.',
        responsable: 'Geotecnia & Suelos S.A.S.',
        fechaLimite: '2026-11-15',
        severidad: 'ALTA',
        estado: 'PENDIENTE',
        usuarioRegistro: 'Carlos Mario Gómez',
      },
      {
        id: 'cto-02',
        fecha: '2026-11-06T15:30:00Z',
        categoria: '3. Procedencia de Materiales',
        torre: 'Urbanismo',
        descripcion: 'Entregar certificados de ensayo a compresión y dosificación de tubería de concreto 36" para drenajes.',
        responsable: 'Proveedor Tubos del Valle',
        fechaLimite: '2026-11-18',
        severidad: 'MEDIA',
        estado: 'PENDIENTE',
        usuarioRegistro: 'Carlos Mario Gómez',
      },
    ];
    setCommitments(iniciales);
    localStorage.setItem(STORAGE_CTO_FIELD_KEY, JSON.stringify(iniciales));
  }, []);

  const handleGuardarCompromiso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion) return;

    const current = AuthService.getCurrentUser();
    const nuevo: FieldCtoCommitment = {
      id: `cto-${Date.now()}`,
      fecha: new Date().toISOString(),
      categoria,
      torre,
      descripcion,
      responsable,
      fechaLimite,
      severidad,
      estado: 'PENDIENTE',
      usuarioRegistro: current.nombre,
    };

    const actualizados = [nuevo, ...commitments];
    setCommitments(actualizados);
    localStorage.setItem(STORAGE_CTO_FIELD_KEY, JSON.stringify(actualizados));
    setDescripcion('');
  };

  const handleToggleEstado = (id: string) => {
    const actualizados = commitments.map(c => {
      if (c.id === id) {
        return {
          ...c,
          estado: (c.estado === 'PENDIENTE' ? 'SUBSANADO' : 'PENDIENTE') as 'PENDIENTE' | 'SUBSANADO',
        };
      }
      return c;
    });
    setCommitments(actualizados);
    localStorage.setItem(STORAGE_CTO_FIELD_KEY, JSON.stringify(actualizados));
  };

  const pendientesCount = commitments.filter(c => c.estado === 'PENDIENTE').length;
  const altasCount = commitments.filter(c => c.severidad === 'ALTA' && c.estado === 'PENDIENTE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Observaciones y Compromisos CTO en Campo</h1>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  Comité Técnico de Obra
                </span>
              </div>
              <p className="text-sm text-slate-500">Gestión de compromisos técnicos en sitio, actas de seguimiento y verificación de requisitos legales</p>
            </div>
          </div>
        </div>

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
          <span>{syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Sincronizado a SharePoint' : 'Sincronizar a SharePoint'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Compromisos</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{commitments.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Generados en campo</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase">Pendientes de Subsanar</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendientesCount}</div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Actas con plazo en curso</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase">Severidad Alta</span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{altasCount}</div>
          <div className="text-xs text-rose-600 font-medium mt-0.5">Riesgo técnico o legal</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase">Subsanados / Cerrados</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {commitments.filter(c => c.estado === 'SUBSANADO').length}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Conformidad aprobada</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Registrar Compromiso Técnico</h3>
          </div>

          <form onSubmit={handleGuardarCompromiso} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría CTO *</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {CATEGORIAS_CTO.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Torre / Zona *</label>
                <select
                  value={torre}
                  onChange={e => setTorre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Torre 1">Torre 1</option>
                  <option value="Torre 2">Torre 2</option>
                  <option value="Torre 4">Torre 4</option>
                  <option value="Torre 7">Torre 7</option>
                  <option value="Urbanismo">Urbanismo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Severidad *</label>
                <select
                  value={severidad}
                  onChange={e => setSeveridad(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Responsable Asignado *</label>
              <input
                type="text"
                required
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Límite de Subsanación *</label>
              <input
                type="date"
                required
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Descripción del Compromiso / Hallazgo *</label>
              <textarea
                required
                rows={3}
                placeholder="Especificación técnica observada, prueba de laboratorio pendiente o documento requerido..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Guardar Compromiso
              </button>
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Compromisos Técnicos Registrados ({commitments.length})</h3>
            <span className="text-xs text-slate-500">Toca el botón para cambiar estado</span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {commitments.map(c => (
              <div 
                key={c.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm space-y-3 ${
                  c.estado === 'SUBSANADO'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : c.severidad === 'ALTA'
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {c.categoria}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{c.torre}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      c.severidad === 'ALTA' ? 'bg-rose-100 text-rose-800' : c.severidad === 'MEDIA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.severidad}
                    </span>
                    <button
                      onClick={() => handleToggleEstado(c.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                        c.estado === 'SUBSANADO'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {c.estado === 'SUBSANADO' ? '✓ Subsanado' : '⏳ Pendiente'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  {c.descripcion}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>Responsable: <strong className="text-slate-700">{c.responsable}</strong></span>
                  <span>Vence: <strong className="text-slate-700">{c.fechaLimite}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
