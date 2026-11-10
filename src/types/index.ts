export type Sucursal = 'TODAS' | 'BUCARAMANGA' | 'BOGOTA' | 'BARRANQUILLA' | 'CARTAGENA' | 'CALI';

export interface PortfolioItem {
  id: string;
  sucursal: 'BUCARAMANGA' | 'BOGOTA' | 'BARRANQUILLA' | 'CARTAGENA' | 'CALI';
  gerencia: string;
  proyecto: string;
  tab: 'P-EJECUCION' | 'P-ENTREGADOS';
  fechaPrometida: string;
  fechaConfirmada: string;
  cumplimiento: number; // días atraso/cumplimiento
  compuertas: {
    m12: number;
    m6: number;
    m3: number;
  };
  costos: {
    totales: number;
    viv: number;
    urb: number;
    adminis: number;
  };
  selloCalidad: number; // %
  productividad: number; // %
  ctoCumplimiento: number; // %
  estado: 'Al día' | 'En riesgo' | 'Crítico' | 'Entregado';
  proximaTorre: string;
}

export interface MacroMilestone {
  id: string;
  order: number;
  code: string;
  name: string;
  fase: 'Estructura' | 'Obra Gris' | 'Obra Blanca' | 'Cierre';
  fechaPlan: string;
  fechaReal: string;
  desviacionInicio: number; // 'I' en días
  desviacionFin: number;    // 'E' en días
  estado: 'Cumplido' | 'En plazo' | 'En riesgo' | 'Atrasado';
  avance: number; // %
  responsable: string;
  critico: boolean;
}

export interface S說urvePoint {
  mes: string;
  pv: number; // Planned Value %
  ev: number; // Earned Value %
  proyeccion: number; // Pronóstico ritmo 4-7%
}

export interface MajorDelay {
  id: string;
  tarea: string;
  finPrevisto: string;
  finProyectado: string;
  diasAtraso: number; // VarFin
  responsable: string;
  causaRaiz: string;
  impactoRutaCritica: boolean;
}

export interface WbsItem {
  idConsec?: number;
  edt: string;
  nivel: number;
  esHito: boolean;
  nombre: string;
  w: number;
  duraPrev: number;
  dura: number;
  comienPrev: string;
  finPrev: string;
  comien: string;
  fin: string;
  varComien: number;
  varFin: number;
  responsable?: string;
  unidad?: string;
  cantidad?: string;
  rendimiento?: string;
  predecesora?: string;
  agrupacion?: string;
  codigoPlaneacion?: string;
  tipo: string;
  etapa: string;
}

export type CausaRaiz = 
  | 'Contratos'
  | 'Contratistas / Personal'
  | 'Formaleta'
  | 'Equipos'
  | 'Materiales / Compras'
  | 'Clima / Lluvias'
  | 'Diseños'
  | 'Licencias / Permisos';

export interface WeeklyLog {
  id: string;
  fecha: string;
  semana: number;
  proyecto: string;
  torre: string;
  hitoNombre: string;
  actividad: string;
  cumplio: boolean;
  causaRaiz?: CausaRaiz;
  diasImpacto: number;
  residente: string;
  observaciones: string;
}

export interface LookaheadGate {
  id: string;
  actividad: string;
  frente: string;
  semana: string;
  responsable: string;
  gates: {
    diseno: boolean;
    contratacion: boolean;
    predecesora: boolean;
    materiales: boolean;
    manoObra: boolean;
    equipos: boolean;
    sstAmbiental: boolean;
  };
  indicePreparacion: number; // IP % (gates activas / 7)
}

export interface ProductivityPoint {
  id: string;
  actividad: string;
  torre: string;
  unidadesPlaneadas: number;
  unidadesEjecutadas: number;
  personalEsperado: number;
  personalRealARI: number;
  indicePersonal: number; // ARI / Esperado
  productividad: number;  // Ejecutadas / Planeadas %
  cuadrante: 'Tesla (Alta Prod / Personal Óptimo)' | 'Alerta' | 'Crítico' | 'Sobredimensionado';
  ritmoMensual: number; // % avance en últimas 4 semanas (regla: 4%-7%)
}

export interface FloorElevation {
  piso: number;
  nombre: string;
  actividades: {
    estructura: 'completado' | 'en_proceso' | 'pendiente' | 'observado';
    mamposteria: 'completado' | 'en_proceso' | 'pendiente' | 'observado';
    panete: 'completado' | 'en_proceso' | 'pendiente' | 'observado';
    enchape: 'completado' | 'en_proceso' | 'pendiente' | 'observado';
    redes: 'completado' | 'en_proceso' | 'pendiente' | 'observado';
  };
  sellosCumplidos: number;
  sellosTotales: number;
}

// CALIDAD: Sellos MA-SIG-CAL-001
export type CriterioSello = '0' | '1' | '2' | 'NA'; // 0: Cumple, 1: No cumple, 2: No cumple por externos, NA: No aplica

export interface SelloInspection {
  id: string;
  apartamento: string;
  piso: number;
  resultado: CriterioSello;
  medicionMm?: number;
  toleranciaTexto: string;
  hallazgo?: string;
  contratistaResponsable?: string;
  fecha: string;
  inspector: string;
}

export interface SelloActivity {
  id: string;
  codigo: string;
  nombre: string;
  fase: 'Obra Gris' | 'Obra Blanca';
  descripcion: string;
  tolerancia: string;
  criterioAceptacion: string;
  herramientas: string[];
  inspecciones: SelloInspection[];
}

// CTO: Certificado Técnico de Ocupación (Ley 1796 / NSR-10)
export interface CtoCriterion {
  num: number;
  categoria: string;
  item: number;
  criterio: string;
  responsable: 'A cargo del Proyecto' | 'A cargo de la Supervisión';
  hito: string;
  norma: string;
  cumple: 'SÍ' | 'NO' | 'EN TRÁMITE' | 'NO APLICA';
  fechaVerificacion?: string;
  observaciones?: string;
}

export interface CtoTowerStatus {
  id: string;
  proyecto: string;
  torre: string;
  gerente: string;
  director: string;
  interventor: string;
  supervisor: string;
  fechaInicio: string;
  fechaInformeCTO: string;
  fechaAlistamiento: string;
  fechaRPH: string;
  diasEjecucion: number;
  diasParaRPH: number;
  diasParaAlistamiento: number;
  porcentajeCumplimiento: number;
  estadoCTO: 'Expedido' | 'En Trámite' | 'En Riesgo' | 'Crítico';
}

export interface CtoPendingItem {
  proyecto: string;
  torre: string;
  interventor: string;
  director: string;
  planosRecord: string;
  geotecnia: string;
  materiales: string;
  especificaciones: string;
  programaCalidad: string;
  enoes: string;
  observacionCritica: string;
  itemsAbiertos: number;
}
