import { WeeklyLog, SelloActivity, SelloInspection } from '../types';
import { initialWeeklyLogs, initialQualityActivities } from '../data/mockData';

const STORAGE_KEYS = {
  WEEKLY_LOGS: 'marval_pco_weekly_logs',
  QUALITY_ACTIVITIES: 'marval_pco_quality_activities',
  LAST_SYNC: 'marval_pco_last_sync'
};

class DataStorageService {
  /**
   * Obtiene la lista de registros de bitácora semanal (persistencia offline en localStorage).
   */
  getWeeklyLogs(): WeeklyLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      console.warn('No se pudo acceder a localStorage. Usando datos iniciales.');
    }
    return initialWeeklyLogs;
  }

  /**
   * Guarda un nuevo registro de bitácora capturado en campo.
   */
  saveWeeklyLog(log: WeeklyLog): void {
    const logs = this.getWeeklyLogs();
    const updated = [log, ...logs];
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_LOGS, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (err) {
      console.error('Error al guardar log en localStorage:', err);
    }
  }

  /**
   * Elimina un registro de bitácora.
   */
  deleteWeeklyLog(id: string): void {
    const logs = this.getWeeklyLogs();
    const filtered = logs.filter(l => l.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_LOGS, JSON.stringify(filtered));
      this.notifyUpdate();
    } catch (err) {
      console.error('Error al eliminar log:', err);
    }
  }

  /**
   * Obtiene el catálogo de actividades de sellos de calidad con sus inspecciones acumuladas.
   */
  getQualityActivities(): SelloActivity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUALITY_ACTIVITIES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      console.warn('No se pudo acceder a localStorage para calidad.');
    }
    return initialQualityActivities;
  }

  /**
   * Registra una inspección de calidad tomada en campo (Norma MA-SIG-CAL-001).
   */
  saveQualityInspection(activityId: string, inspection: SelloInspection): void {
    const activities = this.getQualityActivities();
    const updated = activities.map(act => {
      if (act.id === activityId) {
        const insps = [inspection, ...act.inspecciones];
        const conformes = insps.filter(i => i.resultado === '0').length;
        const total = insps.length;
        const newPct = total > 0 ? Math.round((conformes / total) * 100) : 100;
        return {
          ...act,
          cumplimientoPct: newPct,
          inspecciones: insps
        };
      }
      return act;
    });

    try {
      localStorage.setItem(STORAGE_KEYS.QUALITY_ACTIVITIES, JSON.stringify(updated));
      this.notifyUpdate();
    } catch (err) {
      console.error('Error al guardar inspección de calidad:', err);
    }
  }

  /**
   * Restablece los datos a las muestras iniciales.
   */
  resetToDefaults(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WEEKLY_LOGS);
      localStorage.removeItem(STORAGE_KEYS.QUALITY_ACTIVITIES);
      this.notifyUpdate();
    } catch (err) {
      console.error('Error al reiniciar almacenamiento:', err);
    }
  }

  /**
   * Notifica a todos los componentes React suscritos que los datos cambiaron.
   */
  private notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marval_data_changed'));
    }
  }
}

export const dataStorageService = new DataStorageService();
