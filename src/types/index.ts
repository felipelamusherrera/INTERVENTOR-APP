export type Sucursal =
  | 'TODAS'
  | 'BOGOTA'
  | 'BARRANQUILLA'
  | 'CARTAGENA'
  | 'CALI'
  | 'BUCARAMANGA'
  | 'SANTA MARTA';

export type SucursalOperativa = Exclude<Sucursal, 'TODAS'>;

export const SUCURSALES_OFICIALES: Array<{ value: SucursalOperativa; label: string }> = [
  { value: 'BOGOTA', label: 'Bogotá' },
  { value: 'BARRANQUILLA', label: 'Barranquilla' },
  { value: 'CARTAGENA', label: 'Cartagena' },
  { value: 'CALI', label: 'Cali' },
  { value: 'BUCARAMANGA', label: 'Bucaramanga' },
  { value: 'SANTA MARTA', label: 'Santa Marta' },
];

export const SUCURSAL_LABEL: Record<Sucursal, string> = {
  TODAS: 'Todas las Sucursales',
  BOGOTA: 'Bogotá',
  BARRANQUILLA: 'Barranquilla',
  CARTAGENA: 'Cartagena',
  CALI: 'Cali',
  BUCARAMANGA: 'Bucaramanga',
  'SANTA MARTA': 'Santa Marta',
};

// ==========================================
// HITOS MACRO ESTANDARIZADOS (GERENCIA Y OBRA)
// ==========================================
export type HitoMacro = 
  | 'URBANISMO'
  | 'CIMENTACION'
  | 'ESTRUCTURA'
  | 'MAMPOSTERIA'
  | 'FACHADAS'
  | 'REDES_HIDROSANITARIAS'
  | 'REDES_ELECTRICAS_GAS'
  | 'ACABADOS_OBRA_GRIS' // Morteros de piso y frisos
  | 'ACABADOS_OBRA_BLANCA' // Enchapes, estucos, pintura
  | 'CARPINTERIAS'
  | 'EQUIPOS_ESPECIALES'
  | 'ZONAS_COMUNES_ESENCIALES'
  | 'CIERRE_ENTREGAS';

// ==========================================
// CAUSAS ESTANDARIZADAS DE DESVIACIÓN
// ==========================================
export type CausaNoInicio =
  | 'FALTA_CONTRATO_LEGALIZADO'
  | 'FALTA_PREPEDIDO_MATERIALES'
  | 'FALTA_EQUIPOS_FORMALETA'
  | 'DISENO_NO_DISPONIBLE'
  | 'FALTA_APROBACION_SST'
  | 'FRENTE_NO_LIBERADO_PREDECESORA'
  | 'RESTRICCION_CTO_PENDIENTE'
  | 'OTRO_INICIO';

export type CausaNoFin =
  | 'BAJO_RENDIMIENTO_PERSONAL'
  | 'FALLA_DE_EQUIPO_FORMALETA'
  | 'DESABASTECIMIENTO_MATERIAL'
  | 'CONDICIONES_CLIMATICAS'
  | 'REPROCESOS_CALIDAD_SELLOS'
  | 'DESERCION_CONTRATISTA'
  | 'INTERFERENCIA_CRUCES'
  | 'OTRO_FIN';

export type MomentoDesviacion = 
  | 'A_TIEMPO'
  | 'DESVIACION_INICIO'
  | 'DESVIACION_EJECUCION'
  | 'DESVIACION_CRITICA_MIXTA';

// ==========================================
// ARQUITECTURA SHAREPOINT (llamus@marval.com.co)
// ==========================================

// LISTA 1: INT_Bitacora_Cabecera_Semanas
export interface BitacoraSemanalCabecera {
  id: string; // PROY-SEMANA-ANIO
  proyectoId: string;
  sucursal: Sucursal;
  semana: number;
  anio: number;
  mes: string; // 'YYYY-MM'
  fechaCorte: string;
  residenteNombre: string;
  
  // Métricas PPC Semanal
  totalActividadesProgramadas: number;
  actividadesIniciadasATiempo: number;
  actividadesFinalizadasATiempo: number;
  ppcInicioPorcentaje: number;
  ppcFinPorcentaje: number;
  ppcGlobalPorcentaje: number;
  
  // Diagnóstico Ejecutivo Consolidado (Las 4 Dimensiones Gerenciales)
  hitoMayorImpacto: HitoMacro; // Hito macro con mayor atraso en días a ruta crítica
  contratistaMenorCumplimiento: string; // Nombre contratista y su %
  contratistaMenorCumplimientoPorcentaje: number;
  causaPrincipalDesviacion: string; // Causa raíz con mayor recurrencia
  momentoPredominanteDesviacion: 'INICIO_RESTRICCIONES' | 'EJECUCION_OBRA' | 'EQUILIBRADO';
  
