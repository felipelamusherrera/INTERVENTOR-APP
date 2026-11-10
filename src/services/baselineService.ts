import { CpmTask } from './cpmEngine';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';

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

  // Condiciones de inclusión semanal
  esInicioEstaSemana: boolean;
  esFinEstaSemana: boolean;
  esInicioAnticipado: boolean;
  esFinAnticipado: boolean;
  motivoInclusion: string[];
}

export interface CalificacionActividad {
  idConsec: number;
  calificado: boolean;
  cumpleInicio: boolean | null;
  cumpleFin: boolean | null;
  causaNoInicio?: string;
  causaNoFin?: string;
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

// 7 Restricciones del Módulo Lookahead (Lean Construction / Prerrequisitos de Inicio)
export const RESTRICCIONES_LOOKAHEAD = [
  'Diseño / Planos',
  'Contratos y Adjudicación',
  'Actividad Predecesora',
  'Materiales y Compras',
  'Mano de Obra / Cuadrillas',
  'Equipos y Maquinaria',
  'SST, Permisos y Licencias'
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

export class BaselineService {
  /**
   * Verifica si existe una Línea Base congelada para el proyecto.
   */
  static tieneLineaBase(proyecto: string): boolean {
    const raw = localStorage.getItem(`${KEY_LB_PREFIX}${proyecto}`);
    return Boolean(raw && raw.length > 10);
  }

  /**
   * Obtiene la Línea Base congelada del proyecto como un Map indexado por idConsec.
   */
  static getLineaBase(proyecto: string): Map<number, BaselineRecord> | null {
    try {
      const raw = localStorage.getItem(`${KEY_LB_PREFIX}${proyecto}`);
      if (!raw) return null;
      const records: BaselineRecord[] = JSON.parse(raw);
      const map = new Map<number, BaselineRecord>();
      for (const r of records) {
        map.set(r.idConsec, r);
      }
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
    try {
      const raw = localStorage.getItem(`${KEY_LB_META_PREFIX}${proyecto}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Congela la Línea Base oficial del proyecto usando las columnas Comien, Fin y Dura actuales.
   */
  static guardarLineaBase(proyecto: string, tasks: CpmTask[], usuario: string = 'Residente de Interventoría'): void {
    const timestamp = new Date().toISOString();
    const records: BaselineRecord[] = tasks.map(t => ({
      idConsec: t.idConsec,
      edt: t.edt,
      nombre: t.nombre,
      agrupacion: t.agrupacion || 'NO APLICA',
      duraLineaBase: t.dura,
      comienzoLineaBase: t.comien,
      finLineaBase: t.fin,
      wLineaBase: t.w,
      congeladoEl: timestamp,
      proyecto,
    }));

    let minInicio = '';
    let maxFin = '';
    for (const t of tasks) {
      if (t.comien && (!minInicio || t.comien < minInicio)) minInicio = t.comien;
      if (t.fin && (!maxFin || t.fin > maxFin)) maxFin = t.fin;
    }

    const metadata: BaselineMetadata = {
      proyecto,
      fechaCongelacion: timestamp,
      totalTareas: tasks.length,
      duracionTotalDias: tasks.reduce((acc, t) => Math.max(acc, t.dura), 0),
      fechaInicioProyecto: minInicio,
      fechaFinProyecto: maxFin,
      usuario,
    };

    localStorage.setItem(`${KEY_LB_PREFIX}${proyecto}`, JSON.stringify(records));
    localStorage.setItem(`${KEY_LB_META_PREFIX}${proyecto}`, JSON.stringify(metadata));

    // Notificar actualización en tiempo real
    window.dispatchEvent(new CustomEvent('marval_baseline_updated', { detail: { proyecto, timestamp } }));
  }

  /**
   * Elimina la Línea Base de un proyecto para permitir recongelarla.
   */
  static eliminarLineaBase(proyecto: string): void {
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
   * Genera la lista de semanas de corte con actividades disponibles para selector desplegable.
   */
  static listarSemanasConActividad(tasks: CpmTask[]): SemanaCorteInfo[] {
    const semanaMap = new Map<string, SemanaCorteInfo>();

    for (const t of tasks) {
      if (t.comien) {
        const s = this.getSemanaCorte(t.comien);
        const key = `${s.anio}-W${s.numeroSemana}`;
        if (!semanaMap.has(key)) {
          semanaMap.set(key, s);
        }
      }
      if (t.fin) {
        const s = this.getSemanaCorte(t.fin);
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
   * Filtra las actividades de la semana de corte según las reglas estrictas de interventoría:
   * 1. Inician en la semana (Lunes <= Comien <= Domingo)
   * 2. Finalizan en la semana (Lunes <= Fin <= Domingo)
   * 3. Anticipadas frente a Línea Base (Comien < ComienzoLB ó Fin < FinLB)
   * Las demás actividades NO aparecen.
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
      // Omitir tareas resumen a menos que tengan fechas directas y sean ejecutables
      if (t.type === 'project' && t.dura > 300) continue;

      const lb = lbMap ? lbMap.get(t.idConsec) : undefined;
      const comienzoLB = lb?.comienzoLineaBase || t.comienPrev || t.comien;
      const finLB = lb?.finLineaBase || t.finPrev || t.fin;
      const duraLB = lb?.duraLineaBase || t.duraPrev || t.dura;

      const esInicioEstaSemana = Boolean(t.comien && t.comien >= lunesStr && t.comien <= domingoStr);
      const esFinEstaSemana = Boolean(t.fin && t.fin >= lunesStr && t.fin <= domingoStr);

      // Detección de anticipaciones reales frente a la Línea Base congelada
      const esInicioAnticipado = Boolean(lb && t.comien && comienzoLB && t.comien < comienzoLB);
      const esFinAnticipado = Boolean(lb && t.fin && finLB && t.fin < finLB);

      // Inclusión estricta
      if (esInicioEstaSemana || esFinEstaSemana || esInicioAnticipado || esFinAnticipado) {
        const motivos: string[] = [];
        if (esInicioEstaSemana) motivos.push('Inicia esta semana');
        if (esFinEstaSemana) motivos.push('Finaliza esta semana');
        if (esInicioAnticipado) motivos.push('Inicio anticipado vs LB');
        if (esFinAnticipado) motivos.push('Fin anticipado vs LB');

        actividades.push({
          idConsec: t.idConsec,
          edt: t.edt,
          nombre: t.nombre,
          agrupacion: t.agrupacion || 'NO APLICA',
          nivel: t.nivel || (t.edt ? t.edt.split('.').length : 1),
          sucursal: t.sucursal || 'CALI',
          proyecto: t.proyecto || proyecto,
          w: t.w,
          comienzoLineaBase: comienzoLB,
          finLineaBase: finLB,
          duraLineaBase: duraLB,
          comien: t.comien,
          fin: t.fin,
          dura: t.dura,
          tf: t.tf,
          ff: t.ff,
          esCritica: t.esCritica,
          obligatoria: t.esCritica, // Obligatorio calificar la ruta crítica
          esInicioEstaSemana,
          esFinEstaSemana,
          esInicioAnticipado,
          esFinAnticipado,
          motivoInclusion: motivos,
        });
      }
    }

    // Ordenar: primero las críticas, luego por fecha de inicio y EDT
    actividades.sort((a, b) => {
      if (a.esCritica !== b.esCritica) return a.esCritica ? -1 : 1;
      if (a.comien !== b.comien) return a.comien.localeCompare(b.comien);
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
    localStorage.setItem(`${KEY_CALIFICACIONES_TEMP_PREFIX}${proyecto}_${semanaKey}`, JSON.stringify(califs));
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
   * 1. Todas las actividades críticas (TF <= 0) deben estar obligatoriamente calificadas.
   * 2. Si no cumple inicio o no cumple fin, las Observaciones son obligatorias y no pueden estar vacías.
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

      // Validación de obligatoriedad en Ruta Crítica
      if (act.esCritica) {
        const calificada = cal && (cal.cumpleInicio !== null || cal.cumpleFin !== null);
        if (!calificada) {
          faltantesCriticas.push(act);
        }
      }

      // Validación de observaciones obligatorias en caso de incumplimiento
      if (cal) {
        const noCumpleInicio = cal.cumpleInicio === false;
        const noCumpleFin = cal.cumpleFin === false;

        if (noCumpleInicio || noCumpleFin) {
          const obsVacia = !cal.observaciones || cal.observaciones.trim().length < 5;
          if (obsVacia) {
            faltantesObservaciones.push(act);
          }
        }
      }
    }

    if (faltantesCriticas.length > 0) {
      errores.push(`Existen ${faltantesCriticas.length} actividades de Ruta Crítica pendientes de calificación obligatoria.`);
    }

    if (faltantesObservaciones.length > 0) {
      errores.push(`Existen ${faltantesObservaciones.length} actividades con incumplimiento sin justificación en Observaciones.`);
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

    localStorage.setItem(KEY_REPORTES_SEMANALES, JSON.stringify(list));

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
}
