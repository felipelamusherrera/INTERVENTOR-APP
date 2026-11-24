import { SucursalOperativa } from '../types';
import { Usuario } from '../types/auth';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import { BaselineService } from './baselineService';
import { AuthService } from './authService';

export interface ProyectoEstructuraRow {
  id: string;
  hc: string;
  nombreHcJde: string;
  etapa: string; // Siempre formato 'ETAPA 01' .. 'ETAPA 50'
}

export interface EtapaResumenProyecto {
  etapa: string;
  hc: string;
  nombreHcJde: string;
}

export interface ProyectoMaestro {
  id: string;
  sucursal: SucursalOperativa;
  nombreJde: string;
  an8DirectorObra: string;
  nombreDirectorObra: string;
  nombreGerenteProyectos: string;
  estructura: ProyectoEstructuraRow[];
  datosGuardados: boolean;
  torresGuardadas: boolean;
  creadoPorUsuarioId: string;
  creadoPorNombre: string;
  usuariosAsignados: string[]; // IDs de usuarios con permiso de edición en este proyecto
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface SolicitudAsignacionProyecto {
  id: string;
  proyectoId: string;
  proyectoNombre: string;
  sucursal: SucursalOperativa;
  hcConflicto: string;
  solicitanteId: string;
  solicitanteNombre: string;
  solicitanteCorreo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaSolicitud: string;
  resueltoPor?: string;
  fechaResolucion?: string;
  motivoRechazo?: string;
}

export interface ProyectoOnboardingStatus {
  paso1DatosGuardados: boolean;
  paso1TorresGuardadas: boolean;
  paso1Completo: boolean;
  paso2LineaBaseCongelada: boolean;
  paso2FechasAlistamientoCargadas: boolean;
  todoHabilitado: boolean;
}

export const TORRE_OPTIONS: string[] = Array.from(
  { length: 50 },
  (_, idx) => `TORRE ${String(idx + 1).padStart(2, '0')}`
);

export const ETAPA_OPTIONS: string[] = Array.from(
  { length: 50 },
  (_, idx) => `ETAPA ${String(idx + 1).padStart(2, '0')}`
);

/**
 * Normaliza cualquier mención de "ETAPA <n>" (ej. "Etapa 1", "ETAPA 01")
 * al formato estándar de dos dígitos: "ETAPA 01" .. "ETAPA 50".
 */
export function normalizeEtapaStandard(raw?: string): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^ETAPA\s*0*(\d{1,2})$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 1 || num > 99) return null;
  return `ETAPA ${String(num).padStart(2, '0')}`;
}

const STORAGE_PROJECTS_KEY = 'interventor_proyectos_maestro_v2';
const STORAGE_SOLICITUDES_KEY = 'interventor_solicitudes_asignacion_v2';
const STORAGE_ACTIVE_PROJECT_PREFIX = 'interventor_active_project_user_v2_';

/**
 * Normaliza cualquier mención de "TORRE <n>" (ej. "Torre 1", "TORRE 01", "torre 4")
 * al formato estándar de dos dígitos: "TORRE 01" .. "TORRE 50".
 * Retorna null si el texto no contiene la palabra TORRE acompañada de un número.
 */
export function normalizeTorreStandard(raw?: string): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^TORRE\s*0*(\d{1,2})$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 1 || num > 99) return null;
  return `TORRE ${String(num).padStart(2, '0')}`;
}

/**
 * Detecta si una agrupación de Workplanner contiene la palabra "TORRE"
 * y devuelve su forma normalizada si tiene número, o el texto en mayúsculas si no tiene número.
 */
export function containsTorreKeyword(raw?: string): boolean {
  if (!raw) return false;
  return /\bTORRE\b/i.test(raw.trim());
}

export function normalizeHc(raw: string): string {
  return raw.trim().toUpperCase();
}

