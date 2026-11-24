import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { ParametrosProyectoView } from './components/views/ParametrosProyectoView';
import { ResumenView } from './components/views/ResumenView';
import { TiempoView } from './components/views/TiempoView';
import { WbsView } from './components/views/WbsView';
import { GanttGerencialView } from './components/views/GanttGerencialView';
import { BitacoraView } from './components/views/BitacoraView';
import { LookaheadView } from './components/views/LookaheadView';
import { ProductividadView } from './components/views/ProductividadView';
import { ElevacionView } from './components/views/ElevacionView';
import { CalidadView } from './components/views/CalidadView';
import { CtoView } from './components/views/CtoView';
import { ReportePdfView } from './components/views/ReportePdfView';
import { UsuariosView } from './components/views/UsuariosView';

// Submódulos de Operación en Campo (Residentes)
import { ResidentePresupuestoView } from './components/views/residente/ResidentePresupuestoView';
import { ResidenteCalidadView } from './components/views/residente/ResidenteCalidadView';
import { ResidenteCtoView } from './components/views/residente/ResidenteCtoView';
import { ResidenteProductividadView } from './components/views/residente/ResidenteProductividadView';
import { LookaheadCompuertasTab } from './components/views/bitacora/LookaheadCompuertasTab';

import { Sucursal } from './types';
import { Usuario, ROL_LABEL } from './types/auth';
import { AuthService } from './services/authService';
import { SharePointService } from './services/sharepointService';
import { ProjectService, ProyectoMaestro } from './services/projectService';
import { ParametrizacionService } from './services/parametrizacionService';
import { purgeLegacyStorage } from './services/baselineService';
import {
  puedeAccederModulo,
  esRolDirectivo,
} from './lib/permisos-roles';

