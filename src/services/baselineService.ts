import { CpmTask } from './cpmEngine';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import { LookaheadGate } from '../types';

export interface BaselineRecord {
  idConsec: number;
  edt: string;
  nombre: string;
  agrupacion: string;
  duraLineaBase: number;
  comienzoLineaBase: string; // YYYY-MM-DD
  finLineaBase: string;       // YYYY-MM-DD
  wLineaBase: number;
  congeladoEl: string;        // ISO timestamp
  proyecto: string;
}

export interface BaselineMetadata {
  proyecto: string;
  fechaCongelacion: string;
  totalTareas: number;
  duracionTotalDias: number;
  fechaInicioProyecto: string;
  fechaFinProyecto: string;
  usuario: string;
}

export interface SemanaCorteInfo {
  numeroSemana: number;
  anio: number;
  lunesStr: string;   // YYYY-MM-DD
  domingoStr: string; // YYYY-MM-DD
  etiquetaSemana: string;
  totalActividades?: number;
  totalCriticas?: number;
}

export interface ActividadSemanalBitacora {
  idConsec: number;
  edt: string;
  nombre: string;
  agrupacion: string;
  nivel: number;
  sucursal: string;
  proyecto: string;
  w: number; // Porcentaje de avance actual (0-1)

  // Línea Base
  comienzoLineaBase: string;
  finLineaBase: string;
  duraLineaBase: number;

  // Reprogramado / Real WorkPlanner
  comien: string;
  fin: string;
  dura: number;
  tf: number;
  ff: number;
  esCritica: boolean;
  obligatoria: boolean;

  // Condiciones de inclusión semanal (acotadas estrictamente a fechas de Línea Base)
  esInicioEstaSemana: boolean;
  esFinEstaSemana: boolean;
  // Avisos informativos y alertas operativas exactas de interventoría
  esInicioAnticipado: boolean;
  esFinAnticipado: boolean;
  alertaPrioridadFinSinAvanceCritica: boolean;
  motivoInclusion: string[];
}

export interface CalificacionActividad {
  idConsec: number;
  edt?: string;
  nombre?: string;
  agrupacion?: string;
  esCritica?: boolean;
  calificado: boolean;
  cumpleInicio: boolean | null;
  cumpleFin: boolean | null;
  causaNoInicio?: string;
  fechaCompromisoInicio?: string;
  responsableInicio?: string;
  observacionesInicio?: string;
  causaNoFin?: string;
  fechaCompromisoFin?: string;
  responsableFin?: string;
  observacionesFin?: string;
  observaciones: string;
  fechaCalificacion?: string;
  residente?: string;
}

export interface ReporteSemanalBitacora {
  idReporte: string;
  proyecto: string;
  sucursal: string;
  semana: number;
  anio: number;
  fechaCorte: string;
  lunesSemana: string;
  domingoSemana: string;
  residente: string;
  fechaCierre: string;
  totalActividades: number;
  criticasTotales: number;
  criticasEvaluadas: number;
  noCriticasEvaluadas: number;
  cumplimientoInicioPct: number;
  cumplimientoFinPct: number;
  items: Array<ActividadSemanalBitacora & CalificacionActividad>;
}

// 6 Restricciones Oficiales del Módulo Lookahead (Lean Construction / Prerrequisitos de Inicio)
export const RESTRICCIONES_LOOKAHEAD = [
  'Diseños',
  'Contrato',
  'Actividad Predecesora',
  'Materiales',
  'Equipo y formaleta',
  'Ingreso personal - SST'
] as const;

// Causas Operativas de Incumplimiento en Fin (Ejecución en Campo)
export const CAUSAS_OPERATIVAS_NO_FIN = [
  'Contratista / Personal',
  'Falla / Mantenimiento de Equipos',
  'Imprevisto Climático',
  'Facturación y Flujo de Caja',
  'Actividad Predecesora / Interferencia',
  'Rendimiento y Calidad de Ejecución'
] as const;

const KEY_LB_PREFIX = 'marval_pco_baseline_';
const KEY_LB_META_PREFIX = 'marval_pco_baseline_meta_';
const KEY_REPORTES_SEMANALES = 'marval_pco_reportes_bitacora_v1';
const KEY_CALIFICACIONES_TEMP_PREFIX = 'marval_pco_calif_temp_';
const KEY_LOOKAHEAD_RESOLUCIONES = 'marval_pco_lookahead_resoluciones_v1';

