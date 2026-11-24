import { WbsItem, HitoMacro } from '../types';
import { CpmEngine } from './cpmEngine';
import { BaselineService, purgeLegacyStorage, safeLocalStorageSet } from './baselineService';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import {
  MacroMilestoneService,
  mapOfficialHitoToLegacyEnum,
} from './macroMilestoneService';
import {
  ProjectService,
  normalizeTorreStandard,
  containsTorreKeyword,
} from './projectService';
import type { FechaAlistamientoTorreRecord } from './wbsParser';

export type { FechaAlistamientoTorreRecord };

export interface FechasAlistamientoState {
  proyecto: string;
  fileName: string;
  fechaCarga: string;
  usuario: string;
  records: FechaAlistamientoTorreRecord[];
  byTorre: Record<string, FechaAlistamientoTorreRecord>;
}

export interface ScheduleMetadata {
  proyecto: string;
  fileName: string;
  fechaCarga: string;
  totalTareas: number;
  tieneLineaBase: boolean;
  fechaLineaBase?: string;
  tipoAccion?: 'LINEA_BASE' | 'AVANCE_SEMANAL';
  usuario?: string;
}

export interface SharePointWbsBaselineRow {
  codigoEdt: string;
  nivelEsquema: number;
  nombreActividad: string;
  tipo: string;
  avanceW: number;
  comienzoLineaBase: string;
  finLineaBase: string;
  comienzoReal: string;
  finReal: string;
  variacionInicioDias: number;
  variacionFinDias: number;
  hitoMacro: string;
  contratista: string;
  corteId: string;
}

export interface CorteProgramacion {
  id: string;
  numeroCorte: number;
  etiqueta: string;
  semanaIso: string;
  fechaCorte: string;
  fileName: string;
  esLineaBase: boolean;
  tasks: WbsItem[];
}

export interface WbsAssignmentsState {
  hitoByEdt: Record<string, string>;
  contratistaByEdt: Record<string, string>;
}

export interface TowerNormalizationAudit {
  normalizedTasks: WbsItem[];
  renamedGroups: Array<{ from: string; to: string; count: number }>;
  missingTorresInParam: string[];
  torresEnWorkplanner: string[];
}

const STORAGE_SCHEDULE_KEY_PREFIX = 'interventor_active_edt_v3_';
const STORAGE_SCHEDULE_META_PREFIX = 'interventor_active_edt_meta_v3_';
const STORAGE_WBS_ASSIGNMENTS_PREFIX = 'interventor_edt_assignments_v3_';
const STORAGE_WBS_CORTES_PREFIX = 'interventor_edt_cortes_v3_';
const STORAGE_FECHAS_ALISTAMIENTO_PREFIX = 'interventor_fechas_alistamiento_v1_';

// Tupla compacta por corte: [idConsec, w, comien, fin, dura, varComien, varFin]
type CompactCorteTaskTuple = [number, number, string, string, number, number, number];

interface StoredCorteCompact {
  id: string;
  numeroCorte: number;
  etiqueta: string;
  semanaIso: string;
  fechaCorte: string;
  fileName: string;
  esLineaBase: boolean;
  compactTasks?: CompactCorteTaskTuple[];
  extraTasks?: WbsItem[];
  tasks?: WbsItem[];
}

// Cachés en memoria para evitar fallos de cuota de localStorage y acelerar consultas
const memoryScheduleMap = new Map<string, WbsItem[]>();
const memoryCortesMap = new Map<string, CorteProgramacion[]>();
const memoryMetaMap = new Map<string, ScheduleMetadata>();
const memoryAlistamientoMap = new Map<string, FechasAlistamientoState>();

function compactWbsItemForStorage(t: WbsItem): Partial<WbsItem> {
  const obj: Partial<WbsItem> = {
    edt: t.edt,
    nivel: t.nivel,
    nombre: t.nombre,
    w: t.w,
    duraPrev: t.duraPrev,
    dura: t.dura,
    comienPrev: t.comienPrev,
    finPrev: t.finPrev,
    comien: t.comien,
    fin: t.fin,
    varComien: t.varComien,
    varFin: t.varFin,
    tipo: t.tipo,
    etapa: t.etapa,
  };
  if (t.idConsec !== undefined) obj.idConsec = t.idConsec;
  if (t.esHito) obj.esHito = true;
  if (t.responsable) obj.responsable = t.responsable;
  if (t.unidad) obj.unidad = t.unidad;
  if (t.cantidad) obj.cantidad = t.cantidad;
  if (t.rendimiento) obj.rendimiento = t.rendimiento;
  if (t.predecesora) obj.predecesora = t.predecesora;
  if (t.agrupacion && t.agrupacion !== 'NO APLICA') obj.agrupacion = t.agrupacion;
  if (t.codigoPlaneacion) obj.codigoPlaneacion = t.codigoPlaneacion;
  return obj;
}

