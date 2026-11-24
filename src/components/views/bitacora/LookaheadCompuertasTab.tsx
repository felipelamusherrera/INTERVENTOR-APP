import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  FileCheck,
  Truck,
  FileText,
  HardHat,
  Flame,
  Lock,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  LookaheadRestriccionItem,
  LookaheadGate,
  HitoMacro,
  Sucursal,
  TipoContratacionSLA,
} from '../../../types';
import {
  BaselineService,
  RESTRICCIONES_LOOKAHEAD,
  SemanaCorteInfo,
  safeLocalStorageSet,
} from '../../../services/baselineService';
import { AcuerdosServicioEngine } from '../../../services/acuerdosServicioEngine';
import { ScheduleService } from '../../../services/scheduleService';
import { CpmEngine } from '../../../services/cpmEngine';
import {
  MacroMilestoneService,
  HITO_MACRO_LABELS,
  getTipoContratoByCodigoCpc,
  isAlistamientoCodigoCpc,
  mapOfficialHitoToLegacyEnum,
} from '../../../services/macroMilestoneService';
import { ContratistaSelector } from '../../common/ContratistaSelector';

interface LookaheadCompuertasTabProps {
  proyectoId: string;
  sucursal: Sucursal;
  residenteNombre: string;
  mode?: 'GESTION_RESTRICCIONES' | 'MATRIZ_OPERATIVA';
  fechaCorteActiva?: string;
  compuertasIniciales?: LookaheadRestriccionItem[];
}

interface ResumenLookaheadSource {
  edt: string;
  nombre: string;
  codigoCpc?: string;
  agrupacion: string;
  hitoMacroLabel: string;
  hitoMacroEnum: HitoMacro;
  fechaInicioLB: string;
  fechaFinLB: string;
  avancePct: number;
  esCritica: boolean;
  responsable: string;
  esManoObra: boolean;
  tipoContrato: TipoContratacionSLA;
}

interface GateWithWindow extends LookaheadGate {
  agrupacion: string;
  hitoMacroLabel: string;
  hitoMacroEnum: HitoMacro;
  fechaInicioLB: string;
  fechaActivacion: string;
  semanaActivacion: SemanaCorteInfo;
  semanasSinSolucionar: number;
  autoLiberadaPorAvance?: boolean;
  avancePct?: number;
}

interface SlaWithWindow extends LookaheadRestriccionItem {
  agrupacion: string;
  hitoMacroLabel: string;
  semanaActivacion: SemanaCorteInfo;
  semanasSinSolucionar: number;
  autoLiberadaPorAvance?: boolean;
  avancePct?: number;
}

interface SlaUserOverride {
  causaBloqueo?: string;
  planAccion?: string;
  responsableGestion?: string;
  fechaCierreReal?: string;
}

type OfficialGateKey =
  | 'diseno'
  | 'contratacion'
  | 'predecesora'
  | 'materiales'
  | 'equipos'
  | 'sstAmbiental';

const OFFICIAL_6_GATES: Array<{ key: OfficialGateKey; label: string }> = [
  { key: 'diseno', label: 'Diseños' },
  { key: 'contratacion', label: 'Contrato' },
  { key: 'predecesora', label: 'Actividad Predecesora' },
  { key: 'materiales', label: 'Materiales' },
  { key: 'equipos', label: 'Equipo y formaleta' },
  { key: 'sstAmbiental', label: 'Ingreso personal - SST' },
];

const TIPO_RESTRICCION_LABELS: Record<LookaheadRestriccionItem['tipoCompuerta'], string> = {
  CONTRATOS: 'Contrato',
  MATERIALES_INVENTORY: 'Materiales',
  EQUIPOS_FORMALETA: 'Equipo y formaleta',
  DISENOS: 'Diseños',
  SST_ACCESO_PERSONAL: 'Ingreso personal - SST',
};

const KEY_SLA_STATE_PREFIX = 'marval_pco_lookahead_sla_v3_';

function calcWeeksUnresolved(
  activacionLunesStr: string,
  refLunesStr: string,
  isResolved: boolean
): number {
  if (isResolved || !activacionLunesStr || !refLunesStr) return 0;
  const actMs = new Date(`${activacionLunesStr}T12:00:00`).getTime();
  const refMs = new Date(`${refLunesStr}T12:00:00`).getTime();
  if (isNaN(actMs) || isNaN(refMs) || refMs <= actMs) return 0;
  return Math.max(0, Math.round((refMs - actMs) / (7 * 86400000)));
}