  // Desviaciones acumuladas en días
  diasAtrasoInicioSemana: number;
  diasAtrasoFinSemana: number;
  diasImpactoRutaCriticaSemana: number;
  
  // Sincronización SharePoint
  sincronizadoSharePoint: boolean;
  fechaSincronizacion?: string;
}

// LISTA 2: INT_Bitacora_Detalle_Actividades
export interface BitacoraDetalleActividad {
  id: string; // PROY-SEM-IDTAREA
  proyectoId: string;
  sucursal: Sucursal;
  semana: number;
  anio: number;
  mes: string;
  
  // Datos Actividad Workplanner
  idTareaWorkplanner: string;
  nombreActividad: string;
  hitoMacro: HitoMacro;
  esRutaCritica: boolean;
  contratista: string;
  tipoContrato?: 'TODO_COSTO' | 'MANO_OBRA';
  
  // Fechas y Variación de Inicio
  fechaInicioLB: string;
  fechaInicioReal: string;
  varComienDias: number; // Desviación inicio en días
  cumpleInicio: boolean;
  causaNoInicio?: CausaNoInicio;
  compromisoFechaInicio?: string;
  
  // Fechas y Variación de Fin
  fechaFinLB: string;
  fechaFinReal: string;
  varFinDias: number; // Desviación fin en días
  cumpleFin: boolean;
  causaNoFin?: CausaNoFin;
  compromisoFechaFin?: string;
  
  // Momento e Impacto
  momentoDesviacion: MomentoDesviacion;
  impactoDiasRutaCritica: number;
  planAccion?: string;
  responsablePlanAccion?: string;
  
  sincronizadoSharePoint: boolean;
}

// LISTA 3: INT_Lookahead_Restricciones
export type TipoCompuertaLookahead =
  | 'CONTRATOS'
  | 'MATERIALES_INVENTORY'
  | 'EQUIPOS_FORMALETA'
  | 'DISENOS'
  | 'SST_ACCESO_PERSONAL';

export type TipoContratacionSLA =
  | 'TODO_COSTO_64D'
  | 'MANO_OBRA_22D'
  | 'NO_APLICA';

export type AreaResponsableSLA =
  | 'CONTRATACIONES'
  | 'COMPRAS_INVENTORY'
  | 'DISENO'
  | 'SST'
  | 'OBRA_RESIDENCIA';

export interface LookaheadRestriccionItem {
  id: string; // PROY-TAREA-COMPUERTA
  proyectoId: string;
  sucursal: Sucursal;
  idTareaWorkplanner: string;
  nombreActividad: string;
  hitoMacro: HitoMacro;
  esRutaCritica: boolean;
  
  // Compuerta y Reglas SLA
  tipoCompuerta: TipoCompuertaLookahead;
  tipoContratacion: TipoContratacionSLA;
  fechaDisparoRequerida: string; // Disparo automático según predecesora/LB
  fechaInicioLB: string;
  fechaLimiteCumplimiento: string; // Mínimo 15 días antes de fechaInicioLB
  fechaCierreReal?: string;
  
  // Estado y SLA
  estadoCompuerta: 'BLOQUEADA' | 'EN_GESTION' | 'LIBERADA' | 'VENCIDA_CRITICA';
  diasDesviacionSLA: number; // Días de atraso frente al acuerdo de servicio
  areaResponsableSLA: AreaResponsableSLA;
  
  // Auditoría del Residente
  causaBloqueo?: string;
  planAccion?: string;
  responsableGestion?: string;
  residenteAuditor: string;
  
  sincronizadoSharePoint: boolean;
}

// LISTA 4: INT_Calidad_Sellos_Muestreo (MA-SIG-CAL-001)
export type HitoMacroCalidad =
  | 'ESTRUCTURA_VANOS'
  | 'REDES_HIDROSANITARIAS'
  | 'MUROS_LIVIANOS'
  | 'AFINADO_PISO'
  | 'FRISOS_MUROS'
  | 'PISOS_ENCHAPES'
  | 'ENCHAPES_MUROS';

export type DefectoCalidadPredominante =
  | 'PLOMOS_Y_NIVELES'
  | 'VANOS_DESCUADRADOS'
  | 'DESPRENDIMIENTOS_HUECOS'
  | 'FISURAS_GRIETAS'
  | 'DESVIO_ESPECIFICACION'
  | 'FUGAS_ESTANQUEIDAD';

