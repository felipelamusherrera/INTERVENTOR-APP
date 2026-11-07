import {
  MacroMilestone,
  S說urvePoint,
  MajorDelay,
  WeeklyLog,
  LookaheadGate,
  ProductivityPoint,
  FloorElevation,
  SelloActivity,
  CtoCriterion,
  CtoTowerStatus,
  CtoPendingItem,
  PortfolioItem,
  WbsItem
} from '../types';

import rawPortfolio from './portfolioData.json';
import rawWbs from './wbsBelaterra.json';
import rawCto from './ctoData.json';

// Portfolio rows from Excel
export const portfolioEjecucion: PortfolioItem[] = rawPortfolio.ejecucion as PortfolioItem[];
export const portfolioEntregados: PortfolioItem[] = rawPortfolio.entregados as PortfolioItem[];

// WBS items from Belaterra CSV
export const wbsBelaterraData: WbsItem[] = rawWbs as WbsItem[];

// 12 Macro-Hitos de Marval (Metodología Ing. Rubén Darío Ortega)
export const macroMilestones: MacroMilestone[] = [
  {
    id: 'm-01',
    order: 1,
    code: 'H-01',
    name: 'Inicio de Obra y Preliminares',
    fase: 'Estructura',
    fechaPlan: '2025-11-14',
    fechaReal: '2025-11-19',
    desviacionInicio: 3,
    desviacionFin: 5,
    estado: 'Cumplido',
    avance: 100,
    responsable: 'Carlos Julio Beltrán',
    critico: true
  },
  {
    id: 'm-02',
    order: 2,
    code: 'H-02',
    name: 'Cimentación y Muros Contención',
    fase: 'Estructura',
    fechaPlan: '2025-12-01',
    fechaReal: '2026-02-15',
    desviacionInicio: 12,
    desviacionFin: 28,
    estado: 'Cumplido',
    avance: 100,
    responsable: 'Carlos Julio Beltrán',
    critico: true
  },
  {
    id: 'm-03',
    order: 3,
    code: 'H-03',
    name: 'Estructura Principal (Pisos 1-12)',
    fase: 'Estructura',
    fechaPlan: '2026-02-01',
    fechaReal: '2026-08-30',
    desviacionInicio: 18,
    desviacionFin: 42,
    estado: 'Cumplido',
    avance: 100,
    responsable: 'Tatiana Alejandra Correa',
    critico: true
  },
  {
    id: 'm-04',
    order: 4,
    code: 'H-04',
    name: 'Mampostería y Divisiones Internas',
    fase: 'Obra Gris',
    fechaPlan: '2026-04-15',
    fechaReal: '2026-09-20',
    desviacionInicio: 24,
    desviacionFin: 35,
    estado: 'Cumplido',
    avance: 100,
    responsable: 'Jairo Jahir Vargas',
    critico: true
  },
  {
    id: 'm-05',
    order: 5,
    code: 'H-05',
    name: 'Redes Hidrosanitarias y Gas',
    fase: 'Obra Gris',
    fechaPlan: '2026-05-01',
    fechaReal: '2026-10-10',
    desviacionInicio: 20,
    desviacionFin: 38,
    estado: 'Cumplido',
    avance: 95,
    responsable: 'Tatiana Alejandra Correa',
    critico: false
  },
  {
    id: 'm-06',
    order: 6,
    code: 'H-06',
    name: 'Instalaciones Eléctricas y RCI',
    fase: 'Obra Gris',
    fechaPlan: '2026-05-15',
    fechaReal: '2026-10-25',
    desviacionInicio: 15,
    desviacionFin: 30,
    estado: 'En riesgo',
    avance: 88,
    responsable: 'Tatiana Alejandra Correa',
    critico: false
  },
  {
    id: 'm-07',
    order: 7,
    code: 'H-07',
    name: 'Morteros, Frisos y Pañetes',
    fase: 'Obra Gris',
    fechaPlan: '2026-06-01',
    fechaReal: '2026-11-05',
    desviacionInicio: 22,
    desviacionFin: 25,
    estado: 'En riesgo',
    avance: 82,
    responsable: 'Carlos Julio Beltrán',
    critico: true
  },
  {
    id: 'm-08',
    order: 8,
    code: 'H-08',
    name: 'Afinado y Pisos',
    fase: 'Obra Gris',
    fechaPlan: '2026-07-01',
    fechaReal: '2026-11-20',
    desviacionInicio: 25,
    desviacionFin: 32,
    estado: 'En riesgo',
    avance: 76,
    responsable: 'Carlos Julio Beltrán',
    critico: true
  },
  {
    id: 'm-09',
    order: 9,
    code: 'H-09',
    name: 'Enchapes y Zonas Húmedas',
    fase: 'Obra Blanca',
    fechaPlan: '2026-08-01',
    fechaReal: '2026-12-15',
    desviacionInicio: 30,
    desviacionFin: 45,
    estado: 'Atrasado',
    avance: 64,
    responsable: 'Tatiana Alejandra Correa',
    critico: true
  },
  {
    id: 'm-10',
    order: 10,
    code: 'H-10',
    name: 'Ventanería, Puertas y Barandas',
    fase: 'Obra Blanca',
    fechaPlan: '2026-09-01',
    fechaReal: '2026-12-30',
    desviacionInicio: 35,
    desviacionFin: 50,
    estado: 'Atrasado',
    avance: 48,
    responsable: 'Tatiana Alejandra Correa',
    critico: true
  },
  {
    id: 'm-11',
    order: 11,
    code: 'H-11',
    name: 'Pintura Segunda Mano y Alistamiento',
    fase: 'Cierre',
    fechaPlan: '2026-10-15',
    fechaReal: '2027-01-20',
    desviacionInicio: 40,
    desviacionFin: 40,
    estado: 'En riesgo',
    avance: 25,
    responsable: 'Carlos Julio Beltrán',
    critico: true
  },
  {
    id: 'm-12',
    order: 12,
    code: 'H-12',
    name: 'Entrega a Propietarios y RPH',
    fase: 'Cierre',
    fechaPlan: '2026-11-30',
    fechaReal: '2027-02-15',
    desviacionInicio: 45,
    desviacionFin: 45,
    estado: 'En riesgo',
    avance: 10,
    responsable: 'Jairo Jahir Vargas',
    critico: true
  }
];