function loadSlaOverrides(proyectoId: string): Record<string, SlaUserOverride> {
  if (!proyectoId) return {};
  try {
    const raw = localStorage.getItem(`${KEY_SLA_STATE_PREFIX}${proyectoId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function evaluateSlaItem(
  gate: SlaWithWindow | LookaheadRestriccionItem,
  refFechaCorteStr: string
): { estado: 'BLOQUEADA' | 'EN_GESTION' | 'LIBERADA' | 'VENCIDA_CRITICA'; diasDesviacionSLA: number } {
  if ('autoLiberadaPorAvance' in gate && gate.autoLiberadaPorAvance) {
    return { estado: 'LIBERADA', diasDesviacionSLA: 0 };
  }
  return AcuerdosServicioEngine.evaluateGateStatus(gate, refFechaCorteStr);
}

export const LookaheadCompuertasTab: React.FC<LookaheadCompuertasTabProps> = ({
  proyectoId,
  sucursal,
  residenteNombre,
  mode = 'GESTION_RESTRICCIONES',
  fechaCorteActiva,
  compuertasIniciales,
}) => {
  const isGestionMode = mode === 'GESTION_RESTRICCIONES';
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scheduleVersion, setScheduleVersion] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const bump = () => setScheduleVersion((v) => v + 1);
    window.addEventListener('schedule_updated', bump);
    window.addEventListener('marval_wbs_assignments_updated', bump);
    window.addEventListener('marval_baseline_updated', bump);
    window.addEventListener('marval_lookahead_updated', bump);
    window.addEventListener('marval_bitacora_reporte_cerrado', bump);
    return () => {
      window.removeEventListener('schedule_updated', bump);
      window.removeEventListener('marval_wbs_assignments_updated', bump);
      window.removeEventListener('marval_baseline_updated', bump);
      window.removeEventListener('marval_lookahead_updated', bump);
      window.removeEventListener('marval_bitacora_reporte_cerrado', bump);
    };
  }, []);

  // =========================================================================
  // FUENTE REAL DE TAREAS RESUMEN DESDE SÁBANA CONGELADA (ZERO DATOS FICTICIOS)
  // =========================================================================
  const { resumenesBase, cortesSubidos } = useMemo(() => {
    if (!proyectoId) {
      return { resumenesBase: [] as ResumenLookaheadSource[], cortesSubidos: [] as SemanaCorteInfo[] };
    }

    const activeSchedule = ScheduleService.getActiveSchedule(proyectoId);
    const cortes = ScheduleService.getCortes(proyectoId);
    const assignments = ScheduleService.getWbsAssignments(proyectoId);

    const cortesSem = cortes.map((c) => BaselineService.getSemanaCorte(c.fechaCorte));

    if (!activeSchedule || activeSchedule.length === 0) {
      return { resumenesBase: [] as ResumenLookaheadSource[], cortesSubidos: cortesSem };
    }

    const cpm = CpmEngine.computeSchedule(activeSchedule as any[]);
    const rollup = CpmEngine.buildThreeLevelRollup({
      cpmTasks: cpm.tasks,
      hitoByEdt: assignments.hitoByEdt,
    });

    const resumenList: ResumenLookaheadSource[] = [];
    const seenEdts = new Set<string>();

    // Nivel 2 del Rollup = Tareas Resumen oficiales (por Agrupación / Punto de Control)
    // Excluir ALISTAMIENTO (CPC 603510 / milestone) ya que no tiene acuerdos de servicio
    rollup.hitosMacro.forEach((hm) => {
      hm.resumenes.forEach((res) => {
        if (
          isAlistamientoCodigoCpc(res.codigoCpc) ||
          res.tipo === 'milestone' ||
          /alistamiento/i.test(res.hitoMacro || '') ||
          /alistamiento/i.test(res.nombre || '')
        ) {
          return;
        }

        const key = `${res.edt}::${res.agrupacion}`;
        if (seenEdts.has(key)) return;
        seenEdts.add(key);

        const hitoEnum =
          mapOfficialHitoToLegacyEnum(res.hitoMacro) ||
          MacroMilestoneService.autoClassifyTask({
            edt: res.edt,
            nombre: res.nombre,
            agrupacion: res.agrupacion,
          }) ||
          'URBANISMO';

        const resp =
          assignments.contratistaByEdt[res.edt] ||
          res.tasks.find((t) => t.responsable)?.responsable ||
          'Por asignar AN8';

        const tipoContrato = getTipoContratoByCodigoCpc(res.codigoCpc);

        resumenList.push({
          edt: res.edt,
          nombre: res.nombre,
          codigoCpc: res.codigoCpc,
          agrupacion: res.agrupacion && res.agrupacion !== 'NO APLICA' ? res.agrupacion : 'GENERAL',
          hitoMacroLabel: res.hitoMacro,
          hitoMacroEnum: hitoEnum,
          fechaInicioLB: res.comienPrev || res.comien,
          fechaFinLB: res.finPrev || res.fin,
          avancePct: res.avancePct,
          esCritica: res.esCritica,
          responsable: resp,
          esManoObra: tipoContrato === 'MANO_OBRA_22D',
          tipoContrato,
        });
      });
    });

    // Fallback si una sábana no tiene códigos CPC asignados: usar Tareas Resumen (project) con tareas "task" directas
    if (resumenList.length === 0) {
      const childrenByEdt = new Map<string, typeof cpm.tasks>();
      cpm.tasks.forEach((t) => {
        if (t.type !== 'task' || !t.edt.includes('.')) return;
        const parentEdt = t.edt.split('.').slice(0, -1).join('.');
        if (!childrenByEdt.has(parentEdt)) childrenByEdt.set(parentEdt, []);
        childrenByEdt.get(parentEdt)!.push(t);
      });

      cpm.tasks.forEach((t) => {
        const directTasks = childrenByEdt.get(t.edt);
        if (t.type !== 'project' || !directTasks || directTasks.length === 0) return;

        const cpc = String(t.codigoPlaneacion || '').trim();
        const hitoAsig = assignments.hitoByEdt[t.edt];
        if (
          isAlistamientoCodigoCpc(cpc) ||
          /alistamiento/i.test(hitoAsig || '') ||
          /alistamiento/i.test(t.nombre || '')
        ) {
          return;
        }

        const hitoEnum =
          mapOfficialHitoToLegacyEnum(hitoAsig) ||
          MacroMilestoneService.autoClassifyTask({
            edt: t.edt,
            nombre: t.nombre,
            agrupacion: t.agrupacion,
          }) ||
          'URBANISMO';

        const isCrit = directTasks.some((ch) => ch.esCritica) || t.esCritica;
        const anyStarted = directTasks.some((ch) => Number(ch.w || 0) > 0) || Number(t.w || 0) > 0;
        const rawAvance = Number(((t.w || 0) * 100).toFixed(1));
        const tipoContrato = getTipoContratoByCodigoCpc(cpc);
        resumenList.push({
          edt: t.edt,
          nombre: t.nombre,
          codigoCpc: cpc || undefined,
          agrupacion: t.agrupacion && t.agrupacion !== 'NO APLICA' ? t.agrupacion : 'GENERAL',
          hitoMacroLabel: hitoAsig || HITO_MACRO_LABELS[hitoEnum],
          hitoMacroEnum: hitoEnum,
          fechaInicioLB: t.comienPrev || t.comien,
          fechaFinLB: t.finPrev || t.fin,
          avancePct: rawAvance > 0 ? rawAvance : anyStarted ? 0.1 : 0,
          esCritica: isCrit,
          responsable: assignments.contratistaByEdt[t.edt] || 'Por asignar AN8',
          esManoObra: tipoContrato === 'MANO_OBRA_22D',
          tipoContrato,
        });
      });
    }

    return { resumenesBase: resumenList, cortesSubidos: cortesSem };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId, scheduleVersion]);

  // Lista de agrupaciones reales del proyecto para filtro en ambas vistas
  const agrupacionesDisponibles = useMemo(() => {
    const set = new Set<string>();
    resumenesBase.forEach((r) => {
      if (r.agrupacion && r.agrupacion !== 'NO APLICA') {
        set.add(r.agrupacion);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [resumenesBase]);

  // Ventanas/Cortes disponibles (Cortes reales + semanas donde inicia el seguimiento de restricciones)
  const ventanasDisponibles = useMemo(() => {
    const map = new Map<string, SemanaCorteInfo>();
    cortesSubidos.forEach((s) => map.set(s.lunesStr, s));

    if (fechaCorteActiva) {
      const s = BaselineService.getSemanaCorte(fechaCorteActiva);
      map.set(s.lunesStr, s);
    }

    resumenesBase.forEach((r) => {
      if (!r.fechaInicioLB) return;
      // Ventana estándar de seguimiento (6 semanas antes de Inicio LB + disparo de Contrato y Diseños)
      const dispLookahead = AcuerdosServicioEngine.addDays(r.fechaInicioLB, -42);
      const sem6 = BaselineService.getSemanaCorte(dispLookahead);
      map.set(sem6.lunesStr, sem6);

      if (r.tipoContrato !== 'NO_APLICA') {
        const dispContrato = AcuerdosServicioEngine.calculateGateDates({
          fechaInicioLB: r.fechaInicioLB,
          tipoCompuerta: 'CONTRATOS',
          tipoContratacion: r.tipoContrato,
        }).fechaDisparoRequerida;
        const semContrato = BaselineService.getSemanaCorte(dispContrato);
        map.set(semContrato.lunesStr, semContrato);
      }

      const dispDiseno = AcuerdosServicioEngine.calculateGateDates({
        fechaInicioLB: r.fechaInicioLB,
        tipoCompuerta: 'DISENOS',
      }).fechaDisparoRequerida;
      const semDiseno = BaselineService.getSemanaCorte(dispDiseno);
      map.set(semDiseno.lunesStr, semDiseno);
    });

    return Array.from(map.values()).sort((a, b) => a.lunesStr.localeCompare(b.lunesStr));
  }, [cortesSubidos, fechaCorteActiva, resumenesBase]);

  const defaultVentanaLunes = useMemo(() => {
    if (fechaCorteActiva) {
      return BaselineService.getSemanaCorte(fechaCorteActiva).lunesStr;
    }
    if (cortesSubidos.length > 0) {
      return cortesSubidos[cortesSubidos.length - 1].lunesStr;
    }
    return BaselineService.getSemanaCorte(new Date()).lunesStr;
  }, [fechaCorteActiva, cortesSubidos]);

  const [filtroCorteVentana, setFiltroCorteVentana] = useState<string>(defaultVentanaLunes);
  const [modoVentana, setModoVentana] = useState<'ACTIVAS_EN_VENTANA' | 'INICIAN_EN_VENTANA'>('ACTIVAS_EN_VENTANA');
  const [filtroAgrupacion, setFiltroAgrupacion] = useState<string>('TODAS');
  const [filtroHitoMacro, setFiltroHitoMacro] = useState<string>('TODOS');
  const [filtroTareaResumen, setFiltroTareaResumen] = useState<string>('TODAS');

  useEffect(() => {
    if (fechaCorteActiva) {
      setFiltroCorteVentana(BaselineService.getSemanaCorte(fechaCorteActiva).lunesStr);
    }
  }, [fechaCorteActiva]);

  const refLunesActual =
    filtroCorteVentana !== 'TODAS' ? filtroCorteVentana : defaultVentanaLunes;
  const refFechaCorteStr = useMemo(
    () => AcuerdosServicioEngine.addDays(refLunesActual, 5), // Sábado de la ventana seleccionada
    [refLunesActual]
  );

  // Listas dinámicas para filtros de Punto de Control y Tarea Resumen
  const hitosMacroDisponibles = useMemo(() => {
    const set = new Set<string>();
    resumenesBase.forEach((r) => {
      const label = r.hitoMacroLabel || HITO_MACRO_LABELS[r.hitoMacroEnum];
      if (label) set.add(label);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [resumenesBase]);

  const tareasResumenDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    resumenesBase.forEach((r) => {
      if (filtroHitoMacro !== 'TODOS') {
        const label = r.hitoMacroLabel || HITO_MACRO_LABELS[r.hitoMacroEnum];
        if (label !== filtroHitoMacro) return;
      }
      if (filtroAgrupacion !== 'TODAS' && r.agrupacion !== filtroAgrupacion) return;
      if (!map.has(r.edt)) {
        map.set(r.edt, `[${r.edt}] ${r.nombre}`);
      }
    });
    return Array.from(map.entries())
      .map(([edt, label]) => ({ edt, label }))
      .sort((a, b) => a.edt.localeCompare(b.edt, undefined, { numeric: true }));
  }, [resumenesBase, filtroHitoMacro, filtroAgrupacion]);

  // =========================================================================
  // VISTA A: MATRIZ OPERATIVA DE 6 SEMANAS (MÓDULO REPORTE DE RESTRICCIONES LEAN)
  // =========================================================================
  const [filterMode, setFilterMode] = useState<'TODOS' | 'CRITICOS' | 'BITACORA' | 'BLOQUEADOS'>('TODOS');
  const [searchTermMatrix, setSearchTermMatrix] = useState('');
  const [selectedGateItem, setSelectedGateItem] = useState<
    (GateWithWindow & { fechaCompromiso?: string }) | null
  >(null);
  const [gestionNotas, setGestionNotas] = useState('');
  const [gestionResponsable, setGestionResponsable] = useState('');
  const [gestionFechaCompromiso, setGestionFechaCompromiso] = useState('');
  const [resolucionesTick, setResolucionesTick] = useState(0);

  const resolucionesSaved = useMemo(
    () => BaselineService.getResolucionesLookahead(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolucionesTick, scheduleVersion]
  );

  // Consolidar Tareas Resumen en la Matriz Operativa de 6 Semanas (6 restricciones oficiales)
  const matrixGates: GateWithWindow[] = useMemo(() => {
    const bitacoraFeed = BaselineService.getRestriccionesLookaheadFeed(proyectoId);

    const gatesFromResumen: GateWithWindow[] = resumenesBase
      .filter((r) => Boolean(r.fechaInicioLB))
      .map((r) => {
        const gateId = `resumen-gate-${proyectoId}-${r.edt}-${r.agrupacion}`;
        const fechaActivacion = AcuerdosServicioEngine.addDays(r.fechaInicioLB, -42);
        const semanaActivacion = BaselineService.getSemanaCorte(fechaActivacion);

        // Revisar si alguna tarea hija falló en Bitácora para asociar bloqueo automático a la Tarea Resumen
        const matchingBitacora = bitacoraFeed.filter(
          (b) => b.edt === r.edt || (b.edt && b.edt.startsWith(`${r.edt}.`))
        );

        const defaultGates: LookaheadGate['gates'] = {
          diseno: true,
          contratacion: true,
          predecesora: true,
          materiales: true,
          manoObra: true,
          equipos: true,
          sstAmbiental: true,
        };

        matchingBitacora.forEach((b) => {
          if (!b.gates.diseno) defaultGates.diseno = false;
          if (!b.gates.contratacion || !b.gates.manoObra) defaultGates.contratacion = false;
          if (!b.gates.predecesora) defaultGates.predecesora = false;
          if (!b.gates.materiales) defaultGates.materiales = false;
          if (!b.gates.equipos) defaultGates.equipos = false;
          if (!b.gates.sstAmbiental) defaultGates.sstAmbiental = false;
        });

        const yaIniciadaPorAvance = r.avancePct > 0;
        const res = resolucionesSaved[gateId];
        const finalGates: LookaheadGate['gates'] = yaIniciadaPorAvance
          ? {
              diseno: true,
              contratacion: true,
              predecesora: true,
              materiales: true,
              manoObra: true,
              equipos: true,
              sstAmbiental: true,
            }
          : res?.gates
            ? { ...defaultGates, ...res.gates }
            : defaultGates;

        const official6Ok = OFFICIAL_6_GATES.filter((og) => finalGates[og.key]).length;
        const ip = Math.round((official6Ok / 6) * 100);
        const isLiberado = yaIniciadaPorAvance || ip >= 100 || res?.estadoGestion === 'LIBERADO';
        const hasBitacoraAlert = !yaIniciadaPorAvance && matchingBitacora.length > 0;
        const semanasSinSolucionar = calcWeeksUnresolved(
          semanaActivacion.lunesStr,
          refLunesActual,
          isLiberado
        );

        return {
          id: gateId,
          edt: r.edt,
          actividad: r.nombre,
          frente: r.agrupacion,
          agrupacion: r.agrupacion,
          hitoMacroLabel: r.hitoMacroLabel || HITO_MACRO_LABELS[r.hitoMacroEnum],
          hitoMacroEnum: r.hitoMacroEnum,
          semana: semanaActivacion.etiquetaSemana,
          fechaInicioLB: r.fechaInicioLB,
          fechaActivacion,
          semanaActivacion,
          semanasSinSolucionar,
          autoLiberadaPorAvance: yaIniciadaPorAvance,
          avancePct: r.avancePct,
          responsable: res?.responsableGestion || r.responsable,
          esCritica: r.esCritica,
          origen: hasBitacoraAlert ? 'BITACORA_CAMPO' : 'PLANIFICACION',
          observaciones:
            res?.notasGestion ||
            (yaIniciadaPorAvance
              ? `Liberada automáticamente por avance (${r.avancePct}%)`
              : hasBitacoraAlert
                ? matchingBitacora.map((m) => m.restriccionPrincipal).filter(Boolean).join(', ')
                : ''),
          restriccionPrincipal: matchingBitacora[0]?.restriccionPrincipal,
          estadoGestion: isLiberado ? 'LIBERADO' : res?.estadoGestion || 'PENDIENTE',
          gates: finalGates,
          indicePreparacion: ip,
        };
      });

    return gatesFromResumen;
  }, [resumenesBase, proyectoId, resolucionesSaved, refLunesActual]);

  const toggleGate = (itemId: string, gateKey: OfficialGateKey) => {
    const item = matrixGates.find((m) => m.id === itemId);
    if (!item) return;
    const newGates = { ...item.gates, [gateKey]: !item.gates[gateKey] };
    const trueCount = OFFICIAL_6_GATES.filter((og) => newGates[og.key]).length;
    const newIp = Math.round((trueCount / 6) * 100);

    BaselineService.guardarResolucionLookahead(itemId, {
      gates: newGates,
      estadoGestion: newIp >= 100 ? 'LIBERADO' : 'EN_GESTION',
    });
    setResolucionesTick((v) => v + 1);
  };

  const handleGuardarGestion = () => {
    if (!selectedGateItem) return;
    BaselineService.guardarResolucionLookahead(selectedGateItem.id, {
      estadoGestion: 'EN_GESTION',
      notasGestion: gestionNotas,
      responsableGestion: gestionResponsable || selectedGateItem.responsable,
      fechaCompromiso: gestionFechaCompromiso || undefined,
    });
    showToast(`Plan de acción guardado para "${selectedGateItem.actividad}".`);
    setSelectedGateItem(null);
    setGestionNotas('');
    setGestionResponsable('');
    setGestionFechaCompromiso('');
    setResolucionesTick((v) => v + 1);
  };

  const handleLiberarTodas = (item: GateWithWindow) => {
    const allTrue: LookaheadGate['gates'] = {
      diseno: true,
      contratacion: true,
      predecesora: true,
      materiales: true,
      manoObra: true,
      equipos: true,
      sstAmbiental: true,
    };
    BaselineService.guardarResolucionLookahead(item.id, {
      gates: allTrue,
      estadoGestion: 'LIBERADO',
      notasGestion: gestionNotas || 'Restricciones liberadas en comité LEAN.',
      responsableGestion: gestionResponsable || item.responsable,
      fechaCompromiso: gestionFechaCompromiso || undefined,
    });
    showToast(`¡Todas las restricciones liberadas para "${item.actividad}"!`);
    setSelectedGateItem(null);
    setResolucionesTick((v) => v + 1);
  };

  const windowScopedMatrixGates = useMemo(() => {
    return matrixGates.filter((item) => {
      if (filtroAgrupacion !== 'TODAS' && item.agrupacion !== filtroAgrupacion) {
        return false;
      }
      if (filtroHitoMacro !== 'TODOS' && item.hitoMacroLabel !== filtroHitoMacro) {
        return false;
      }
      if (filtroTareaResumen !== 'TODAS' && item.edt !== filtroTareaResumen) {
        return false;
      }
      if (filtroCorteVentana !== 'TODAS') {
        if (modoVentana === 'INICIAN_EN_VENTANA') {
          if (item.semanaActivacion.lunesStr !== filtroCorteVentana) return false;
        } else {
          // Mostrar todas las activadas en esta ventana o anteriores (incluyendo liberadas)
          if (item.semanaActivacion.lunesStr > filtroCorteVentana) return false;
        }
      }
      return true;
    });
  }, [
    matrixGates,
    filtroAgrupacion,
    filtroHitoMacro,
    filtroTareaResumen,
    filtroCorteVentana,
    modoVentana,
  ]);

  const countMatrixInicianEnVentana = useMemo(() => {
    if (filtroCorteVentana === 'TODAS') return matrixGates.length;
    return matrixGates.filter(
      (i) =>
        (filtroAgrupacion === 'TODAS' || i.agrupacion === filtroAgrupacion) &&
        (filtroHitoMacro === 'TODOS' || i.hitoMacroLabel === filtroHitoMacro) &&
        (filtroTareaResumen === 'TODAS' || i.edt === filtroTareaResumen) &&
        i.semanaActivacion.lunesStr === filtroCorteVentana
    ).length;
  }, [matrixGates, filtroCorteVentana, filtroAgrupacion, filtroHitoMacro, filtroTareaResumen]);

  const filteredMatrixGates = useMemo(() => {
    return windowScopedMatrixGates.filter((item) => {
      if (searchTermMatrix) {
        const term = searchTermMatrix.toLowerCase();
        const match =
          item.actividad.toLowerCase().includes(term) ||
          item.agrupacion.toLowerCase().includes(term) ||
          (item.edt && item.edt.toLowerCase().includes(term)) ||
          item.responsable.toLowerCase().includes(term);
        if (!match) return false;
      }

      if (filterMode === 'CRITICOS') return Boolean(item.esCritica);
      if (filterMode === 'BITACORA') return item.origen === 'BITACORA_CAMPO';
      if (filterMode === 'BLOQUEADOS') return item.indicePreparacion < 75;
      return true;
    });
  }, [windowScopedMatrixGates, searchTermMatrix, filterMode]);

  const avgIp =
    windowScopedMatrixGates.length > 0
      ? Math.round(
          windowScopedMatrixGates.reduce((acc, curr) => acc + curr.indicePreparacion, 0) /
            windowScopedMatrixGates.length
        )
      : 0;
  const criticalGatesCount = windowScopedMatrixGates.filter((g) => g.indicePreparacion < 75).length;
  const bitacoraRestrictionsCount = windowScopedMatrixGates.filter(
    (g) => g.origen === 'BITACORA_CAMPO'
  ).length;
  const rutaCriticaBloqueadaCount = windowScopedMatrixGates.filter(
    (g) => g.esCritica && g.indicePreparacion < 75
  ).length;

  const gateBreakdown = useMemo(() => {
    return OFFICIAL_6_GATES.map((og) => {
      const blockedCount = windowScopedMatrixGates.filter((g) => !g.gates[og.key]).length;
      return { key: og.key, label: og.label, count: blockedCount };
    });
  }, [windowScopedMatrixGates]);

  const handleExportCSV = () => {
    const headers = [
      'EDT',
      'Tarea Resumen',
      'Agrupacion',
      'HitoMacro',
      'Ventana Activacion Inicial',
      'Semanas Sin Solucionar',
      'Responsable',
      'Criticidad',
      'IP (%)',
      ...OFFICIAL_6_GATES.map((g) => g.label),
      'Estado',
      'Observaciones',
    ];
    const rows = filteredMatrixGates.map((g) => {
      const hito = MacroMilestoneService.autoClassifyTask({
        edt: g.edt || '',
        nombre: g.actividad,
        agrupacion: g.frente,
      });
      return [
        g.edt || 'N/A',
        `"${g.actividad.replace(/"/g, '""')}"`,
        `"${g.agrupacion.replace(/"/g, '""')}"`,
        hito || 'SIN_ASIGNAR',
        `"${g.semanaActivacion.etiquetaSemana}"`,
        `${g.semanasSinSolucionar}`,
        `"${g.responsable.replace(/"/g, '""')}"`,
        g.esCritica ? 'CRITICA' : 'HOLGURA',
        `${g.indicePreparacion}%`,
        ...OFFICIAL_6_GATES.map((og) => (g.gates[og.key] ? 'OK' : 'BLOQUEO')),
        g.estadoGestion || 'PENDIENTE',
        `"${(g.observaciones || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `Reporte_Restricciones_LEAN_${proyectoId.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de restricciones LEAN exportado a CSV.');
  };

  // =========================================================================
  // VISTA B: GESTIÓN DE RESTRICCIONES (BITÁCORA SEMANAL -> PESTAÑA 2)
  // =========================================================================
  const [slaOverrides, setSlaOverrides] = useState<Record<string, SlaUserOverride>>(() =>
    loadSlaOverrides(proyectoId)
  );

  useEffect(() => {
    setSlaOverrides(loadSlaOverrides(proyectoId));
  }, [proyectoId]);

  const compuertas: SlaWithWindow[] = useMemo(() => {
    if (compuertasIniciales && compuertasIniciales.length > 0) {
      return compuertasIniciales.map((g) => {
        const semAct = BaselineService.getSemanaCorte(g.fechaDisparoRequerida || g.fechaInicioLB);
        const evalRes = evaluateSlaItem(g, refFechaCorteStr);
        return {
          ...g,
          agrupacion: 'GENERAL',
          hitoMacroLabel: HITO_MACRO_LABELS[g.hitoMacro],
          semanaActivacion: semAct,
          semanasSinSolucionar: calcWeeksUnresolved(
            semAct.lunesStr,
            refLunesActual,
            evalRes.estado === 'LIBERADA'
          ),
        };
      });
    }

    const generated: SlaWithWindow[] = [];

    resumenesBase.forEach((res) => {
      if (!res.fechaInicioLB) return;
      const baseGates = AcuerdosServicioEngine.generateDefaultGatesForTask({
        idTarea: res.edt,
        nombreActividad: res.nombre,
        hitoMacro: res.hitoMacroEnum,
        fechaInicioLB: res.fechaInicioLB,
        proyectoId,
        sucursal,
        residenteAuditor: residenteNombre,
        esManoObra: res.esManoObra,
        codigoCpc: res.codigoCpc,
        agrupacion: res.agrupacion,
        tipoContratacion: res.tipoContrato,
      });

      baseGates.forEach((g) => {
        const uniqueId = `${g.id}::${res.agrupacion}`;
        const ov = slaOverrides[uniqueId] || {};
        const yaIniciada = res.avancePct > 0;

        const merged: SlaWithWindow = {
          ...g,
          id: uniqueId,
          esRutaCritica: res.esCritica,
          responsableGestion:
            ov.responsableGestion ?? (res.responsable !== 'Por asignar AN8' ? res.responsable : ''),
          causaBloqueo: ov.causaBloqueo ?? '',
          planAccion:
            ov.planAccion ??
            (yaIniciada
              ? `Iniciada en obra (${res.avancePct}% avance): restricción liberada previo al inicio.`
              : ''),
          fechaCierreReal:
            ov.fechaCierreReal ||
            (yaIniciada ? g.fechaLimiteCumplimiento || res.fechaInicioLB : undefined),
          agrupacion: res.agrupacion,
          hitoMacroLabel: res.hitoMacroLabel || HITO_MACRO_LABELS[res.hitoMacroEnum],
          semanaActivacion: BaselineService.getSemanaCorte(
            g.fechaDisparoRequerida || g.fechaInicioLB
          ),
          semanasSinSolucionar: 0,
          autoLiberadaPorAvance: yaIniciada,
          avancePct: res.avancePct,
        };

        const evalRes = evaluateSlaItem(merged, refFechaCorteStr);
        merged.estadoCompuerta = evalRes.estado;
        merged.diasDesviacionSLA = evalRes.diasDesviacionSLA;
        merged.semanasSinSolucionar = calcWeeksUnresolved(
          merged.semanaActivacion.lunesStr,
          refLunesActual,
          evalRes.estado === 'LIBERADA'
        );

        generated.push(merged);
      });
    });

    return generated;
  }, [
    compuertasIniciales,
    resumenesBase,
    proyectoId,
    sucursal,
    residenteNombre,
    slaOverrides,
    refLunesActual,
    refFechaCorteStr,
  ]);

  const [filtroTipoSLA, setFiltroTipoSLA] = useState<string>('TODAS');
  const [filtroEstadoSLA, setFiltroEstadoSLA] = useState<string>('TODOS');
  const [searchTermSLA, setSearchTermSLA] = useState('');

  const handleUpdateGateSLA = (
    id: string,
    field: 'causaBloqueo' | 'planAccion' | 'responsableGestion' | 'fechaCierreReal',
    val: string
  ) => {
    setSlaOverrides((prev) => {
      const next: Record<string, SlaUserOverride> = {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [field]: val,
        },
      };
      safeLocalStorageSet(`${KEY_SLA_STATE_PREFIX}${proyectoId}`, JSON.stringify(next));
      return next;
    });
  };

  const windowScopedSlaItems = useMemo(() => {
    return compuertas.filter((g) => {
      if (filtroAgrupacion !== 'TODAS' && g.agrupacion !== filtroAgrupacion) {
        return false;
      }
      if (filtroHitoMacro !== 'TODOS' && g.hitoMacroLabel !== filtroHitoMacro) {
        return false;
      }
      if (filtroTareaResumen !== 'TODAS' && g.idTareaWorkplanner !== filtroTareaResumen) {
        return false;
      }
      if (filtroCorteVentana !== 'TODAS') {
        if (modoVentana === 'INICIAN_EN_VENTANA') {
          if (g.semanaActivacion.lunesStr !== filtroCorteVentana) return false;
        } else {
          // Mostrar todas las activadas en esta ventana o anteriores (incluyendo liberadas)
          if (g.semanaActivacion.lunesStr > filtroCorteVentana) return false;
        }
      }
      return true;
    });
  }, [
    compuertas,
    filtroAgrupacion,
    filtroHitoMacro,
    filtroTareaResumen,
    filtroCorteVentana,
    modoVentana,
  ]);

  const countSlaInicianEnVentana = useMemo(() => {
    if (filtroCorteVentana === 'TODAS') return compuertas.length;
    return compuertas.filter(
      (g) =>
        (filtroAgrupacion === 'TODAS' || g.agrupacion === filtroAgrupacion) &&
        (filtroHitoMacro === 'TODOS' || g.hitoMacroLabel === filtroHitoMacro) &&
        (filtroTareaResumen === 'TODAS' || g.idTareaWorkplanner === filtroTareaResumen) &&
        g.semanaActivacion.lunesStr === filtroCorteVentana
    ).length;
  }, [compuertas, filtroCorteVentana, filtroAgrupacion, filtroHitoMacro, filtroTareaResumen]);

  const metricasSLA = useMemo(() => {
    let liberadas = 0;
    let bloqueadas = 0;
    let vencidas = 0;
    let enGestion = 0;

    windowScopedSlaItems.forEach((g) => {
      const evalStatus = evaluateSlaItem(g, refFechaCorteStr);
      if (evalStatus.estado === 'LIBERADA') liberadas++;
      else if (evalStatus.estado === 'VENCIDA_CRITICA') vencidas++;
      else if (evalStatus.estado === 'BLOQUEADA') bloqueadas++;
      else enGestion++;
    });

    return {
      total: windowScopedSlaItems.length,
      liberadas,
      bloqueadas,
      vencidas,
      enGestion,
      indicePreparacion:
        windowScopedSlaItems.length > 0
          ? Math.round((liberadas / windowScopedSlaItems.length) * 100)
          : 0,
    };
  }, [windowScopedSlaItems, refFechaCorteStr]);

  const compuertasFiltradasSLA = useMemo(() => {
    return windowScopedSlaItems.filter((g) => {
      const matchTipo = filtroTipoSLA === 'TODAS' || g.tipoCompuerta === filtroTipoSLA;
      const evalRes = evaluateSlaItem(g, refFechaCorteStr);
      const matchEstado = filtroEstadoSLA === 'TODOS' || evalRes.estado === filtroEstadoSLA;
      const tipoLabel = TIPO_RESTRICCION_LABELS[g.tipoCompuerta] || g.tipoCompuerta;
      const matchSearch =
        !searchTermSLA ||
        g.nombreActividad.toLowerCase().includes(searchTermSLA.toLowerCase()) ||
        g.idTareaWorkplanner.toLowerCase().includes(searchTermSLA.toLowerCase()) ||
        g.agrupacion.toLowerCase().includes(searchTermSLA.toLowerCase()) ||
        g.hitoMacroLabel.toLowerCase().includes(searchTermSLA.toLowerCase()) ||
        tipoLabel.toLowerCase().includes(searchTermSLA.toLowerCase()) ||
        g.tipoCompuerta.toLowerCase().includes(searchTermSLA.toLowerCase());

      return matchTipo && matchEstado && matchSearch;
    });
  }, [windowScopedSlaItems, filtroTipoSLA, filtroEstadoSLA, searchTermSLA, refFechaCorteStr]);

  // Barra compartida de Corte / Ventana, Agrupación, Hito Macro y Tarea Resumen para ambas vistas
  const renderSharedWindowToolbar = (inicianCount: number) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Corte (Ventana):</span>
            <select
              value={filtroCorteVentana}
              onChange={(e) => setFiltroCorteVentana(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas las ventanas</option>
              {ventanasDisponibles.map((sem) => (
                <option key={sem.lunesStr} value={sem.lunesStr}>
                  {sem.etiquetaSemana}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">Agrupación:</span>
            <select
              value={filtroAgrupacion}
              onChange={(e) => {
                setFiltroAgrupacion(e.target.value);
                setFiltroTareaResumen('TODAS');
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAS">Todas las Agrupaciones ({agrupacionesDisponibles.length})</option>
              {agrupacionesDisponibles.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtroCorteVentana !== 'TODAS' && (
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 font-bold">
            <button
              type="button"
              onClick={() => setModoVentana('ACTIVAS_EN_VENTANA')}
              className={`px-2.5 py-1 rounded-md transition ${
                modoVentana === 'ACTIVAS_EN_VENTANA'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activas + sin solucionar previas
            </button>
            <button
              type="button"
              onClick={() => setModoVentana('INICIAN_EN_VENTANA')}
              className={`px-2.5 py-1 rounded-md transition ${
                modoVentana === 'INICIAN_EN_VENTANA'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo inician en esta ventana ({inicianCount})
            </button>
          </div>
        )}
      </div>

      {/* Filtros adicionales por Hito Macro y Tarea Resumen */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/80">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-700">Punto de Control:</span>
          <select
            value={filtroHitoMacro}
            onChange={(e) => {
              setFiltroHitoMacro(e.target.value);
              setFiltroTareaResumen('TODAS');
            }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los Puntos de Control ({hitosMacroDisponibles.length})</option>
            {hitosMacroDisponibles.map((hm) => (
              <option key={hm} value={hm}>
                {hm}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
          <span className="font-bold text-slate-700 whitespace-nowrap">Tarea Resumen:</span>
          <select
            value={filtroTareaResumen}
            onChange={(e) => setFiltroTareaResumen(e.target.value)}
            className="flex-1 max-w-md bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas las Tareas Resumen ({tareasResumenDisponibles.length})</option>
            {tareasResumenDisponibles.map((tr) => (
              <option key={tr.edt} value={tr.edt}>
                {tr.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-xl bg-slate-900 text-white flex items-center space-x-3 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BANNER EXPLICATIVO DEL FLUJO POR TAREA RESUMEN */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border border-blue-200 rounded-xl shadow-2xs space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-blue-950">
                <span className="bg-white border border-blue-200 px-2 py-0.5 rounded">
                  1. Tarea Resumen Workplanner
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                <span className="bg-blue-100 border border-blue-300 text-blue-900 px-2 py-0.5 rounded">
                  2. Punto de Control &amp; Agrupación
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                <span className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded">
                  {isGestionMode
                    ? '3. Gestión de Restricciones (Contratos, Materiales, Equipos, Diseños y SST)'
                    : '3. Reporte de Restricciones LEAN (6 Compuertas · 6 Semanas)'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Seguimiento y calificación a nivel de <strong>Tarea Resumen</strong> sobre el horizonte de <strong>6 semanas</strong>. Seleccione la ventana de corte para identificar qué restricciones deben iniciar seguimiento en la ventana actual y cuántas semanas llevan sin solucionarse las alertas activadas en cortes anteriores.
              </p>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold shrink-0 self-start lg:self-center">
            {isGestionMode ? 'Gestión de restricciones' : 'Matriz Operativa (6 Semanas)'}
          </span>
        </div>
      </div>

      {resumenesBase.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2 shadow-sm">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            No hay Tareas Resumen disponibles en programación
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cargue y congele la primera sábana de Workplanner en el módulo <strong>Programación &amp; EDT</strong> para alimentar automáticamente las restricciones de este proyecto.
          </p>
        </div>
      ) : !isGestionMode ? (
        /* =============================================================== */
        /* MÓDULO REPORTE DE RESTRICCIONES LEAN: MATRIZ OPERATIVA (6 SEM)  */
        /* =============================================================== */
        <div className="space-y-5">
          {renderSharedWindowToolbar(countMatrixInicianEnVentana)}

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Índice IP Promedio</span>
              <span className={`text-2xl font-black ${avgIp >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {avgIp}%
              </span>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-[10px] text-red-600 font-bold block uppercase">Frentes Bloqueados (&lt;75%)</span>
              <span className="text-2xl font-black text-red-600">{criticalGatesCount}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-[10px] text-blue-700 font-bold block uppercase">Alerta Bitácora</span>
              <span className="text-2xl font-black text-blue-800">{bitacoraRestrictionsCount}</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-center shadow-sm">
              <span className="text-[10px] text-rose-700 font-bold block uppercase flex items-center justify-center space-x-1">
                <Flame className="w-3 h-3 text-rose-600" />
                <span>Ruta Crítica Bloqueada</span>
              </span>
              <span className="text-2xl font-black text-rose-800">{rutaCriticaBloqueadaCount}</span>
            </div>
          </div>

          {/* Tarjetas de las 6 Restricciones Oficiales (Nombres Completos) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {gateBreakdown.map((gate) => (
              <div
                key={gate.key}
                className={`border rounded-xl p-3 shadow-2xs transition-all ${
                  gate.count > 0 ? 'bg-red-50/70 border-red-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-800 text-[11px] leading-tight">
                    {gate.label}
                  </span>
                  {gate.count > 0 ? (
                    <span className="w-5 h-5 shrink-0 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center">
                      {gate.count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold shrink-0">✓ OK</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {gate.count > 0 ? `${gate.count} resumen(es) bloqueado(s)` : 'Sin restricciones'}
                </span>
              </div>
            ))}
          </div>

          {/* Barra de Filtros, Búsqueda y Exportación */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por tarea resumen, EDT o agrupación..."
                  value={searchTermMatrix}
                  onChange={(e) => setSearchTermMatrix(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                />
              </div>

              <div className="flex items-center space-x-1 text-xs font-bold flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('TODOS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterMode === 'TODOS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({windowScopedMatrixGates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('CRITICOS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                    filterMode === 'CRITICOS' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Ruta Crítica ({windowScopedMatrixGates.filter((g) => g.esCritica).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('BITACORA')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterMode === 'BITACORA' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Alerta Bitácora ({bitacoraRestrictionsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('BLOQUEADOS')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                    filterMode === 'BLOQUEADOS' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Bloqueados &lt;75% ({criticalGatesCount})</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition self-start md:self-auto shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Plan de Acción CSV</span>
            </button>
          </div>

          {/* Tabla Matriz Operativa (Nombres Completos Sin Abreviar) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3 whitespace-nowrap">EDT</th>
                    <th className="py-3 px-3 min-w-[210px]">Tarea Resumen / Agrupación</th>
                    <th className="py-3 px-3 min-w-[180px]">Punto de Control &amp; Material</th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap">Activación Inicial</th>
                    <th className="py-3 px-2.5 text-center whitespace-nowrap">Sem. Sin Solucionar</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Criticidad</th>
                    {OFFICIAL_6_GATES.map((og) => (
                      <th key={og.key} className="py-3 px-2.5 text-center whitespace-nowrap">
                        {og.label}
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center whitespace-nowrap">IP (%)</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Estado</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrixGates.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-10 text-center text-slate-400">
                        No hay tareas resumen con restricciones en la ventana y agrupación seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrixGates.map((item) => {
                      const hito = MacroMilestoneService.autoClassifyTask({
                        edt: item.edt || '',
                        nombre: item.actividad,
                        agrupacion: item.frente,
                      });
                      const materialRules = hito
                        ? AcuerdosServicioEngine.getMaterialesRestringidosParaActividad(item.edt || '', hito)
                        : [];
                      const firstRule = materialRules[0];
                      const resMeta = resolucionesSaved[item.id];

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.origen === 'BITACORA_CAMPO' ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {item.edt || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{item.actividad}</div>
                            <div className="text-[10px] text-slate-500 flex items-center flex-wrap gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                                {item.agrupacion}
                              </span>
                              <span>·</span>
                              <span className="text-slate-600 font-medium">{item.responsable}</span>
                              {item.origen === 'BITACORA_CAMPO' && (
                                <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                  Bitácora Campo
                                </span>
                              )}
                            </div>
                            {resMeta?.fechaCompromiso && (
                              <div className="text-[9.5px] text-indigo-700 font-semibold mt-0.5">
                                Compromiso: {resMeta.fechaCompromiso}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {hito ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                  <Layers className="w-2.5 h-2.5" />
                                  {item.hitoMacroLabel || HITO_MACRO_LABELS[hito]}
                                </span>
                                {firstRule && (
                                  <div className="text-[9.5px] text-slate-500">
                                    <span className="font-bold text-blue-700">{firstRule.etapa.replace('_', ' ')}</span>
                                    {' · Trigger: '}
                                    <strong>{firstRule.hitoDesencadenante}</strong>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Asignación pendiente en EDT</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                              Sem {item.semanaActivacion.numeroSemana} ({item.semanaActivacion.anio})
                            </span>
                            <div className="text-[9.5px] text-slate-400 mt-0.5">
                              Inicio Progr.: {item.fechaInicioLB}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-center whitespace-nowrap">
                            {item.estadoGestion === 'LIBERADO' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Liberada
                              </span>
                            ) : item.semanasSinSolucionar > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 text-[10px] font-black">
                                {item.semanasSinSolucionar} sem sin solucionar
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Inicia seguimiento (0 sem)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.esCritica ? (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center space-x-1">
                                <Flame className="w-2.5 h-2.5 text-rose-600" />
                                <span>Crítica</span>
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                                Holgura
                              </span>
                            )}
                          </td>
                          {OFFICIAL_6_GATES.map((og) => {
                            const val = item.gates[og.key];
                            return (
                              <td key={og.key} className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleGate(item.id, og.key)}
                                  className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center font-bold text-[11px] transition-transform active:scale-90 ${
                                    val
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                  title={`Alternar ${og.label}`}
                                >
                                  {val ? '✓' : '✗'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded tabular-nums ${
                                item.indicePreparacion >= 85
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.indicePreparacion >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.indicePreparacion}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                item.estadoGestion === 'LIBERADO'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.estadoGestion === 'EN_GESTION'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.estadoGestion || 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const saved = resolucionesSaved[item.id];
                                setSelectedGateItem(item);
                                setGestionNotas(saved?.notasGestion || item.observaciones || '');
                                setGestionResponsable(saved?.responsableGestion || item.responsable || '');
                                setGestionFechaCompromiso(saved?.fechaCompromiso || '');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                            >
                              Gestionar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* =============================================================== */
        /* BITÁCORA SEMANAL PESTAÑA 2: GESTIÓN DE RESTRICCIONES (SLAs)     */
        /* =============================================================== */
        <div className="space-y-5">
          {renderSharedWindowToolbar(countSlaInicianEnVentana)}

          {/* KPIs Interactivos por Estado (Clic para filtrar) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              type="button"
              onClick={() => setFiltroEstadoSLA('TODOS')}
              className={`p-4 bg-white rounded-xl border text-left shadow-sm transition ${
                filtroEstadoSLA === 'TODOS'
                  ? 'border-slate-900 ring-2 ring-slate-900/15'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Índice Preparación</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{metricasSLA.indicePreparacion}%</span>
                <span className="text-xs text-slate-500 font-medium">de restricciones listas</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metricasSLA.indicePreparacion >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${metricasSLA.indicePreparacion}%` }}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltroEstadoSLA((prev) => (prev === 'LIBERADA' ? 'TODOS' : 'LIBERADA'))
              }
              className={`p-4 bg-white rounded-xl border text-left shadow-sm transition ${
                filtroEstadoSLA === 'LIBERADA'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Liberadas a Tiempo</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-700">{metricasSLA.liberadas}</span>
                <span className="text-xs text-slate-500">de {metricasSLA.total}</span>
              </div>
              <span className="text-[11px] text-emerald-600 mt-1 inline-block">
                Avance &gt; 0% o liberada antes límite
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltroEstadoSLA((prev) => (prev === 'EN_GESTION' ? 'TODOS' : 'EN_GESTION'))
              }
              className={`p-4 bg-white rounded-xl border text-left shadow-sm transition ${
                filtroEstadoSLA === 'EN_GESTION'
                  ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/30'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">En Gestión Normal</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-700">{metricasSLA.enGestion}</span>
                <span className="text-xs text-slate-500">en plazo</span>
              </div>
              <span className="text-[11px] text-blue-600 mt-1 inline-block">Dentro de fecha límite</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltroEstadoSLA((prev) => (prev === 'BLOQUEADA' ? 'TODOS' : 'BLOQUEADA'))
              }
              className={`p-4 bg-white rounded-xl border text-left shadow-sm transition ${
                filtroEstadoSLA === 'BLOQUEADA'
                  ? 'border-amber-600 ring-2 ring-amber-500/30 bg-amber-50/30'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Bloqueadas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-700">{metricasSLA.bloqueadas}</span>
                <span className="text-xs text-slate-500">límite vencido</span>
              </div>
              <span className="text-[11px] text-amber-600 mt-1 inline-block">&le; 15 días de atraso</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFiltroEstadoSLA((prev) =>
                  prev === 'VENCIDA_CRITICA' ? 'TODOS' : 'VENCIDA_CRITICA'
                )
              }
              className={`p-4 bg-white rounded-xl border text-left shadow-sm transition ${
                filtroEstadoSLA === 'VENCIDA_CRITICA'
                  ? 'border-red-600 ring-2 ring-red-500/30 bg-red-50/30'
                  : 'border-slate-200 hover:border-red-300'
              }`}
            >
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Vencidas Críticas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-red-700">{metricasSLA.vencidas}</span>
                <span className="text-xs text-red-500">retrasan ruta</span>
              </div>
              <span className="text-[11px] text-red-600 mt-1 inline-block">&gt; 15 días sin liberar</span>
            </button>
          </div>

          {/* Filtros de búsqueda, Tipo de restricción y Estado */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por tarea resumen, EDT o agrupación..."
                  value={searchTermSLA}
                  onChange={(e) => setSearchTermSLA(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroTipoSLA}
                onChange={(e) => setFiltroTipoSLA(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
              >
                <option value="TODAS">Todos los tipos de restricción</option>
                <option value="CONTRATOS">Contrato</option>
                <option value="MATERIALES_INVENTORY">Materiales</option>
                <option value="EQUIPOS_FORMALETA">Equipo y formaleta</option>
                <option value="DISENOS">Diseños</option>
                <option value="SST_ACCESO_PERSONAL">Ingreso personal - SST</option>
              </select>

              <select
                value={filtroEstadoSLA}
                onChange={(e) => setFiltroEstadoSLA(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
              >
                <option value="TODOS">Todos los Estados ({metricasSLA.total})</option>
                <option value="LIBERADA">Liberadas a tiempo ({metricasSLA.liberadas})</option>
                <option value="EN_GESTION">En gestión normal ({metricasSLA.enGestion})</option>
                <option value="BLOQUEADA">Bloqueadas ({metricasSLA.bloqueadas})</option>
                <option value="VENCIDA_CRITICA">Vencidas críticas ({metricasSLA.vencidas})</option>
              </select>
            </div>

            {/* Botones rápidos de filtro por Estado */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              {[
                { id: 'TODOS', label: `Todos (${metricasSLA.total})`, activeCls: 'bg-slate-900 text-white' },
                { id: 'LIBERADA', label: `Liberadas a tiempo (${metricasSLA.liberadas})`, activeCls: 'bg-emerald-600 text-white' },
                { id: 'EN_GESTION', label: `En gestión normal (${metricasSLA.enGestion})`, activeCls: 'bg-blue-600 text-white' },
                { id: 'BLOQUEADA', label: `Bloqueadas (${metricasSLA.bloqueadas})`, activeCls: 'bg-amber-600 text-white' },
                { id: 'VENCIDA_CRITICA', label: `Vencidas críticas (${metricasSLA.vencidas})`, activeCls: 'bg-red-600 text-white' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFiltroEstadoSLA(st.id)}
                  className={`px-3 py-1 rounded-lg transition ${
                    filtroEstadoSLA === st.id
                      ? st.activeCls
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla Gestión de Restricciones (a nivel de Tarea Resumen) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tarea Resumen &amp; Agrupación</th>
                    <th className="py-3 px-4">Restricción</th>
                    <th className="py-3 px-4">Ventana Activación &amp; Fechas Clave</th>
                    <th className="py-3 px-4">Estado / Semanas Sin Solucionar</th>
                    <th className="py-3 px-4">Causa, Plan de Acción y Responsable (AN8)</th>
                    <th className="py-3 px-4">Liberación Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compuertasFiltradasSLA.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No se encontraron restricciones de Tareas Resumen en la ventana y agrupación seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    compuertasFiltradasSLA.map((g) => {
                      const evalRes = evaluateSlaItem(g, refFechaCorteStr);
                      const isLiberada = evalRes.estado === 'LIBERADA';
                      const isVencida = evalRes.estado === 'VENCIDA_CRITICA';
                      const isBloqueada = evalRes.estado === 'BLOQUEADA';

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                                {g.idTareaWorkplanner}
                              </span>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {g.agrupacion}
                              </span>
                              {g.esRutaCritica && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200/50">
                                  Crítica
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-800 mt-1">{g.nombreActividad}</p>
                            <p className="text-[11px] text-slate-500">
                              Punto de Control: {g.hitoMacroLabel || HITO_MACRO_LABELS[g.hitoMacro]}
                            </p>
                          </td>

                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-1.5">
                              {g.tipoCompuerta === 'CONTRATOS' && <FileCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                              {g.tipoCompuerta === 'MATERIALES_INVENTORY' && <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              {g.tipoCompuerta === 'EQUIPOS_FORMALETA' && <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                              {g.tipoCompuerta === 'DISENOS' && <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                              {g.tipoCompuerta === 'SST_ACCESO_PERSONAL' && <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              <span className="font-bold text-slate-800 whitespace-nowrap">
                                {TIPO_RESTRICCION_LABELS[g.tipoCompuerta] || g.tipoCompuerta}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 align-top text-[11px] text-slate-600 space-y-1">
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                Activación inicial: Sem {g.semanaActivacion.numeroSemana} ({g.semanaActivacion.anio})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Inicio Progr.:</span>{' '}
                              <strong className="text-slate-800">{g.fechaInicioLB}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Límite Restricción:</span>{' '}
                              <strong className={isVencida ? 'text-red-600' : 'text-slate-800'}>
                                {g.fechaLimiteCumplimiento}
                              </strong>
                            </div>
                          </td>

                          <td className="py-3 px-4 align-top space-y-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isLiberada
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : isVencida
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : isBloqueada
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}
                            >
                              {isLiberada && <CheckCircle2 className="w-3 h-3" />}
                              {isVencida && <AlertTriangle className="w-3 h-3" />}
                              {isBloqueada && <Clock className="w-3 h-3" />}
                              {evalRes.estado}
                            </span>

                            <div>
                              {g.autoLiberadaPorAvance ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Liberada automáticamente (Avance {g.avancePct}%)
                                </span>
                              ) : !isLiberada && g.semanasSinSolucionar > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black">
                                  {g.semanasSinSolucionar} sem sin solucionarse
                                </span>
                              ) : !isLiberada ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                  Inicia seguimiento en ventana
                                </span>
                              ) : null}
                            </div>

                            {evalRes.diasDesviacionSLA > 0 && (
                              <p className="text-[10px] text-red-600 font-bold">
                                +{evalRes.diasDesviacionSLA} días de atraso
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 align-top space-y-2 min-w-[290px]">
                            <select
                              value={g.causaBloqueo || ''}
                              disabled={isLiberada}
                              onChange={(e) => handleUpdateGateSLA(g.id, 'causaBloqueo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                            >
                              <option value="">Seleccionar causa de incumplimiento...</option>
                              {RESTRICCIONES_LOOKAHEAD.map((causa) => (
                                <option key={causa} value={causa}>
                                  {causa}
                                </option>
                              ))}
                              {g.causaBloqueo &&
                                !(RESTRICCIONES_LOOKAHEAD as readonly string[]).includes(g.causaBloqueo) && (
                                  <option value={g.causaBloqueo}>{g.causaBloqueo}</option>
                                )}
                            </select>
                            <input
                              type="text"
                              placeholder="Plan de acción..."
                              value={g.planAccion || ''}
                              disabled={isLiberada}
                              onChange={(e) => handleUpdateGateSLA(g.id, 'planAccion', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                            />
                            <ContratistaSelector
                              value={g.responsableGestion || ''}
                              disabled={isLiberada}
                              onChange={(val) => handleUpdateGateSLA(g.id, 'responsableGestion', val)}
                            />
                          </td>

                          <td className="py-3 px-4 align-top min-w-[130px]">
                            <input
                              type="date"
                              value={g.fechaCierreReal || ''}
                              onChange={(e) => handleUpdateGateSLA(g.id, 'fechaCierreReal', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {g.fechaCierreReal ? 'Restricción levantada' : 'Pendiente de liberación'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLAN DE ACCIÓN Y RESPONSABLE (AN8) */}
      {selectedGateItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 block">
                  Reporte de restricciones LEAN · Plan de Acción (Tarea Resumen)
                </span>
                <h3 className="font-black text-slate-900 text-base">
                  {selectedGateItem.actividad}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGateItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-700">
              <div>
                <strong>Agrupación:</strong> {selectedGateItem.agrupacion}
              </div>
              <div>
                <strong>Ventana de Activación Inicial:</strong> {selectedGateItem.semanaActivacion.etiquetaSemana}
              </div>
              <div>
                <strong>Punto de Control Asociado:</strong>{' '}
                {selectedGateItem.hitoMacroLabel || 'Por asignar en EDT'}
              </div>
              {selectedGateItem.restriccionPrincipal && (
                <div>
                  <strong>Restricción Causal:</strong>{' '}
                  <span className="text-red-700 font-bold">{selectedGateItem.restriccionPrincipal}</span>
                </div>
              )}
            </div>

            {/* 6 Restricciones Oficiales */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                Estado de las 6 Restricciones (Clic para liberar/bloquear):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {OFFICIAL_6_GATES.map((og) => {
                  const val = selectedGateItem.gates[og.key];
                  return (
                    <button
                      key={og.key}
                      type="button"
                      onClick={() => {
                        toggleGate(selectedGateItem.id, og.key);
                        setSelectedGateItem((prev) =>
                          prev
                            ? {
                                ...prev,
                                gates: {
                                  ...prev.gates,
                                  [og.key]: !prev.gates[og.key],
                                },
                              }
                            : null
                        );
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                        val
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-red-50 border-red-300 text-red-800'
                      }`}
                    >
                      <span className="font-semibold">{og.label}</span>
                      <span>{val ? '✓' : '✗'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Responsable de Liberación (AN8 / Marval):
                </label>
                <ContratistaSelector
                  value={gestionResponsable}
                  onChange={setGestionResponsable}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Fecha de Compromiso:
                </label>
                <input
                  type="date"
                  value={gestionFechaCompromiso}
                  onChange={(e) => setGestionFechaCompromiso(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Acción de Mitigación / Causa de Bloqueo:
              </label>
              <textarea
                rows={3}
                value={gestionNotas}
                onChange={(e) => setGestionNotas(e.target.value)}
                placeholder="Especifique las gestiones realizadas para desatascar la restricción..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleLiberarTodas(selectedGateItem)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
              >
                Liberar Todas (100% OK)
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedGateItem(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarGestion}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
                >
                  Guardar Plan de Acción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