export interface CalidadSelloMuestreo {
  id: string; // PROY-HITO-FECHA
  proyectoId: string;
  sucursal: Sucursal;
  torre: string;
  fechaAuditoria: string;
  mes: string;
  
  // Datos Técnicos y Contratista
  hitoMacroCalidad: HitoMacroCalidad;
  selloId?: string;
  selloNombre?: string;
  codigoCpc?: string;
  contratistaEjecutor: string;
  tipoContrato: 'TODO_COSTO' | 'MANO_OBRA';
  valorContratoPorApto?: number;
  porcentajeRetencionAplicado?: number;
  valorTotalContratoLote?: number;
  
  // Regla de Muestreo (50%, mínimo 5 unidades)
  unidadesLiberadasObra?: number; // Calculado o verificado en campo
  unidadesAuditadasInterventoria: number; // Muestreadas por interventoría
  unidadesAprobadas: number;
  unidadesRechazadas: number;
  indiceCumplimientoLote: number; // (unidadesAprobadas / unidadesAuditadas) * 100
  
  // Amarre a Workplanner y Control de Ritmo / Desfase
  idTareaWorkplannerAsociada?: string; // Subtarea EDT que marca el ritmo
  porcentajeAvanceWorkplanner?: number; // % reportado en LEAN
  unidadesEjecutadasSegunWP?: number; // Unidades calculadas según % avance
  desfaseDiasMuestreo?: number; // Días de desfase ejecución vs muestreo
  alertaDesfase?: 'AL_DIA' | 'ATENCION_ATRASO_MUESTREO' | 'CRITICA_VALIDAR_AVANCE_OBRA';
  mensajeAlertaDesfase?: string;
  
  // Retención y Consecuencias Contractuales
  aprobado: boolean; // >= 80%
  aplicaRetencion20: boolean; // True si índice < 80%
  valorRetencionEstimado?: number;
  defectoPredominante?: DefectoCalidadPredominante;
  espaciosIncumplimiento: string[]; // Ej. ["Habitación Principal - Vano Ventana"]
  
  // Subsanación y Bloqueo de Sucesora
  estadoSubsanacion: 'PENDIENTE_CORRECCION_8D' | 'REINSPECCIONADO_APROBADO' | 'RETENCION_EJECUTADA';
  bloqueaSucesora: boolean; // Bloquea actividades sucesoras en campo y bitácora
  fechaLimiteSubsanacion8d: string;
  fechaCierreRealSubsanacion?: string;
  
  residenteAuditor: string;
  sincronizadoSharePoint: boolean;
}

// LISTA 5: INT_CTO_Seguimiento_Torres (Ley 1796 / NSR-10)
export interface CtoTorreSeguimiento {
  id: string; // PROY-TORRE
  proyectoId: string;
  sucursal: Sucursal;
  torre: string;
  
  // Regla de Torre 1 vs Torre 2+
  esPrimeraTorre: boolean; // Si es true, evalúa obligatoriamente Zonas Comunes Esenciales
  zonasComunesCerradas: boolean;
  
  // Calendario y Control 12 Meses Antes
  fechaAlistamientoProgramada: string;
  fechaInicioControl12M: string; // 12 meses antes del alistamiento
  mesesRestantesAlistamiento: number;
  estaEnVentanaControl12M: boolean; // true si mesesRestantes <= 12
  
  // Madurez y Criterios
  totalCriteriosAplica: number;
  criteriosCumplidos: number; // En Estado 3 (Aprobación Supervisor)
  criteriosPendienteIngenieria: number; // Estado 1
  criteriosRevisionSupervisor: number; // Estado 2
  indiceMadurezCTO: number; // % Cumplimiento acumulado
  
  // Semáforo de Riesgo Legal
  estadoRiesgoLegal: 'VERDE_EN_TIEMPO' | 'AMARILLO_RIESGO_MODERADO' | 'ROJO_RIESGO_CRITICO_ENTREGA';
  
  residenteInterventoria: string;
  directorObra: string;
  supervisorTecnicoIndependiente: string;
  fechaUltimaEvaluacionMensual: string;
  
  sincronizadoSharePoint: boolean;
}

// LISTA 6: INT_CTO_Evaluacion_Criterios (Auditoría Criterios Ley 1796)
export type CtoCategoriaCriterio =
  | 'CIMENTACION'
  | 'ESTRUCTURA'
  | 'REDES_HIDROSANITARIAS_INCENDIO'
  | 'ELEMENTOS_NO_ESTRUCTURALES'
  | 'ZONAS_COMUNES_ESENCIALES'
  | 'DOCUMENTACION_Y_CURADURIA';

