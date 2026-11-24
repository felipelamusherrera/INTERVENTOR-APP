import { Rol, ModuloSistema, MatrizPermisos } from '../types/auth';

export const MODULOS_SISTEMA: ModuloSistema[] = [
  // 1. Operación Campo (Residentes de Interventoría)
  {
    id: 'parametros',
    label: 'Parámetros del proyecto',
    seccion: 'Operación Campo',
    descripcion: 'Datos maestros JDE, estructura HC/Torres (TORRE 01–50) y parametrización de pisos e inmuebles.',
    icono: 'Sliders',
    badge: 'Paso 1',
  },
  {
    id: 'wbs',
    label: 'Programación & EDT',
    seccion: 'Control & Programación',
    descripcion: 'Fuente única de carga de Workplanner, Línea Base, cortes semanales, Gantt Ruta Crítica y desviaciones.',
    icono: 'ListTree',
    badge: 'Paso 2',
  },
  {
    id: 'bitacora',
    label: 'Bitácora de Campo',
    seccion: 'Operación Campo',
    descripcion: 'Seguimiento semanal 1A Inicios / 1B Fines programados, Lookahead, Sellos y CTO.',
    icono: 'CheckSquare',
    badge: 'Cockpit 5 en 1',
  },
  {
    id: 'residente-lookahead',
    label: 'Reporte de restricciones LEAN',
    seccion: 'Operación Campo',
    descripcion: 'Matriz operativa de 6 semanas por tarea resumen y seguimiento a las 6 restricciones de arranque.',
    icono: 'AlertTriangle',
    badge: '6 Sem',
  },
  {
    id: 'residente-calidad',
    label: 'Indicadores Sellos',
    seccion: 'Operación Campo',
    descripcion: 'Inspección de sellos de calidad por torre, piso, apartamento y contratista.',
    icono: 'Award',
    badge: 'Calidad',
  },
  {
    id: 'residente-cto',
    label: 'Matriz CTO Proyecto',
    seccion: 'Operación Campo',
    descripcion: 'Estado CTO por agrupación, seguimiento de los 56 criterios e histórico de bitácora.',
    icono: 'ShieldCheck',
    badge: 'Ley 1796',
  },
  {
    id: 'elevacion',
    label: 'Elevación 3D',
    seccion: 'Operación Campo',
    descripcion: 'Matriz vertical de avance piso por piso, series y sellos por apartamento.',
    icono: 'Layers',
    badge: 'Torres',
  },
  {
    id: 'residente-presupuesto',
    label: 'Presupuesto Opus',
    seccion: 'Operación Campo',
    descripcion: 'Control jerárquico Opus (Capítulos/Subcapítulos) y libreta de comentarios de campo.',
    icono: 'Coins',
    badge: 'Costos',
  },
  {
    id: 'residente-productividad',
    label: 'Censo Cuadrillas',
    seccion: 'Operación Campo',
    descripcion: 'Reporte diario de personal en sitio por contratista, frentes y horas perdidas.',
    icono: 'Users',
    badge: 'Diario',
  },

  // 2. Gestión Gerencial (Solo lectura para Directivos / Gerentes)
  {
    id: 'tiempo',
    label: 'Control de Tiempo',
    seccion: 'Gestión Gerencial',
    descripcion: 'Programación maestra consolidada, compuertas y desviaciones de hitos críticos.',
    icono: 'Clock',
  },
  {
    id: 'lookahead',
    label: 'Lookahead & SLAs',
    seccion: 'Gestión Gerencial',
    descripcion: 'Consolidado gerencial de restricciones y acuerdos de servicio por área.',
    icono: 'Calendar',
  },
  {
    id: 'calidad',
    label: 'Calidad Corporativa',
    seccion: 'Gestión Gerencial',
    descripcion: 'Índice de sellos de calidad, análisis Pareto y ranking de contratistas.',
    icono: 'CheckCircle2',
  },
  {
    id: 'cto',
    label: 'Madurez CTO (Ley 1796)',
    seccion: 'Gestión Gerencial',
    descripcion: 'Estatus integral de las categorías de interventoría y compromisos vencidos.',
    icono: 'FileCheck',
  },
  {
    id: 'resumen',
    label: 'Portafolio Global',
    seccion: 'Gestión Gerencial',
    descripcion: 'Semáforo global de proyectos cargados en plataforma, matriz BSC y alertas.',
    icono: 'LayoutDashboard',
    badge: 'KPIs',
  },
  {
    id: 'gantt-gerencial',
    label: 'Gantt Gerencial',
    seccion: 'Gestión Gerencial',
    descripcion: 'Diagrama de Gantt ejecutivo consolidado.',
    icono: 'BarChart3',
  },
  {
    id: 'productividad',
    label: 'Matriz Productividad',
    seccion: 'Gestión Gerencial',
    descripcion: 'Cuadrantes de ritmo vs. personal e índices de mano de obra.',
    icono: 'TrendingUp',
  },
  {
    id: 'reporte',
    label: 'Ficha Aconex PDF',
    seccion: 'Gestión Gerencial',
    descripcion: 'Generador de informe ejecutivo mensual en PDF para comités directivos.',
    icono: 'Printer',
  },

  // 3. Administración y Gobernanza
  {
    id: 'usuarios',
    label: 'Panel Administración',
    seccion: 'Administración',
    descripcion: 'Aprobación de cuentas, solicitudes de asignación de proyectos y permisos por rol.',
    icono: 'UserCheck',
    badge: 'Admin',
  },
];

export const PERMISOS_DEFAULT: MatrizPermisos = {
  ADMINISTRADOR: [
    'parametros',
    'wbs',
    'bitacora',
    'residente-lookahead',
    'residente-calidad',
    'residente-cto',
    'elevacion',
    'residente-presupuesto',
    'residente-productividad',
    'tiempo',
    'lookahead',
    'calidad',
    'cto',
    'resumen',
    'gantt-gerencial',
    'productividad',
    'reporte',
    'usuarios',
  ],
  RESIDENTE_INTERVENTORIA: [
    'parametros',
    'wbs',
    'bitacora',
    'residente-lookahead',
    'residente-calidad',
    'residente-cto',
    'elevacion',
    'residente-presupuesto',
    'residente-productividad',
  ],
  DIRECTOR_GERENTE_INTERVENTORIA: [
    'resumen',
    'tiempo',
    'lookahead',
    'calidad',
    'cto',
    'gantt-gerencial',
    'productividad',
    'reporte',
  ],
  DIRECTOR_OBRA_GERENTE_AREA: [
    'resumen',
    'tiempo',
    'lookahead',
    'calidad',
    'cto',
    'gantt-gerencial',
    'productividad',
    'reporte',
  ],
};

const STORAGE_KEY_PERMISOS = 'interventor_app_matriz_permisos_v2';

export function getMatrizPermisos(): MatrizPermisos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERMISOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...PERMISOS_DEFAULT,
        ...parsed,
      };
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

export function esRolDirectivo(rol: Rol): boolean {
  return rol === 'DIRECTOR_GERENTE_INTERVENTORIA' || rol === 'DIRECTOR_OBRA_GERENTE_AREA';
}

export function puedeOperarCampo(rol: Rol): boolean {
  return rol === 'ADMINISTRADOR' || rol === 'RESIDENTE_INTERVENTORIA';
}

export function puedeVerGerencial(rol: Rol): boolean {
  return (
    rol === 'ADMINISTRADOR' ||
    rol === 'DIRECTOR_GERENTE_INTERVENTORIA' ||
    rol === 'DIRECTOR_OBRA_GERENTE_AREA'
  );
}
