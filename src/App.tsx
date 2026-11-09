import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { ResumenView } from './components/views/ResumenView';
import { TiempoView } from './components/views/TiempoView';
import { WbsView } from './components/views/WbsView';
import { BitacoraView } from './components/views/BitacoraView';
import { LookaheadView } from './components/views/LookaheadView';
import { ProductividadView } from './components/views/ProductividadView';
import { ElevacionView } from './components/views/ElevacionView';
import { CalidadView } from './components/views/CalidadView';
import { CtoView } from './components/views/CtoView';
import { ReportePdfView } from './components/views/ReportePdfView';
import { UsuariosView } from './components/views/UsuariosView';

// Submódulos de Operación en Campo (Residentes)
import { ResidenteProgramacionView } from './components/views/residente/ResidenteProgramacionView';
import { ResidentePresupuestoView } from './components/views/residente/ResidentePresupuestoView';
import { ResidenteCalidadView } from './components/views/residente/ResidenteCalidadView';
import { ResidenteCtoView } from './components/views/residente/ResidenteCtoView';
import { ResidenteProductividadView } from './components/views/residente/ResidenteProductividadView';

import { Sucursal } from './types';
import { AuthService } from './services/authService';
import { puedeAccederModulo } from './lib/permisos-roles';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('resumen');
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal>('CALI');
  const [selectedProject, setSelectedProject] = useState<string>('Belaterra Pietra');
  const [selectedTower, setSelectedTower] = useState<string>('Torre 1');
  const [cutoffDate] = useState<string>('2026-11-03');

  useEffect(() => {
    const handleAuthChange = () => {
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
      // Si el tab actual no está permitido para el nuevo rol, redirigir al primer tab permitido
      if (!puedeAccederModulo(user.rol, activeTab)) {
        if (user.rol === 'RESIDENTE_INTERVENTORIA') {
          setActiveTab('residente-programacion');
        } else if (user.rol === 'DIRECTIVO') {
          setActiveTab('resumen');
        } else {
          setActiveTab('resumen');
        }
      }
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col font-sans">
      {/* Top Header Shell */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSucursal={selectedSucursal}
        setSelectedSucursal={setSelectedSucursal}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedTower={selectedTower}
        setSelectedTower={setSelectedTower}
        cutoffDate={cutoffDate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Submódulos de Operación Campo para Residentes */}
        {activeTab === 'residente-programacion' && (
          <ResidenteProgramacionView />
        )}

        {activeTab === 'residente-presupuesto' && (
          <ResidentePresupuestoView />
        )}

        {activeTab === 'residente-calidad' && (
          <ResidenteCalidadView />
        )}

        {activeTab === 'residente-cto' && (
          <ResidenteCtoView />
        )}

        {activeTab === 'residente-productividad' && (
          <ResidenteProductividadView />
        )}

        {/* Módulos de Control y Programación */}
        {activeTab === 'wbs' && (
          <WbsView />
        )}

        {activeTab === 'tiempo' && (
          <TiempoView
            selectedProject={selectedProject}
            selectedTower={selectedTower}
          />
        )}

        {activeTab === 'lookahead' && (
          <LookaheadView />
        )}

        {activeTab === 'elevacion' && (
          <ElevacionView />
        )}

        {/* Módulos de Gestión Gerencial */}
        {activeTab === 'resumen' && (
          <ResumenView
            selectedSucursal={selectedSucursal}
            onNavigateTab={setActiveTab}
            onSelectProject={setSelectedProject}
          />
        )}

        {activeTab === 'calidad' && (
          <CalidadView />
        )}

        {activeTab === 'cto' && (
          <CtoView />
        )}

        {activeTab === 'productividad' && (
          <ProductividadView />
        )}

        {activeTab === 'bitacora' && (
          <BitacoraView />
        )}

        {activeTab === 'reporte' && (
          <ReportePdfView
            selectedProject={selectedProject}
            selectedTower={selectedTower}
            selectedSucursal={selectedSucursal}
            cutoffDate={cutoffDate}
          />
        )}

        {/* Módulo de Administración y Gobernanza */}
        {activeTab === 'usuarios' && (
          <UsuariosView />
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="bg-white border-t border-surface-border py-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">MARVAL S.A.S.</span>
            <span>·</span>
            <span>Sistema Integral de Interventoría y Control de Proyectos</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Sesión: {currentUser.nombre}</span>
            <span>·</span>
            <span>Microsoft Fabric Ready</span>
            <span>·</span>
            <span>Ambiente: Producción v3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
