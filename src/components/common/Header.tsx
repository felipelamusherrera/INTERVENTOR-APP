import React from 'react';
import { 
  Building2, 
  Calendar, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Clock, 
  TrendingUp, 
  ListTree, 
  CheckSquare, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { Sucursal } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSucursal: Sucursal;
  setSelectedSucursal: (sucursal: Sucursal) => void;
  selectedProject: string;
  setSelectedProject: (proj: string) => void;
  selectedTower: string;
  setSelectedTower: (tower: string) => void;
  cutoffDate: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedSucursal,
  setSelectedSucursal,
  selectedProject,
  setSelectedProject,
  selectedTower,
  setSelectedTower,
  cutoffDate,
}) => {
  const sucursales: Sucursal[] = ['TODAS', 'BUCARAMANGA', 'BOGOTA', 'CALI', 'BARRANQUILLA', 'CARTAGENA'];

  const navItems = [
    { id: 'resumen', label: '00. Vista Cero', icon: Building2, badge: 'Gerencial' },
    { id: 'tiempo', label: '02. Tiempo & Hitos', icon: Clock, badge: 'I / E' },
    { id: 'wbs', label: '03. WBS Ingesta', icon: ListTree },
    { id: 'bitacora', label: '04. Bitácora Móvil', icon: CheckSquare, badge: '5 Causas' },
    { id: 'lookahead', label: '05. Lookahead', icon: AlertTriangle, badge: '7 Compuertas' },
    { id: 'productividad', label: '06. Productividad', icon: TrendingUp, badge: 'Tesla' },
    { id: 'elevacion', label: '07. Elevación 3D/Pisos', icon: Layers },
    { id: 'calidad', label: '08. Calidad & Sellos', icon: Award, badge: 'Gris / Blanca' },
    { id: 'cto', label: '09. CTO Proyectos', icon: ShieldCheck, badge: 'Ley 1796' },
    { id: 'reporte', label: '01. Ficha Aconex', icon: FileText, badge: 'PDF' },
  ];

  return (
    <header className="bg-white border-b border-surface-border sticky top-0 z-30 shadow-sm no-print">
      {/* Top Level Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-900 via-brand-700 to-blue-600 flex items-center justify-center text-white font-bold shadow-md tracking-wider">
              M
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">MARVAL</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  INTERVENTORÍA Y CONTROL
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  v2.4 Tesla
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Plataforma Integral de Supervisión Técnica y Control de Proyectos
              </p>
            </div>
          </div>

          {/* Context Selectors */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Fecha de Corte:</span>
              <span className="font-semibold text-slate-800 tabular-nums">{cutoffDate}</span>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500 font-medium">Sucursal:</span>
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value as Sucursal)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {sucursales.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500 font-medium">Proyecto:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Belaterra Pietra">Belaterra Pietra (Cali)</option>
                <option value="Belaterra Areia">Belaterra Areia (Cali)</option>
                <option value="Baikal">Baikal (Cali)</option>
                <option value="Santa Clara">Santa Clara (Cali)</option>
                <option value="Verdania">Verdania (Piloto Bogotá)</option>
                <option value="Country Park">Country Park (B/manga)</option>
                <option value="Burdeos">Burdeos (B/quilla)</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500 font-medium">Torre:</span>
              <select
                value={selectedTower}
                onChange={(e) => setSelectedTower(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Torre 1">Torre 1</option>
                <option value="Torre 2">Torre 2</option>
                <option value="Torre 4">Torre 4</option>
                <option value="Torre 7">Torre 7</option>
                <option value="Urbanismo">Urbanismo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Level 2: Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
