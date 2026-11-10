import { Rol, ModuloSistema, MatrizPermisos } from '../types/auth';

export const MODULOS_SISTEMA: ModuloSistema[] = [
  // 1. Operación Campo (Residentes de Interventoría)
  {
    id: 'residente-programacion',
    label: 'Prog. Obra & CPM',
    seccion: 'Operación Campo',
    descripcion: 'Carga de sábana WorkPlanner, red de precedencias y cálculo de ruta crítica en vivo.',
    icono: 'GitBranch',
    badge: 'CPM Vivo',
  },
  {
    id: 'residente-presupuesto',
    label: 'Presupuesto & Costos',
    seccion: 'Operación Campo',
    descripcion: 'Control jerárquico Opus (Capítulos/Subcapítulos) y libreta de comentarios de campo.',
    icono: 'Coins',
    badge: 'Opus ND',
  },
  {
    id: 'residente-calidad',
    label: 'Sellos de Calidad',
    seccion: 'Operación Campo',
    descripcion: 'Inspección rápida de sellos (0, X, R) por torre, piso, apartamento y contratista.',
    icono: 'Award',
    badge: 'Campo',
  },
  {
    id: 'residente-cto',
    label: 'Compromisos CTO',
    seccion: 'Operación Campo',
    descripcion: 'Registro de actas y compromisos técnicos en las 6 categorías de interventoría.',
    icono: 'ShieldCheck',
    badge: 'Actas',
  },
  {
    id: 'residente-productividad',
    label: 'Censo de Cuadrillas',
    seccion: 'Operación Campo',
    descripcion: 'Reporte diario de personal en sitio por contratista, frentes y horas perdidas.',
    icono: 'Users',
    badge: 'Diario',
  },

  // 2. Control & Programación
  {
    id: 'wbs',
    label: 'WBS / EDT',
    seccion: 'Control & Programación',
    descripcion: 'Estructura analítica de descomposición de obra con árbol expandible y curvas.',
    icono: 'Network',
  },
  {
    id: 'tiempo',
    label: 'Hitos & Curva S',
    seccion: 'Control & Programación',
    descripcion: 'Programación maestra, compuertas M-12/M-6/M-3 y desviaciones de hitos críticos.',
    icono: 'Clock',
  },
  {
    id: 'gantt-gerencial',
    label: 'Gantt Gerencial',
    seccion: 'Control & Programación',
    descripcion: 'Diagrama de Gantt ejecutivo (Nivel 6 Torre / Nivel 5 Otras) con árbol colapsable y CPM.',
    icono: 'BarChart3',
    badge: 'EDT 6/5',
  },
  {
    id: 'lookahead',
    label: 'Lookahead 4 Sem.',
    seccion: 'Control & Programación',
    descripcion: 'Ventana de planificación a 4 semanas para desatascar restricciones de contratistas.',
    icono: 'Calendar',
  },
  {
    id: 'elevacion',
    label: 'Elevación & Fachadas',
    seccion: 'Control & Programación',
    descripcion: 'Matriz vertical de avance piso por piso y torre por torre.',
    icono: 'Layers',
  },

  // 3. Gestión Gerencial
  {
    id: 'resumen',
    label: 'Tablero Gerencial',
    seccion: 'Gestión Gerencial',
    descripcion: 'Semáforo global de portafolio, matriz BSC y alertas estratégicas.',
    icono: 'LayoutDashboard',
    badge: 'KPIs',
  },
  {
    id: 'calidad',
    label: 'Tablero Calidad',
    seccion: 'Gestión Gerencial',
    descripcion: 'Índice de sellos de calidad, análisis Pareto y ranking de contratistas.',
    icono: 'CheckCircle2',
  },
  {
    id: 'cto',
    label: 'Auditoría CTO',
    seccion: 'Gestión Gerencial',
    descripcion: 'Estatus integral de las 6 categorías de interventoría y compromisos vencidos.',
    icono: 'FileCheck',
  },
  {
    id: 'productividad',
    label: 'Matriz Productividad',
    seccion: 'Gestión Gerencial',
    descripcion: 'Cuadrantes de ritmo vs. personal (Tesla Quad) e índices de mano de obra.',
    icono: 'TrendingUp',
  },
  {
    id: 'bitacora',
    label: 'Bitácora & Riesgos',
    seccion: 'Gestión Gerencial',
    descripcion: 'Registro cronológico de lecciones aprendidas, reclamos y contingencias.',
    icono: 'FileText',
  },
  {
    id: 'reportes',
    label: 'Informe Mensual',
    seccion: 'Gestión Gerencial',
    descripcion: 'Generador de informe ejecutivo mensual en PDF para comités directivos.',
    icono: 'Printer',
  },

  // 4. Administración y Gobernanza
  {
    id: 'usuarios',
    label: 'Usuarios & Permisos',
    seccion: 'Administración',
    descripcion: 'Gestión de directorio, cola de aprobación de cuentas y permisos por rol (estándar PETINC).',
    icono: 'UserCheck',
    badge: 'Admin',
  },
];

