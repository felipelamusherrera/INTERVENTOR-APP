import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Building2, 
  HelpCircle, 
  Filter, 
  Search, 
  ChevronRight,
  ExternalLink,
  Award,
  Calendar,
  AlertCircle,
  FileCheck2,
  Hourglass,
  Layers
} from 'lucide-react';
import { CtoCriterion, CtoTowerStatus, CtoPendingItem, Sucursal, EstadoRevisionSupervisor } from '../../types';
import { ctoCriteriaCatalog, ctoTowersStatus, ctoPendingItems } from '../../data/mockData';
import { GerenciaService } from '../../services/gerenciaService';

export const CtoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gerencial' | 'torres' | 'pendientes' | 'criterios'>('gerencial');
  const [selectedMes, setSelectedMes] = useState<string>('2026-11');
  const [filtroSucursal, setFiltroSucursal] = useState<Sucursal>('TODAS');

  // Estados de Filtro de Criterios y Catálogo
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedResp, setSelectedResp] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [criteria, setCriteria] = useState<CtoCriterion[]>(ctoCriteriaCatalog);

  // Consolidado Gerencial de CTO
  const consolidadoCto = useMemo(() => {
    return GerenciaService.getConsolidadoCto(selectedMes, filtroSucursal);
  }, [selectedMes, filtroSucursal]);

  const categories = [
    'TODAS',
    '1. Planos Récord',
    '2. Constancia del Geotecnista',
    '3. Procedencia de Materiales',
    '4. Especificaciones Técnicas',
    '5. Programa de Calidad',
    '6. Elementos No Estructurales'
  ];

  const toggleCriteriaStatus = (num: number) => {
    setCriteria(prev => prev.map(c => {
      if (c.num !== num) return c;
      const nextStatus: Record<string, CtoCriterion['cumple']> = {
        'SÍ': 'NO',
        'NO': 'EN TRÁMITE',
        'EN TRÁMITE': 'NO APLICA',
        'NO APLICA': 'SÍ'
      };
      return {
        ...c,
        cumple: nextStatus[c.cumple] || 'SÍ'
      };
    }));
  };

  const filteredCriteria = criteria.filter(c => {
    const matchCat = selectedCategory === 'TODAS' || c.categoria === selectedCategory;
    const matchResp = selectedResp === 'TODOS' || c.responsable === selectedResp;
    const matchSearch = c.criterio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchResp && matchSearch;
  });

  const totalCriteria = criteria.length;
  const compliedCriteria = criteria.filter(c => c.cumple === 'SÍ').length;
  const pendingCriteria = criteria.filter(c => c.cumple === 'NO' || c.cumple === 'EN TRÁMITE').length;
  const globalCompliance = Math.round((compliedCriteria / totalCriteria) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner Gerencial */}
      <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo 09 · Certificado Técnico de Ocupación (CTO) · Ley 1796 de 2016</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tablero Gerencial de Madurez y Alistamiento CTO</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {activeTab === 'gerencial' ? 'Visión Ejecutiva Multi-Torre' : 'Auditoría Técnica'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Control de requisitos legales para escrituración y radicación RPH: <strong>3 Fases del Supervisor Técnico</strong>, semáforo de alistamiento a 12m/6m/3m y <strong>áreas comunes esenciales obligatorias para Torre 1</strong>.
          </p>
        </div>

        {/* Global CTO Stats */}
        <div className="flex items-center space-x-3 text-xs tabular-nums self-start md:self-center">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Madurez Promedio</span>
            <span className="text-lg font-extrabold text-emerald-700">
              {consolidadoCto.madurezPromedioPorSucursal[filtroSucursal]}%
            </span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-red-600 font-semibold block uppercase">Torres en Riesgo &le; 3m</span>
            <span className="text-lg font-extrabold text-red-600">{consolidadoCto.torresEnRiesgoCritico}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-blue-600 font-semibold block uppercase">Torres Auditadas</span>
            <span className="text-lg font-extrabold text-blue-700">{consolidadoCto.torresEnSeguimiento}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-lg space-x-1 text-xs font-bold max-w-fit">
        <button
          onClick={() => setActiveTab('gerencial')}
          className={`px-4 py-1.5 rounded-md transition ${
            activeTab === 'gerencial' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tablero Ejecutivo Gerencial
        </button>
        <button
          onClick={() => setActiveTab('torres')}
          className={`px-4 py-1.5 rounded-md transition ${
            activeTab === 'torres' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Programación de Torres ({ctoTowersStatus.length})
        </button>
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`px-4 py-1.5 rounded-md transition ${
            activeTab === 'pendientes' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cuellos de Botella ({ctoPendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('criterios')}
          className={`px-4 py-1.5 rounded-md transition ${
            activeTab === 'criterios' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Catálogo Maestro (56 Criterios)
        </button>
      </div>

      {/* TAB GERENCIAL: Consolidado Ejecutivo Multi-Proyecto */}
      {activeTab === 'gerencial' && (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Mes de Análisis:</span>
                <select
                  value={selectedMes}
                  onChange={(e) => setSelectedMes(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2026-11">Noviembre 2026 (Mes Actual)</option>
                  <option value="2026-10">Octubre 2026</option>
                  <option value="2026-09">Septiembre 2026</option>
                  <option value="ACUMULADO_2026">Acumulado Anual 2026</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Sucursal / Regional:</span>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value as Sucursal)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TODAS">Todas las Sucursales (Nacional)</option>
                  <option value="CALI">Sucursal Cali</option>
                  <option value="BUCARAMANGA">Sucursal Bucaramanga</option>
                  <option value="BOGOTA">Sucursal Bogotá</option>
                  <option value="BARRANQUILLA">Sucursal Barranquilla</option>
                  <option value="CARTAGENA">Sucursal Cartagena</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Alerta Alistamiento Inminente: <strong className="text-red-600">{consolidadoCto.alertasCriticasAlistamiento.length} proyectos</strong></span>
            </div>
          </div>

          {/* 3 Fases del Supervisor Técnico (Estandarización Solicitada) */}
          <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Estado Documental en las 3 Fases del Supervisor Técnico Independiente</span>
              </h3>
              <p className="text-xs text-slate-400">
                Flujo oficial de auditoría: 1. Entrega por Ingeniería &rarr; 2. En Trámite de Revisión &rarr; 3. Aprobación Técnica Formal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fase 1 */}
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-red-700">Fase 1 · En Espera / Incumplimiento</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-red-100 text-red-800">
                    {consolidadoCto.distribucionFasesSupervisor['1_ENTREGA_RESPUESTA_INGENIERIA']} ítems
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-red-950">
                  Entrega / Respuesta por Ingeniería
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  El supervisor técnico ha notificado observaciones que aún no han sido radicadas o subsanadas por el equipo de obra o diseño.
                </p>
              </div>

              {/* Fase 2 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Fase 2 · En Trámite</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-100 text-amber-800">
                    {consolidadoCto.distribucionFasesSupervisor['2_REVISION_SUPERVISOR_PENDIENTE']} ítems
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-amber-950">
                  Revisión de Supervisor Pendiente
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Documentación radicada ante la firma de supervisión técnica externa y actualmente en proceso de validación o muestreo.
                </p>
              </div>

              {/* Fase 3 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Fase 3 · Aprobado Formal</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-100 text-emerald-800">
                    {consolidadoCto.distribucionFasesSupervisor['3_APROBACION_SUPERVISOR_TECNICO']} ítems
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  Aprobación de Supervisor Técnico
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Criterio con visto bueno técnico, firma del supervisor independiente y acta de inspección lista para anexar al expediente RPH.
                </p>
              </div>
            </div>
          </div>

          {/* Grilla 2 Cols: Alertas Críticas de Alistamiento por Torre + Áreas Comunes Esenciales Torre 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas Críticas: Torres <= 3 meses con madurez < 85% */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Torres en Riesgo Inminente (&le; 3 Meses para Alistamiento)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Torres con madurez &lt; 85% que pueden retrasar la escrituración y entrega a clientes.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  Semáforo Rojo
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {consolidadoCto.alertasCriticasAlistamiento.map((alerta, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 text-xs font-bold block">{alerta.proyecto}</strong>
                        <span className="text-[11px] text-red-700 font-semibold">{alerta.torre} ({alerta.sucursal})</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">
                          Faltan {alerta.mesesParaAlistamiento} meses
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">Madurez: {alerta.indiceMadurez}%</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-red-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Ítems críticos sin resolver: <strong className="text-red-700">{alerta.itemsCriticosPendientes}</strong></span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Responsables causantes:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {alerta.responsablesIncumplimiento.map((r, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Áreas Comunes Esenciales de Torre 1 (Regla Ley 1796) */}
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Áreas Comunes Esenciales Obligatorias (Torre 1)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sistemas vitales que deben estar 100% operativos para expedir el primer CTO del conjunto.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Ley 1796
                </span>
              </div>

              <div className="space-y-2.5 pt-1 overflow-y-auto max-h-[380px] pr-1">
                {consolidadoCto.zonasComunesTorre1.map((item, idx) => {
                  const isBloqueante = item.estado === 'BLOQUEANTE';
                  const isDone = item.estado === 'COMPLETADO';

                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isBloqueante
                          ? 'border-red-200 bg-red-50/50'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{item.zonaComun}</strong>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          isBloqueante ? 'bg-red-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {item.estado}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${isBloqueante ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${item.avancePct}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Avance certificación: <strong>{item.avancePct}%</strong></span>
                        <span className="text-[10px] text-slate-400">{item.impactoTorre1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Estado y Programación de Torres */}
      {activeTab === 'torres' && (
        <div className="space-y-4">
          <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Proyecto / Torre</th>
                    <th className="py-2.5 px-2">Gerente Proy.</th>
                    <th className="py-2.5 px-2">Director Obra</th>
                    <th className="py-2.5 px-2">Interventor</th>
                    <th className="py-2.5 px-2">Inicio Informe CTO</th>
                    <th className="py-2.5 px-2">Alistamiento</th>
                    <th className="py-2.5 px-2">Prog. RPH</th>
                    <th className="py-2.5 px-2 text-center">Días RPH</th>
                    <th className="py-2.5 px-2 text-center">Cumplimiento %</th>
                    <th className="py-2.5 px-3 text-center">Estado CTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {ctoTowersStatus.map((t) => {
                    const isExpedido = t.estadoCTO === 'Expedido';
                    const isRisk = t.estadoCTO === 'En Riesgo';

                    return (
                      <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">{t.proyecto}</strong>
                          <span className="text-[10px] text-emerald-700 font-semibold">{t.torre}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-600">{t.gerente}</td>
                        <td className="py-3 px-2 text-slate-600">{t.director}</td>
                        <td className="py-3 px-2 text-slate-600 font-medium">{t.interventor}</td>
                        <td className="py-3 px-2 text-slate-600">{t.fechaInformeCTO || '-'}</td>
                        <td className="py-3 px-2 text-slate-600">{t.fechaAlistamiento || '-'}</td>
                        <td className="py-3 px-2 text-slate-600">{t.fechaRPH || '-'}</td>
                        <td className={`py-3 px-2 text-center font-bold ${
                          t.diasParaRPH < 0 ? 'text-red-600' : 'text-slate-700'
                        }`}>
                          {t.diasParaRPH < 0 ? `${t.diasParaRPH}d` : `+${t.diasParaRPH}d`}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <span className="font-extrabold text-emerald-700">
                              {t.porcentajeCumplimiento}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isExpedido ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isRisk ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {t.estadoCTO}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Matriz de Pendientes y Cuellos de Botella */}
      {activeTab === 'pendientes' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 font-bold">Cuello de Botella Recurrente Detectado en Marval:</strong>
              <span>
                Los principales motivos de bloqueo para expedición de CTO en auditoría son: <strong>1) Pruebas de estanqueidad de tanques y piscinas sin realizar</strong>, <strong>2) Falta de planos de taller K.4 y memorias de cálculo para ventanería y barandas</strong>, y <strong>3) Ausencia de diseños de mezcla de morteros</strong>.
              </span>
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Proyecto / Torre</th>
                    <th className="py-2.5 px-2">Planos Récord</th>
                    <th className="py-2.5 px-2">Geotecnia</th>
                    <th className="py-2.5 px-2">Materiales</th>
                    <th className="py-2.5 px-2">Especificac.</th>
                    <th className="py-2.5 px-2">Prog. Calidad</th>
                    <th className="py-2.5 px-2">ENOES</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Hallazgo / Requisito Crítico Pendiente</th>
                    <th className="py-2.5 px-2 text-center">Ítems Abiertos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ctoPendingItems.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900 block font-bold">{p.proyecto}</strong>
                        <span className="text-[10px] text-slate-500 font-semibold">{p.torre}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.planosRecord.includes('CUMPLE') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.planosRecord.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.geotecnia.includes('CUMPLE') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.geotecnia.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.materiales.includes('CUMPLE') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.materiales.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CUMPLE
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.programaCalidad.includes('CRÍTICO') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.programaCalidad.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.enoes.includes('CRÍTICO') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.enoes.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed font-medium">
                        {p.observacionCritica}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-red-600 tabular-nums">
                        {p.itemsAbiertos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Catálogo Maestro de 56 Criterios */}
      {activeTab === 'criterios' && (
        <div className="space-y-4">
          <div className="bg-white border border-surface-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar criterio o palabra clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 md:w-64 text-xs"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[210px]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedResp}
                onChange={(e) => setSelectedResp(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos los Responsables</option>
                <option value="A cargo del Proyecto">A cargo del Proyecto (Blanco)</option>
                <option value="A cargo de la Supervisión">A cargo de la Supervisión (Gris)</option>
              </select>
            </div>

            <span className="text-slate-500 text-xs font-semibold tabular-nums">
              Mostrando {filteredCriteria.length} de {criteria.length} criterios
            </span>
          </div>

          <div className="bg-white border border-surface-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">N°</th>
                    <th className="py-2.5 px-3">Categoría CTO</th>
                    <th className="py-2.5 px-3 min-w-[340px]">Criterio de Evaluación / Requisito Documental</th>
                    <th className="py-2.5 px-3">Responsable Documental</th>
                    <th className="py-2.5 px-2">Hito Relacionado</th>
                    <th className="py-2.5 px-2">Normativa</th>
                    <th className="py-2.5 px-3 text-center">Cumple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCriteria.map((c) => {
                    const isSupervisor = c.responsable.includes('Supervisión');

                    return (
                      <tr 
                        key={c.num}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSupervisor ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">{c.num}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{c.categoria}</td>
                        <td className="py-2.5 px-3 text-slate-700 leading-relaxed font-medium">
                          {c.criterio}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isSupervisor ? 'bg-slate-200 text-slate-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {c.responsable}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-500">{c.hito}</td>
                        <td className="py-2.5 px-2 text-slate-400 text-[10px]">{c.norma}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCriteriaStatus(c.num)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition shadow-sm ${
                              c.cumple === 'SÍ' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                              c.cumple === 'NO' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                              c.cumple === 'EN TRÁMITE' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                              'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Haga clic para alternar estado de cumplimiento"
                          >
                            {c.cumple}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