export class ProjectService {
  /**
   * Lista completa de proyectos reales cargados en la plataforma (lista maestra SharePoint / caché local).
   * Inicia completamente vacía ([]) para entorno limpio sin datos demo.
   */
  static getAllProjects(): ProyectoMaestro[] {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('[ProjectService] Error leyendo proyectos:', e);
    }
    return [];
  }

  private static saveAllProjects(projects: ProyectoMaestro[]): void {
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
      window.dispatchEvent(new CustomEvent('marval_projects_updated'));
    } catch (e) {
      console.error('[ProjectService] Error guardando proyectos:', e);
    }
  }

  static getProjectById(projectId?: string | null): ProyectoMaestro | null {
    if (!projectId) return null;
    return this.getAllProjects().find((p) => p.id === projectId || p.nombreJde === projectId) || null;
  }

  /**
   * Proyectos visibles en Módulo de Campo para un usuario:
   * - Residente: solo los que creó o le fueron asignados.
   * - Administrador: todos los proyectos registrados en la plataforma.
   * - Directivos: todos los proyectos registrados (para consulta gerencial).
   */
  static getProjectsForUser(user: Usuario | null): ProyectoMaestro[] {
    if (!user) return [];
    const all = this.getAllProjects();
    if (
      user.rol === 'ADMINISTRADOR' ||
      user.rol === 'DIRECTOR_GERENTE_INTERVENTORIA' ||
      user.rol === 'DIRECTOR_OBRA_GERENTE_AREA'
    ) {
      return all;
    }
    return all.filter(
      (p) =>
        p.creadoPorUsuarioId === user.id ||
        p.usuariosAsignados.includes(user.id) ||
        user.proyectos.includes(p.id)
    );
  }

  static getActiveProjectIdForUser(userId: string): string {
    try {
      return localStorage.getItem(`${STORAGE_ACTIVE_PROJECT_PREFIX}${userId}`) || '';
    } catch {
      return '';
    }
  }

  static setActiveProjectIdForUser(userId: string, projectId: string): void {
    try {
      if (projectId) {
        localStorage.setItem(`${STORAGE_ACTIVE_PROJECT_PREFIX}${userId}`, projectId);
      } else {
        localStorage.removeItem(`${STORAGE_ACTIVE_PROJECT_PREFIX}${userId}`);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Busca si alguno de los códigos HC ya existe en la lista maestra de SharePoint / proyectos.
   */
  static findDuplicateHcConflict(
    hcList: string[],
    excludeProjectId?: string
  ): { hc: string; project: ProyectoMaestro } | null {
    const cleanTargetHcs = hcList.map(normalizeHc).filter(Boolean);
    if (cleanTargetHcs.length === 0) return null;

    const all = this.getAllProjects();
    for (const proj of all) {
      if (excludeProjectId && proj.id === excludeProjectId) continue;
      for (const row of proj.estructura || []) {
        const existingHc = normalizeHc(row.hc);
        if (existingHc && cleanTargetHcs.includes(existingHc)) {
          return { hc: existingHc, project: proj };
        }
      }
    }
    return null;
  }

  /**
   * Crea o actualiza un proyecto en la lista maestra (validando duplicados de HC en SharePoint).
   */
  static saveProjectDatos(
    input: {
      id?: string;
      sucursal: SucursalOperativa;
      nombreJde: string;
      an8DirectorObra: string;
      nombreDirectorObra: string;
      nombreGerenteProyectos: string;
      estructura: ProyectoEstructuraRow[];
    },
    currentUser: Usuario
  ):
    | { success: true; project: ProyectoMaestro; message: string }
    | { success: false; message: string; duplicateConflict?: { hc: string; project: ProyectoMaestro } } {
    const nombreClean = input.nombreJde.trim();
    if (!nombreClean) {
      return { success: false, message: 'El campo "Proyecto (Nombre JDE)" es obligatorio.' };
    }

    const estructuraLimpia: ProyectoEstructuraRow[] = (input.estructura || [])
      .map((row) => {
        const rawEtapa = row.etapa || ((row as any).torre ? String((row as any).torre).replace(/TORRE/i, 'ETAPA') : '');
        const etapaNorm = normalizeEtapaStandard(rawEtapa) || rawEtapa.trim().toUpperCase();
        return {
          id: row.id || `est-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          hc: row.hc.trim().toUpperCase(),
          nombreHcJde: row.nombreHcJde.trim(),
          etapa: etapaNorm,
        };
      })
      .filter((row) => row.hc || row.nombreHcJde || row.etapa);

    if (estructuraLimpia.length === 0) {
      return {
        success: false,
        message: 'Debe registrar al menos una fila en "Estructura de proyecto" (HC, Nombre HC JDE y ETAPA).',
      };
    }

    for (const row of estructuraLimpia) {
      if (!row.hc || !row.nombreHcJde || !row.etapa) {
        return {
          success: false,
          message: 'Todas las filas de "Estructura de proyecto" deben tener HC, Nombre HC JDE y ETAPA diligenciados.',
        };
      }
    }

    // Permitir que un mismo HC se desglose en múltiples etapas dentro del mismo proyecto,
    // evitando únicamente filas duplicadas con exactamente el mismo par HC + ETAPA.
    const seenPairs = new Set<string>();
    for (const row of estructuraLimpia) {
      const pairKey = `${row.hc}__${row.etapa}`;
      if (seenPairs.has(pairKey)) {
        return {
          success: false,
          message: `La combinación HC "${row.hc}" con "${row.etapa}" ya está registrada en la tabla Estructura de proyecto.`,
        };
      }
      seenPairs.add(pairKey);
    }

    // Validar HC contra todos los proyectos existentes en la base de datos maestra (SharePoint)
    const conflict = this.findDuplicateHcConflict(
      estructuraLimpia.map((r) => r.hc),
      input.id
    );
    if (conflict) {
      return {
        success: false,
        message: `El código HC "${conflict.hc}" ya existe en la plataforma bajo el proyecto "${conflict.project.nombreJde}" (${conflict.project.sucursal}). No se permite crear un proyecto duplicado.`,
        duplicateConflict: conflict,
      };
    }

    const all = this.getAllProjects();
    const now = new Date().toISOString();

    if (input.id) {
      const idx = all.findIndex((p) => p.id === input.id);
      if (idx >= 0) {
        const updated: ProyectoMaestro = {
          ...all[idx],
          sucursal: input.sucursal,
          nombreJde: nombreClean,
          an8DirectorObra: input.an8DirectorObra.trim(),
          nombreDirectorObra: input.nombreDirectorObra.trim(),
          nombreGerenteProyectos: input.nombreGerenteProyectos.trim(),
          estructura: estructuraLimpia,
          datosGuardados: true,
          fechaActualizacion: now,
        };
        all[idx] = updated;
        this.saveAllProjects(all);
        SharePointService.enqueueRecord(SHAREPOINT_LISTS.PROYECTOS_MAESTRO, 'UPDATE', updated.id, {
          proyectoId: updated.id,
          sucursal: updated.sucursal,
          nombreJde: updated.nombreJde,
          an8DirectorObra: updated.an8DirectorObra,
          nombreDirectorObra: updated.nombreDirectorObra,
          nombreGerenteProyectos: updated.nombreGerenteProyectos,
          hcs: updated.estructura.map((e) => e.hc).join(','),
          estructura: updated.estructura,
          fechaActualizacion: now,
        });
        return {
          success: true,
          project: updated,
          message: `Datos del proyecto "${updated.nombreJde}" guardados y sincronizados con SharePoint (${SHAREPOINT_LISTS.PROYECTOS_MAESTRO}).`,
        };
      }
    }

    const newId = `PRJ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const created: ProyectoMaestro = {
      id: newId,
      sucursal: input.sucursal,
      nombreJde: nombreClean,
      an8DirectorObra: input.an8DirectorObra.trim(),
      nombreDirectorObra: input.nombreDirectorObra.trim(),
      nombreGerenteProyectos: input.nombreGerenteProyectos.trim(),
      estructura: estructuraLimpia,
      datosGuardados: true,
      torresGuardadas: false,
      creadoPorUsuarioId: currentUser.id,
      creadoPorNombre: currentUser.nombre,
      usuariosAsignados: [currentUser.id],
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    all.push(created);
    this.saveAllProjects(all);
    AuthService.asignarProyectoAUsuario(currentUser.id, created.id);
    this.setActiveProjectIdForUser(currentUser.id, created.id);

    SharePointService.enqueueRecord(SHAREPOINT_LISTS.PROYECTOS_MAESTRO, 'CREATE', created.id, {
      proyectoId: created.id,
      sucursal: created.sucursal,
      nombreJde: created.nombreJde,
      an8DirectorObra: created.an8DirectorObra,
      nombreDirectorObra: created.nombreDirectorObra,
      nombreGerenteProyectos: created.nombreGerenteProyectos,
      hcs: created.estructura.map((e) => e.hc).join(','),
      estructura: created.estructura,
      creadoPor: currentUser.nombre,
      fechaCreacion: now,
    });

    return {
      success: true,
      project: created,
      message: `Proyecto "${created.nombreJde}" creado y registrado en SharePoint (${SHAREPOINT_LISTS.PROYECTOS_MAESTRO}). Continúe con la Pestaña 2: Parametrización Torres e inmuebles.`,
    };
  }

  static markTorresGuardadas(projectId: string): void {
    const all = this.getAllProjects();
    const idx = all.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    all[idx] = {
      ...all[idx],
      torresGuardadas: true,
      fechaActualizacion: new Date().toISOString(),
    };
    this.saveAllProjects(all);
  }

  /**
   * Retorna las etapas únicas configuradas en "Datos del proyecto > Estructura de proyecto"
   * ordenadas ascendentemente (ETAPA 01, ETAPA 02...).
   */
  static getEtapasEstructura(projectId?: string | null): EtapaResumenProyecto[] {
    const proj = this.getProjectById(projectId);
    if (!proj) return [];
    const map = new Map<string, EtapaResumenProyecto>();
    (proj.estructura || []).forEach((row) => {
      const raw = row.etapa || ((row as any).torre ? String((row as any).torre).replace(/TORRE/i, 'ETAPA') : '');
      const norm = normalizeEtapaStandard(raw) || raw.trim().toUpperCase();
      if (norm && !map.has(norm)) {
        map.set(norm, {
          etapa: norm,
          hc: row.hc || '',
          nombreHcJde: row.nombreHcJde || '',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.etapa.localeCompare(b.etapa, undefined, { numeric: true })
    );
  }

  /**
   * Retorna las torres parametrizadas guardadas para el proyecto desde
   * "Parámetros del proyecto > Parametrización Torres e inmuebles" (TORRE 01, TORRE 02...).
   */
  static getTorresEstructura(projectId?: string | null): string[] {
    if (!projectId) return [];
    try {
      const raw = localStorage.getItem(`marval_parametrizacion_torres_v2_${projectId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const set = new Set<string>();
          parsed.forEach((t: any) => {
            const name = t?.nombreTorre || '';
            const norm = normalizeTorreStandard(name) || String(name).trim().toUpperCase();
            if (norm) set.add(norm);
          });
          return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        }
      }
    } catch {
      // ignore storage read error
    }
    return [];
  }

  /**
   * Estado del tutorial obligatorio paso a paso para el proyecto activo.
   */
  static getOnboardingStatus(projectId?: string | null): ProyectoOnboardingStatus {
    const proj = this.getProjectById(projectId);
    if (!proj) {
      return {
        paso1DatosGuardados: false,
        paso1TorresGuardadas: false,
        paso1Completo: false,
        paso2LineaBaseCongelada: false,
        paso2FechasAlistamientoCargadas: false,
        todoHabilitado: false,
      };
    }

    const paso1DatosGuardados = Boolean(proj.datosGuardados);
    const paso1TorresGuardadas = Boolean(proj.torresGuardadas);
    const paso1Completo = paso1DatosGuardados && paso1TorresGuardadas;
    const paso2LineaBaseCongelada = BaselineService.tieneLineaBase(proj.id);

    let paso2FechasAlistamientoCargadas = false;
    try {
      const rawAlist = localStorage.getItem(`interventor_fechas_alistamiento_v1_${proj.id}`);
      if (rawAlist) {
        const parsedAlist = JSON.parse(rawAlist);
        paso2FechasAlistamientoCargadas = Boolean(
          parsedAlist && Array.isArray(parsedAlist.records) && parsedAlist.records.length > 0
        );
      }
    } catch {
      paso2FechasAlistamientoCargadas = false;
    }

    const todoHabilitado =
      paso1Completo && paso2LineaBaseCongelada && paso2FechasAlistamientoCargadas;

    return {
      paso1DatosGuardados,
      paso1TorresGuardadas,
      paso1Completo,
      paso2LineaBaseCongelada,
      paso2FechasAlistamientoCargadas,
      todoHabilitado,
    };
  }

  // =========================================================================
  // SOLICITUDES DE ASIGNACIÓN DE PROYECTO (CUANDO UN HC YA EXISTE)
  // =========================================================================

  static getSolicitudesAsignacion(): SolicitudAsignacionProyecto[] {
    try {
      const raw = localStorage.getItem(STORAGE_SOLICITUDES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('[ProjectService] Error leyendo solicitudes:', e);
    }
    return [];
  }

  private static saveSolicitudes(list: SolicitudAsignacionProyecto[]): void {
    try {
      localStorage.setItem(STORAGE_SOLICITUDES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('marval_solicitudes_updated'));
    } catch (e) {
      console.error('[ProjectService] Error guardando solicitudes:', e);
    }
  }

  static crearSolicitudAsignacion(params: {
    proyecto: ProyectoMaestro;
    hcConflicto: string;
    solicitante: Usuario;
  }): { success: boolean; message: string; solicitud?: SolicitudAsignacionProyecto } {
    const list = this.getSolicitudesAsignacion();
    const yaPendiente = list.find(
      (s) =>
        s.proyectoId === params.proyecto.id &&
        s.solicitanteId === params.solicitante.id &&
        s.estado === 'PENDIENTE'
    );
    if (yaPendiente) {
      return {
        success: false,
        message: `Ya existe una solicitud pendiente de asignación para el proyecto "${params.proyecto.nombreJde}". El Administrador la revisará pronto.`,
      };
    }

    if (params.proyecto.usuariosAsignados.includes(params.solicitante.id)) {
      return {
        success: false,
        message: `Ya tienes asignado el proyecto "${params.proyecto.nombreJde}". Selecciónalo en la barra superior.`,
      };
    }

    const solicitud: SolicitudAsignacionProyecto = {
      id: `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      proyectoId: params.proyecto.id,
      proyectoNombre: params.proyecto.nombreJde,
      sucursal: params.proyecto.sucursal,
      hcConflicto: params.hcConflicto,
      solicitanteId: params.solicitante.id,
      solicitanteNombre: params.solicitante.nombre,
      solicitanteCorreo: params.solicitante.correo,
      estado: 'PENDIENTE',
      fechaSolicitud: new Date().toISOString(),
    };

    list.unshift(solicitud);
    this.saveSolicitudes(list);

    SharePointService.enqueueRecord(
      SHAREPOINT_LISTS.SOLICITUDES_ASIGNACION,
      'CREATE',
      solicitud.id,
      solicitud
    );

    return {
      success: true,
      message: `Solicitud de asignación enviada al Administrador para el proyecto "${params.proyecto.nombreJde}" (HC ${params.hcConflicto}).`,
      solicitud,
    };
  }

  static resolverSolicitudAsignacion(
    solicitudId: string,
    aprobar: boolean,
    adminNombre: string,
    motivoRechazo?: string
  ): boolean {
    const list = this.getSolicitudesAsignacion();
    const idx = list.findIndex((s) => s.id === solicitudId);
    if (idx === -1) return false;

    const sol = list[idx];
    const now = new Date().toISOString();

    list[idx] = {
      ...sol,
      estado: aprobar ? 'APROBADA' : 'RECHAZADA',
      resueltoPor: adminNombre,
      fechaResolucion: now,
      motivoRechazo: aprobar ? undefined : motivoRechazo || 'Solicitud no autorizada por Administración',
    };
    this.saveSolicitudes(list);

    if (aprobar) {
      const projects = this.getAllProjects();
      const pIdx = projects.findIndex((p) => p.id === sol.proyectoId);
      if (pIdx >= 0) {
        const currentAssigned = new Set(projects[pIdx].usuariosAsignados || []);
        currentAssigned.add(sol.solicitanteId);
        projects[pIdx] = {
          ...projects[pIdx],
          usuariosAsignados: Array.from(currentAssigned),
          fechaActualizacion: now,
        };
        this.saveAllProjects(projects);
      }
      AuthService.asignarProyectoAUsuario(sol.solicitanteId, sol.proyectoId);
    }

    SharePointService.enqueueRecord(
      SHAREPOINT_LISTS.SOLICITUDES_ASIGNACION,
      'UPDATE',
      solicitudId,
      list[idx]
    );
    return true;
  }

  /**
   * Estadísticas reales de la plataforma para la pantalla de Login y resúmenes.
   * Devuelve 0 en todos los contadores cuando la plataforma está en blanco.
   */
  static getPlatformStats(): {
    proyectosActivos: number;
    torresEnObra: number;
    actividades: number;
  } {
    const projects = this.getAllProjects();
    let torresEnObra = 0;
    let actividades = 0;

    projects.forEach((p) => {
      torresEnObra += this.getTorresEstructura(p.id).length;

      try {
        const rawSched = localStorage.getItem(`interventor_active_edt_v3_${p.id}`);
        if (rawSched) {
          const parsed = JSON.parse(rawSched);
          if (Array.isArray(parsed)) {
            actividades += parsed.length;
          }
        }
      } catch {
        // ignore
      }
    });

    return {
      proyectosActivos: projects.length,
      torresEnObra,
      actividades,
    };
  }
}