// Curva S sincronizada (PV vs EV con ritmo mensual proyectado 5.8%)
export const sCurveData: S說urvePoint[] = [
  { mes: 'Nov 25', pv: 4, ev: 4, proyeccion: 4 },
  { mes: 'Ene 26', pv: 14, ev: 12, proyeccion: 12 },
  { mes: 'Mar 26', pv: 28, ev: 23, proyeccion: 23 },
  { mes: 'May 26', pv: 45, ev: 38, proyeccion: 38 },
  { mes: 'Jul 26', pv: 62, ev: 53, proyeccion: 53 },
  { mes: 'Sep 26', pv: 78, ev: 68, proyeccion: 68 },
  { mes: 'Oct 26', pv: 86, ev: 74, proyeccion: 74 },
  { mes: 'Nov 26 (Corte)', pv: 92, ev: 79, proyeccion: 79 },
  { mes: 'Dic 26', pv: 97, ev: 0, proyeccion: 85 },
  { mes: 'Ene 27', pv: 100, ev: 0, proyeccion: 91 },
  { mes: 'Feb 27', pv: 100, ev: 0, proyeccion: 97 },
  { mes: 'Mar 27', pv: 100, ev: 0, proyeccion: 100 }
];

// Top 5 Mayores Atrasos
export const majorDelays: MajorDelay[] = [
  {
    id: 'del-1',
    tarea: 'SOTANO Relleno muro de contención EJE 13 A 9',
    finPrevisto: '2026-02-24',
    finProyectado: '2026-11-02',
    diasAtraso: 180,
    responsable: 'Tatiana Alejandra Correa',
    causaRaiz: 'Equipos',
    impactoRutaCritica: true
  },
  {
    id: 'del-2',
    tarea: 'Provisional de energía y acometida principal',
    finPrevisto: '2026-01-02',
    finProyectado: '2026-11-02',
    diasAtraso: 219,
    responsable: 'Tatiana Alejandra Correa',
    causaRaiz: 'Licencias / Permisos',
    impactoRutaCritica: false
  },
  {
    id: 'del-3',
    tarea: 'SOTANO CIM Relleno EJE 6 A EJE 1',
    finPrevisto: '2026-04-10',
    finProyectado: '2026-08-04',
    diasAtraso: 116,
    responsable: 'Carlos Julio Beltrán',
    causaRaiz: 'Formaleta',
    impactoRutaCritica: true
  },
  {
    id: 'del-4',
    tarea: 'Instalación de Barandas y Ensayos de Empuje',
    finPrevisto: '2026-08-15',
    finProyectado: '2026-11-30',
    diasAtraso: 107,
    responsable: 'Tatiana Alejandra Correa',
    causaRaiz: 'Contratistas / Personal',
    impactoRutaCritica: true
  },
  {
    id: 'del-5',
    tarea: 'Pruebas de Estanqueidad Tanque 1 y Piscinas',
    finPrevisto: '2026-09-01',
    finProyectado: '2026-12-05',
    diasAtraso: 95,
    responsable: 'Carlos Julio Beltrán',
    causaRaiz: 'Materiales / Compras',
    impactoRutaCritica: true
  }
];

