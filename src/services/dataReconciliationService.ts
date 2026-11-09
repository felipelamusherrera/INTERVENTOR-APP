import { WbsItem, MajorDelay, WeeklyLog } from '../types';
import { dataStorageService } from './dataStorageService';

export interface ReconciledDelay extends MajorDelay {
  justificadoEnCampo: boolean;
  residenteNombre?: string;
  fechaReporteCampo?: string;
  observacionesCampo?: string;
}

export interface ReconciliationMetrics {
  totalAtrasosCriticos: number;
  totalDiasAtraso: number;
  atrasosJustificados: number;
  atrasosPendientesCampo: number;
  paretoCausas: { causa: string; dias: number; incidentes: number }[];
}

export class DataReconciliationService {
  /**
   * Cruza las tareas del cronograma oficial (WorkPlanner) con los reportes de campo (Bitácora).
   */
  reconcileDelays(wbsTasks: WbsItem[]): { delays: ReconciledDelay[]; metrics: ReconciliationMetrics } {
    const weeklyLogs = dataStorageService.getWeeklyLogs();
    
    // Filtramos tareas con retraso de fin positivo (VarFin > 0)
    const delayedTasks = wbsTasks
      .filter(t => t.tipo === 'task' && t.varFin > 0)
      .sort((a, b) => b.varFin - a.varFin);

    const reconciledList: ReconciledDelay[] = [];
    let justificadosCount = 0;
    let totalDias = 0;

    const paretoCounts: Record<string, { dias: number; incidentes: number }> = {
      'Contratistas / Personal': { dias: 0, incidentes: 0 },
      'Formaleta': { dias: 0, incidentes: 0 },
      'Equipos': { dias: 0, incidentes: 0 },
      'Materiales / Compras': { dias: 0, incidentes: 0 },
      'Contratos': { dias: 0, incidentes: 0 },
      'Clima / Lluvias': { dias: 0, incidentes: 0 },
      'Diseños': { dias: 0, incidentes: 0 },
      'Licencias / Permisos': { dias: 0, incidentes: 0 },
      'Sin justificar en campo': { dias: 0, incidentes: 0 }
    };

    delayedTasks.forEach((t, idx) => {
      totalDias += t.varFin;
      
      // Búsqueda de conciliación por coincidencia semántica o por hito
      const matchingLog = this.findMatchingLog(t, weeklyLogs);

      if (matchingLog && !matchingLog.cumplio && matchingLog.causaRaiz) {
        justificadosCount++;
        const causa = matchingLog.causaRaiz;
        if (!paretoCounts[causa]) {
          paretoCounts[causa] = { dias: 0, incidentes: 0 };
        }
        paretoCounts[causa].dias += t.varFin;
        paretoCounts[causa].incidentes += 1;

        reconciledList.push({
          id: `rec-delay-${idx + 1}`,
          tarea: t.nombre,
          finPrevisto: t.finPrev,
          finProyectado: t.fin,
          diasAtraso: t.varFin,
          responsable: t.responsable || matchingLog.residente || 'No Asignado',
          causaRaiz: causa,
          impactoRutaCritica: t.varFin >= 15,
          justificadoEnCampo: true,
          residenteNombre: matchingLog.residente,
          fechaReporteCampo: matchingLog.fecha,
          observacionesCampo: matchingLog.observaciones
        });
      } else {
        paretoCounts['Sin justificar en campo'].dias += t.varFin;
        paretoCounts['Sin justificar en campo'].incidentes += 1;

        // Causa por defecto estimada si no se ha ingresado en campo
        const causaEstimada = this.inferEstimatedCause(t.nombre);

        reconciledList.push({
          id: `rec-delay-${idx + 1}`,
          tarea: t.nombre,
          finPrevisto: t.finPrev,
          finProyectado: t.fin,
          diasAtraso: t.varFin,
          responsable: t.responsable || 'OBS No Asignada',
          causaRaiz: `${causaEstimada} (Pendiente Validación)`,
          impactoRutaCritica: t.varFin >= 15,
          justificadoEnCampo: false
        });
      }
    });

    const paretoArray = Object.entries(paretoCounts)
      .map(([causa, val]) => ({
        causa,
        dias: val.dias,
        incidentes: val.incidentes
      }))
      .filter(p => p.dias > 0 || p.incidentes > 0)
      .sort((a, b) => b.dias - a.dias);

    return {
      delays: reconciledList.slice(0, 5), // Top 5 mayores atrasos
      metrics: {
        totalAtrasosCriticos: delayedTasks.filter(t => t.varFin >= 15).length,
        totalDiasAtraso: totalDias,
        atrasosJustificados: justificadosCount,
        atrasosPendientesCampo: delayedTasks.length - justificadosCount,
        paretoCausas: paretoArray
      }
    };
  }

  /**
   * Intenta vincular una tarea del cronograma con los reportes de bitácora ingresados en campo.
   */
  private findMatchingLog(task: WbsItem, logs: WeeklyLog[]): WeeklyLog | undefined {
    const taskNameLower = task.nombre.toLowerCase();
    
    return logs.find(log => {
      const logActLower = log.actividad.toLowerCase();
      const logHitoLower = log.hitoNombre.toLowerCase();

      // Coincidencia directa en texto de actividad
      if (taskNameLower.includes(logActLower) || logActLower.includes(taskNameLower)) {
        return true;
      }

      // Coincidencia por términos clave (ej. enchape, mampostería, pintura)
      const keywords = ['relleno', 'enchape', 'piso', 'baranda', 'redes', 'mamposteria', 'estructura', 'formaleta'];
      for (const kw of keywords) {
        if (taskNameLower.includes(kw) && (logActLower.includes(kw) || logHitoLower.includes(kw))) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Heurística de respaldo cuando el residente aún no ha clasificado la causa en campo.
   */
  private inferEstimatedCause(taskName: string): string {
    const name = taskName.toLowerCase();
    if (name.includes('formaleta') || name.includes('muro')) return 'Formaleta';
    if (name.includes('relleno') || name.includes('excavacion') || name.includes('grua')) return 'Equipos';
    if (name.includes('redes') || name.includes('tuberia') || name.includes('cemento')) return 'Materiales / Compras';
    if (name.includes('provisional') || name.includes('permiso')) return 'Licencias / Permisos';
    return 'Contratistas / Personal';
  }
}

export const dataReconciliationService = new DataReconciliationService();

