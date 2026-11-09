import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Plus, 
  Calendar, 
  Building2, 
  Clock, 
  AlertTriangle, 
  Check, 
  CloudUpload,
  User,
  Zap
} from 'lucide-react';
import { AuthService } from '../../../services/authService';

export interface FieldProductivityLog {
  id: string;
  fecha: string;
  contratista: string;
  frente: string;
  actividad: string;
  personalActivo: number;
  unidadesEjecutadas: number;
  unidadesMeta: number;
  horasPerdidas: number;
  causaParada?: 'Lluvia' | 'Falta de Material' | 'Espera Concreto' | 'Reproceso' | 'Falta de Planos' | 'Ninguna';
  observaciones?: string;
  usuarioRegistro: string;
}

const STORAGE_PRODUCTIVIDAD_FIELD_KEY = 'interventor_productividad_field_v1';

export const ResidenteProductividadView: React.FC = () => {
  const [logs, setLogs] = useState<FieldProductivityLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Formulario
  const [contratista, setContratista] = useState('Estructuras del Valle S.A.S.');
  const [frente, setFrente] = useState('Torre 1');
  const [actividad, setActividad] = useState('Encofrado y Vaciado de Muros');
  const [personalActivo, setPersonalActivo] = useState(14);
  const [unidadesEjecutadas, setUnidadesEjecutadas] = useState(2);
  const [unidadesMeta, setUnidadesMeta] = useState(2);
  const [horasPerdidas, setHorasPerdidas] = useState(0);
  const [causaParada, setCausaParada] = useState<FieldProductivityLog['causaParada']>('Ninguna');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTIVIDAD_FIELD_KEY);
      if (saved) {
        setLogs(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const iniciales: FieldProductivityLog[] = [
      {
        id: 'prod-01',
        fecha: '2026-11-09T08:00:00Z',
        contratista: 'Estructuras del Valle S.A.S.',
        frente: 'Torre 1',
        actividad: 'Encofrado y Vaciado de Muros Piso 3',
        personalActivo: 16,
        unidadesEjecutadas: 2,
        unidadesMeta: 2,
        horasPerdidas: 0,
        causaParada: 'Ninguna',
        observaciones: 'Jornada normal, ritmo de 1 apartamento por día cumplido.',
        usuarioRegistro: 'Carlos Mario Gómez',
      },
      {
        id: 'prod-02',
        fecha: '2026-11-08T08:00:00Z',
        contratista: 'Mampostería San Juan',
        frente: 'Torre 2',
        actividad: 'Pega de Bloque Arcilla Piso 2',
        personalActivo: 8,
        unidadesEjecutadas: 1,
        unidadesMeta: 2,
        horasPerdidas: 3.5,
        causaParada: 'Lluvia',
        observaciones: 'Lluvia torrencial de 11:30 a 14:00 impidió transporte vertical de ladrillo.',
        usuarioRegistro: 'Carlos Mario Gómez',
      },
    ];
    setLogs(iniciales);
    localStorage.setItem(STORAGE_PRODUCTIVIDAD_FIELD_KEY, JSON.stringify(iniciales));
  }, []);

  const handleGuardarLog = (e: React.FormEvent) => {
    e.preventDefault();
    const current = AuthService.getCurrentUser();
    const nuevo: FieldProductivityLog = {
      id: `prod-${Date.now()}`,
      fecha: new Date().toISOString(),
      contratista,
      frente,
      actividad,
      personalActivo,
      unidadesEjecutadas,
      unidadesMeta,
      horasPerdidas,
      causaParada,
      observaciones,
      usuarioRegistro: current.nombre,
    };

    const actualizados = [nuevo, ...logs];
    setLogs(actualizados);
    localStorage.setItem(STORAGE_PRODUCTIVIDAD_FIELD_KEY, JSON.stringify(actualizados));
    setObservaciones('');
    setHorasPerdidas(0);
    setCausaParada('Ninguna');
  };

  const totalPersonal = logs.reduce((acc, l) => acc + l.personalActivo, 0);
  const totalHorasPerdidas = logs.reduce((acc, l) => acc + l.horasPerdidas, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Censo Diario de Cuadrillas & Productividad</h1>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Control Diario en Sitio
                </span>
              </div>
              <p className="text-sm text-slate-500">Conteo de personal activo por contratista, avance de unidades físicas y registro de paradas de obra</p>
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
          <span className="text-xs font-semibold text-slate-500 uppercase">Reportes Diarios</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{logs.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Frentes censados</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase">Personal Activo Censado</span>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">{totalPersonal} operarios</div>
          <div className="text-xs text-indigo-600 font-medium mt-0.5">Oficiales y ayudantes en sitio</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase">Horas Perdidas Acumuladas</span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{totalHorasPerdidas} hrs</div>
          <div className="text-xs text-rose-600 font-medium mt-0.5">Impacto en rendimientos</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Contratistas Activos</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {new Set(logs.map(l => l.contratista)).size}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Empresas en obra</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Registrar Censo de Cuadrilla</h3>
          </div>

          <form onSubmit={handleGuardarLog} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contratista *</label>
              <input
                type="text"
                required
                value={contratista}
                onChange={e => setContratista(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Frente de Obra *</label>
                <select
                  value={frente}
                  onChange={e => setFrente(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Torre 1">Torre 1</option>
                  <option value="Torre 2">Torre 2</option>
                  <option value="Torre 4">Torre 4</option>
                  <option value="Torre 7">Torre 7</option>
                  <option value="Urbanismo">Urbanismo</option>
                  <option value="Sótanos">Sótanos y Contención</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Personal Activo (nº) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={personalActivo}
                  onChange={e => setPersonalActivo(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Actividad Principal de la Cuadrilla *</label>
              <input
                type="text"
                required
                value={actividad}
                onChange={e => setActividad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unidades Ejecutadas</label>
                <input
                  type="number"
                  step="0.5"
                  value={unidadesEjecutadas}
                  onChange={e => setUnidadesEjecutadas(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meta Planeada</label>
                <input
                  type="number"
                  step="0.5"
                  value={unidadesMeta}
                  onChange={e => setUnidadesMeta(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Causa de Parada</label>
                <select
                  value={causaParada}
                  onChange={e => setCausaParada(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Ninguna">Ninguna (Normal)</option>
                  <option value="Lluvia">Lluvia / Clima</option>
                  <option value="Falta de Material">Falta de Material</option>
                  <option value="Espera Concreto">Espera Concreto / Bomba</option>
                  <option value="Reproceso">Reproceso / Desmonte</option>
                  <option value="Falta de Planos">Falta de Planos / Aclaración</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Perdidas</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={horasPerdidas}
                  onChange={e => setHorasPerdidas(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Observaciones de Campo</label>
              <textarea
                rows={3}
                placeholder="Novedades de la cuadrilla, rendimiento por operario o compromisos de recuperación..."
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Registrar Censo
              </button>
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Registros de Campo Recientes ({logs.length})</h3>
            <span className="text-xs text-slate-500">Últimos censos ingresados</span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {logs.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {l.contratista}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{l.actividad}</h4>
                    <p className="text-xs text-slate-500">{l.frente}</p>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-800">
                      👥 {l.personalActivo} operarios
                    </span>
                    <div className="text-xs font-semibold text-slate-600 mt-1">
                      Avance: {l.unidadesEjecutadas} / {l.unidadesMeta} unid.
                    </div>
                  </div>
                </div>

                {l.causaParada && l.causaParada !== 'Ninguna' && (
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Parada por {l.causaParada}
                    </div>
                    <span className="font-extrabold">{l.horasPerdidas} hrs perdidas</span>
                  </div>
                )}

                {l.observaciones && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg">
                    "{l.observaciones}"
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>Registrado por: <strong className="text-slate-600">{l.usuarioRegistro}</strong></span>
                  <span>{new Date(l.fecha).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
