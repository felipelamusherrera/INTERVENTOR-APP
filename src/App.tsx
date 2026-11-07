import React, { useState } from 'react';
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
import { Sucursal } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('resumen');
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal>('CALI');
  const [selectedProject, setSelectedProject] = useState<string>('Belaterra Pietra');
  const [selectedTower, setSelectedTower] = useState<string>('Torre 1');
  const [cutoffDate] = useState<string>('2026-11-03');

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
        {activeTab === 'resumen' && (
          <ResumenView
            selectedSucursal={selectedSucursal}
            onNavigateTab={setActiveTab}
            onSelectProject={setSelectedProject}
          />
        )}

        {activeTab === 'tiempo' && (
          <TiempoView
            selectedProject={selectedProject}
            selectedTower={selectedTower}
          />
        )}

        {activeTab === 'wbs' && (
          <WbsView />
        )}

        {activeTab === 'bitacora' && (
          <BitacoraView />
        )}

        {activeTab === 'lookahead' && (
          <LookaheadView />
        )}

        {activeTab === 'productividad' && (
          <ProductividadView />
        )}

        {activeTab === 'elevacion' && (
          <ElevacionView />
        )}

        {activeTab === 'calidad' && (
          <CalidadView />
        )}

        {activeTab === 'cto' && (
          <CtoView />
        )}

        {activeTab === 'reporte' && (
          <ReportePdfView
            selectedProject={selectedProject}
            selectedTower={selectedTower}
            selectedSucursal={selectedSucursal}
            cutoffDate={cutoffDate}
          />
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
            <span>Metodología 12 Macro-Hitos</span>
            <span>·</span>
            <span>Sellos MA-SIG-CAL-001</span>
            <span>·</span>
            <span>CTO Ley 1796</span>
            <span>·</span>
            <span>Aconex Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