// Tupla compacta para ahorrar >75% de cuota en localStorage:
// [idConsec, edt, duraLineaBase, comienzoLineaBase, finLineaBase, wLineaBase]
type CompactBaselineTuple = [number, string, number, string, string, number];

const memoryBaselineMap = new Map<string, Map<number, BaselineRecord>>();
const memoryBaselineMeta = new Map<string, BaselineMetadata>();

const LEGACY_STORAGE_PREFIXES = [
  'interventor_active_wbs_',
  'interventor_active_wbs_meta_',
  'interventor_wbs_cortes_v2_',
  'interventor_wbs_assignments_v2_',
  'marval_pco_baseline_Belaterra',
  'marval_pco_baseline_meta_Belaterra',
  'marval_cto_matrix_v2_',
  'marval_sellos_activities_v1_',
  'marval_sellos_lotes_v1_',
  'marval_sellos_activities_v2_',
  'marval_sellos_lotes_v2_',
  'marval_parametrizacion_torres_v1_',
  'interventor_active_project_user_v1_',
];

const LEGACY_EXACT_KEYS = [
  'interventor_app_usuarios_v1',
  'interventor_app_current_user_v1',
  'interventor_app_matriz_permisos',
  'interventor_sp_sync_queue_v1',
];

const WORKPLANNER_CLEAN_FLAG_V4 = 'interventor_workplanner_cache_cleaned_v4';
const PRE_TEST_WORKPLANNER_PREFIXES = [
  'interventor_active_edt_v3_',
  'interventor_active_edt_meta_v3_',
  'interventor_edt_cortes_v3_',
  'interventor_edt_assignments_v3_',
  KEY_LB_PREFIX,
  KEY_LB_META_PREFIX,
  KEY_CALIFICACIONES_TEMP_PREFIX,
  KEY_REPORTES_SEMANALES,
  KEY_LOOKAHEAD_RESOLUCIONES,
];

/**
 * Elimina llaves obsoletas de versiones anteriores que consumen cuota de localStorage
 * y purga cualquier caché residual de Workplanner anterior a las pruebas actuales.
 */
export function purgeLegacyStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const cleanPreTestCache = localStorage.getItem(WORKPLANNER_CLEAN_FLAG_V4) !== '1';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const isLegacy =
        LEGACY_EXACT_KEYS.includes(k) ||
        LEGACY_STORAGE_PREFIXES.some((prefix) => k.startsWith(prefix));
      const isPreTestWorkplanner =
        cleanPreTestCache &&
        PRE_TEST_WORKPLANNER_PREFIXES.some((prefix) => k.startsWith(prefix));
      if (isLegacy || isPreTestWorkplanner) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore individual removal failure
      }
    });
    if (cleanPreTestCache) {
      memoryBaselineMap.clear();
      memoryBaselineMeta.clear();
      try {
        localStorage.setItem(WORKPLANNER_CLEAN_FLAG_V4, '1');
      } catch {
        // ignore flag write failure
      }
    }
  } catch {
    // ignore storage enumeration errors
  }
}

/**
 * Escribe en localStorage liberando llaves legadas automáticamente ante QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    purgeLegacyStorage();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`[Storage] Cuota de localStorage insuficiente para "${key}". Se mantiene en caché de sesión.`, retryErr);
      return false;
    }
  }
}

/**
 * Mapea la causa de no inicio seleccionada en bitácora a la compuerta correspondiente del Lookahead.
 */
export function mapRestriccionToGateKey(restriccion: string): keyof LookaheadGate['gates'] {
  const r = (restriccion || '').toLowerCase();
  if (r.includes('diseño') || r.includes('plano')) return 'diseno';
  if (r.includes('sst') || r.includes('ingreso personal') || r.includes('permiso') || r.includes('licencia') || r.includes('ambiental')) return 'sstAmbiental';
  if (r.includes('contrat') || r.includes('adjudicaci') || r.includes('mano de obra') || r.includes('cuadrilla')) return 'contratacion';
  if (r.includes('predecesora')) return 'predecesora';
  if (r.includes('material') || r.includes('compra')) return 'materiales';
  if (r.includes('equipo') || r.includes('maquinaria') || r.includes('formaleta')) return 'equipos';
  return 'materiales';
}