const DOWNSTREAM_CAMPO_TABS = new Set([
  'bitacora',
  'residente-lookahead',
  'residente-calidad',
  'residente-cto',
  'elevacion',
  'residente-presupuesto',
  'residente-productividad',
]);

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => AuthService.getCurrentUser());
  const [projects, setProjects] = useState<ProyectoMaestro[]>(() =>
    ProjectService.getProjectsForUser(AuthService.getCurrentUser())
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const u = AuthService.getCurrentUser();
    if (!u) return '';
    const userProjs = ProjectService.getProjectsForUser(u);
    const saved = ProjectService.getActiveProjectIdForUser(u.id);
    if (saved && userProjs.some((p) => p.id === saved)) return saved;
    return userProjs[0]?.id || '';
  });
  const [isCreatingNewProject, setIsCreatingNewProject] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const u = AuthService.getCurrentUser();
    if (!u) return 'parametros';
    return esRolDirectivo(u.rol) ? 'resumen' : 'parametros';
  });
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal>('TODAS');
  const [selectedTower, setSelectedTower] = useState<string>('');
  const [cutoffDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [onboardingVersion, setOnboardingVersion] = useState<number>(0);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  const showLockNotice = (msg: string) => {
    setLockNotice(msg);
    setTimeout(() => setLockNotice(null), 5000);
  };

  // Sincronización con eventos globales de auth, proyectos, parametrización y línea base
  useEffect(() => {
    purgeLegacyStorage();
    setOnboardingVersion((v) => v + 1);
    SharePointService.initBackgroundSync();

    const syncUserAndProjects = () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
      if (!user) {
        setProjects([]);
        setActiveProjectId('');
        return;
      }

      const list = ProjectService.getProjectsForUser(user);
      setProjects(list);
      setActiveProjectId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        const saved = ProjectService.getActiveProjectIdForUser(user.id);
        if (saved && list.some((p) => p.id === saved)) return saved;
        return list[0]?.id || '';
      });

      setActiveTab((prevTab) => {
        if (!puedeAccederModulo(user.rol, prevTab)) {
          return esRolDirectivo(user.rol) ? 'resumen' : 'parametros';
        }
        return prevTab;
      });
    };

    const bumpOnboarding = () => {
      syncUserAndProjects();
      setOnboardingVersion((v) => v + 1);
    };

    window.addEventListener('auth_state_changed', syncUserAndProjects);
    window.addEventListener('marval_projects_updated', bumpOnboarding);
    window.addEventListener('marval_parametrizacion_updated', bumpOnboarding);
    window.addEventListener('marval_baseline_updated', bumpOnboarding);
    window.addEventListener('marval_alistamiento_updated', bumpOnboarding);
    window.addEventListener('schedule_updated', bumpOnboarding);

    return () => {
      window.removeEventListener('auth_state_changed', syncUserAndProjects);
      window.removeEventListener('marval_projects_updated', bumpOnboarding);
      window.removeEventListener('marval_parametrizacion_updated', bumpOnboarding);
      window.removeEventListener('marval_baseline_updated', bumpOnboarding);
      window.removeEventListener('marval_alistamiento_updated', bumpOnboarding);
      window.removeEventListener('schedule_updated', bumpOnboarding);
    };
  }, []);

  // Estado de avance del tutorial paso a paso para el proyecto activo
  const onboardingStatus = useMemo(() => {
    return ProjectService.getOnboardingStatus(activeProjectId);
  }, [activeProjectId, onboardingVersion]);

  // Actualizar torre seleccionada al cambiar de proyecto
  useEffect(() => {
    if (!activeProjectId) {
      setSelectedTower('');
      return;
    }
    const torres = ParametrizacionService.getTorresConfig(activeProjectId);
    setSelectedTower((prev) =>
      torres.some((t) => t.nombreTorre === prev) ? prev : torres[0]?.nombreTorre || ''
    );
  }, [activeProjectId, onboardingVersion]);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsCreatingNewProject(false);
    if (currentUser) {
      ProjectService.setActiveProjectIdForUser(currentUser.id, projectId);
    }
    setOnboardingVersion((v) => v + 1);
  };

  const handleCreateNewProject = () => {
    setIsCreatingNewProject(true);
    setActiveTab('parametros');
  };

  // Guardián de navegación secuencial obligatoria (Tutorial Paso 1 -> Paso 2 -> Desbloqueo)
  const handleSafeSetActiveTab = (targetTab: string) => {
    if (!currentUser) return;
    if (!puedeAccederModulo(currentUser.rol, targetTab)) {
      showLockNotice(`Tu rol (${ROL_LABEL[currentUser.rol]}) no tiene acceso a este módulo.`);
      return;
    }

    if (targetTab === 'wbs' && !onboardingStatus.paso1Completo) {
      setActiveTab('parametros');
      showLockNotice(
        'Paso 1 pendiente: complete y guarde "Datos del proyecto" y "Parametrización Torres e inmuebles" para habilitar Programación & EDT.'
      );
      return;
    }

    if (DOWNSTREAM_CAMPO_TABS.has(targetTab) && !onboardingStatus.todoHabilitado) {
      if (!onboardingStatus.paso1Completo) {
        setActiveTab('parametros');
        showLockNotice(
          'Paso 1 pendiente: configure y guarde los parámetros del proyecto antes de acceder a los módulos operativos.'
        );
      } else if (
        onboardingStatus.paso2LineaBaseCongelada &&
        !onboardingStatus.paso2FechasAlistamientoCargadas
      ) {
        setActiveTab('wbs');
        showLockNotice(
          'Paso 2 pendiente: cargue el archivo de Fechas de Alistamiento de Gerencia en "Programación & EDT" para habilitar todos los módulos de campo.'
        );
      } else {
        setActiveTab('wbs');
        showLockNotice(
          'Paso 2 pendiente: cargue la 1ª sábana de Workplanner y el archivo de Fechas de Alistamiento en "Programación & EDT" para habilitar todos los módulos de campo.'
        );
      }
      return;
    }

    if (targetTab !== 'parametros') {
      setIsCreatingNewProject(false);
    }
    setActiveTab(targetTab);
  };

  // Escuchar eventos globales de navegación entre pestañas
  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        handleSafeSetActiveTab(detail);
      }
    };
    window.addEventListener('marval_navigate_tab', handleNavigateTab);
    return () => window.removeEventListener('marval_navigate_tab', handleNavigateTab);
  }, [currentUser, onboardingStatus]);

  const handleLoginSuccess = () => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const list = ProjectService.getProjectsForUser(user);
      setProjects(list);
      const saved = ProjectService.getActiveProjectIdForUser(user.id);
      const nextProj = saved && list.some((p) => p.id === saved) ? saved : list[0]?.id || '';
      setActiveProjectId(nextProj);
      setActiveTab(esRolDirectivo(user.rol) ? 'resumen' : 'parametros');
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setIsCreatingNewProject(false);
  };

  // Si no hay sesión autenticada, mostrar pantalla de acceso Site Control Marval
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const activeProjectObj = ProjectService.getProjectById(activeProjectId);
  const effectiveSucursal: Sucursal =
    activeProjectObj?.sucursal || selectedSucursal || currentUser.sucursal;

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col font-sans">
      {/* Top Header Shell */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleSafeSetActiveTab}
        selectedSucursal={selectedSucursal}
        setSelectedSucursal={setSelectedSucursal}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateNewProject={handleCreateNewProject}
        selectedTower={selectedTower}
        setSelectedTower={setSelectedTower}
        cutoffDate={cutoffDate}
        onboardingStatus={onboardingStatus}
        onLogout={handleLogout}
      />

      {/* Aviso de módulo bloqueado por flujo tutorial */}
      {lockNotice && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-400/60 flex items-start gap-2.5 text-xs font-semibold">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{lockNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 pb-24 md:pb-6">
        {/* MÓDULO 1: PARÁMETROS DEL PROYECTO (PRIMER LUGAR DE IZQUIERDA A DERECHA) */}
        {activeTab === 'parametros' && (
          <ParametrosProyectoView
            currentUser={currentUser}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onNavigateTab={handleSafeSetActiveTab}
            isCreatingNew={isCreatingNewProject}
            onCancelCreateNew={() => setIsCreatingNewProject(false)}
          />
        )}

        {/* MÓDULO 2: PROGRAMACIÓN & EDT (FUENTE ÚNICA WORKPLANNER) */}
        {activeTab === 'wbs' && (
          <WbsView
            selectedProject={activeProjectId}
            selectedTower={selectedTower}
          />
        )}

        {/* MÓDULOS OPERATIVOS DE CAMPO (HABILITADOS TRAS CONGELAR 1ª SÁBANA) */}
        {activeTab === 'bitacora' && (
          <BitacoraView
            selectedProject={activeProjectId}
            selectedSucursal={effectiveSucursal}
            residenteNombre={currentUser.nombre}
          />
        )}

        {activeTab === 'residente-lookahead' && (
          <LookaheadCompuertasTab
            proyectoId={activeProjectId}
            sucursal={effectiveSucursal}
            residenteNombre={currentUser.nombre}
            mode="MATRIZ_OPERATIVA"
          />
        )}

        {activeTab === 'residente-calidad' && (
          <ResidenteCalidadView
            selectedProject={activeProjectId}
            selectedSucursal={effectiveSucursal}
          />
        )}

        {activeTab === 'residente-cto' && (
          <ResidenteCtoView selectedProject={activeProjectId} />
        )}

        {activeTab === 'elevacion' && (
          <ElevacionView
            selectedProject={activeProjectId}
            selectedTower={selectedTower}
          />
        )}

        {activeTab === 'residente-presupuesto' && (
          <ResidentePresupuestoView selectedProject={activeProjectId} />
        )}

        {activeTab === 'residente-productividad' && (
          <ResidenteProductividadView selectedProject={activeProjectId} />
        )}

        {/* TABLEROS GERENCIALES (DIRECTIVOS / GERENTES - SOLO LECTURA) */}
        {activeTab === 'resumen' && (
          <ResumenView
            selectedSucursal={selectedSucursal}
            onNavigateTab={handleSafeSetActiveTab}
            onSelectProject={handleSelectProject}
          />
        )}

        {activeTab === 'tiempo' && (
          <TiempoView
            selectedProject={activeProjectObj?.nombreJde || activeProjectId}
            selectedTower={selectedTower}
            selectedSucursal={selectedSucursal}
          />
        )}

        {activeTab === 'gantt-gerencial' && (
          <GanttGerencialView
            selectedProject={activeProjectObj?.nombreJde || activeProjectId}
          />
        )}

        {activeTab === 'lookahead' && (
          <LookaheadView
            selectedProject={activeProjectObj?.nombreJde || activeProjectId}
            selectedSucursal={selectedSucursal}
          />
        )}

        {activeTab === 'calidad' && <CalidadView />}

        {activeTab === 'cto' && <CtoView />}

        {activeTab === 'productividad' && <ProductividadView />}

        {activeTab === 'reporte' && (
          <ReportePdfView
            selectedProject={activeProjectObj?.nombreJde || activeProjectId}
            selectedTower={selectedTower}
            selectedSucursal={selectedSucursal}
            cutoffDate={cutoffDate}
          />
        )}

        {/* PANEL DE ADMINISTRACIÓN */}
        {activeTab === 'usuarios' && <UsuariosView />}

        {/* Banner informativo solo lectura para Directivos si no hay proyectos cargados aún */}
        {esRolDirectivo(currentUser.rol) && projects.length === 0 && activeTab !== 'resumen' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-xs text-blue-900">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Actualmente no existen proyectos cargados por residentes en la plataforma. Los indicadores gerenciales se alimentarán automáticamente conforme los residentes registren sus obras.
            </span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-border py-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">MARVAL CONSTRUCTORES</span>
            <span>·</span>
            <span>Site Control Marval · Interventoría y Control de Proyectos</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Sesión: {currentUser.nombre} ({ROL_LABEL[currentUser.rol]})</span>
            <span>·</span>
            <span>SharePoint &amp; Lovable Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