function hydrateWbsItem(raw: Partial<WbsItem>): WbsItem {
  return {
    idConsec: raw.idConsec,
    edt: raw.edt || '',
    nivel: Number(raw.nivel || 1),
    esHito: Boolean(raw.esHito),
    nombre: raw.nombre || '',
    w: Number(raw.w || 0),
    duraPrev: Number(raw.duraPrev || 0),
    dura: Number(raw.dura || 0),
    comienPrev: raw.comienPrev || '',
    finPrev: raw.finPrev || '',
    comien: raw.comien || '',
    fin: raw.fin || '',
    varComien: Number(raw.varComien || 0),
    varFin: Number(raw.varFin || 0),
    responsable: raw.responsable,
    unidad: raw.unidad,
    cantidad: raw.cantidad,
    rendimiento: raw.rendimiento,
    predecesora: raw.predecesora,
    agrupacion: raw.agrupacion || 'NO APLICA',
    codigoPlaneacion: raw.codigoPlaneacion,
    tipo: raw.tipo || 'task',
    etapa: raw.etapa || 'NO APLICA',
  };
}

function serializeCortesCompact(
  cortes: CorteProgramacion[],
  baseTasks: WbsItem[]
): StoredCorteCompact[] {
  const baseById = new Map<number, WbsItem>();
  baseTasks.forEach((t) => {
    if (t.idConsec !== undefined) baseById.set(t.idConsec, t);
  });

  return cortes.map((c) => {
    const compactTasks: CompactCorteTaskTuple[] = [];
    const extraTasks: WbsItem[] = [];

    c.tasks.forEach((t) => {
      if (t.idConsec !== undefined && baseById.has(t.idConsec)) {
        compactTasks.push([
          t.idConsec,
          Number(t.w || 0),
          t.comien || '',
          t.fin || '',
          Number(t.dura || 0),
          Number(t.varComien || 0),
          Number(t.varFin || 0),
        ]);
      } else {
        extraTasks.push(compactWbsItemForStorage(t) as WbsItem);
      }
    });

    const entry: StoredCorteCompact = {
      id: c.id,
      numeroCorte: c.numeroCorte,
      etiqueta: c.etiqueta,
      semanaIso: c.semanaIso,
      fechaCorte: c.fechaCorte,
      fileName: c.fileName,
      esLineaBase: c.esLineaBase,
      compactTasks,
    };
    if (extraTasks.length > 0) {
      entry.extraTasks = extraTasks;
    }
    return entry;
  });
}

function hydrateCortesFromStored(
  stored: StoredCorteCompact[],
  baseTasks: WbsItem[]
): CorteProgramacion[] {
  const baseById = new Map<number, WbsItem>();
  baseTasks.forEach((t) => {
    if (t.idConsec !== undefined) baseById.set(t.idConsec, t);
  });

  return stored.map((c) => {
    if (Array.isArray(c.tasks)) {
      return {
        id: c.id,
        numeroCorte: c.numeroCorte,
        etiqueta: c.etiqueta,
        semanaIso: c.semanaIso,
        fechaCorte: c.fechaCorte,
        fileName: c.fileName,
        esLineaBase: c.esLineaBase,
        tasks: c.tasks.map(hydrateWbsItem),
      };
    }

    const hydrated: WbsItem[] = [];
    (c.compactTasks || []).forEach(([idConsec, w, comien, fin, dura, varComien, varFin]) => {
      const base = baseById.get(idConsec);
      if (base) {
        hydrated.push({
          ...base,
          w,
          comien: comien || base.comien,
          fin: fin || base.fin,
          dura,
          varComien,
          varFin,
        });
      }
    });
    (c.extraTasks || []).forEach((et) => hydrated.push(hydrateWbsItem(et)));

    return {
      id: c.id,
      numeroCorte: c.numeroCorte,
      etiqueta: c.etiqueta,
      semanaIso: c.semanaIso,
      fechaCorte: c.fechaCorte,
      fileName: c.fileName,
      esLineaBase: c.esLineaBase,
      tasks: hydrated,
    };
  });
}

function normalizeTipo(t: WbsItem): 'project' | 'milestone' | 'task' {
  const raw = (t.tipo || '').toLowerCase();
  if (raw === 'project') return 'project';
  if (raw === 'milestone' || t.esHito) return 'milestone';
  return 'task';
}

export class ScheduleService {
  /**
   * Diferencia en días calendario entre fecha real y fecha línea base (Real - Línea Base).
   */
  static diffDays(dateReal?: string, dateBase?: string): number {
    if (!dateReal || !dateBase) return 0;
    const d1 = new Date(`${dateReal}T12:00:00`);
    const d2 = new Date(`${dateBase}T12:00:00`);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    return Math.round((d1.getTime() - d2.getTime()) / (1000 * 86400));
  }