// Bitácora Semanal (5 Causas Raíz internas de Marval)
export const initialWeeklyLogs: WeeklyLog[] = [
  {
    id: 'log-01',
    fecha: '2026-11-02',
    semana: 44,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Enchapes y Zonas Húmedas',
    actividad: 'Enchape Baño Ppal Pisos 7 al 9',
    cumplio: false,
    causaRaiz: 'Contratistas / Personal',
    diasImpacto: 4,
    residente: 'Juan Pablo Morales',
    observaciones: 'Cuadrilla de enchapadores llegó con 3 personas en lugar de las 6 requeridas.'
  },
  {
    id: 'log-02',
    fecha: '2026-11-02',
    semana: 44,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Ventanería, Puertas y Barandas',
    actividad: 'Instalación barandas balcones P6',
    cumplio: false,
    causaRaiz: 'Contratos',
    diasImpacto: 6,
    residente: 'Juan Pablo Morales',
    observaciones: 'Contrato de Montajes OMI pendiente de legalización de adenda por precio unitario.'
  },
  {
    id: 'log-03',
    fecha: '2026-10-26',
    semana: 43,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Estructura Principal',
    actividad: 'Fundida rampa vehicular acceso',
    cumplio: false,
    causaRaiz: 'Formaleta',
    diasImpacto: 3,
    residente: 'Juan Pablo Morales',
    observaciones: 'Despacho de formaleta metálica con demora de 48 horas en patio central.'
  },
  {
    id: 'log-04',
    fecha: '2026-10-26',
    semana: 43,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Mampostería y Divisiones Internas',
    actividad: 'Mampostería Piso 10',
    cumplio: true,
    diasImpacto: 0,
    residente: 'Juan Pablo Morales',
    observaciones: 'Actividad ejecutada en plazo y con sellos aprobados.'
  },
  {
    id: 'log-05',
    fecha: '2026-10-19',
    semana: 42,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Cimentación y Muros Contención',
    actividad: 'Filtro muro de contención EJE 13',
    cumplio: false,
    causaRaiz: 'Equipos',
    diasImpacto: 5,
    residente: 'Juan Pablo Morales',
    observaciones: 'Minicargador en mantenimiento no programado por rotura de manguera hidráulica.'
  },
  {
    id: 'log-06',
    fecha: '2026-10-12',
    semana: 41,
    proyecto: 'Belaterra Pietra',
    torre: 'Torre 1',
    hitoNombre: 'Morteros, Frisos y Pañetes',
    actividad: 'Pañete culata occidental P8',
    cumplio: false,
    causaRaiz: 'Materiales / Compras',
    diasImpacto: 3,
    residente: 'Juan Pablo Morales',
    observaciones: 'Falta de arena lavada en acopio por bloqueo en vía de suministro.'
  }
];