export class BaselineService {
  /**
   * Verifica si existe una Línea Base congelada para el proyecto.
   */
  static tieneLineaBase(proyecto: string): boolean {
    if (!proyecto) return false;
    if (memoryBaselineMap.has(proyecto) || memoryBaselineMeta.has(proyecto)) return true;
    const raw = localStorage.getItem(`${KEY_LB_PREFIX}${proyecto}`);
    const meta = localStorage.getItem(`${KEY_LB_META_PREFIX}${proyecto}`);
    return Boolean((raw && raw.length > 2) || meta);
  }

  /**
   * Obtiene la Línea Base congelada del proyecto como un Map indexado por idConsec.
   */
  static getLineaBase(proyecto: string): Map<number, BaselineRecord> | null {
    if (!proyecto) return null;
    if (memoryBaselineMap.has(proyecto)) {
      return memoryBaselineMap.get(proyecto)!;
    }
    try {
      const raw = localStorage.getItem(`${KEY_LB_PREFIX}${proyecto}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      const meta = this.getLineaBaseMetadata(proyecto);
      const congeladoEl = meta?.fechaCongelacion || '';
      const map = new Map<number, BaselineRecord>();

      if (Array.isArray(parsed[0])) {
        // Formato compacto de tuplas: [idConsec, edt, duraLB, comienzoLB, finLB, wLB]
        for (const tuple of parsed as CompactBaselineTuple[]) {
          const [idConsec, edt, duraLineaBase, comienzoLineaBase, finLineaBase, wLineaBase] = tuple;
          map.set(idConsec, {
            idConsec,
            edt,
            nombre: '',
            agrupacion: '',
            duraLineaBase,
            comienzoLineaBase,
            finLineaBase,
            wLineaBase,
            congeladoEl,
            proyecto,
          });
        }
      } else {
        for (const r of parsed as BaselineRecord[]) {
          map.set(r.idConsec, r);
        }
      }

      memoryBaselineMap.set(proyecto, map);
      return map;
    } catch (e) {
      console.error('Error al recuperar Línea Base:', e);
      return null;
    }
  }

  /**
   * Obtiene los metadatos de la congelación de Línea Base.
   */
  static getLineaBaseMetadata(proyecto: string): BaselineMetadata | null {
    if (!proyecto) return null;
    if (memoryBaselineMeta.has(proyecto)) {
      return memoryBaselineMeta.get(proyecto)!;
    }
    try {
      const raw = localStorage.getItem(`${KEY_LB_META_PREFIX}${proyecto}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BaselineMetadata;
      memoryBaselineMeta.set(proyecto, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Congela la Línea Base oficial del proyecto usando prioritariamente las columnas
   * ComienPrev, FinPrev y DuraPrev del Workplanner, almacenando en formato compacto
   * para evitar QuotaExceededError en sábanas grandes.
   */
  static guardarLineaBase(proyecto: string, tasks: CpmTask[], usuario: string = 'Residente de Interventoría'): void {
    purgeLegacyStorage();

    const timestamp = new Date().toISOString();
    const fullMap = new Map<number, BaselineRecord>();
    const compactTuples: CompactBaselineTuple[] = [];

    let minInicio = '';
    let maxFin = '';
    let maxDura = 0;

    for (const t of tasks) {
      const duraLB = t.duraPrev !== undefined && t.duraPrev > 0 ? t.duraPrev : t.dura;
      const iniLB = t.comienPrev || t.comien;
      const finLB = t.finPrev || t.fin;
      const wLB = Number(t.w || 0);

      if (iniLB && (!minInicio || iniLB < minInicio)) minInicio = iniLB;
      if (finLB && (!maxFin || finLB > maxFin)) maxFin = finLB;
      if (duraLB > maxDura) maxDura = duraLB;

      fullMap.set(t.idConsec, {
        idConsec: t.idConsec,
        edt: t.edt,
        nombre: t.nombre,
        agrupacion: t.agrupacion || 'NO APLICA',
        duraLineaBase: duraLB,
        comienzoLineaBase: iniLB,
        finLineaBase: finLB,
        wLineaBase: wLB,
        congeladoEl: timestamp,
        proyecto,
      });

      compactTuples.push([t.idConsec, t.edt, duraLB, iniLB, finLB, wLB]);
    }

    const metadata: BaselineMetadata = {
      proyecto,
      fechaCongelacion: timestamp,
      totalTareas: tasks.length,
      duracionTotalDias: maxDura,
      fechaInicioProyecto: minInicio,
      fechaFinProyecto: maxFin,
      usuario,
    };

    // Mantener estado completo en caché de sesión y persistencia compacta en localStorage
    memoryBaselineMap.set(proyecto, fullMap);
    memoryBaselineMeta.set(proyecto, metadata);

    safeLocalStorageSet(`${KEY_LB_META_PREFIX}${proyecto}`, JSON.stringify(metadata));
    safeLocalStorageSet(`${KEY_LB_PREFIX}${proyecto}`, JSON.stringify(compactTuples));

    window.dispatchEvent(new CustomEvent('marval_baseline_updated', { detail: { proyecto, timestamp } }));
  }

  /**
   * Elimina la Línea Base de un proyecto para permitir recongelarla.
   */
  static eliminarLineaBase(proyecto: string): void {
    memoryBaselineMap.delete(proyecto);
    memoryBaselineMeta.delete(proyecto);
    localStorage.removeItem(`${KEY_LB_PREFIX}${proyecto}`);
    localStorage.removeItem(`${KEY_LB_META_PREFIX}${proyecto}`);
    window.dispatchEvent(new CustomEvent('marval_baseline_updated', { detail: { proyecto, timestamp: null } }));
  }

  /**
   * Calcula la información de la semana de corte (Lunes a Domingo) para una fecha dada.
   */
  static getSemanaCorte(fechaInput: Date | string): SemanaCorteInfo {
    const d = typeof fechaInput === 'string' ? new Date(fechaInput + 'T12:00:00') : new Date(fechaInput);

    // Normalizar a día de la semana (1 = lunes, ..., 7 = domingo)
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();

    // Lunes de la semana
    const lunes = new Date(d);
    lunes.setDate(d.getDate() - (dayOfWeek - 1));
    lunes.setHours(0, 0, 0, 0);

    // Domingo de la semana
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, '0');
    const lunesStr = `${lunes.getFullYear()}-${pad(lunes.getMonth() + 1)}-${pad(lunes.getDate())}`;
    const domingoStr = `${domingo.getFullYear()}-${pad(domingo.getMonth() + 1)}-${pad(domingo.getDate())}`;

    // Cálculo ISO Week Number
    const target = new Date(lunes.valueOf());
    const dayNr = (lunes.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const numeroSemana = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const anio = lunes.getFullYear();

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const etiquetaSemana = `Semana ${numeroSemana} (${lunes.getDate()} ${meses[lunes.getMonth()]} - ${domingo.getDate()} ${meses[domingo.getMonth()]} ${anio})`;

    return {
      numeroSemana,
      anio,
      lunesStr,
      domingoStr,
      etiquetaSemana,
    };
  }

  /**
   * Genera la lista de semanas de corte con actividades tipo "task" disponibles para selector desplegable,
   * tomando las fechas de Línea Base (Inicio LB / Fin LB) para alinear con el filtro semanal.
   */
  static listarSemanasConActividad(tasks: CpmTask[], proyecto?: string): SemanaCorteInfo[] {
    const semanaMap = new Map<string, SemanaCorteInfo>();
    const lbMap = proyecto ? this.getLineaBase(proyecto) : null;

    for (const t of tasks) {
      if (t.type !== 'task') continue;
      const lb = lbMap ? lbMap.get(t.idConsec) : undefined;
      const inicioLB = t.comienPrev || lb?.comienzoLineaBase || t.comien;
      const finLB = t.finPrev || lb?.finLineaBase || t.fin;

      if (inicioLB) {
        const s = this.getSemanaCorte(inicioLB);
        const key = `${s.anio}-W${s.numeroSemana}`;
        if (!semanaMap.has(key)) {
          semanaMap.set(key, s);
        }
      }
      if (finLB) {
        const s = this.getSemanaCorte(finLB);
        const key = `${s.anio}-W${s.numeroSemana}`;
        if (!semanaMap.has(key)) {
          semanaMap.set(key, s);
        }
      }
    }

    return Array.from(semanaMap.values()).sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio;
      return a.numeroSemana - b.numeroSemana;
    });
  }

  /**
   * Filtra las actividades tipo "task" estrictamente acotadas por la ventana semanal [Lunes, Domingo]
   * según las fechas de Línea Base (Inicio LB para 1A, Fin LB para 1B):
   *
   * 1A · Inicios Programados (Lunes <= Inicio LB <= Domingo):
   * - W = 0%: no ha iniciado en Workplanner (si residente marca Sí Cumplió -> alerta pendiente avance WP).
   * - W > 0%: ya inició; si Inicio Proyectado (Comien) < Lunes -> aviso informativo "Inicio anticipado".
   *
   * 1B · Fines Programados (Lunes <= Fin LB <= Domingo):
   * - W = 0%: no inició en todo su periodo; si es Ruta Crítica -> alerta informativa de prioridad.
   * - W = 100%: ya finalizó en Workplanner; si Fin Proyectado < Lunes -> nota informativa "Fin anticipado".
   * - W < 100%: si residente marca Sí Cumplió Fin -> alerta "Pendiente dar avance al 100% en Workplanner".
   */
  static filtrarActividadesSemana(
    tasks: CpmTask[],
    fechaCorte: string | Date,
    proyecto: string
  ): {
    actividades: ActividadSemanalBitacora[];
    totalSemana: number;
    totalCriticas: number;
    infoSemana: SemanaCorteInfo;
  } {
    const infoSemana = this.getSemanaCorte(fechaCorte);
    const lbMap = this.getLineaBase(proyecto);

    const { lunesStr, domingoStr } = infoSemana;
    const actividades: ActividadSemanalBitacora[] = [];

    for (const t of tasks) {
      // Omitir estrictamente tareas resumen o hitos; solo evaluar tareas tipo "task" ejecutables
      if (t.type !== 'task') continue;

      const lb = lbMap ? lbMap.get(t.idConsec) : undefined;
      const comienzoLB = t.comienPrev || lb?.comienzoLineaBase || t.comien;
      const finLB = t.finPrev || lb?.finLineaBase || t.fin;
      const duraLB = t.duraPrev || lb?.duraLineaBase || t.dura;

      // Inclusión estricta únicamente por fechas de Línea Base dentro de [Lunes, Domingo]
      const esInicioEstaSemana = Boolean(comienzoLB && comienzoLB >= lunesStr && comienzoLB <= domingoStr);
      const esFinEstaSemana = Boolean(finLB && finLB >= lunesStr && finLB <= domingoStr);

      if (!esInicioEstaSemana && !esFinEstaSemana) continue;

      const avanceW = Number(t.w || 0);
      const tieneAvance = avanceW > 0;
      const estaAl100 = avanceW >= 0.999 || Math.round(avanceW * 100) >= 100;

      // Aviso informativo 1A: Inicio LB en ventana + % avance > 0% + Inicio proyectado anterior a la ventana
      const esInicioAnticipado = Boolean(
        esInicioEstaSemana && tieneAvance && t.comien && t.comien < lunesStr
      );

      // Nota informativa 1B: Fin LB en ventana + 100% avance + Fin proyectado en semana anterior o más antigua
      const esFinAnticipado = Boolean(
        esFinEstaSemana && estaAl100 && t.fin && t.fin < lunesStr
      );

      // Alerta informativa de prioridad 1B: Fin LB en ventana + 0% avance + Ruta Crítica
      const alertaPrioridadFinSinAvanceCritica = Boolean(
        esFinEstaSemana && !tieneAvance && t.esCritica
      );

      const motivos: string[] = [];
      if (esInicioEstaSemana) motivos.push('Inicio LB en esta semana');
      if (esFinEstaSemana) motivos.push('Fin LB en esta semana');
      if (esInicioAnticipado) motivos.push('Inicio anticipado (adelanto)');
      if (esFinAnticipado) motivos.push('Fin anticipado');
      if (alertaPrioridadFinSinAvanceCritica) motivos.push('Prioridad Ruta Crítica: 0% avance al Fin LB');

      actividades.push({
        idConsec: t.idConsec,
        edt: t.edt,
        nombre: t.nombre,
        agrupacion: t.agrupacion || 'NO APLICA',
        nivel: t.nivel || (t.edt ? t.edt.split('.').length : 1),
        sucursal: t.sucursal || 'CALI',
        proyecto: t.proyecto || proyecto,
        w: avanceW,
        comienzoLineaBase: comienzoLB,
        finLineaBase: finLB,
        duraLineaBase: duraLB,
        comien: t.comien,
        fin: t.fin,
        dura: t.dura,
        tf: t.tf,
        ff: t.ff,
        esCritica: t.esCritica,
        obligatoria: t.esCritica,
        esInicioEstaSemana,
        esFinEstaSemana,
        esInicioAnticipado,
        esFinAnticipado,
        alertaPrioridadFinSinAvanceCritica,
        motivoInclusion: motivos,
      });
    }

    // Ordenar: primero las críticas, luego por fecha de inicio LB y EDT
    actividades.sort((a, b) => {
      if (a.esCritica !== b.esCritica) return a.esCritica ? -1 : 1;
      if (a.comienzoLineaBase !== b.comienzoLineaBase) {
        return a.comienzoLineaBase.localeCompare(b.comienzoLineaBase);
      }
      return a.edt.localeCompare(b.edt);
    });

    const totalCriticas = actividades.filter(a => a.esCritica).length;

    return {
      actividades,
      totalSemana: actividades.length,
      totalCriticas,
      infoSemana,
    };
  }

  /**
   * Guarda las calificaciones temporales de la semana en curso (borrador en edición).
   */
  static guardarCalificacionesTemp(proyecto: string, semanaKey: string, califs: Record<number, CalificacionActividad>): void {
    safeLocalStorageSet(`${KEY_CALIFICACIONES_TEMP_PREFIX}${proyecto}_${semanaKey}`, JSON.stringify(califs));
  }

  /**
   * Recupera las calificaciones en borrador para la semana seleccionada.
   */
  static getCalificacionesTemp(proyecto: string, semanaKey: string): Record<number, CalificacionActividad> {
    try {
      const raw = localStorage.getItem(`${KEY_CALIFICACIONES_TEMP_PREFIX}${proyecto}_${semanaKey}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Valida estrictamente si el reporte semanal puede cerrarse:
   * 1. Todas las actividades críticas (tipo task con TF <= 0) deben estar calificadas en su pestaña (Inicio y/o Fin).
   * 2. Si no cumple inicio o no cumple fin, son obligatorios Causa, Fecha de Compromiso, Responsable y Observación.
   */
  static validarCierreReporte(
    actividades: ActividadSemanalBitacora[],
    calificaciones: Record<number, CalificacionActividad>
  ): {
    valido: boolean;
    errores: string[];
    faltantesCriticas: ActividadSemanalBitacora[];
    faltantesObservaciones: ActividadSemanalBitacora[];
  } {
    const errores: string[] = [];
    const faltantesCriticas: ActividadSemanalBitacora[] = [];
    const faltantesObservaciones: ActividadSemanalBitacora[] = [];

    for (const act of actividades) {
      const cal = calificaciones[act.idConsec];
      const requiereInicio = act.esInicioEstaSemana;
      const requiereFin = act.esFinEstaSemana;

      // Validación de obligatoriedad en Ruta Crítica
      if (act.esCritica) {
        const inicioPendiente = requiereInicio && (!cal || cal.cumpleInicio === null || cal.cumpleInicio === undefined);
        const finPendiente = requiereFin && (!cal || cal.cumpleFin === null || cal.cumpleFin === undefined);
        if (inicioPendiente || finPendiente) {
          faltantesCriticas.push(act);
        }
      }

      // Validación de campos obligatorios en caso de incumplimiento
      if (cal) {
        let incompletoInicio = false;
        let incompletoFin = false;

        if (cal.cumpleInicio === false) {
          const obsIni = (cal.observacionesInicio || cal.observaciones || '').trim();
          if (
            !cal.causaNoInicio ||
            !cal.fechaCompromisoInicio ||
            !cal.responsableInicio ||
            obsIni.length < 5
          ) {
            incompletoInicio = true;
          }
        }

        if (cal.cumpleFin === false) {
          const obsFin = (cal.observacionesFin || cal.observaciones || '').trim();
          if (
            !cal.causaNoFin ||
            !cal.fechaCompromisoFin ||
            !cal.responsableFin ||
            obsFin.length < 5
          ) {
            incompletoFin = true;
          }
        }

        if (incompletoInicio || incompletoFin) {
          faltantesObservaciones.push(act);
        }
      }
    }

    if (faltantesCriticas.length > 0) {
      errores.push(`Existen ${faltantesCriticas.length} actividades de Ruta Crítica (tipo task) pendientes de calificación obligatoria.`);
    }

    if (faltantesObservaciones.length > 0) {
      errores.push(`Existen ${faltantesObservaciones.length} actividades con incumplimiento sin completar Causa, Fecha Compromiso, Responsable u Observación.`);
    }

    return {
      valido: errores.length === 0,
      errores,
      faltantesCriticas,
      faltantesObservaciones,
    };
  }

  /**
   * Cierra y guarda oficialmente el reporte semanal en localStorage y lo encola a SharePoint.
   */
  static cerrarReporteSemanal(
    reporte: ReporteSemanalBitacora
  ): void {
    const list = this.getReportesSemanales();
    // Reemplazar si ya existe la misma semana o agregar al inicio
    const index = list.findIndex(r => r.proyecto === reporte.proyecto && r.semana === reporte.semana && r.anio === reporte.anio);
    if (index >= 0) {
      list[index] = reporte;
    } else {
      list.unshift(reporte);
    }

    safeLocalStorageSet(KEY_REPORTES_SEMANALES, JSON.stringify(list));

    // Encolar hacia SharePoint Service
    SharePointService.enqueueRecord(
      SHAREPOINT_LISTS.PROGRAMACION,
      'CREATE',
      reporte.idReporte,
      {
        Title: `Reporte Semanal Sem-${reporte.semana} ${reporte.proyecto}`,
        Proyecto: reporte.proyecto,
        Sucursal: reporte.sucursal,
        Semana: reporte.semana,
        Anio: reporte.anio,
        FechaCierre: reporte.fechaCierre,
        Residente: reporte.residente,
        TotalActividades: reporte.totalActividades,
        CriticasEvaluadas: reporte.criticasEvaluadas,
        CumplimientoInicioPct: reporte.cumplimientoInicioPct,
        CumplimientoFinPct: reporte.cumplimientoFinPct,
        DetalleJSON: JSON.stringify(reporte.items),
      }
    );

    // Limpiar borrador temporal de esa semana
    const semanaKey = `${reporte.anio}-W${reporte.semana}`;
    localStorage.removeItem(`${KEY_CALIFICACIONES_TEMP_PREFIX}${reporte.proyecto}_${semanaKey}`);

    // Disparar evento
    window.dispatchEvent(new CustomEvent('marval_bitacora_reporte_cerrado', { detail: reporte }));
  }

  /**
   * Obtiene el histórico de reportes semanales cerrados.
   */
  static getReportesSemanales(proyecto?: string): ReporteSemanalBitacora[] {
    try {
      const raw = localStorage.getItem(KEY_REPORTES_SEMANALES);
      if (!raw) return [];
      const list: ReporteSemanalBitacora[] = JSON.parse(raw);
      if (proyecto) {
        return list.filter(r => r.proyecto === proyecto);
      }
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Obtiene el diccionario de resoluciones y acciones correctivas aplicadas en Lookahead.
   */
  static getResolucionesLookahead(): Record<string, { gates?: Partial<LookaheadGate['gates']>; estadoGestion?: 'PENDIENTE' | 'EN_GESTION' | 'LIBERADO'; notasGestion?: string; responsableGestion?: string; fechaCompromiso?: string; fechaResolucion?: string }> {
    try {
      const raw = localStorage.getItem(KEY_LOOKAHEAD_RESOLUCIONES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Guarda una acción de resolución o liberación sobre una compuerta en Lookahead.
   */
  static guardarResolucionLookahead(
    gateId: string,
    updates: { gates?: Partial<LookaheadGate['gates']>; estadoGestion?: 'PENDIENTE' | 'EN_GESTION' | 'LIBERADO'; notasGestion?: string; responsableGestion?: string; fechaCompromiso?: string }
  ): void {
    const all = this.getResolucionesLookahead();
    all[gateId] = {
      ...all[gateId],
      ...updates,
      fechaResolucion: new Date().toISOString()
    };
    safeLocalStorageSet(KEY_LOOKAHEAD_RESOLUCIONES, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('marval_lookahead_updated'));
  }

  /**
   * Consolida dinámicamente las restricciones de arranque registradas en Bitácora
   * (tanto borradores en edición como reportes cerrados) para alimentar la matriz de 7 compuertas Lookahead.
   */
  static getRestriccionesLookaheadFeed(proyecto: string = 'Belaterra Pietra'): LookaheadGate[] {
    const resoluciones = this.getResolucionesLookahead();
    const feedItems: LookaheadGate[] = [];
    const idSet = new Set<string>();

    // 1. Extraer restricciones de borradores en edición
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${KEY_CALIFICACIONES_TEMP_PREFIX}${proyecto}`)) {
          const semanaPart = key.split('_').slice(-1)[0] || 'W0';
          const califs = JSON.parse(localStorage.getItem(key) || '{}');

          Object.values(califs).forEach((c: any) => {
            if (c && c.cumpleInicio === false && c.causaNoInicio) {
              const id = `bitacora-temp-${c.idConsec}-${semanaPart}`;
              if (!idSet.has(id)) {
                idSet.add(id);
                const failedGate = mapRestriccionToGateKey(c.causaNoInicio);
                const defaultGates: LookaheadGate['gates'] = {
                  diseno: true,
                  contratacion: true,
                  predecesora: true,
                  materiales: true,
                  manoObra: true,
                  equipos: true,
                  sstAmbiental: true,
                  [failedGate]: false,
                };

                const res = resoluciones[id];
                const finalGates = res?.gates ? { ...defaultGates, ...res.gates } : defaultGates;
                const officialGates = [
                  finalGates.diseno,
                  finalGates.contratacion,
                  finalGates.predecesora,
                  finalGates.materiales,
                  finalGates.equipos,
                  finalGates.sstAmbiental,
                ];
                const trueCount = officialGates.filter(Boolean).length;
                const ip = Math.round((trueCount / 6) * 100);

                feedItems.push({
                  id,
                  edt: c.edt || 'EDT',
                  actividad: c.nombre || `Actividad ${c.idConsec}`,
                  frente: c.agrupacion || 'Obra General',
                  semana: semanaPart.replace('-', ' '),
                  responsable: c.residente || 'Residente Interventoría',
                  esCritica: Boolean(c.esCritica),
                  origen: 'BITACORA_CAMPO',
                  observaciones: c.observaciones || 'Restricción levantada en bitácora de obra.',
                  restriccionPrincipal: c.causaNoInicio,
                  estadoGestion: res?.estadoGestion || (finalGates[failedGate] ? 'LIBERADO' : 'PENDIENTE'),
                  gates: finalGates,
                  indicePreparacion: ip,
                });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('Error leyendo borradores de bitácora para Lookahead:', err);
    }

    // 2. Extraer restricciones de reportes cerrados oficiales
    try {
      const reportes = this.getReportesSemanales(proyecto);
      reportes.forEach(rep => {
        rep.items.forEach(item => {
          if (item.cumpleInicio === false && item.causaNoInicio) {
            const id = `bitacora-rep-${item.idConsec}-W${rep.semana}`;
            if (!idSet.has(id)) {
              idSet.add(id);
              const failedGate = mapRestriccionToGateKey(item.causaNoInicio);
              const defaultGates: LookaheadGate['gates'] = {
                diseno: true,
                contratacion: true,
                predecesora: true,
                materiales: true,
                manoObra: true,
                equipos: true,
                sstAmbiental: true,
                [failedGate]: false,
              };

              const res = resoluciones[id];
              const finalGates = res?.gates ? { ...defaultGates, ...res.gates } : defaultGates;
              const officialGates = [
                finalGates.diseno,
                finalGates.contratacion,
                finalGates.predecesora,
                finalGates.materiales,
                finalGates.equipos,
                finalGates.sstAmbiental,
              ];
              const trueCount = officialGates.filter(Boolean).length;
              const ip = Math.round((trueCount / 6) * 100);

              feedItems.push({
                id,
                edt: item.edt,
                actividad: item.nombre,
                frente: item.agrupacion || 'Obra General',
                semana: `Semana ${rep.semana}`,
                responsable: item.residente || rep.residente || 'Residente Interventoría',
                esCritica: Boolean(item.esCritica),
                origen: 'BITACORA_CAMPO',
                observaciones: item.observaciones || 'Registrado en cierre de bitácora semanal.',
                restriccionPrincipal: item.causaNoInicio,
                estadoGestion: res?.estadoGestion || (finalGates[failedGate] ? 'LIBERADO' : 'PENDIENTE'),
                gates: finalGates,
                indicePreparacion: ip,
              });
            }
          }
        });
      });
    } catch (err) {
      console.warn('Error leyendo reportes de bitácora para Lookahead:', err);
    }

    return feedItems;
  }
}