  /**
   * Normaliza automáticamente las agrupaciones del Workplanner que contengan "TORRE"
   * (ej. "TORRE 1" -> "TORRE 01") para igualarlas al estándar de dos dígitos definido
   * en Parámetros del proyecto, y detecta qué torres no existen aún en la parametrización.
   */
  static normalizeAndAuditTowers(
    proyectoId: string,
    rawTasks: WbsItem[]
  ): TowerNormalizationAudit {
    const paramTorres = new Set(
      ProjectService.getTorresEstructura(proyectoId).map((t) => t.toUpperCase())
    );

    const renameCounter = new Map<string, { from: string; to: string; count: number }>();
    const wpTorreSet = new Set<string>();

    const normalizedTasks = rawTasks.map((t) => {
      const rawAgr = (t.agrupacion || '').trim();
      if (!rawAgr || !containsTorreKeyword(rawAgr)) {
        return t;
      }

      const std = normalizeTorreStandard(rawAgr);
      const finalAgr = std || rawAgr.toUpperCase();
      wpTorreSet.add(finalAgr);

      if (finalAgr !== rawAgr) {
        const key = `${rawAgr}__${finalAgr}`;
        const prev = renameCounter.get(key) || { from: rawAgr, to: finalAgr, count: 0 };
        prev.count += 1;
        renameCounter.set(key, prev);
        return {
          ...t,
          agrupacion: finalAgr,
        };
      }

      return t;
    });

    const torresEnWorkplanner = Array.from(wpTorreSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    const missingTorresInParam = torresEnWorkplanner.filter(
      (torreName) => !paramTorres.has(torreName.toUpperCase())
    );

    return {
      normalizedTasks,
      renamedGroups: Array.from(renameCounter.values()),
      missingTorresInParam,
      torresEnWorkplanner,
    };
  }

  /**
   * Obtiene la sábana activa de programación para un proyecto.
   * Retorna [] si aún no se ha cargado ninguna sábana (cero datos precargados).
   */
  static getActiveSchedule(proyecto?: string | null): WbsItem[] {
    if (!proyecto) return [];
    if (memoryScheduleMap.has(proyecto)) {
      return memoryScheduleMap.get(proyecto)!;
    }
    try {
      const raw = localStorage.getItem(`${STORAGE_SCHEDULE_KEY_PREFIX}${proyecto}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const hydrated = parsed.map(hydrateWbsItem);
          memoryScheduleMap.set(proyecto, hydrated);
          return hydrated;
        }
      }
    } catch (e) {
      console.warn(`[ScheduleService] Error leyendo programación almacenada para ${proyecto}:`, e);
    }
    return [];
  }

  /**
   * Obtiene los metadatos de carga y estado de línea base de la programación activa.
   */
  static getScheduleMetadata(proyecto?: string | null): ScheduleMetadata {
    const projId = proyecto || '';
    const tieneLB = projId ? BaselineService.tieneLineaBase(projId) : false;
    const metaLB = projId ? BaselineService.getLineaBaseMetadata(projId) : null;

    if (projId && memoryMetaMap.has(projId)) {
      const cached = memoryMetaMap.get(projId)!;
      return {
        ...cached,
        tieneLineaBase: tieneLB,
        fechaLineaBase: metaLB?.fechaCongelacion || cached.fechaLineaBase,
      };
    }

    if (projId) {
      try {
        const rawMeta = localStorage.getItem(`${STORAGE_SCHEDULE_META_PREFIX}${projId}`);
        if (rawMeta) {
          const parsed = JSON.parse(rawMeta) as ScheduleMetadata;
          memoryMetaMap.set(projId, parsed);
          return {
            ...parsed,
            tieneLineaBase: tieneLB,
            fechaLineaBase: metaLB?.fechaCongelacion || parsed.fechaLineaBase,
          };
        }
      } catch (e) {
        console.warn(`[ScheduleService] Error leyendo metadatos de ${projId}:`, e);
      }
    }

    return {
      proyecto: projId,
      fileName: 'Sin sábana cargada',
      fechaCarga: '',
      totalTareas: 0,
      tieneLineaBase: tieneLB,
      fechaLineaBase: metaLB?.fechaCongelacion,
      tipoAccion: undefined,
      usuario: metaLB?.usuario,
    };
  }

  /**
   * Inicializa o recupera asignaciones de Hito Macro (por Código CPC del catálogo de 54 hitos)
   * y Contratista por Código EDT.
   */
  static getWbsAssignments(
    proyecto?: string | null,
    tasksOverride?: WbsItem[]
  ): WbsAssignmentsState {
    if (!proyecto) return { hitoByEdt: {}, contratistaByEdt: {} };
    try {
      const raw = localStorage.getItem(`${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.hitoByEdt && parsed.contratistaByEdt) {
          // Migrar automáticamente etiquetas antiguas del catálogo anterior ("Urbanismo y movimiento de tierra" / "Zonas comune no esenciales")
          const values = Object.values(parsed.hitoByEdt as Record<string, string>);
          const needsMigration = values.some(
            (v) => v === 'Urbanismo y movimiento de tierra' || v === 'Zonas comune no esenciales'
          );
          if (needsMigration) {
            const tasksForMigration = tasksOverride || this.getActiveSchedule(proyecto);
            const freshByCpc =
              tasksForMigration.length > 0
                ? MacroMilestoneService.buildDefaultHitoByEdtFromCpc(tasksForMigration)
                : {};
            const migratedHitoByEdt: Record<string, string> = { ...parsed.hitoByEdt };
            Object.entries(migratedHitoByEdt).forEach(([edt, val]) => {
              if (val === 'Urbanismo y movimiento de tierra') {
                migratedHitoByEdt[edt] = freshByCpc[edt] || 'Urbanismo';
              } else if (val === 'Zonas comune no esenciales') {
                migratedHitoByEdt[edt] = 'Zonas comunes no esenciales';
              }
            });
            const migratedState: WbsAssignmentsState = {
              hitoByEdt: migratedHitoByEdt,
              contratistaByEdt: parsed.contratistaByEdt,
            };
            safeLocalStorageSet(
              `${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`,
              JSON.stringify(migratedState)
            );
            return migratedState;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[ScheduleService] Error leyendo asignaciones EDT:', e);
    }

    const tasks = tasksOverride || this.getActiveSchedule(proyecto);
    if (tasks.length === 0) {
      return { hitoByEdt: {}, contratistaByEdt: {} };
    }

    const hitoByEdt = MacroMilestoneService.buildDefaultHitoByEdtFromCpc(tasks);
    const contratistaByEdt: Record<string, string> = {};

    tasks.forEach((t) => {
      if (t.responsable && t.responsable.trim()) {
        contratistaByEdt[t.edt] = t.responsable.trim();
      }
    });

    const initial: WbsAssignmentsState = { hitoByEdt, contratistaByEdt };
    safeLocalStorageSet(`${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`, JSON.stringify(initial));
    return initial;
  }

  private static syncMappingToMacroMilestoneService(
    proyecto: string,
    tasks: WbsItem[],
    hitoByEdt: Record<string, string>
  ): void {
    const mapping: Record<HitoMacro, string[]> = {
      URBANISMO: [],
      CIMENTACION: [],
      ESTRUCTURA: [],
      MAMPOSTERIA: [],
      FACHADAS: [],
      REDES_HIDROSANITARIAS: [],
      REDES_ELECTRICAS_GAS: [],
      ACABADOS_OBRA_GRIS: [],
      ACABADOS_OBRA_BLANCA: [],
      CARPINTERIAS: [],
      EQUIPOS_ESPECIALES: [],
      ZONAS_COMUNES_ESENCIALES: [],
      CIERRE_ENTREGAS: [],
    };

    tasks.forEach((t) => {
      const h = hitoByEdt[t.edt];
      const legacy = mapOfficialHitoToLegacyEnum(h);
      if (legacy && normalizeTipo(t) === 'task') {
        mapping[legacy].push(t.edt);
      }
    });

    MacroMilestoneService.saveProjectMapping(proyecto, mapping);
  }

  /**
   * Asigna un Hito Macro a una fila EDT (propagando solo a subtareas tipo "task").
   */
  static assignHitoMacroToEdt(
    proyecto: string,
    targetEdt: string,
    hito: string,
    allTasks: WbsItem[]
  ): { updatedCount: number; assignments: WbsAssignmentsState } {
    const state = this.getWbsAssignments(proyecto, allTasks);
    const hitoByEdt = { ...state.hitoByEdt };
    const targetRow = allTasks.find((t) => t.edt === targetEdt);
    const isTask = targetRow ? normalizeTipo(targetRow) === 'task' : true;

    let updatedCount = 0;
    const edtsAffected: WbsItem[] = [];

    if (isTask) {
      if (hito) hitoByEdt[targetEdt] = hito;
      else delete hitoByEdt[targetEdt];
      if (targetRow) edtsAffected.push(targetRow);
      updatedCount = 1;
    } else {
      const prefix = `${targetEdt}.`;
      if (hito) hitoByEdt[targetEdt] = hito;
      else delete hitoByEdt[targetEdt];
      allTasks.forEach((t) => {
        if (t.edt === targetEdt || (t.edt.startsWith(prefix) && normalizeTipo(t) === 'task')) {
          if (hito) hitoByEdt[t.edt] = hito;
          else delete hitoByEdt[t.edt];
          edtsAffected.push(t);
          if (normalizeTipo(t) === 'task') updatedCount++;
        }
      });
    }

    const nextState: WbsAssignmentsState = {
      hitoByEdt,
      contratistaByEdt: state.contratistaByEdt,
    };

    safeLocalStorageSet(`${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`, JSON.stringify(nextState));
    this.syncMappingToMacroMilestoneService(proyecto, allTasks, hitoByEdt);

    const lbMap = BaselineService.getLineaBase(proyecto);
    edtsAffected.slice(0, 50).forEach((row) => {
      const lb = lbMap?.get(row.idConsec || 0);
      const comLB = row.comienPrev || lb?.comienzoLineaBase || row.comien;
      const finLB = row.finPrev || lb?.finLineaBase || row.fin;
      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.WBS_LINEA_BASE,
        'UPDATE',
        `${proyecto}-EDT-${row.edt}`,
        {
          codigoEdt: row.edt,
          nivelEsquema: row.nivel,
          nombreActividad: row.nombre,
          tipo: normalizeTipo(row),
          avanceW: row.w,
          comienzoLineaBase: comLB,
          finLineaBase: finLB,
          comienzoReal: row.comien,
          finReal: row.fin,
          variacionInicioDias: this.diffDays(row.comien, comLB),
          variacionFinDias: this.diffDays(row.fin, finLB),
          hitoMacro: hitoByEdt[row.edt] || '',
          contratista: nextState.contratistaByEdt[row.edt] || row.responsable || '',
        }
      );
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marval_wbs_assignments_updated', { detail: { proyecto } }));
    }

    return { updatedCount, assignments: nextState };
  }

  /**
   * Asigna Contratista (AN8 / Marval Ingeniería) a una fila EDT y opcionalmente sus hijas "task".
   */
  static assignContratistaToEdt(
    proyecto: string,
    targetEdt: string,
    contratista: string,
    allTasks?: WbsItem[],
    propagateIfSummary: boolean = true
  ): WbsAssignmentsState {
    const tasks = allTasks || this.getActiveSchedule(proyecto);
    const state = this.getWbsAssignments(proyecto, tasks);
    const contratistaByEdt = { ...state.contratistaByEdt };

    const targetRow = tasks.find((t) => t.edt === targetEdt);
    const isTask = targetRow ? normalizeTipo(targetRow) === 'task' : true;
    const affected: WbsItem[] = [];

    if (isTask || !propagateIfSummary) {
      if (contratista) contratistaByEdt[targetEdt] = contratista;
      else delete contratistaByEdt[targetEdt];
      if (targetRow) affected.push(targetRow);
    } else {
      const prefix = `${targetEdt}.`;
      if (contratista) contratistaByEdt[targetEdt] = contratista;
      else delete contratistaByEdt[targetEdt];
      tasks.forEach((t) => {
        if (t.edt === targetEdt || (t.edt.startsWith(prefix) && normalizeTipo(t) === 'task')) {
          if (contratista) contratistaByEdt[t.edt] = contratista;
          else delete contratistaByEdt[t.edt];
          affected.push(t);
        }
      });
    }

    const nextState: WbsAssignmentsState = {
      hitoByEdt: state.hitoByEdt,
      contratistaByEdt,
    };

    safeLocalStorageSet(`${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`, JSON.stringify(nextState));

    const lbMap = BaselineService.getLineaBase(proyecto);
    affected.slice(0, 50).forEach((row) => {
      const lb = lbMap?.get(row.idConsec || 0);
      const comLB = row.comienPrev || lb?.comienzoLineaBase || row.comien;
      const finLB = row.finPrev || lb?.finLineaBase || row.fin;
      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.WBS_LINEA_BASE,
        'UPDATE',
        `${proyecto}-EDT-${row.edt}`,
        {
          codigoEdt: row.edt,
          nivelEsquema: row.nivel,
          nombreActividad: row.nombre,
          tipo: normalizeTipo(row),
          avanceW: row.w,
          comienzoLineaBase: comLB,
          finLineaBase: finLB,
          comienzoReal: row.comien,
          finReal: row.fin,
          variacionInicioDias: this.diffDays(row.comien, comLB),
          variacionFinDias: this.diffDays(row.fin, finLB),
          hitoMacro: nextState.hitoByEdt[row.edt] || '',
          contratista: contratistaByEdt[row.edt] || '',
        }
      );
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marval_wbs_assignments_updated', { detail: { proyecto } }));
    }

    return nextState;
  }

  /**
   * Construye las filas exactas de las 14 columnas para la lista SharePoint `Interventoria_WBS_LineasBase`.
   */
  static buildSharePointBaselineRows(
    proyecto: string,
    tasks: WbsItem[],
    corteId: string = 'CORTE_00'
  ): SharePointWbsBaselineRow[] {
    const assignments = this.getWbsAssignments(proyecto, tasks);
    const lbMap = BaselineService.getLineaBase(proyecto);

    return tasks.map((t) => {
      const lb = lbMap?.get(t.idConsec || 0);
      const comienzoLineaBase = t.comienPrev || lb?.comienzoLineaBase || t.comien || '';
      const finLineaBase = t.finPrev || lb?.finLineaBase || t.fin || '';
      const comienzoReal = t.comien || comienzoLineaBase;
      const finReal = t.fin || finLineaBase;

      return {
        codigoEdt: t.edt,
        nivelEsquema: t.nivel,
        nombreActividad: t.nombre,
        tipo: normalizeTipo(t),
        avanceW: Math.round((t.w || 0) * 100),
        comienzoLineaBase,
        finLineaBase,
        comienzoReal,
        finReal,
        variacionInicioDias: this.diffDays(comienzoReal, comienzoLineaBase),
        variacionFinDias: this.diffDays(finReal, finLineaBase),
        hitoMacro: assignments.hitoByEdt[t.edt] || '',
        contratista: assignments.contratistaByEdt[t.edt] || t.responsable || '',
        corteId,
      };
    });
  }

  /**
   * Retorna únicamente los cortes reales cargados por el usuario para el proyecto.
   * SIN cortes sintéticos ni datos precargados. Rehidrata los cortes compactos desde localStorage.
   */
  static getCortes(proyecto?: string | null): CorteProgramacion[] {
    if (!proyecto) return [];
    if (memoryCortesMap.has(proyecto)) {
      return memoryCortesMap.get(proyecto)!;
    }
    try {
      const raw = localStorage.getItem(`${STORAGE_WBS_CORTES_PREFIX}${proyecto}`);
      if (raw) {
        const stored = JSON.parse(raw) as StoredCorteCompact[];
        if (Array.isArray(stored)) {
          const baseTasks = this.getActiveSchedule(proyecto);
          const hydrated = hydrateCortesFromStored(stored, baseTasks);
          memoryCortesMap.set(proyecto, hydrated);
          return hydrated;
        }
      }
    } catch (e) {
      console.warn('[ScheduleService] Error leyendo cortes almacenados:', e);
    }
    return [];
  }

  /**
   * Verifica si ya existe una sábana de seguimiento registrada en la misma semana ISO.
   */
  static findCorteDuplicadoEnSemana(
    proyecto: string,
    fechaCorteIso: string
  ): CorteProgramacion | null {
    const semInfo = BaselineService.getSemanaCorte(fechaCorteIso);
    const semanaIso = `${semInfo.anio}-W${semInfo.numeroSemana}`;
    const cortes = this.getCortes(proyecto);
    return cortes.find((c) => !c.esLineaBase && c.semanaIso === semanaIso) || null;
  }

  /**
   * Congela la primera sábana como Línea Base o registra un nuevo corte semanal nombrado por la ventana de la semana.
   * Incluye normalización preventiva de "TORRE ##" y rechazo de duplicados en la misma semana.
   */
  static saveCorteProgramacion(params: {
    proyecto: string;
    tasks: WbsItem[];
    fileName: string;
    esLineaBase: boolean;
    fechaCorte?: string;
    usuario?: string;
  }): {
    success: boolean;
    duplicateRejected?: boolean;
    message: string;
    corte?: CorteProgramacion;
    towerAudit?: TowerNormalizationAudit;
  } {
    const usuario = params.usuario || 'Residente de Interventoría';
    const fechaCorte = params.fechaCorte || new Date().toISOString().split('T')[0];
    const semInfo = BaselineService.getSemanaCorte(fechaCorte);
    const semanaIso = `${semInfo.anio}-W${semInfo.numeroSemana}`;
    const etiquetaVentana = semInfo.etiquetaSemana; // ej. "Semana 47 (16 Nov - 22 Nov 2026)"

    const existingCortes = this.getCortes(params.proyecto);

    // Validación anti-duplicado: no permitir más de una sábana semanal en la misma semana
    if (!params.esLineaBase) {
      const dup = existingCortes.find((c) => !c.esLineaBase && c.semanaIso === semanaIso);
      if (dup) {
        return {
          success: false,
          duplicateRejected: true,
          message: `Rechazo por carga duplicada: ya existe una sábana registrada para "${dup.etiqueta}". No se permite cargar más de una sábana en la misma semana.`,
        };
      }
    }

    // Normalización preventiva de agrupaciones "TORRE" a formato de 2 dígitos (TORRE ##)
    const towerAudit = this.normalizeAndAuditTowers(params.proyecto, params.tasks);
    const normalizedTasks = towerAudit.normalizedTasks;

    purgeLegacyStorage();

    // Asignación automática de Hitos Macro por Código CPC del catálogo oficial de 54 registros
    const defaultHitosByCpc = MacroMilestoneService.buildDefaultHitoByEdtFromCpc(normalizedTasks);
    const currentAssign = this.getWbsAssignments(params.proyecto, normalizedTasks);
    const mergedHitoByEdt = { ...currentAssign.hitoByEdt, ...defaultHitosByCpc };
    const contratistaByEdt = { ...currentAssign.contratistaByEdt };
    normalizedTasks.forEach((t) => {
      if (t.responsable && t.responsable.trim() && !contratistaByEdt[t.edt]) {
        contratistaByEdt[t.edt] = t.responsable.trim();
      }
    });
    safeLocalStorageSet(
      `${STORAGE_WBS_ASSIGNMENTS_PREFIX}${params.proyecto}`,
      JSON.stringify({ hitoByEdt: mergedHitoByEdt, contratistaByEdt })
    );
    this.syncMappingToMacroMilestoneService(params.proyecto, normalizedTasks, mergedHitoByEdt);

    let targetCorte: CorteProgramacion;
    let nextCortes = [...existingCortes];

    if (params.esLineaBase) {
      const cpmResult = CpmEngine.computeSchedule(normalizedTasks as any[]);
      BaselineService.guardarLineaBase(params.proyecto, cpmResult.tasks, usuario);

      // Primera sábana congelada como Línea Base oficial
      targetCorte = {
        id: 'CORTE_00',
        numeroCorte: 0,
        etiqueta: `Línea Base · ${etiquetaVentana}`,
        semanaIso,
        fechaCorte,
        fileName: params.fileName,
        esLineaBase: true,
        tasks: normalizedTasks,
      };
      nextCortes = [targetCorte, ...existingCortes.filter((c) => !c.esLineaBase)];

      const spRows = this.buildSharePointBaselineRows(params.proyecto, normalizedTasks, 'CORTE_00');
      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.WBS_LINEA_BASE,
        'CREATE',
        `LB-${params.proyecto}-${Date.now()}`,
        {
          proyecto: params.proyecto,
          corteId: 'CORTE_00',
          totalRegistros: spRows.length,
          muestraColumnas: spRows.slice(0, 25),
          usuario,
          timestamp: new Date().toISOString(),
        }
      );
    } else {
      const maxNum = existingCortes.reduce((m, c) => Math.max(m, c.numeroCorte), 0);
      const nextNum = maxNum + 1;
      const corteNumStr = String(nextNum).padStart(2, '0');
      targetCorte = {
        id: `CORTE_${corteNumStr}_${semanaIso}`,
        numeroCorte: nextNum,
        // Nombre del registro en "Corte visualizado" = la semana (ventana) en la que se cargó
        etiqueta: etiquetaVentana,
        semanaIso,
        fechaCorte,
        fileName: params.fileName,
        esLineaBase: false,
        tasks: normalizedTasks,
      };
      nextCortes = [...existingCortes, targetCorte];
    }

    // Guardar programación activa primero y cortes compactos sin duplicar el arreglo completo
    this.saveActiveSchedule(
      params.proyecto,
      normalizedTasks,
      params.fileName,
      params.esLineaBase ? 'FREEZE_BASELINE' : 'UPDATE_WEEKLY',
      usuario,
      params.esLineaBase
    );

    memoryCortesMap.set(params.proyecto, nextCortes);
    const compactCortes = serializeCortesCompact(nextCortes, normalizedTasks);
    safeLocalStorageSet(
      `${STORAGE_WBS_CORTES_PREFIX}${params.proyecto}`,
      JSON.stringify(compactCortes)
    );

    window.dispatchEvent(
      new CustomEvent('schedule_updated', {
        detail: { proyecto: params.proyecto, fileName: params.fileName },
      })
    );

    return {
      success: true,
      message: params.esLineaBase
        ? `Línea Base congelada con éxito (${normalizedTasks.length} actividades). Todos los módulos del proyecto han sido habilitados.`
        : `Sábana semanal registrada en "${targetCorte.etiqueta}" (${normalizedTasks.length} actividades).`,
      corte: targetCorte,
      towerAudit,
    };
  }

  /**
   * Guarda y propaga la sábana activa de programación para el proyecto.
   */
  static saveActiveSchedule(
    proyecto: string,
    tasks: WbsItem[],
    fileName: string,
    actionType: 'FREEZE_BASELINE' | 'UPDATE_WEEKLY',
    usuario: string = 'Residente de Interventoría',
    skipBaselineSave: boolean = false
  ): { success: boolean; message: string; tareasCount: number } {
    try {
      purgeLegacyStorage();
      memoryScheduleMap.set(proyecto, tasks);
      const compactedTasks = tasks.map(compactWbsItemForStorage);
      safeLocalStorageSet(`${STORAGE_SCHEDULE_KEY_PREFIX}${proyecto}`, JSON.stringify(compactedTasks));

      const cpmResult = CpmEngine.computeSchedule(tasks as any[]);

      if (actionType === 'FREEZE_BASELINE' && !skipBaselineSave) {
        BaselineService.guardarLineaBase(proyecto, cpmResult.tasks, usuario);
      }

      const metadata: ScheduleMetadata = {
        proyecto,
        fileName,
        fechaCarga: new Date().toISOString(),
        totalTareas: tasks.length,
        tieneLineaBase: BaselineService.tieneLineaBase(proyecto),
        fechaLineaBase: BaselineService.getLineaBaseMetadata(proyecto)?.fechaCongelacion,
        tipoAccion: actionType === 'FREEZE_BASELINE' ? 'LINEA_BASE' : 'AVANCE_SEMANAL',
        usuario,
      };
      memoryMetaMap.set(proyecto, metadata);
      safeLocalStorageSet(`${STORAGE_SCHEDULE_META_PREFIX}${proyecto}`, JSON.stringify(metadata));

      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.PROGRAMACION,
        actionType === 'FREEZE_BASELINE' ? 'CREATE' : 'UPDATE',
        `EDT-${proyecto}-${Date.now()}`,
        {
          proyecto,
          fileName,
          actionType,
          totalTareas: tasks.length,
          tareasCriticas: cpmResult.summary.tareasCriticas,
          porcentajeCriticidad: cpmResult.summary.porcentajeCriticidad,
          duracionProyectoDias: cpmResult.summary.duracionProyectoDias,
          usuario,
          timestamp: new Date().toISOString(),
        }
      );

      window.dispatchEvent(
        new CustomEvent('schedule_updated', {
          detail: { proyecto, fileName, actionType, tareasCount: tasks.length },
        })
      );

      return {
        success: true,
        message:
          actionType === 'FREEZE_BASELINE'
            ? `Línea base oficial congelada con éxito (${tasks.length} tareas).`
            : `Sábana semanal actualizada con éxito (${tasks.length} tareas).`,
        tareasCount: tasks.length,
      };
    } catch (e: any) {
      console.error('[ScheduleService] Error guardando programación activa:', e);
      return {
        success: false,
        message: `Error al persistir la programación: ${e.message || String(e)}`,
        tareasCount: 0,
      };
    }
  }

  /**
   * Guarda las fechas de alistamiento confirmadas por Gerencia para cada torre del proyecto.
   */
  static saveFechasAlistamiento(params: {
    proyecto: string;
    fileName: string;
    records: FechaAlistamientoTorreRecord[];
    usuario: string;
  }): { success: boolean; message: string; state?: FechasAlistamientoState } {
    if (!params.proyecto) {
      return { success: false, message: 'No hay un proyecto activo seleccionado.' };
    }
    if (!params.records || params.records.length === 0) {
      return {
        success: false,
        message:
          'El archivo no contiene filas válidas con AgrupacionWorkPlanner y AlistamientConfirmadoGerente(C).',
      };
    }

    const byTorre: Record<string, FechaAlistamientoTorreRecord> = {};
    params.records.forEach((rec) => {
      const key = (normalizeTorreStandard(rec.agrupacion) || rec.agrupacion || '')
        .trim()
        .toUpperCase();
      if (key) {
        byTorre[key] = { ...rec, agrupacion: key };
      }
    });

    const state: FechasAlistamientoState = {
      proyecto: params.proyecto,
      fileName: params.fileName,
      fechaCarga: new Date().toISOString(),
      usuario: params.usuario,
      records: Object.values(byTorre),
      byTorre,
    };

    memoryAlistamientoMap.set(params.proyecto, state);
    safeLocalStorageSet(
      `${STORAGE_FECHAS_ALISTAMIENTO_PREFIX}${params.proyecto}`,
      JSON.stringify(state)
    );

    SharePointService.enqueueRecord(
      SHAREPOINT_LISTS.FECHAS_ALISTAMIENTO,
      'CREATE',
      `ALIST-${params.proyecto}-${Date.now()}`,
      {
        proyecto: params.proyecto,
        fileName: params.fileName,
        totalTorres: state.records.length,
        torres: state.records.map((r) => r.agrupacion).join(','),
        usuario: params.usuario,
        fechaCarga: state.fechaCarga,
        records: state.records,
      }
    );

    window.dispatchEvent(
      new CustomEvent('marval_alistamiento_updated', {
        detail: { proyecto: params.proyecto, fileName: params.fileName, totalTorres: state.records.length },
      })
    );
    window.dispatchEvent(
      new CustomEvent('schedule_updated', {
        detail: { proyecto: params.proyecto, actionType: 'ALISTAMIENTO' },
      })
    );

    return {
      success: true,
      message: `Fechas de alistamiento cargadas con éxito (${state.records.length} torre(s) desde "${params.fileName}").`,
      state,
    };
  }

  static getFechasAlistamiento(proyecto: string): FechasAlistamientoState | null {
    if (!proyecto) return null;
    const mem = memoryAlistamientoMap.get(proyecto);
    if (mem && mem.records?.length > 0) return mem;
    try {
      const raw = localStorage.getItem(`${STORAGE_FECHAS_ALISTAMIENTO_PREFIX}${proyecto}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as FechasAlistamientoState;
      if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
        if (!parsed.byTorre) {
          const map: Record<string, FechaAlistamientoTorreRecord> = {};
          parsed.records.forEach((r) => {
            const key = (normalizeTorreStandard(r.agrupacion) || r.agrupacion || '')
              .trim()
              .toUpperCase();
            if (key) map[key] = { ...r, agrupacion: key };
          });
          parsed.byTorre = map;
        }
        memoryAlistamientoMap.set(proyecto, parsed);
        return parsed;
      }
    } catch {
      // ignore storage read error
    }
    return null;
  }

  static tieneFechasAlistamiento(proyecto: string): boolean {
    const st = this.getFechasAlistamiento(proyecto);
    return Boolean(st && st.records.length > 0);
  }

  /**
   * Elimina la programación almacenada del proyecto para volver a cargar desde cero.
   */
  static resetSchedule(proyecto: string): void {
    memoryScheduleMap.delete(proyecto);
    memoryCortesMap.delete(proyecto);
    memoryMetaMap.delete(proyecto);
    memoryAlistamientoMap.delete(proyecto);
    localStorage.removeItem(`${STORAGE_SCHEDULE_KEY_PREFIX}${proyecto}`);
    localStorage.removeItem(`${STORAGE_SCHEDULE_META_PREFIX}${proyecto}`);
    localStorage.removeItem(`${STORAGE_WBS_CORTES_PREFIX}${proyecto}`);
    localStorage.removeItem(`${STORAGE_WBS_ASSIGNMENTS_PREFIX}${proyecto}`);
    localStorage.removeItem(`${STORAGE_FECHAS_ALISTAMIENTO_PREFIX}${proyecto}`);
    BaselineService.eliminarLineaBase(proyecto);
    window.dispatchEvent(new CustomEvent('marval_alistamiento_updated', { detail: { proyecto } }));
    window.dispatchEvent(new CustomEvent('schedule_updated', { detail: { proyecto, actionType: 'RESET' } }));
  }
}