export type CtoTipoResponsable =
  | 'DISENADOR_ESTRUCTURAL'
  | 'DISENADOR_GEOTECNICO'
  | 'DISENADOR_REDES'
  | 'DISENADOR_ARQUITECTONICO'
  | 'CONTRATISTA_TODO_COSTO'
  | 'CONTRATISTA_MANO_OBRA'
  | 'EQUIPO_INGENIERIA_OBRA';

// Las 3 fases oficiales de evaluación del CTO
export type CtoEstadoSupervisorTecnico =
  | '1_ENTREGA_RESPUESTA_INGENIERIA'    // Pendiente entrega o respuesta por parte de Ingeniería
  | '2_REVISION_SUPERVISOR_PENDIENTE'   // En revisión y aprobación pendiente del Supervisor Técnico
  | '3_APROBACION_SUPERVISOR_TECNICO';  // Aprobación formal del Supervisor Técnico

export type EstadoRevisionSupervisor = CtoEstadoSupervisorTecnico;

export interface CtoCriterioEvaluacion {
  id: string; // PROY-TORRE-NUM_CRITERIO
  proyectoId: string;
  sucursal: Sucursal;
  torre: string;
  numCriterio: number;
  
  // Clasificación Técnica
  categoriaCriterio: CtoCategoriaCriterio;
  descripcionCriterio: string;
  hitoMacro: HitoMacro; // Hito macro asociado (ej. ESTRUCTURA, CIMENTACION, ACABADOS)
  
  // Responsable y Vinculación con Workplanner
  tipoResponsable: CtoTipoResponsable;
  nombreResponsable: string; // Ej. "Cálculos y Estructuras SAS", "Contratista Barandas"
  tareasWorkplannerIds: string[]; // Tareas de la EDT que marcan este requerimiento
  fechaInicioTareaProgramada?: string; // Fecha de inicio de la tarea en Workplanner
  
  // Auditoría: 3 Fases del Supervisor Técnico
  estadoSupervisorTecnico: CtoEstadoSupervisorTecnico;
  cumplimientoInterventoria: 'CUMPLE' | 'INCUMPLE'; // CUMPLE solo en Estado 3
  
  // Trazabilidad
  observacionesPendiente?: string; // Faltante reportado por el supervisor técnico
  fechaAprobacionSupervisor?: string;
  mesEvaluacion: string; // 'YYYY-MM'
  
  sincronizadoSharePoint: boolean;
}

// ==========================================
// MODELOS DE CONSOLIDADO GERENCIAL (MENSUAL / MULTI-PROYECTO)
// ==========================================
export interface GerenciaTiemposConsolidado {
  mes: string; // 'YYYY-MM'
  sucursalFiltro: Sucursal;
  
  // 1. Hito Macro con Mayor Desviación Nacional
  hitoMacroMayorImpacto: HitoMacro;
  diasAtrasoPorHitoMacro: Record<HitoMacro, number>;
  
  // 2. Ranking Nacional de Contratistas con Menor Cumplimiento
  rankingContratistas: Array<{
    contratista: string;
    sucursal: Sucursal;
    tipoContrato: 'TODO_COSTO' | 'MANO_OBRA';
    tareasProgramadas: number;
    tareasCumplidas: number;
    porcentajeCumplimiento: number;
    diasAtrasoTotal: number;
  }>;
  
  // 3. Pareto Nacional de Causas Raíz
  paretoCausas: Array<{
    causa: string;
    frecuencia: number;
    porcentaje: number;
    porcentajeAcumulado: number;
  }>;
  
  // 4. Momento Predominante de Desviación (Inicio vs Fin)
  ratioInicioVsFin: {
    totalDiasAtrasoInicio: number;
    totalDiasAtrasoFin: number;
    momentoPredominante: 'INICIO_RESTRICCIONES' | 'EJECUCION_OBRA' | 'EQUILIBRADO';
    porcentajeDesviacionInicio: number;
    porcentajeDesviacionFin: number;
  };
  
  ppcPromedioMes: number;
  proyectosEvaluados: number;
}

export interface GerenciaLookaheadConsolidado {
  mes: string;
  compuertasTotales: number;
  compuertasLiberadasATiempo: number;
  compuertasVencidasCriticas: number;
  cumplimientoSlaPorArea: Record<AreaResponsableSLA, {
    total: number;
    aTiempo: number;
    vencidas: number;
    porcentajeCumplimiento: number;
    diasDemoraPromedio: number;
  }>;
}

