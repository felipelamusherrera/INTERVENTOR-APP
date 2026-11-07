import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award, 
  Building, 
  Info,
  ChevronRight
} from 'lucide-react';
import { FloorElevation } from '../../types';
import { floorElevations } from '../../data/mockData';

export const ElevacionView: React.FC = () => {
  const [selectedFloor, setSelectedFloor] = useState<FloorElevation>(floorElevations[3]); // Floor 9 default

  const getStatusBadge = (status: 'completado' | 'en_proceso' | 'pendiente' | 'observado') => {
    switch (status) {
      case 'completado':
        return <span className="w-4 h-4 rounded bg-emerald-500 inline-block shadow-sm" title="Completado"></span>;
      case 'en_proceso':
        return <span className="w-4 h-4 rounded bg-blue-500 inline-block shadow-sm animate-pulse" title="En Proceso"></span>;
      case 'observado':
        return <span className="w-4 h-4 rounded bg-red-500 inline-block shadow-sm" title="Observado / Con Hallazgo"></span>;
      case 'pendiente':
      default:
        return <span className="w-4 h-4 rounded bg-slate-200 inline-block" title="Pendiente"></span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Módulo 07 · Visor de Elevación Vertical</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Matriz de Avance Piso a Piso (Torre 1)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspección vertical multi-frente de la torre (Pisos 1 al 12 y Sótano). Permite visualizar qué gremios tienen frentes abiertos y cuántos <strong>sellos de calidad</strong> han sido aprobados por nivel.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Completado</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-slate-600 font-medium">En proceso</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-slate-600 font-medium">Observado</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-200"></span>
            <span className="text-slate-600 font-medium">Pendiente</span>
          </div>
        </div>
      </div>

      {/* Grid: Vertical Tower Stacking (Left) & Floor Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tower Floors Stacking (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Estructura Vertical de la Torre
            </h3>
            <span className="text-xs text-slate-400">13 Niveles Totales</span>
          </div>

          <div className="space-y-1.5">
            {floorElevations.map((floor) => {
              const isSelected = selectedFloor.piso === floor.piso;
              const compliance = Math.round((floor.sellosCumplidos / floor.sellosTotales) * 100);

              return (
                <div
                  key={floor.piso}
                  onClick={() => setSelectedFloor(floor)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-[130px]">
                    <span className="text-xs font-black text-slate-800 w-6 tabular-nums">
                      {floor.piso === 0 ? 'S1' : `P${floor.piso}`}
                    </span>
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {floor.nombre}
                    </span>
                  </div>

                  {/* 5 Activity status dots */}
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Est:</span>
                      {getStatusBadge(floor.actividades.estructura)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Mamp:</span>
                      {getStatusBadge(floor.actividades.mamposteria)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Pañ:</span>
                      {getStatusBadge(floor.actividades.panete)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Ench:</span>
                      {getStatusBadge(floor.actividades.enchape)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Red:</span>
                      {getStatusBadge(floor.actividades.redes)}
                    </div>
                  </div>

                  {/* Sellos Badge */}
                  <div className="flex items-center space-x-2 tabular-nums">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      compliance === 100 ? 'bg-emerald-100 text-emerald-800' :
                      compliance >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {floor.sellosCumplidos}/{floor.sellosTotales} Sellos ({compliance}%)
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Floor Detail Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              Detalle de Nivel Seleccionado
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {selectedFloor.nombre}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Estado por Actividad
            </h4>

            {[
              { label: 'Estructura Principal', key: selectedFloor.actividades.estructura },
              { label: 'Mampostería y Divisiones', key: selectedFloor.actividades.mamposteria },
              { label: 'Pañetes / Frisos', key: selectedFloor.actividades.panete },
              { label: 'Enchape Baños y Cocina', key: selectedFloor.actividades.enchape },
              { label: 'Instalaciones y Redes', key: selectedFloor.actividades.redes },
            ].map((act, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">{act.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  act.key === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                  act.key === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                  act.key === 'observado' ? 'bg-red-100 text-red-800' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {act.key.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Sellos de Calidad MA-SIG-CAL-001</span>
            </h4>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">Cumplimiento en este piso:</span>
                <span className="font-extrabold text-indigo-700 text-sm">
                  {Math.round((selectedFloor.sellosCumplidos / selectedFloor.sellosTotales) * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-indigo-700">
                {selectedFloor.sellosCumplidos} de {selectedFloor.sellosTotales} sellos aprobados por el residente de interventoría.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
