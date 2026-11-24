import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
  FileText,
  Clock,
  ListTree,
  CheckSquare,
  AlertTriangle,
  Award,
  Coins,
  Users,
  UserCheck,
  ChevronDown,
  BarChart3,
  HardHat,
  LineChart,
  Sliders,
  Lock,
  LogOut,
  FolderPlus,
} from 'lucide-react';
import { Sucursal, SUCURSALES_OFICIALES, SUCURSAL_LABEL } from '../../types';
import { AuthService } from '../../services/authService';
import { Usuario, ROL_LABEL } from '../../types/auth';
import {
  puedeAccederModulo,
  puedeOperarCampo,
  puedeVerGerencial,
} from '../../lib/permisos-roles';
import {
  ProjectService,
  ProyectoMaestro,
  ProyectoOnboardingStatus,
} from '../../services/projectService';
import { ParametrizacionService } from '../../services/parametrizacionService';

interface HeaderProps {
  currentUser: Usuario;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSucursal: Sucursal;
  setSelectedSucursal: (sucursal: Sucursal) => void;
  projects: ProyectoMaestro[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  selectedTower: string;
  setSelectedTower: (tower: string) => void;
  cutoffDate: string;
  onboardingStatus: ProyectoOnboardingStatus;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  selectedSucursal,
  setSelectedSucursal,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  selectedTower,
  setSelectedTower,
  cutoffDate,
  onboardingStatus,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [pendientesUsuarios, setPendientesUsuarios] = useState(0);
  const [pendientesSolicitudes, setPendientesSolicitudes] = useState(0);

  const canCampo = puedeOperarCampo(currentUser.rol);
  const canGerencial = puedeVerGerencial(currentUser.rol);
  const isAdmin = currentUser.rol === 'ADMINISTRADOR';

  const campoTabIds = [
    'parametros',
    'wbs',
    'bitacora',
    'residente-lookahead',
    'residente-calidad',
    'residente-cto',
    'elevacion',
    'residente-presupuesto',
    'residente-productividad',
  ];

  const isCampoTab = campoTabIds.includes(activeTab);
  const [activeMode, setActiveMode] = useState<'CAMPO' | 'GERENCIAL'>(() => {
    if (canCampo && !canGerencial) return 'CAMPO';
    if (!canCampo && canGerencial) return 'GERENCIAL';
    return isCampoTab ? 'CAMPO' : 'GERENCIAL';
  });

  useEffect(() => {
    const refreshBadges = () => {
      setPendientesUsuarios(
        AuthService.getUsuarios().filter((u) => u.estado === 'PENDIENTE').length
      );
      setPendientesSolicitudes(
        ProjectService.getSolicitudesAsignacion().filter((s) => s.estado === 'PENDIENTE').length
      );
    };
    refreshBadges();
    window.addEventListener('auth_state_changed', refreshBadges);
    window.addEventListener('marval_solicitudes_updated', refreshBadges);
    return () => {
      window.removeEventListener('auth_state_changed', refreshBadges);
      window.removeEventListener('marval_solicitudes_updated', refreshBadges);
    };
  }, []);

  useEffect(() => {
    if (canCampo && !canGerencial) {
      setActiveMode('CAMPO');
    } else if (!canCampo && canGerencial) {
      setActiveMode('GERENCIAL');
    } else if (isCampoTab && activeMode !== 'CAMPO') {
      setActiveMode('CAMPO');
    } else if (!isCampoTab && activeMode !== 'GERENCIAL') {
      setActiveMode('GERENCIAL');
    }
  }, [activeTab, canCampo, canGerencial]);

  // Torres reales parametrizadas del proyecto activo
  const torresProyecto = activeProjectId
    ? ParametrizacionService.getTorresConfig(activeProjectId)
    : [];

  // Ítems Módulo de Campo (Residente) — Orden exacto de izquierda a derecha
  const navItemsCampo = [
    {
      id: 'parametros',
      label: 'Parámetros del proyecto',
      icon: Sliders,
      badge: onboardingStatus.paso1Completo ? 'OK' : 'Paso 1',
      highlight: !onboardingStatus.paso1Completo,
      locked: false,
    },
    {
      id: 'wbs',
      label: 'Programación & EDT',
      icon: ListTree,
      badge:
        onboardingStatus.paso2LineaBaseCongelada && onboardingStatus.paso2FechasAlistamientoCargadas
          ? 'CPM & LB'
          : 'Paso 2',
      highlight:
        onboardingStatus.paso1Completo &&
        !(onboardingStatus.paso2LineaBaseCongelada && onboardingStatus.paso2FechasAlistamientoCargadas),
      locked: !onboardingStatus.paso1Completo,
    },
    {
      id: 'bitacora',
      label: 'Bitácora de Campo',
      icon: CheckSquare,
      badge: 'Cockpit 5 en 1',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'residente-lookahead',
      label: 'Reporte de restricciones LEAN',
      icon: AlertTriangle,
      badge: '6 Sem',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'residente-calidad',
      label: 'Indicadores Sellos',
      icon: Award,
      badge: 'Calidad',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'residente-cto',
      label: 'Matriz CTO Proyecto',
      icon: ShieldCheck,
      badge: 'Ley 1796',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'elevacion',
      label: 'Elevación 3D',
      icon: Layers,
      badge: 'Torres',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'residente-presupuesto',
      label: 'Presupuesto Opus',
      icon: Coins,
      badge: 'Costos',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
    {
      id: 'residente-productividad',
      label: 'Censo Cuadrillas',
      icon: Users,
      badge: 'Diario',
      highlight: false,
      locked: !onboardingStatus.todoHabilitado,
    },
  ];

  // Ítems Tableros Gerenciales (Directivos / Gerentes - Solo lectura) + Admin
  const totalAdminAlertas = pendientesUsuarios + pendientesSolicitudes;
  const navItemsGerencial = [
    { id: 'resumen', label: 'Portafolio Global', icon: Building2, badge: 'Portafolio', highlight: true, locked: false },
    { id: 'tiempo', label: 'Control de Tiempo', icon: Clock, badge: 'Puntos Ctrl', highlight: false, locked: false },
    { id: 'lookahead', label: 'Lookahead & Restricciones', icon: AlertTriangle, badge: 'Restricc.', highlight: false, locked: false },
    { id: 'calidad', label: 'Calidad Corporativa', icon: Award, badge: 'Sellos', highlight: false, locked: false },
    { id: 'cto', label: 'Madurez CTO (Ley 1796)', icon: ShieldCheck, badge: '3 Fases', highlight: false, locked: false },
    { id: 'gantt-gerencial', label: 'Gantt Gerencial', icon: BarChart3, badge: 'EDT', highlight: false, locked: false },
    { id: 'reporte', label: 'Ficha Aconex PDF', icon: FileText, badge: 'PDF', highlight: false, locked: false },
    {
      id: 'usuarios',
      label: 'Panel Administración',
      icon: UserCheck,
      badge: totalAdminAlertas > 0 ? `${totalAdminAlertas}` : 'Admin',
      highlight: totalAdminAlertas > 0,
      locked: false,
    },
  ];

  const currentNavItems = activeMode === 'CAMPO' ? navItemsCampo : navItemsGerencial;
  const visibleNavItems = currentNavItems.filter((item) =>
    puedeAccederModulo(currentUser.rol, item.id)
  );

  const handleSwitchMode = (newMode: 'CAMPO' | 'GERENCIAL') => {
    setActiveMode(newMode);
    if (newMode === 'CAMPO') {
      setActiveTab('parametros');
    } else {
      setActiveTab('resumen');
    }
  };

  return (
    <header className="bg-white border-b border-surface-border sticky top-0 z-30 shadow-sm no-print">
      {/* Top Brand Bar */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-16 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-3 shrink-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-900 via-brand-700 to-blue-600 flex items-center justify-center text-white font-bold shadow-md tracking-wider">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Site Control Marval
                </span>
                <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  INTERVENTORÍA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Supervisión Técnica de Campo &amp; Tableros Gerenciales
              </p>
            </div>
          </div>

          {/* Context Selectors & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            <div className="hidden xl:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Fecha:</span>
              <span className="font-semibold text-slate-800 tabular-nums">{cutoffDate}</span>
            </div>

            {activeMode === 'GERENCIAL' && (
              <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 font-medium">Sucursal:</span>
                <select
                  value={selectedSucursal}
                  onChange={(e) => setSelectedSucursal(e.target.value as Sucursal)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="TODAS">Todas</option>
                  {SUCURSALES_OFICIALES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector dinámico de Proyecto */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline text-slate-500 font-medium">Proyecto:</span>
              {projects.length === 0 ? (
                <span className="font-semibold text-slate-400 italic">Sin proyecto</span>
              ) : (
                <select
                  value={activeProjectId}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombreJde} ({SUCURSAL_LABEL[p.sucursal] || p.sucursal})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Botón rápido Crear nuevo proyecto (si ya tiene proyectos y opera campo) */}
            {canCampo && projects.length > 0 && (
              <button
                type="button"
                onClick={onCreateNewProject}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition cursor-pointer"
                title="Crear nuevo proyecto"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Nuevo proyecto</span>
              </button>
            )}

            {/* Selector dinámico de Torre */}
            {torresProyecto.length > 0 && (
              <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500 font-medium">Torre:</span>
                <select
                  value={selectedTower}
                  onChange={(e) => setSelectedTower(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {torresProyecto.map((t) => (
                    <option key={t.id} value={t.nombreTorre}>
                      {t.nombreTorre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl px-2.5 py-1.5 transition-all text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                    {currentUser.nombre}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold leading-none mt-0.5 truncate max-w-[130px]">
                    {ROL_LABEL[currentUser.rol]}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Sesión Autenticada
                    </span>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{currentUser.nombre}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.correo}</div>
                    <div className="text-[10px] font-bold text-blue-700 mt-1">
                      {ROL_LABEL[currentUser.rol]} · {SUCURSAL_LABEL[currentUser.sucursal]}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveMode('GERENCIAL');
                        setActiveTab('usuarios');
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Panel Administración
                      </span>
                      {totalAdminAlertas > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {totalAdminAlertas}
                        </span>
                      )}
                    </button>
                  )}

                  {canCampo && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onCreateNewProject();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                    >
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      <span>Crear nuevo proyecto</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Level 2: Modo de Trabajo + Navegación de Pestañas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-2 border-b border-slate-100">
          {/* Segmented Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start shrink-0">
            {canCampo && (
              <button
                onClick={() => handleSwitchMode('CAMPO')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeMode === 'CAMPO'
                    ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HardHat className="w-3.5 h-3.5 text-emerald-600" />
                <span>Módulo de Campo (Residente)</span>
              </button>
            )}

            {canGerencial && (
              <button
                onClick={() => handleSwitchMode('GERENCIAL')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeMode === 'GERENCIAL'
                    ? 'bg-white text-blue-800 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LineChart className="w-3.5 h-3.5 text-blue-600" />
                <span>Tableros Gerenciales (Directivos)</span>
              </button>
            )}
          </div>

          {/* Sub-Pestañas del Modo Activo */}
          <nav className="flex space-x-1 overflow-x-auto scrollbar-none self-stretch md:self-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={
                    item.locked
                      ? item.id === 'wbs'
                        ? 'Complete y guarde Parámetros del proyecto (Paso 1) para habilitar Programación & EDT'
                        : 'Congele la primera sábana de Workplanner en Programación & EDT (Paso 2) para habilitar este módulo'
                      : item.label
                  }
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : item.locked
                        ? 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-200'
                        : item.highlight
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.locked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                  {item.badge && !item.locked && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : item.highlight
                            ? 'bg-emerald-200 text-emerald-900'
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
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex justify-around items-center md:hidden shadow-2xl no-print">
        {canCampo ? (
          <>
            <button
              onClick={() => setActiveTab('parametros')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'parametros' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <Sliders className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Parámetros</span>
            </button>
            <button
              onClick={() => setActiveTab('wbs')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'wbs' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <ListTree className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Prog &amp; EDT</span>
            </button>
            <button
              onClick={() => setActiveTab('bitacora')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'bitacora' ? 'text-emerald-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Bitácora</span>
            </button>
            <button
              onClick={() => setActiveTab('elevacion')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'elevacion' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Elevación</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('resumen')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'resumen' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Portafolio</span>
            </button>
            <button
              onClick={() => setActiveTab('tiempo')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'tiempo' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Tiempo</span>
            </button>
            <button
              onClick={() => setActiveTab('calidad')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'calidad' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Calidad</span>
            </button>
            <button
              onClick={() => setActiveTab('cto')}
              className={`flex flex-col items-center justify-center min-h-[48px] px-1.5 rounded-xl ${
                activeTab === 'cto' ? 'text-blue-600 font-extrabold' : 'text-slate-500'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">CTO</span>
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