export interface GerenciaCalidadConsolidado {
  mes: string;
  indiceCalidadCorporativo: number; // Promedio % aprobación nacional
  totalUnidadesAuditadas: number;
  totalRetenciones20Aplicadas: number;
  valorTotalRetencionesEstimado: number;
  calidadPorHitoMacro: Record<HitoMacroCalidad, number>;
  rankingContratistasRetenciones: Array<{
    contratista: string;
    sucursal: Sucursal;
    lotesAuditados: number;
    lotesAprobados: number;
    retencionesAplicadas: number;
    indiceCalidad: number;
  }>;
  paretoDefectos: Array<{
    defecto: DefectoCalidadPredominante;
    conteo: number;
    porcentaje: number;
  }>;
}

export interface GerenciaCtoConsolidado {
  mes: string;
  torresEnSeguimiento: number;
  torresEnRiesgoCritico: number; // < 3 meses con madurez < 85%
  torresConZonasComunesPendientes: number;
  madurezPromedioPorSucursal: Record<Sucursal, number>;
  alertasCriticasAlistamiento: Array<{
    proyecto: string;
    sucursal: Sucursal;
    torre: string;
    mesesParaAlistamiento: number;
    indiceMadurez: number;
    itemsCriticosPendientes: number;
    responsablesIncumplimiento: string[];
  }>;
}

// ==========================================
// MODELOS PREVIOS COMPATIBLES (LEGACY WORKFLOWS)
// ==========================================
export interface PortfolioItem {
  id: string;
  sucursal: 'BUCARAMANGA' | 'BOGOTA' | 'BARRANQUILLA' | 'CARTAGENA' | 'CALI' | 'SANTA MARTA';
  gerencia: string;
  proyecto: string;
  tab: 'P-EJECUCION' | 'P-ENTREGADOS';
  fechaPrometida: string;
  fechaConfirmada: string;
  cumplimiento: number;
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
  selloCalidad: number;
  productividad: number;
  ctoCumplimiento: number;
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
  desviacionInicio: number;
  desviacionFin: number;
  estado: 'Cumplido' | 'En plazo' | 'En riesgo' | 'Atrasado';
  avance: number;
  responsable: string;
  critico: boolean;
}

export interface S說urvePoint {
  mes: string;
  pv: number;
  ev: number;
  proyeccion: number;
}
export type SCurvePoint = S說urvePoint;

export interface MajorDelay {
  id: string;
  tarea: string;
  finPrevisto: string;
  finProyectado: string;
  diasAtraso: number;
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
  edt?: string;
  frente: string;
  semana: string;
  responsable: string;
  esCritica?: boolean;
  origen?: 'BITACORA_CAMPO' | 'PLANIFICACION';
  observaciones?: string;
  restriccionPrincipal?: string;
  estadoGestion?: 'PENDIENTE' | 'EN_GESTION' | 'LIBERADO';
  gates: {
    diseno: boolean;
    contratacion: boolean;
    predecesora: boolean;
    materiales: boolean;
    manoObra: boolean;
    equipos: boolean;
    sstAmbiental: boolean;
  };
  indicePreparacion: number;
}

export interface ProductivityPoint {
  id: string;
  actividad: string;
  torre: string;
  unidadesPlaneadas: number;
  unidadesEjecutadas: number;
  personalEsperado: number;
  personalRealARI: number;
  indicePersonal: number;
  productividad: number;
  cuadrante: 'Tesla (Alta Prod / Personal Óptimo)' | 'Alerta' | 'Crítico' | 'Sobredimensionado';
  ritmoMensual: number;
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

export type CriterioSello = '0' | '1' | '2' | 'NA';

export interface SelloInspection {
  id: string;
  proyectoId?: string;
  sucursal?: Sucursal;
  selloId?: string;
  selloNombre?: string;
  torre?: string;
  apartamento: string;
  piso: number;
  resultado: CriterioSello;
  criterioEvaluado?: string;
  medicionMm?: number;
  toleranciaPositivaMm?: number;
  toleranciaNegativaMm?: number;
  unidadTolerancia?: string;
  toleranciaTexto: string;
  defectoPredominante?: DefectoCalidadPredominante;
  hallazgo?: string;
  contratistaResponsable?: string;
  tipoContrato?: 'TODO_COSTO' | 'MANO_OBRA';
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
  unidadTolerancia?: string;
  toleranciaPositivaMm?: number;
  toleranciaNegativaMm?: number;
  criteriosManual?: string[];
  criterioAceptacion: string;
  herramientas: string[];
  inspecciones: SelloInspection[];
}

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
