export interface ContratistaAN8 {
  an8: string | number;
  nombre: string;
  label: string;
  esCorporativo?: boolean;
}

interface RawContratistaRecord {
  an8: string | number;
  nombre: string;
}

/**
 * Opción corporativa prioritaria para asignar responsabilidades internas de la constructora.
 */
export const OPCION_MARVAL_INGENIERIA: ContratistaAN8 = {
  an8: 'MARVAL-ING',
  nombre: 'Marval Ingeniería',
  label: 'Marval Ingeniería (Gestión Interna)',
  esCorporativo: true,
};

function formatContratista(an8: string | number, nombre: string): ContratistaAN8 {
  const cleanNombre = nombre.trim();
  return {
    an8,
    nombre: cleanNombre,
    label: `[${an8}] - ${cleanNombre}`,
  };
}

/**
 * Semilla en memoria con contratistas reales extraídos de AN8 CONTRATISTAS.xlsx
 * para disponibilidad síncrona inmediata antes de completar la carga del catálogo completo.
 */
export const CONTRATISTAS_DESTACADOS_PROYECTO: ContratistaAN8[] = [
  formatContratista(405, 'GERMAN GONZALEZ QUINTERO'),
  formatContratista(421, 'COOMEVA'),
  formatContratista(847, 'JUAN BAUTISTA MEJIA PALENCIA'),
  formatContratista(870, 'CARLOS ALBERTO GONZALEZ MORENO'),
  formatContratista(871, 'LUIS ERNESTO GUALDRON BARRERA'),
  formatContratista(1074, 'MALLASAN SAS.'),
  formatContratista(1077, 'SIKA COLOMBIA S.A.S'),
  formatContratista(2620, 'SOLMAHER INGENIERIA LTDA.'),
  formatContratista(2706, 'CEMEX CONCRETOS DE COLOMBIA S.A.'),
  formatContratista(2756, 'ACABADOS Y ARQUITECTURA ECA LTDA.'),
  formatContratista(2921, 'IMEVALLE S.A.S.'),
  formatContratista(2922, 'ELECTRICOS  DEL VALLE S.A.S'),
  formatContratista(2945, 'AGREGADOS Y CONCRETOS S.A.'),
  formatContratista(4079, 'SUELOS INGENIERIA SAS'),
  formatContratista(544109, 'ARCO ARQUITECTURA Y CONSTRUCCION LTDA'),
  formatContratista(544856, 'ACCESORIOS TECNIC. PARA CONCRETO  SAS'),
  formatContratista(742909, 'ADECUACIONES INGENIERIA Y SERVICIOS LTDA'),
];

/**
 * Servicio para consulta y búsqueda del maestro institucional de contratistas (AN8).
 */
export class ContratistasService {
  private static cachedContratistas: ContratistaAN8[] | null = null;
  private static pendingLoad: Promise<ContratistaAN8[]> | null = null;

  /**
   * Carga de forma asíncrona el catálogo completo (18,027 contratistas) desde ./data/contratistas_an8.json
   * y lo almacena en caché en memoria.
   */
  static async loadAllContratistas(): Promise<ContratistaAN8[]> {
    if (this.cachedContratistas) {
      return this.cachedContratistas;
    }

    if (this.pendingLoad) {
      return this.pendingLoad;
    }

    const fetchUrl = async () => {
      try {
        const res = await fetch('/data/contratistas_an8.json');
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      const resFallback = await fetch('./data/contratistas_an8.json');
      if (!resFallback.ok) {
        throw new Error(`Error HTTP ${resFallback.status} cargando contratistas_an8.json`);
      }
      return await resFallback.json();
    };

    this.pendingLoad = fetchUrl()
      .then((rawList: RawContratistaRecord[]) => {
        const formatted = rawList
          .filter((item) => item && item.an8 !== undefined && item.an8 !== null && item.nombre)
          .map((item) => formatContratista(item.an8, String(item.nombre)));
        this.cachedContratistas = formatted;
        return formatted;
      })
      .catch((err) => {
        console.error('Error cargando catálogo AN8 de contratistas:', err);
        return CONTRATISTAS_DESTACADOS_PROYECTO;
      })
      .finally(() => {
        this.pendingLoad = null;
      });

    return this.pendingLoad;
  }

  /**
   * Retorna la opción prioritaria Marval Ingeniería seguida de los contratistas destacados.
   */
  static getContratistasDestacados(limit = 50): ContratistaAN8[] {
    const base = this.cachedContratistas ?? CONTRATISTAS_DESTACADOS_PROYECTO;
    return [OPCION_MARVAL_INGENIERIA, ...base.slice(0, Math.max(0, limit))];
  }

  /**
   * Filtra rápidamente el catálogo en memoria por código AN8 o nombre,
   * manteniendo siempre accesible la opción corporativa Marval Ingeniería.
   */
  static searchContratistas(query: string, limit = 120): ContratistaAN8[] {
    const source = this.cachedContratistas ?? CONTRATISTAS_DESTACADOS_PROYECTO;
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [OPCION_MARVAL_INGENIERIA, ...source.slice(0, Math.max(0, limit - 1))];
    }

    const isNumeric = /^\d+$/.test(normalized);
    const exactAn8Matches: ContratistaAN8[] = [];
    const prefixAn8Matches: ContratistaAN8[] = [];
    const otherMatches: ContratistaAN8[] = [];

    for (const item of source) {
      const an8Str = String(item.an8).toLowerCase();
      const nomStr = item.nombre.toLowerCase();

      if (an8Str === normalized) {
        exactAn8Matches.push(item);
      } else if (an8Str.startsWith(normalized)) {
        prefixAn8Matches.push(item);
      } else if (an8Str.includes(normalized) || nomStr.includes(normalized)) {
        otherMatches.push(item);
      }

      if (exactAn8Matches.length + prefixAn8Matches.length + otherMatches.length >= limit * 2) {
        break;
      }
    }

    const combined = [...exactAn8Matches, ...prefixAn8Matches, ...otherMatches].slice(0, limit);
    const includesMarval = 'marval'.includes(normalized) || 'ingenieria'.includes(normalized);

    return includesMarval || !isNumeric
      ? [OPCION_MARVAL_INGENIERIA, ...combined.filter((c) => !c.esCorporativo)]
      : combined;
  }

  /**
   * Busca un contratista puntual por su identificador AN8.
   */
  static findByAn8(an8: string | number): ContratistaAN8 | undefined {
    const key = String(an8).trim().toLowerCase();
    if (key === OPCION_MARVAL_INGENIERIA.an8.toString().toLowerCase()) {
      return OPCION_MARVAL_INGENIERIA;
    }
    const source = this.cachedContratistas ?? CONTRATISTAS_DESTACADOS_PROYECTO;
    return source.find((c) => String(c.an8).toLowerCase() === key);
  }
}

export const loadAllContratistas = () => ContratistasService.loadAllContratistas();
export const getContratistasDestacados = (limit?: number) =>
  ContratistasService.getContratistasDestacados(limit);
export const searchContratistas = (query: string, limit?: number) =>
  ContratistasService.searchContratistas(query, limit);
