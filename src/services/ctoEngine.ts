import {
  CtoCriterioEvaluacion,
  CtoEstadoSupervisorTecnico,
  HitoMacro,
} from '../types';
import {
  CATALOGO_CRITERIOS_CTO,
  CatalogoCriterioCtoItem,
} from '../data/catalogoCriteriosCto';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import { ParametrizacionService } from './parametrizacionService';

export interface CtoAgrupacionConfig {
  agrupacion: string;
  fechaAlistamiento: string;
  mesesRestantes: number;
  esPrimeraTorre: boolean;
  zonasComunesCerradas: boolean;
}

export interface CtoEvaluacionAgrupacionItem extends CatalogoCriterioCtoItem {
  agrupacion: string;
  estadoFase: CtoEstadoSupervisorTecnico;
  responsableAsignado: string;
  fechaCompromiso: string;
  observaciones: string;
  fechaActualizacion: string;
}

const KEY_CTO_MATRIX_PREFIX = 'marval_cto_matrix_v3_';

export interface CtoMaturityCalculation {
  totalCriterios: number;
  criteriosAprobados: number; // Estado 3
  criteriosRevisionPendiente: number; // Estado 2
  criteriosPendienteIngenieria: number; // Estado 1
  indiceMadurez: number; // %
  mesesRestantesAlistamiento: number;
  estaEnVentanaControl12M: boolean;
  estadoRiesgoLegal: 'VERDE_EN_TIEMPO' | 'AMARILLO_RIESGO_MODERADO' | 'ROJO_RIESGO_CRITICO_ENTREGA';
  alertaTempranaTexto?: string;
}

export class CtoEngine {
  /**
   * Calcula la diferencia en meses entre la fecha de hoy y la fecha de alistamiento
   */
  static getMesesRestantes(fechaAlistamientoStr: string, fechaHoyStr: string = new Date().toISOString().split('T')[0]): number {
    const fAlist = new Date(fechaAlistamientoStr);
    const fHoy = new Date(fechaHoyStr);
    if (isNaN(fAlist.getTime()) || isNaN(fHoy.getTime())) return 0;

    const diffAnios = fAlist.getFullYear() - fHoy.getFullYear();
    const diffMeses = fAlist.getMonth() - fHoy.getMonth();
    return diffAnios * 12 + diffMeses;
  }