// Matriz Lookahead de 7 Compuertas
export const lookaheadGates: LookaheadGate[] = [
  {
    id: 'lh-1',
    actividad: 'Enchape de Baños Pisos 10-12',
    frente: 'Acabados Interiores',
    semana: 'W+1',
    responsable: 'Tatiana Alejandra Correa',
    gates: {
      diseno: true,
      contratacion: true,
      predecesora: true,
      materiales: false, // Bloqueo: faltan cajas baldosa tipo A
      manoObra: true,
      equipos: true,
      sstAmbiental: true
    },
    indicePreparacion: 86
  },
  {
    id: 'lh-2',
    actividad: 'Montaje de Ventanería y Fachada P7-P9',
    frente: 'Cerrajería y Fachada',
    semana: 'W+1',
    responsable: 'Carlos Julio Beltrán',
    gates: {
      diseno: true,
      contratacion: false, // Bloqueo: firma adenda
      predecesora: true,
      materiales: true,
      manoObra: false, // Bloqueo: cuadrilla incompleta
      equipos: true,
      sstAmbiental: true
    },
    indicePreparacion: 71
  },
  {
    id: 'lh-3',
    actividad: 'Pruebas de Estanqueidad Tanque Potable 1',
    frente: 'Instalaciones Especiales',
    semana: 'W+2',
    responsable: 'Carlos Julio Beltrán',
    gates: {
      diseno: true,
      contratacion: true,
      predecesora: false, // Impermeabilización pendiente
      materiales: true,
      manoObra: true,
      equipos: false, // Bomba de llenado no disponible
      sstAmbiental: true
    },
    indicePreparacion: 71
  },
  {
    id: 'lh-4',
    actividad: 'Instalación de Alfajías y Marcos de Puertas P5-P8',
    frente: 'Carpintería',
    semana: 'W+3',
    responsable: 'Tatiana Alejandra Correa',
    gates: {
      diseno: true,
      contratacion: true,
      predecesora: true,
      materiales: true,
      manoObra: true,
      equipos: true,
      sstAmbiental: true
    },
    indicePreparacion: 100
  },
  {
    id: 'lh-5',
    actividad: 'Pintura Segunda Mano en Áreas Comunes',
    frente: 'Acabados Finales',
    semana: 'W+4',
    responsable: 'Carlos Julio Beltrán',
    gates: {
      diseno: true,
      contratacion: true,
      predecesora: false,
      materiales: true,
      manoObra: true,
      equipos: true,
      sstAmbiental: true
    },
    indicePreparacion: 86
  }
];

// Productividad Tesla (Cuadrantes Luis Felipe + 4 Actividades Pareto)
export const productivityData: ProductivityPoint[] = [
  {
    id: 'prod-1',
    actividad: 'Estructura (Placas y Muros)',
    torre: 'Torre 1',
    unidadesPlaneadas: 12,
    unidadesEjecutadas: 12,
    personalEsperado: 24,
    personalRealARI: 25,
    indicePersonal: 1.04,
    productividad: 100,
    cuadrante: 'Tesla (Alta Prod / Personal Óptimo)',
    ritmoMensual: 6.8
  },
  {
    id: 'prod-2',
    actividad: 'Mampostería y Divisiones',
    torre: 'Torre 1',
    unidadesPlaneadas: 24,
    unidadesEjecutadas: 22,
    personalEsperado: 18,
    personalRealARI: 16,
    indicePersonal: 0.89,
    productividad: 91.6,
    cuadrante: 'Tesla (Alta Prod / Personal Óptimo)',
    ritmoMensual: 5.9
  },
  {
    id: 'prod-3',
    actividad: 'Pañetes / Frisos y Morteros',
    torre: 'Torre 1',
    unidadesPlaneadas: 24,
    unidadesEjecutadas: 18,
    personalEsperado: 14,
    personalRealARI: 11,
    indicePersonal: 0.78,
    productividad: 75.0,
    cuadrante: 'Alerta',
    ritmoMensual: 4.4
  },
  {
    id: 'prod-4',
    actividad: 'Enchapes y Estuco',
    torre: 'Torre 1',
    unidadesPlaneadas: 30,
    unidadesEjecutadas: 19,
    personalEsperado: 16,
    personalRealARI: 10,
    indicePersonal: 0.62,
    productividad: 63.3,
    cuadrante: 'Crítico',
    ritmoMensual: 3.2
  },
  {
    id: 'prod-5',
    actividad: 'Instalaciones Eléctricas',
    torre: 'Torre 1',
    unidadesPlaneadas: 20,
    unidadesEjecutadas: 18,
    personalEsperado: 8,
    personalRealARI: 8,
    indicePersonal: 1.0,
    productividad: 90.0,
    cuadrante: 'Tesla (Alta Prod / Personal Óptimo)',
    ritmoMensual: 5.4
  },
  {
    id: 'prod-6',
    actividad: 'Ventanería y Barandas',
    torre: 'Torre 1',
    unidadesPlaneadas: 15,
    unidadesEjecutadas: 9,
    personalEsperado: 10,
    personalRealARI: 6,
    indicePersonal: 0.6,
    productividad: 60.0,
    cuadrante: 'Crítico',
    ritmoMensual: 2.8
  }
];

