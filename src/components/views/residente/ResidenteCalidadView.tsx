import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Camera, 
  Building2, 
  Filter, 
  Check, 
  CloudUpload,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { AuthService } from '../../../services/authService';

export interface FieldQualityInspection {
  id: string;
  fecha: string;
  actividad: string;
  fase: 'Obra Gris' | 'Obra Blanca';
  torre: string;
  piso: number;
  apto: string;
  resultado: '0' | 'X' | 'R';
  medicionMm: number;
  hallazgo: string;
  contratista: string;
  inspector: string;
  fotoNombre?: string;
}

const STORAGE_CALIDAD_FIELD_KEY = 'interventor_calidad_field_v1';

export const ResidenteCalidadView: React.FC = () => {
  const [inspections, setInspections] = useState<FieldQualityInspection[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Formulario
  const [actividad, setActividad] = useState('Muros y Losas de Concreto');
  const [fase, setFase] = useState<'Obra Gris' | 'Obra Blanca'>('Obra Gris');
  const [torre, setTorre] = useState('Torre 1');
  const [piso, setPiso] = useState(3);
  const [apto, setApto] = useState('Apto 302');
  const [resultado, setResultado] = useState<'0' | 'X' | 'R'>('0');
  const [medicionMm, setMedicionMm] = useState(2);
  const [hallazgo, setHallazgo] = useState('');
  const [contratista, setContratista] = useState('Estructuras del Valle S.A.S.');
  const [fotoNombre, setFotoNombre] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CALIDAD_FIELD_KEY);
      if (saved) {
        setInspections(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const iniciales: FieldQualityInspection[] = [
      {
        id: 'insp-1',
        fecha: '2026-11-09T10:15:00Z',
        actividad: 'Muros y Losas de Concreto',
        fase: 'Obra Gris',
        torre: 'Torre 1',
        piso: 3,
        apto: 'Apto 301',
        resultado: '0',
        medicionMm: 1.5,
        hallazgo: 'Plomo y acabados de superficie conformes según tolerancia NSR-10.',
        contratista: 'Estructuras del Valle S.A.S.',
        inspector: 'Carlos Mario Gómez (Residente)',
      },
      {
        id: 'insp-2',
        fecha: '2026-11-09T11:40:00Z',
        actividad: 'Instalaciones Hidráulicas',
        fase: 'Obra Gris',
        torre: 'Torre 1',
        piso: 3,
        apto: 'Apto 302',
        resultado: 'X',
        medicionMm: 3.0,
        hallazgo: 'Prueba de presión con caída de 2 PSI en 15 min. Se solicita reapriete de unión.',
        contratista: 'Hidrosanitarias de Occidente',
        inspector: 'Carlos Mario Gómez (Residente)',
      },
    ];
    setInspections(iniciales);
    localStorage.setItem(STORAGE_CALIDAD_FIELD_KEY, JSON.stringify(iniciales));
  }, []);

  const handleGuardarInspeccion = (e: React.FormEvent) => {
    e.preventDefault();
    const current = AuthService.getCurrentUser();
    const nueva: FieldQualityInspection = {
      id: `insp-${Date.now()}`,
      fecha: new Date().toISOString(),
      actividad,
      fase,
      torre,
      piso,
      apto,
      resultado,
      medicionMm,
      hallazgo: hallazgo || (resultado === '0' ? 'Inspección conforme a especificaciones.' : 'Hallazgo pendiente de subsanar.'),
      contratista,
      inspector: current.nombre,
      fotoNombre,
    };

    const actualizadas = [nueva, ...inspections];
    setInspections(actualizadas);
    localStorage.setItem(STORAGE_CALIDAD_FIELD_KEY, JSON.stringify(actualizadas));
    setHallazgo('');
    setFotoNombre(undefined);
  };

  const conformes = inspections.filter(i => i.resultado === '0').length;
  const tasaAprobacion = inspections.length > 0 ? Math.round((conformes / inspections.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Sellos de Calidad en Campo</h1>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  Liberación por Apto / Elemento
                </span>
              </div>
              <p className="text-sm text-slate-500">Registro de inspecciones de primera ronda, tolerancias milimétricas y evidencias de no conformidad</p>
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
          <span className="text-xs font-semibold text-slate-500 uppercase">Inspecciones Totales</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inspections.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Registradas en campo</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase">Conformes (Sello 0)</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{conformes}</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">{tasaAprobacion}% de aprobación en 1ª ronda</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase">Hallazgos Menores (Sello X)</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {inspections.filter(i => i.resultado === 'X').length}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Requieren ajuste antes de entrega</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase">Rechazados / Reprocesos (R)</span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {inspections.filter(i => i.resultado === 'R').length}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-0.5">Demolición o rehacer trabajo</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Inspección */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Nueva Inspección en Sitio</h3>
          </div>

          <form onSubmit={handleGuardarInspeccion} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Actividad de Calidad *</label>
              <select
                value={actividad}
                onChange={e => setActividad(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Muros y Losas de Concreto">Muros y Losas de Concreto</option>
                <option value="Instalaciones Hidráulicas">Instalaciones Hidráulicas y Sanitarias</option>
                <option value="Instalaciones Eléctricas">Instalaciones Eléctricas</option>
                <option value="Mampostería y Pañetes">Mampostería y Pañetes</option>
                <option value="Enchape Cerámico y Baños">Enchape Cerámico y Baños</option>
                <option value="Pintura y Estuco">Pintura y Estuco</option>
                <option value="Carpintería Madera y Aluminios">Carpintería Madera y Aluminios</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fase *</label>
                <select
                  value={fase}
                  onChange={e => setFase(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Obra Gris">Obra Gris</option>
                  <option value="Obra Blanca">Obra Blanca</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Torre *</label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Piso *</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={piso}
                  onChange={e => setPiso(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Apto / Unidad *</label>
                <input
                  type="text"
                  placeholder="Ej: Apto 302"
                  value={apto}
                  onChange={e => setApto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Selector de Sello */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Resultado del Sello de Calidad *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResultado('0')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    resultado === '0'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <div className="text-sm font-extrabold">0</div>
                  <div className="text-[10px] mt-0.5">Excelente</div>
                </button>

                <button
                  type="button"
                  onClick={() => setResultado('X')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    resultado === 'X'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <div className="text-sm font-extrabold">X</div>
                  <div className="text-[10px] mt-0.5">Hallazgo</div>
                </button>

                <button
                  type="button"
                  onClick={() => setResultado('R')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    resultado === 'R'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <div className="text-sm font-extrabold">R</div>
                  <div className="text-[10px] mt-0.5">Rechazado</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medición (mm) / Desplome</label>
                <input
                  type="number"
                  step="0.5"
                  value={medicionMm}
                  onChange={e => setMedicionMm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contratista *</label>
                <input
                  type="text"
                  value={contratista}
                  onChange={e => setContratista(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Detalle del Hallazgo / Nota</label>
              <textarea
                rows={3}
                placeholder="Descripción del estado físico o especificación verificada..."
                value={hallazgo}
                onChange={e => setHallazgo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Guardar Inspección en Campo
              </button>
            </div>
          </form>
        </div>

        {/* Listado de Inspecciones Recientes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Inspecciones Registradas en este Turno ({inspections.length})</h3>
            <span className="text-xs text-slate-500">Orden cronológico descendente</span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {inspections.map(item => (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl border p-4 shadow-sm space-y-2.5 ${
                  item.resultado === 'R'
                    ? 'border-rose-200 bg-rose-50/20'
                    : item.resultado === 'X'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                      item.resultado === '0'
                        ? 'bg-emerald-600 text-white'
                        : item.resultado === 'X'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {item.resultado}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.actividad}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.torre} • Piso {item.piso} • {item.apto} ({item.fase})
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {item.medicionMm} mm
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  {item.hallazgo}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>Contratista: <strong className="text-slate-600">{item.contratista}</strong></span>
                  <span>{new Date(item.fecha).toLocaleDateString('es-CO')} • {item.inspector}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
