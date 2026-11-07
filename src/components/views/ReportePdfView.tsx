import React from 'react';
import { 
  Printer, 
  Download, 
  FileCheck, 
  Building, 
  Clock, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  UserCheck
} from 'lucide-react';
import { macroMilestones, majorDelays } from '../../data/mockData';

interface ReportePdfViewProps {
  selectedProject: string;
  selectedTower: string;
  selectedSucursal: string;
  cutoffDate: string;
}

export const ReportePdfView: React.FC<ReportePdfViewProps> = ({
  selectedProject,
  selectedTower,
  selectedSucursal,
  cutoffDate
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Módulo 01 · Ficha Ejecutiva 1-Página (Formato Aconex)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Informe Oficial de Supervisión Técnica e Interventoría
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documento formal condensado listo para exportar a PDF y radicar directamente en el repositorio de <strong>Aconex (Field / Documents)</strong> con respaldo documental auditable.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF (1 Página)</span>
          </button>
        </div>
      </div>

      {/* 1-Page Printable Report Canvas */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-md max-w-5xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none text-slate-800 text-xs page-break">
        {/* Header Oficial Marval */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center text-white font-extrabold text-xl tracking-wider">
              M
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">MARVAL S.A.S.</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  FICHA EJECUTIVA SEMANAL
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600">
                Dirección Nacional de Interventoría y Control de Proyectos
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] tabular-nums">
            <div className="text-slate-400 font-medium">Radicado Aconex: <strong className="text-slate-800">MRV-INT-2026-W45-089</strong></div>
            <div className="text-slate-400 font-medium">Fecha de Corte: <strong className="text-slate-800">{cutoffDate}</strong></div>
            <div className="text-slate-400 font-medium">Sucursal: <strong className="text-slate-800">{selectedSucursal}</strong></div>
          </div>
        </div>

        {/* Project Meta Details Bar */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Proyecto:</span>
            <strong className="text-slate-900 text-sm">{selectedProject}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Torre / Frente:</span>
            <strong className="text-slate-900 text-sm">{selectedTower}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Director de Obra:</span>
            <span className="text-slate-800 font-medium">Carlos Julio Beltrán</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Interventor Líder:</span>
            <span className="text-slate-800 font-medium">Juan Pablo Morales</span>
          </div>
        </div>

        {/* KPI Hero Cards Strip */}
        <div className="grid grid-cols-6 gap-2 mb-4 text-center tabular-nums">
          <div className="border border-slate-200 rounded-lg p-2 bg-blue-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Avance Plan (PV)</span>
            <span className="text-lg font-black text-blue-700">92.0%</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 bg-emerald-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Avance Real (EV)</span>
            <span className="text-lg font-black text-emerald-700">79.0%</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 bg-red-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Desvío Plazo</span>
            <span className="text-lg font-black text-red-600">-42 días</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 bg-indigo-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Sellos Calidad</span>
            <span className="text-lg font-black text-indigo-700">89.4%</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 bg-blue-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Productividad</span>
            <span className="text-lg font-black text-blue-700">84.0%</span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2 bg-emerald-50/40">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Cumplim. CTO</span>
            <span className="text-lg font-black text-emerald-700">73.2%</span>
          </div>
        </div>

        {/* Two Columns Grid: Macro-Hitos (Left) & Mayores Atrasos + Calidad (Right) */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Hitos Table (7 cols) */}
          <div className="col-span-7 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Estado de Macro-Hitos (Métricas I / E)</span>
              </h3>
              <span className="text-[10px] text-slate-400">12 Macro-Hitos</span>
            </div>

            <table className="w-full text-left text-[10px] tabular-nums">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-1 px-1.5">Hito</th>
                  <th className="py-1 px-1.5">Nombre</th>
                  <th className="py-1 px-1">Plan</th>
                  <th className="py-1 px-1">Real</th>
                  <th className="py-1 px-1 text-center">`I` (Inicio)</th>
                  <th className="py-1 px-1 text-center">`E` (Fin)</th>
                  <th className="py-1 px-1 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {macroMilestones.slice(0, 8).map((m) => (
                  <tr key={m.id}>
                    <td className="py-1 px-1.5 font-bold text-slate-900">{m.code}</td>
                    <td className="py-1 px-1.5 truncate max-w-[150px] font-medium text-slate-700">{m.name}</td>
                    <td className="py-1 px-1 text-slate-500">{m.fechaPlan.substring(5)}</td>
                    <td className="py-1 px-1 text-slate-500">{m.fechaReal.substring(5)}</td>
                    <td className="py-1 px-1 text-center font-semibold text-amber-600">+{m.desviacionInicio}d</td>
                    <td className={`py-1 px-1 text-center font-bold ${
                      m.desviacionFin > 30 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      +{m.desviacionFin}d
                    </td>
                    <td className="py-1 px-1 text-center">
                      <span className={`px-1 py-0.2 rounded font-bold ${
                        m.estado === 'Cumplido' ? 'bg-emerald-100 text-emerald-800' :
                        m.estado === 'En riesgo' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Mayores Atrasos & Riesgos (5 cols) */}
          <div className="col-span-5 border border-slate-200 rounded-lg p-3 space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Top 4 Mayores Atrasos en Obra</span>
              </h3>

              <div className="space-y-1.5 text-[10px]">
                {majorDelays.slice(0, 4).map((d, i) => (
                  <div key={d.id} className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="truncate max-w-[210px]">
                      <strong className="text-slate-800 block truncate">{i + 1}. {d.tarea}</strong>
                      <span className="text-slate-400 text-[9px]">Causa: {d.causaRaiz}</span>
                    </div>
                    <span className="font-extrabold text-red-600 tabular-nums text-xs">
                      +{d.diasAtraso}d
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen Calidad y CTO */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[10px]">
              <strong className="text-slate-900 block font-bold uppercase tracking-wider">
                Auditoría Técnica y Legal
              </strong>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-1.5 bg-indigo-50/60 rounded border border-indigo-100">
                  <span className="text-indigo-900 font-bold block">Sellos Gris y Blanca</span>
                  <span className="text-slate-600">Norma MA-SIG-CAL-001: <strong>11 aprobados, 2 observados</strong>.</span>
                </div>
                <div className="p-1.5 bg-emerald-50/60 rounded border border-emerald-100">
                  <span className="text-emerald-900 font-bold block">CTO Ley 1796</span>
                  <span className="text-slate-600">Alerta crítica: <strong>Pruebas de estanqueidad pendientes</strong>.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Firmas de Interventoría Formal para Aconex */}
        <div className="border-t border-slate-300 pt-4 mt-6">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div>
                <strong className="block text-slate-900 font-bold">Ing. Juan Pablo Morales</strong>
                <span className="text-[10px] text-slate-500 block">Residente de Interventoría</span>
                <span className="text-[9px] text-slate-400 font-mono">T.P. 25202-145899 CND</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div>
                <strong className="block text-slate-900 font-bold">Ing. Óscar Tapias</strong>
                <span className="text-[10px] text-slate-500 block">Supervisión Técnica (Aconex)</span>
                <span className="text-[9px] text-slate-400 font-mono">T.P. 68202-098712 STD</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <div>
                <strong className="block text-slate-900 font-bold">Ing. Rubén Darío Ortega</strong>
                <span className="text-[10px] text-slate-500 block">Director Nacional de Interventoría</span>
                <span className="text-[9px] text-slate-400 font-mono">Marval S.A.S.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