// Elevación Vertical (P1 a P12 + Sótano)
export const floorElevations: FloorElevation[] = [
  {
    piso: 12,
    nombre: 'Piso 12 (PH)',
    actividades: {
      estructura: 'completado',
      mamposteria: 'en_proceso',
      panete: 'pendiente',
      enchape: 'pendiente',
      redes: 'en_proceso'
    },
    sellosCumplidos: 4,
    sellosTotales: 12
  },
  {
    piso: 11,
    nombre: 'Piso 11',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'en_proceso',
      enchape: 'pendiente',
      redes: 'en_proceso'
    },
    sellosCumplidos: 6,
    sellosTotales: 12
  },
  {
    piso: 10,
    nombre: 'Piso 10',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'en_proceso',
      redes: 'completado'
    },
    sellosCumplidos: 8,
    sellosTotales: 12
  },
  {
    piso: 9,
    nombre: 'Piso 9',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'en_proceso',
      redes: 'completado'
    },
    sellosCumplidos: 9,
    sellosTotales: 12
  },
  {
    piso: 8,
    nombre: 'Piso 8',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'observado',
      redes: 'completado'
    },
    sellosCumplidos: 8,
    sellosTotales: 12
  },
  {
    piso: 7,
    nombre: 'Piso 7',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 11,
    sellosTotales: 12
  },
  {
    piso: 6,
    nombre: 'Piso 6',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 5,
    nombre: 'Piso 5',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 4,
    nombre: 'Piso 4',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 3,
    nombre: 'Piso 3',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 2,
    nombre: 'Piso 2',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 1,
    nombre: 'Piso 1 (Lobby)',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'completado',
      enchape: 'completado',
      redes: 'completado'
    },
    sellosCumplidos: 12,
    sellosTotales: 12
  },
  {
    piso: 0,
    nombre: 'Sótano y Tanques',
    actividades: {
      estructura: 'completado',
      mamposteria: 'completado',
      panete: 'observado',
      enchape: 'pendiente',
      redes: 'en_proceso'
    },
    sellosCumplidos: 7,
    sellosTotales: 12
  }
];

