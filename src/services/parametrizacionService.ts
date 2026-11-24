import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import { ProjectService, normalizeTorreStandard, normalizeEtapaStandard } from './projectService';

export interface TorreParametrizacion {
  id: string;
  nombreTorre: string; // ej. 'TORRE 01'
  agrupacionWorkplanner: string; // ej. 'TORRE 01'
  etapa: string; // ej. 'ETAPA 01'
  numeroPisos: number; // defecto: 12
  aptosPorPiso: number; // defecto: 4
  series: string[]; // defecto: ['01', '02', '03', '04']
  incluyeSotano?: boolean;
}

export interface ApartamentoGenerado {
  codigo: string; // ej. '0101', '0102', '1204'
  piso: number;   // ej. 1..12
  serie: string;  // ej. '01'
  torre: string;  // ej. 'TORRE 01'
  label: string;  // ej. 'Apto 0101 (Piso 1 · Serie 01)'
}

const STORAGE_PARAM_KEY_PREFIX = 'marval_parametrizacion_torres_v2_';

function normalizarSerie(s: string): string {
  const clean = s.trim();
  if (!clean) return '01';
  return /^\d+$/.test(clean) ? clean.padStart(2, '0') : clean.toUpperCase();
}

export class ParametrizacionService {
  /**
   * Obtiene la parametrización de torres guardada para el proyecto.
   * Desacoplada del Workplanner: permite agregar torres libremente (TORRE 01..TORRE 50)
   * y asignar cada torre a una etapa configurada en "Datos del proyecto".
   * Si aún no hay torres guardadas para un proyecto válido, inicializa con 1 tarjeta base (TORRE 01).
   */
  static getTorresConfig(proyectoId?: string | null): TorreParametrizacion[] {
    if (!proyectoId) return [];

    const etapasProyecto = ProjectService.getEtapasEstructura(proyectoId);
    const primeraEtapa = etapasProyecto[0]?.etapa || 'ETAPA 01';

    let savedList: TorreParametrizacion[] = [];
    try {
      const raw = localStorage.getItem(`${STORAGE_PARAM_KEY_PREFIX}${proyectoId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          savedList = parsed;
        }
      }
    } catch (e) {
      console.warn(`[ParametrizacionService] Error leyendo configuración de ${proyectoId}:`, e);
    }

    if (savedList.length > 0) {
      return savedList.map((t, idx) => {
        const stdName =
          normalizeTorreStandard(t.nombreTorre) ||
          t.nombreTorre?.trim().toUpperCase() ||
          `TORRE ${String(idx + 1).padStart(2, '0')}`;
        const etapaNorm = normalizeEtapaStandard(t.etapa) || (t.etapa || '').trim().toUpperCase() || primeraEtapa;
        return {
          ...t,
          nombreTorre: stdName,
          agrupacionWorkplanner: stdName,
          etapa: etapaNorm,
          numeroPisos: Math.max(1, Math.min(50, Number(t.numeroPisos) || 12)),
          aptosPorPiso: Math.max(1, Number(t.aptosPorPiso) || 4),
          series: Array.isArray(t.series) && t.series.length > 0 ? t.series : ['01', '02', '03', '04'],
        };
      });
    }

    return [
      {
        id: 'torre-01',
        nombreTorre: 'TORRE 01',
        agrupacionWorkplanner: 'TORRE 01',
        etapa: primeraEtapa,
        numeroPisos: 12,
        aptosPorPiso: 4,
        series: ['01', '02', '03', '04'],
        incluyeSotano: false,
      },
    ];
  }

  /**
   * Persiste la parametrización de torres del proyecto, marca Paso 1B completado
   * y notifica a Elevación 3D y Sellos de Calidad.
   */
  static saveTorresConfig(
    proyectoId: string,
    torres: TorreParametrizacion[]
  ): TorreParametrizacion[] {
    const etapasProyecto = ProjectService.getEtapasEstructura(proyectoId);
    const primeraEtapa = etapasProyecto[0]?.etapa || 'ETAPA 01';

    const normalized = torres.map((t) => {
      const cleanSeries = (t.series || [])
        .map(normalizarSerie)
        .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);

      const finalSeries =
        cleanSeries.length > 0
          ? cleanSeries
          : Array.from({ length: Math.max(1, t.aptosPorPiso || 4) }, (_, idx) =>
              String(idx + 1).padStart(2, '0')
            );

      const stdName = normalizeTorreStandard(t.nombreTorre) || t.nombreTorre.trim().toUpperCase();
      const etapaNorm = normalizeEtapaStandard(t.etapa) || (t.etapa || '').trim().toUpperCase() || primeraEtapa;

      return {
        ...t,
        nombreTorre: stdName,
        agrupacionWorkplanner: stdName,
        etapa: etapaNorm,
        numeroPisos: Math.max(1, Math.min(50, Number(t.numeroPisos) || 12)),
        aptosPorPiso: finalSeries.length,
        series: finalSeries,
      };
    });

    try {
      localStorage.setItem(`${STORAGE_PARAM_KEY_PREFIX}${proyectoId}`, JSON.stringify(normalized));
      ProjectService.markTorresGuardadas(proyectoId);
      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.PROYECTOS_MAESTRO,
        'UPDATE',
        `PARAM-TORRES-${proyectoId}`,
        {
          tipoRegistro: 'PARAMETRIZACION_TORRES',
          proyectoId,
          torres: normalized,
        }
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marval_parametrizacion_updated', { detail: { proyectoId } }));
      }
    } catch (e) {
      console.error('[ParametrizacionService] Error guardando parametrización:', e);
    }

    return normalized;
  }

  /**
   * Construye series estándar cuando el usuario cambia la cantidad de apartamentos por piso.
   */
  static generarSeriesPorCantidad(cantidad: number): string[] {
    const n = Math.max(1, Math.min(20, Math.round(cantidad) || 1));
    return Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, '0'));
  }

  /**
   * Genera la numeración oficial de apartamentos combinando número de piso y serie:
   * Piso 1, Serie 01 -> 0101; Piso 12, Serie 04 -> 1204.
   */
  static generarApartamentosPorTorre(
    torre: TorreParametrizacion,
    pisoFiltro?: number
  ): ApartamentoGenerado[] {
    const result: ApartamentoGenerado[] = [];
    const series =
      torre.series && torre.series.length > 0
        ? torre.series.map(normalizarSerie)
        : this.generarSeriesPorCantidad(torre.aptosPorPiso);

    for (let piso = 1; piso <= Math.max(1, torre.numeroPisos); piso++) {
      if (pisoFiltro !== undefined && pisoFiltro > 0 && piso !== pisoFiltro) {
        continue;
      }
      for (const serie of series) {
        const codigo = `${String(piso).padStart(2, '0')}${serie}`;
        result.push({
          codigo,
          piso,
          serie,
          torre: torre.nombreTorre,
          label: `Apto ${codigo} (Piso ${piso} · Serie ${serie})`,
        });
      }
    }

    return result;
  }

  /**
   * Busca una torre por nombre (tolerante a 'TORRE 01' vs 'Torre 1').
   */
  static findTorre(
    proyectoId: string,
    nombreOTorreId: string
  ): TorreParametrizacion | undefined {
    const torres = this.getTorresConfig(proyectoId);
    if (torres.length === 0) return undefined;
    const norm = (normalizeTorreStandard(nombreOTorreId) || nombreOTorreId)
      .toLowerCase()
      .replace(/\b0+(\d+)/g, '$1')
      .trim();
    return (
      torres.find(
        (t) =>
          t.id.toLowerCase() === norm ||
          t.nombreTorre.toLowerCase().replace(/\b0+(\d+)/g, '$1').trim() === norm ||
          t.agrupacionWorkplanner.toLowerCase().replace(/\b0+(\d+)/g, '$1').trim() === norm
      ) || torres[0]
    );
  }
}