  /**
   * Calcula la fecha exacta de inicio de control (12 meses antes del alistamiento)
   */
  static getFechaInicioControl12M(fechaAlistamientoStr: string): string {
    const d = new Date(fechaAlistamientoStr);
    if (isNaN(d.getTime())) return fechaAlistamientoStr;
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Evalúa la madurez legal y el nivel de riesgo de una torre
   */
  static evaluateTowerMaturity(
    criterios: CtoCriterioEvaluacion[],
    fechaAlistamiento: string,
    esPrimeraTorre: boolean,
    zonasComunesCerradas: boolean
  ): CtoMaturityCalculation {
    const mesesRestantes = this.getMesesRestantes(fechaAlistamiento);
    const estaEnVentana = mesesRestantes <= 12;

    const totalCriterios = criterios.length;
    let aprobados = 0;
    let revision = 0;
    let ingenieria = 0;

    for (const c of criterios) {
      if (c.estadoSupervisorTecnico === '3_APROBACION_SUPERVISOR_TECNICO') {
        aprobados++;
      } else if (c.estadoSupervisorTecnico === '2_REVISION_SUPERVISOR_PENDIENTE') {
        revision++;
      } else {
        ingenieria++;
      }
    }

    const indiceMadurez = totalCriterios > 0 ? Math.round((aprobados / totalCriterios) * 100) : 0;

    // Matriz de Riesgo Legal Ley 1796:
    // ROJO: Faltan < 3 meses y madurez < 85%, O es Torre 1 y faltan < 6 meses con zonas comunes abiertas
    // AMARILLO: Faltan entre 3 y 6 meses y madurez < 70%
    // VERDE: Madurez acorde a la curva de avance
    let estadoRiesgoLegal: 'VERDE_EN_TIEMPO' | 'AMARILLO_RIESGO_MODERADO' | 'ROJO_RIESGO_CRITICO_ENTREGA' = 'VERDE_EN_TIEMPO';
    let alertaTempranaTexto = '';

    if (mesesRestantes <= 3 && indiceMadurez < 85) {
      estadoRiesgoLegal = 'ROJO_RIESGO_CRITICO_ENTREGA';
      alertaTempranaTexto = `¡ALERTA CRÍTICA! Faltan solo ${mesesRestantes} meses para alistamiento y el índice CTO es de ${indiceMadurez}% (requerido >= 85%).`;
    } else if (esPrimeraTorre && mesesRestantes <= 6 && !zonasComunesCerradas) {
      estadoRiesgoLegal = 'ROJO_RIESGO_CRITICO_ENTREGA';
      alertaTempranaTexto = `¡BLOQUEO LEGAL TORRE 1! Faltan ${mesesRestantes} meses y las Zonas Comunes Esenciales (Tanques / RCI) no están cerradas.`;
    } else if (mesesRestantes <= 6 && indiceMadurez < 70) {
      estadoRiesgoLegal = 'AMARILLO_RIESGO_MODERADO';
      alertaTempranaTexto = `Riesgo moderado: Faltan ${mesesRestantes} meses para alistamiento con un ${indiceMadurez}% de madurez CTO.`;
    }

    return {
      totalCriterios,
      criteriosAprobados: aprobados,
      criteriosRevisionPendiente: revision,
      criteriosPendienteIngenieria: ingenieria,
      indiceMadurez,
      mesesRestantesAlistamiento: mesesRestantes,
      estaEnVentanaControl12M: estaEnVentana,
      estadoRiesgoLegal,
      alertaTempranaTexto: alertaTempranaTexto || undefined
    };
  }

  /**
   * Actualiza el estado de un criterio individual siguiendo las 3 fases oficiales
   */
  static updateCriterionStatus(
    criterio: CtoCriterioEvaluacion,
    nuevoEstado: CtoEstadoSupervisorTecnico,
    observacion?: string
  ): CtoCriterioEvaluacion {
    const esAprobado = nuevoEstado === '3_APROBACION_SUPERVISOR_TECNICO';
    return {
      ...criterio,
      estadoSupervisorTecnico: nuevoEstado,
      cumplimientoInterventoria: esAprobado ? 'CUMPLE' : 'INCUMPLE',
      observacionesPendiente: observacion !== undefined ? observacion : criterio.observacionesPendiente,
      fechaAprobacionSupervisor: esAprobado ? new Date().toISOString().split('T')[0] : undefined
    };
  }

  /**
   * Detecta alertas tempranas cruzando las fechas de inicio de Workplanner con los criterios pendientes
   */
  static detectUpcomingWorkplannerAlerts(
    criterios: CtoCriterioEvaluacion[],
    diasAnticipacionAlerta: number = 30
  ): Array<{
    criterioId: string;
    descripcion: string;
    hitoMacro: HitoMacro;
    responsable: string;
    fechaInicioTareaWP: string;
    diasRestantes: number;
    estadoSupervisor: CtoEstadoSupervisorTecnico;
  }> {
    const alertas: Array<{
      criterioId: string;
      descripcion: string;
      hitoMacro: HitoMacro;
      responsable: string;
      fechaInicioTareaWP: string;
      diasRestantes: number;
      estadoSupervisor: CtoEstadoSupervisorTecnico;
    }> = [];

    const hoy = new Date();

    for (const c of criterios) {
      // Si ya está aprobado por el supervisor, no genera alerta
      if (c.estadoSupervisorTecnico === '3_APROBACION_SUPERVISOR_TECNICO') continue;
      if (!c.fechaInicioTareaProgramada) continue;

      const fTarea = new Date(c.fechaInicioTareaProgramada);
      if (isNaN(fTarea.getTime())) continue;

      const diffDias = Math.round((fTarea.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Si la tarea arranca en los próximos 'diasAnticipacionAlerta' días o ya inició
      if (diffDias <= diasAnticipacionAlerta) {
        alertas.push({
          criterioId: c.id,
          descripcion: c.descripcionCriterio,
          hitoMacro: c.hitoMacro,
          responsable: c.nombreResponsable,
          fechaInicioTareaWP: c.fechaInicioTareaProgramada,
          diasRestantes: diffDias,
          estadoSupervisor: c.estadoSupervisorTecnico
        });
      }
    }

    return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  /**
   * Configuración de agrupaciones (Torres y Urbanismo) con fechas de alistamiento,
   * ordenadas por prioridad (menor cantidad de meses restantes).
   */
  static getAgrupacionesConfig(proyectoId: string = ''): CtoAgrupacionConfig[] {
    const torres = ParametrizacionService.getTorresConfig(proyectoId);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    const defaultIso = defaultDate.toISOString().split('T')[0];

    const baseDefs = [
      {
        agrupacion: 'URBANISMO',
        fechaAlistamiento: defaultIso,
        esPrimeraTorre: false,
        zonasComunesCerradas: false,
      },
      ...torres.map((t, idx) => ({
        agrupacion: t.nombreTorre,
        fechaAlistamiento: defaultIso,
        esPrimeraTorre: idx === 0,
        zonasComunesCerradas: false,
      })),
    ];

    return baseDefs
      .map((cfg) => ({
        ...cfg,
        mesesRestantes: this.getMesesRestantes(cfg.fechaAlistamiento),
      }))
      .sort((a, b) => a.mesesRestantes - b.mesesRestantes);
  }

  private static buildDefaultEvaluationsForAgrupacion(agrupacion: string): CtoEvaluacionAgrupacionItem[] {
    const today = new Date().toISOString().split('T')[0];
    return CATALOGO_CRITERIOS_CTO.map((item) => ({
      ...item,
      agrupacion,
      estadoFase: '1_ENTREGA_RESPUESTA_INGENIERIA',
      responsableAsignado: item.responsableDocumentacion,
      fechaCompromiso: '',
      observaciones: '',
      fechaActualizacion: today,
    }));
  }

  /**
   * Recupera todas las evaluaciones CTO por agrupación para un proyecto desde localStorage,
   * inicializando automáticamente desde el Catálogo Maestro oficial de 56 criterios.
   */
  static getAllEvaluacionesProyecto(proyectoId: string): Record<string, CtoEvaluacionAgrupacionItem[]> {
    const storageKey = `${KEY_CTO_MATRIX_PREFIX}${proyectoId}`;
    let parsed: Record<string, CtoEvaluacionAgrupacionItem[]> = {};

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        parsed = JSON.parse(raw);
      }
    } catch {
      parsed = {};
    }

    const configs = this.getAgrupacionesConfig(proyectoId);
    let mutated = false;

    for (const cfg of configs) {
      if (!Array.isArray(parsed[cfg.agrupacion]) || parsed[cfg.agrupacion].length !== CATALOGO_CRITERIOS_CTO.length) {
        parsed[cfg.agrupacion] = this.buildDefaultEvaluationsForAgrupacion(cfg.agrupacion);
        mutated = true;
      }
    }

    if (mutated) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch {
        // Ignorar cuota de almacenamiento
      }
    }

    return parsed;
  }

  /**
   * Recupera los 56 criterios CTO evaluados para una agrupación puntual (Torre / Urbanismo).
   */
  static getEvaluacionesPorAgrupacion(proyectoId: string, agrupacion: string): CtoEvaluacionAgrupacionItem[] {
    const all = this.getAllEvaluacionesProyecto(proyectoId);
    if (all[agrupacion]) return all[agrupacion];
    return this.buildDefaultEvaluationsForAgrupacion(agrupacion);
  }

  /**
   * Persiste cambios de estado (Fase 1/2/3), responsable, fecha compromiso u observaciones en un criterio CTO
   * y encola la actualización hacia la lista de SharePoint Interventoria_Compromisos_CTO.
   */
  static saveEvaluacionCriterio(
    proyectoId: string,
    agrupacion: string,
    numGeneral: number,
    updates: Partial<
      Pick<
        CtoEvaluacionAgrupacionItem,
        'estadoFase' | 'responsableAsignado' | 'fechaCompromiso' | 'observaciones'
      >
    >
  ): CtoEvaluacionAgrupacionItem[] {
    const all = this.getAllEvaluacionesProyecto(proyectoId);
    const currentList = all[agrupacion] || this.buildDefaultEvaluationsForAgrupacion(agrupacion);
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedList = currentList.map((item) => {
      if (item.numGeneral !== numGeneral) return item;
      const merged: CtoEvaluacionAgrupacionItem = {
        ...item,
        ...updates,
        fechaActualizacion: todayStr,
      };

      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.CTO,
        'UPDATE',
        `${proyectoId}-${agrupacion}-CTO-${numGeneral}`,
        {
          ID_Proyecto: proyectoId,
          Torre_Urbanismo: agrupacion,
          NumGeneral: merged.numGeneral,
          CategoriaCTO: merged.categoriaCto,
          CriterioEvaluacion: merged.criterioEvaluacion,
          HitoRelacionado: merged.hitoRelacionadoTexto,
          HitoMacro: merged.hitoMacro,
          EstadoFase: merged.estadoFase,
          Responsable: merged.responsableAsignado,
          FechaCompromiso: merged.fechaCompromiso,
          Observaciones: merged.observaciones,
          FechaActualizacion: merged.fechaActualizacion,
        }
      );

      return merged;
    });

    all[agrupacion] = updatedList;
    localStorage.setItem(`${KEY_CTO_MATRIX_PREFIX}${proyectoId}`, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('marval_cto_updated', { detail: { proyectoId, agrupacion, numGeneral } }));

    return updatedList;
  }
}