// CALIDAD: Sellos de Calidad MA-SIG-CAL-001 (13 Actividades con criterios 0, 1, 2, NA)
export const initialQualityActivities: SelloActivity[] = [
  {
    id: 'sello-vanos-est',
    codigo: 'SEL-01',
    nombre: 'Vanos Estructura',
    fase: 'Obra Gris',
    descripcion: 'Inspección geométrica de vanos en concreto tras emisión del acta de vanos.',
    tolerancia: '± 5 mm respecto a planos',
    criterioAceptacion: 'Diferencia dimensional en ancho y alto no superior a ±5 mm.',
    herramientas: ['Flexómetro', 'Nivel de burbuja', 'Plomada'],
    inspecciones: [
      { id: 'insp-1', apartamento: 'Apto 801', piso: 8, resultado: '0', medicionMm: 2, toleranciaTexto: '±5 mm', fecha: '2026-11-04', inspector: 'Jefferson Ávila' },
      { id: 'insp-2', apartamento: 'Apto 802', piso: 8, resultado: '0', medicionMm: 3, toleranciaTexto: '±5 mm', fecha: '2026-11-04', inspector: 'Jefferson Ávila' },
      { id: 'insp-3', apartamento: 'Apto 901', piso: 9, resultado: '1', medicionMm: 8, toleranciaTexto: '±5 mm', hallazgo: 'Vano puerta balcón con +8 mm sobre plano', contratistaResponsable: 'Estructuras Andinas', fecha: '2026-11-05', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-vanos-mamp',
    codigo: 'SEL-02',
    nombre: 'Vanos Mampostería',
    fase: 'Obra Gris',
    descripcion: 'Medición de vanos en muros de mampostería e interfaces mixtas (pantalla-muro).',
    tolerancia: '± 5 mm respecto a planos',
    criterioAceptacion: 'Prioridad dimensional sobre vanos respecto a medidas del muro.',
    herramientas: ['Flexómetro', 'Escuadra'],
    inspecciones: [
      { id: 'insp-4', apartamento: 'Apto 801', piso: 8, resultado: '0', medicionMm: 1, toleranciaTexto: '±5 mm', fecha: '2026-11-04', inspector: 'Jefferson Ávila' },
      { id: 'insp-5', apartamento: 'Apto 802', piso: 8, resultado: '2', medicionMm: 7, toleranciaTexto: '±5 mm', hallazgo: 'Descuadre ocasionado por desplome en pantalla de concreto colindante', contratistaResponsable: 'Estructuras (Externo)', fecha: '2026-11-04', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-hidro',
    codigo: 'SEL-03',
    nombre: 'Red Hidrosanitaria',
    fase: 'Obra Gris',
    descripcion: 'Puntos hidrosanitarios, tubería descolgada en piso inferior y formato FT-ING-OBR-002.',
    tolerancia: '100% de puntos según diseño y pruebas de presión vigentes',
    criterioAceptacion: 'Presión hidrostática conforme sin caídas y tubería descolgada conectada sin tapones de cemento.',
    herramientas: ['Manómetro', 'Formato FT-ING-OBR-002', 'Bomba de prueba'],
    inspecciones: [
      { id: 'insp-6', apartamento: 'Apto 801', piso: 8, resultado: '0', toleranciaTexto: 'Sin fugas', fecha: '2026-11-03', inspector: 'Jefferson Ávila' },
      { id: 'insp-7', apartamento: 'Apto 802', piso: 8, resultado: '1', toleranciaTexto: 'Sin fugas', hallazgo: 'Falta formato firmado de prueba de presión FT-ING-OBR-002', contratistaResponsable: 'Hidrosanitarias del Valle', fecha: '2026-11-03', inspector: 'Jefferson Ávila' },
      { id: 'insp-8', apartamento: 'Apto 701', piso: 7, resultado: '0', toleranciaTexto: 'Conectado', fecha: '2026-11-02', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-elec',
    codigo: 'SEL-04',
    nombre: 'Redes Eléctricas',
    fase: 'Obra Gris',
    descripcion: 'Ubicación de salidas según planos, alineación de cajas y verificación de sondeo.',
    tolerancia: 'Alineación visual y guías sobresalientes en 100% de bocas',
    criterioAceptacion: 'Cajas a misma cota alineadas; sondeo certificado con guía pasante.',
    herramientas: ['Nivel láser', 'Flexómetro', 'Guía plástica'],
    inspecciones: [
      { id: 'insp-9', apartamento: 'Apto 801', piso: 8, resultado: '0', toleranciaTexto: 'Guía visible', fecha: '2026-11-04', inspector: 'Jefferson Ávila' },
      { id: 'insp-10', apartamento: 'Apto 802', piso: 8, resultado: '0', toleranciaTexto: 'Alineadas', fecha: '2026-11-04', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-mamp',
    codigo: 'SEL-05',
    nombre: 'Mampostería',
    fase: 'Obra Gris',
    descripcion: 'Plomada, escuadras internas, dimensiones de muros y fundida de dovelas.',
    tolerancia: 'Plomada ≤ 5 mm | Escuadras ≤ 6 mm | Espesor ± 5 mm',
    criterioAceptacion: 'Diferencia superior/inferior con plomada ≤ 5 mm; holgura en escuadra ≤ 6 mm.',
    herramientas: ['Plomada de 16 oz', 'Escuadra metálica de 60 cm', 'Flexómetro'],
    inspecciones: [
      { id: 'insp-11', apartamento: 'Apto 801', piso: 8, resultado: '0', medicionMm: 3, toleranciaTexto: '≤5 mm', fecha: '2026-11-03', inspector: 'Jefferson Ávila' },
      { id: 'insp-12', apartamento: 'Apto 802', piso: 8, resultado: '1', medicionMm: 7, toleranciaTexto: '≤5 mm', hallazgo: 'Desplome de 7 mm en muro divisorio alcoba 2', contratistaResponsable: 'Mampostería San Juan', fecha: '2026-11-03', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-panete',
    codigo: 'SEL-06',
    nombre: 'Morteros / Frisos y Pañete',
    fase: 'Obra Gris',
    descripcion: 'Superficie afinada, sin fisuras, abombamientos ni regatas posteriores.',
    tolerancia: 'Sin fisuras ni resaltes > 2 mm',
    criterioAceptacion: 'Superficie homogénea; penalización a otros gremios si ejecutaron regatas extemporáneas.',
    herramientas: ['Regla de aluminio 2 m', 'Nivel de mano'],
    inspecciones: [
      { id: 'insp-13', apartamento: 'Apto 701', piso: 7, resultado: '0', toleranciaTexto: 'Plano', fecha: '2026-11-01', inspector: 'Jefferson Ávila' },
      { id: 'insp-14', apartamento: 'Apto 702', piso: 7, resultado: '2', toleranciaTexto: 'Sin regatas', hallazgo: 'Regata abierta posterior por plomero en muro pañetado', contratistaResponsable: 'Plomería (Externo)', fecha: '2026-11-01', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-pisos',
    codigo: 'SEL-07',
    nombre: 'Afinado y Pisos',
    fase: 'Obra Gris',
    descripcion: 'Nivelación general respecto a eje testigo, pendientes a desagüe y dilataciones perimetrales.',
    tolerancia: 'Desviación máxima ≤ 10 mm entre ambientes',
    criterioAceptacion: 'Diferencia contra entrada ≤ 10 mm; pendiente garantizada en zonas húmedas.',
    herramientas: ['Nivel láser', 'Flexómetro', 'Nivel de burbuja'],
    inspecciones: [
      { id: 'insp-15', apartamento: 'Apto 601', piso: 6, resultado: '0', medicionMm: 4, toleranciaTexto: '≤10 mm', fecha: '2026-10-28', inspector: 'Jefferson Ávila' },
      { id: 'insp-16', apartamento: 'Apto 602', piso: 6, resultado: '1', medicionMm: 13, toleranciaTexto: '≤10 mm', hallazgo: 'Contrapendiente en balcón hacia puerta corrediza', contratistaResponsable: 'Pisos & Acabados Ltda', fecha: '2026-10-28', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-imper',
    codigo: 'SEL-08',
    nombre: 'Impermeabilización',
    fase: 'Obra Gris',
    descripcion: 'Continuidad de membrana en duchas, balcones y remonte vertical perimetral.',
    tolerancia: 'Subida vertical mínima de 10 cm continua',
    criterioAceptacion: 'Cubrimiento uniforme continuo, color lechoso homogéneo y remonte ≥ 10 cm.',
    herramientas: ['Flexómetro', 'Inspección visual'],
    inspecciones: [
      { id: 'insp-17', apartamento: 'Apto 601', piso: 6, resultado: '0', medicionMm: 120, toleranciaTexto: '≥100 mm', fecha: '2026-10-27', inspector: 'Jefferson Ávila' },
      { id: 'insp-18', apartamento: 'Apto 602', piso: 6, resultado: '0', medicionMm: 110, toleranciaTexto: '≥100 mm', fecha: '2026-10-27', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-enchape',
    codigo: 'SEL-09',
    nombre: 'Enchape',
    fase: 'Obra Blanca',
    descripcion: 'Emboquillado, percusión acústica (sonido hueco / coca) y escuadra a 0 mm.',
    tolerancia: 'Escuadra 0 mm | Sin sonido a hueco | Boquilla continua',
    criterioAceptacion: 'Cero desviación en escuadra de esquinas; adherencia 100% en prueba de percusión metálica.',
    herramientas: ['Elemento percutor metálico', 'Escuadra de precisión', 'Nivel'],
    inspecciones: [
      { id: 'insp-19', apartamento: 'Apto 501', piso: 5, resultado: '0', toleranciaTexto: 'Conforme', fecha: '2026-10-20', inspector: 'Jefferson Ávila' },
      { id: 'insp-20', apartamento: 'Apto 502', piso: 5, resultado: '1', toleranciaTexto: 'Sin hueco', hallazgo: 'Tres baldosas con sonido a hueco (coca) en zona de ducha', contratistaResponsable: 'Enchapados del Norte', fecha: '2026-10-20', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-ventaneria',
    codigo: 'SEL-10',
    nombre: 'Ventanería',
    fase: 'Obra Blanca',
    descripcion: 'Sellos de silicona exterior continuos, vidrios sin rayas y alfajía con pendiente exterior.',
    tolerancia: 'Pendiente positiva hacia el exterior | Cierre sin holguras',
    criterioAceptacion: 'Evacuación de agua sin estancamiento; alfajía libre de golpes o contrapendientes.',
    herramientas: ['Nivel de mano', 'Calibre de espesores'],
    inspecciones: [
      { id: 'insp-21', apartamento: 'Apto 501', piso: 5, resultado: '0', toleranciaTexto: 'Pendiente exterior', fecha: '2026-10-22', inspector: 'Jefferson Ávila' },
      { id: 'insp-22', apartamento: 'Apto 502', piso: 5, resultado: '1', toleranciaTexto: 'Sello exterior', hallazgo: 'Cordón de silicona perimetral interrumpido en vértice superior', contratistaResponsable: 'Ventanería Etalum', fecha: '2026-10-22', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-drywall',
    codigo: 'SEL-11',
    nombre: 'Drywall / Muro Liviano',
    fase: 'Obra Blanca',
    descripcion: 'Planitud, empalmes continuos con cinta masillada y verificación de no afectación.',
    tolerancia: 'Sin ondulaciones visibles a contraluz',
    criterioAceptacion: 'Acabado totalmente liso; sin fisuras en juntas ni humedad imputable a redes.',
    herramientas: ['Regla 2 m', 'Linterna contraluz'],
    inspecciones: [
      { id: 'insp-23', apartamento: 'Apto 501', piso: 5, resultado: '0', toleranciaTexto: 'Liso', fecha: '2026-10-21', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-puertas',
    codigo: 'SEL-12',
    nombre: 'Puertas',
    fase: 'Obra Blanca',
    descripcion: 'Nivelación, holgura sobre piso terminado y funcionamiento suave de cerradura.',
    tolerancia: 'Luz inferior entre 10 mm y 14 mm',
    criterioAceptacion: 'Separación hoja-piso strictly 10 a 14 mm; marco a plomo sin roces.',
    herramientas: ['Cuñas calibradas', 'Flexómetro', 'Nivel'],
    inspecciones: [
      { id: 'insp-24', apartamento: 'Apto 401', piso: 4, resultado: '0', medicionMm: 12, toleranciaTexto: '10-14 mm', fecha: '2026-10-15', inspector: 'Jefferson Ávila' },
      { id: 'insp-25', apartamento: 'Apto 402', piso: 4, resultado: '1', medicionMm: 6, toleranciaTexto: '10-14 mm', hallazgo: 'Luz inferior de 6 mm roza con piso porcelánico', contratistaResponsable: 'Maderas Industriales', fecha: '2026-10-15', inspector: 'Jefferson Ávila' }
    ]
  },
  {
    id: 'sello-pintura',
    codigo: 'SEL-13',
    nombre: 'Pintura Segunda Mano',
    fase: 'Obra Blanca',
    descripcion: 'Película continua, libre de piel de naranja, escurridos y juntas de dilatación limpias.',
    tolerancia: 'Color homogéneo y dilataciones desobstruidas',
    criterioAceptacion: 'Sin diferencias de tono; juntas de dilatación nunca obstruidas con masilla.',
    herramientas: ['Inspección visual', 'Lámpara de inspección'],
    inspecciones: [
      { id: 'insp-26', apartamento: 'Apto 301', piso: 3, resultado: '0', toleranciaTexto: 'Homogéneo', fecha: '2026-10-10', inspector: 'Jefferson Ávila' },
      { id: 'insp-27', apartamento: 'Apto 302', piso: 3, resultado: '0', toleranciaTexto: 'Homogéneo', fecha: '2026-10-10', inspector: 'Jefferson Ávila' }
    ]
  }
];

// CTO: Datos de criterios, torres y pendientes de la Sucursal Cali
export const ctoCriteriaCatalog: CtoCriterion[] = (rawCto.criterios as any[]).map((c, idx) => ({
  num: c.num,
  categoria: c.categoria,
  item: c.item,
  criterio: c.criterio,
  responsable: c.responsable,
  hito: c.hito,
  norma: c.norma,
  cumple: idx % 7 === 3 ? 'NO' : idx % 11 === 4 ? 'EN TRÁMITE' : 'SÍ',
  observaciones: idx % 7 === 3 ? 'Requisito pendiente por entregar a Supervisión Técnica' : undefined
}));

export const ctoTowersStatus: CtoTowerStatus[] = (rawCto.torres as any[]).map((t, idx) => ({
  id: t.id,
  proyecto: t.proyecto,
  torre: t.torre,
  gerente: t.gerente,
  director: t.director,
  interventor: t.interventor,
  supervisor: t.supervisor,
  fechaInicio: t.fechaInicio,
  fechaInformeCTO: t.fechaInformeCTO,
  fechaAlistamiento: t.fechaAlistamiento,
  fechaRPH: t.fechaRPH,
  diasEjecucion: t.diasEjecucion || 850,
  diasParaRPH: t.diasParaRPH || -30,
  diasParaAlistamiento: t.diasParaAlistamiento || -10,
  porcentajeCumplimiento: idx === 0 ? 73.2 : idx === 1 ? 73.2 : idx === 2 ? 69.6 : 85.7,
  estadoCTO: idx === 0 ? 'Expedido' : idx % 2 === 0 ? 'En Riesgo' : 'En Trámite'
}));

export const ctoPendingItems: CtoPendingItem[] = rawCto.pendientes as CtoPendingItem[];
