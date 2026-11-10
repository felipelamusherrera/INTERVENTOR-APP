import React, { useState, useEffect } from 'react';
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
  Award,
  GitBranch,
  Coins,
  Users,
  UserCheck,
  User,
  ChevronDown
} from 'lucide-react';
import { Sucursal } from '../../types';
import { AuthService } from '../../services/authService';
import { Usuario, ROL_LABEL } from '../../types/auth';
import { puedeAccederModulo } from '../../lib/permisos-roles';

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
  
  const [currentUser, setCurrentUser] = useState<Usuario>(AuthService.getCurrentUser());
  const [usuariosList, setUsuariosList] = useState<Usuario[]>(AuthService.getUsuarios());
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(AuthService.getCurrentUser());
      setUsuariosList(AuthService.getUsuarios());
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const allNavItems = [
    // Operación Campo (Residentes)
    { id: 'residente-programacion', label: 'Prog. Obra & CPM', icon: GitBranch, badge: 'CPM Vivo', group: 'campo' },
    { id: 'residente-presupuesto', label: 'Presupuesto Opus', icon: Coins, badge: 'Costos', group: 'campo' },
    { id: 'residente-calidad', label: 'Sellos Campo', icon: Award, badge: '0/X/R', group: 'campo' },
    { id: 'residente-cto', label: 'Compromisos CTO', icon: ShieldCheck, badge: 'Actas', group: 'campo' },
    { id: 'residente-productividad', label: 'Censo Cuadrillas', icon: Users, badge: 'Diario', group: 'campo' },

    // Control y Programación
    { id: 'wbs', label: 'WBS / EDT', icon: ListTree, group: 'control' },
    { id: 'tiempo', label: 'Tiempo & Hitos', icon: Clock, badge: 'I / E', group: 'control' },
    { id: 'lookahead', label: 'Lookahead', icon: AlertTriangle, badge: '4 Sem', group: 'control' },
    { id: 'elevacion', label: 'Elevación 3D', icon: Layers, group: 'control' },

    // Gestión Gerencial
    { id: 'resumen', label: 'Vista Cero Gerencial', icon: Building2, badge: 'Portafolio', group: 'gerencial' },
    { id: 'calidad', label: 'Tablero Calidad', icon: Award, group: 'gerencial' },
    { id: 'cto', label: 'Auditoría CTO', icon: ShieldCheck, group: 'gerencial' },
    { id: 'productividad', label: 'Matriz Productividad', icon: TrendingUp, badge: 'Tesla', group: 'gerencial' },
    { id: 'bitacora', label: 'Bitácora & Riesgos', icon: CheckSquare, group: 'gerencial' },
    { id: 'reporte', label: 'Ficha Aconex PDF', icon: FileText, badge: 'PDF', group: 'gerencial' },

    // Administración
    { id: 'usuarios', label: 'Gobernanza Usuarios', icon: UserCheck, badge: 'Admin', group: 'admin' },
  ];

  // Filtrar según los permisos del rol actual
  const visibleNavItems = allNavItems.filter(item => 
    puedeAccederModulo(currentUser.rol, item.id)
  );

  const pendientesCount = usuariosList.filter(u => u.estado === 'PENDIENTE').length;

  const handleSelectUser = (u: Usuario) => {
    AuthService.setCurrentUser(u);
    setShowUserDropdown(false);
  };

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
                  v3.0 Multi-Rol
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Supervisión Técnica de Campo & Tableros Gerenciales
              </p>
            </div>
          </div>

          {/* Context Selectors & User Profile */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
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

            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
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

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl px-3 py-1.5 transition-all text-left"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {currentUser.nombre.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.nombre}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold leading-none mt-0.5">
                    {ROL_LABEL[currentUser.rol]}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
              </button>

              {/* User Switcher Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cambiar Rol / Usuario</span>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{currentUser.nombre}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.correo}</div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
                    {usuariosList.filter(u => u.estado === 'ACTIVO').map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                          u.id === currentUser.id 
                            ? 'bg-blue-50 text-blue-900 font-bold' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{u.nombre}</div>
                          <div className="text-[10px] text-slate-400">{ROL_LABEL[u.rol]} • {u.sucursal}</div>
                        </div>
                        {u.id === currentUser.id && <span className="text-blue-600 font-bold">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setActiveTab('usuarios');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-center py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      Ir a Gobernanza de Usuarios
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level 2: Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'usuarios' && pendientesCount > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-amber-500 text-white animate-pulse">
                    {pendientesCount}
                  </span>
                ) : item.badge ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation Bar (Acceso Rápido Residente de Obra) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex justify-around items-center md:hidden shadow-2xl no-print">
        <button
          onClick={() => setActiveTab('residente-programacion')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'residente-programacion' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitBranch className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Prog/CPM</span>
        </button>

        <button
          onClick={() => setActiveTab('residente-presupuesto')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'residente-presupuesto' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Costos</span>
        </button>

        <button
          onClick={() => setActiveTab('residente-calidad')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'residente-calidad' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Sellos</span>
        </button>

        <button
          onClick={() => setActiveTab('residente-cto')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'residente-cto' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">CTO</span>
        </button>

        <button
          onClick={() => setActiveTab('residente-productividad')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'residente-productividad' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Cuadrillas</span>
        </button>

        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl transition-all ${
            activeTab === 'resumen' || activeTab === 'usuarios' ? 'text-blue-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Más</span>
        </button>
      </nav>
    </header>
  );
};