export const PERMISOS_DEFAULT: MatrizPermisos = {
  RESIDENTE_INTERVENTORIA: [
    'residente-programacion',
    'residente-presupuesto',
    'residente-calidad',
    'residente-cto',
    'residente-productividad',
    'wbs',
    'tiempo',
    'gantt-gerencial',
    'lookahead',
    'elevacion',
    'bitacora'
  ],
  DIRECTOR_OBRA: [
    'residente-programacion',
    'wbs',
    'tiempo',
    'gantt-gerencial',
    'lookahead',
    'elevacion',
    'resumen',
    'calidad',
    'cto',
    'productividad',
    'bitacora'
  ],
  DIRECTOR_INTERVENTORIA: [
    'residente-programacion',
    'residente-presupuesto',
    'residente-calidad',
    'residente-cto',
    'residente-productividad',
    'wbs',
    'tiempo',
    'gantt-gerencial',
    'lookahead',
    'elevacion',
    'resumen',
    'calidad',
    'cto',
    'productividad',
    'bitacora',
    'reportes',
    'usuarios'
  ],
  GERENTE_INTERVENTORIA: [
    'residente-programacion',
    'residente-presupuesto',
    'residente-calidad',
    'residente-cto',
    'residente-productividad',
    'wbs',
    'tiempo',
    'gantt-gerencial',
    'lookahead',
    'elevacion',
    'resumen',
    'calidad',
    'cto',
    'productividad',
    'bitacora',
    'reportes',
    'usuarios'
  ],
  DIRECTIVO: [
    'resumen',
    'tiempo',
    'gantt-gerencial',
    'calidad',
    'cto',
    'productividad',
    'bitacora',
    'reportes'
  ],
  ADMINISTRADOR: [
    'residente-programacion',
    'residente-presupuesto',
    'residente-calidad',
    'residente-cto',
    'residente-productividad',
    'wbs',
    'tiempo',
    'gantt-gerencial',
    'lookahead',
    'elevacion',
    'resumen',
    'calidad',
    'cto',
    'productividad',
    'bitacora',
    'reportes',
    'usuarios'
  ],
};

const STORAGE_KEY_PERMISOS = 'interventor_app_matriz_permisos';

export function getMatrizPermisos(): MatrizPermisos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERMISOS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error cargando permisos de localStorage', e);
  }
  return PERMISOS_DEFAULT;
}

export function saveMatrizPermisos(matriz: MatrizPermisos): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERMISOS, JSON.stringify(matriz));
  } catch (e) {
    console.error('Error guardando permisos en localStorage', e);
  }
}

export function puedeAccederModulo(rol: Rol, moduloId: string): boolean {
  const matriz = getMatrizPermisos();
  const permitidos = matriz[rol] || PERMISOS_DEFAULT[rol] || [];
  return permitidos.includes(moduloId);
}
