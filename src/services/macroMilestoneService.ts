import { HitoMacro, TipoContratacionSLA, WbsItem } from '../types';

export const HITOS_MACRO_LIST: HitoMacro[] = [
  'URBANISMO',
  'CIMENTACION',
  'ESTRUCTURA',
  'MAMPOSTERIA',
  'FACHADAS',
  'REDES_HIDROSANITARIAS',
  'REDES_ELECTRICAS_GAS',
  'ACABADOS_OBRA_GRIS',
  'ACABADOS_OBRA_BLANCA',
  'CARPINTERIAS',
  'EQUIPOS_ESPECIALES',
  'ZONAS_COMUNES_ESENCIALES',
  'CIERRE_ENTREGAS'
];

export const HITO_MACRO_LABELS: Record<HitoMacro, string> = {
  URBANISMO: 'Urbanismo y Movimiento de Tierras',
  CIMENTACION: 'Cimentación y Sótanos',
  ESTRUCTURA: 'Estructura (Muros y Losas)',
  MAMPOSTERIA: 'Mampostería (Muros Divisorios / Drywall)',
  FACHADAS: 'Fachadas y Ventanería Exterior',
  REDES_HIDROSANITARIAS: 'Redes Hidrosanitarias y RCI',
  REDES_ELECTRICAS_GAS: 'Redes Eléctricas y Gas',
  ACABADOS_OBRA_GRIS: 'Acabados Obra Gris (Frisos y Morteros de Piso)',
  ACABADOS_OBRA_BLANCA: 'Acabados Obra Blanca (Pisos, Enchapes, Pintura)',
  CARPINTERIAS: 'Carpinterías (Madera y Metálica / Barandas)',
  EQUIPOS_ESPECIALES: 'Equipos Especiales (Torre Grúa, Ascensores)',
  ZONAS_COMUNES_ESENCIALES: 'Zonas Comunes Esenciales (Tanques, RCI Comunal, Cubiertas)',
  CIERRE_ENTREGAS: 'Alistamiento, Cierre y Entregas'
};

// ==========================================
// CATÁLOGO OFICIAL DE 54 CÓDIGOS CPC Y 17 PUNTOS DE CONTROL (BASE WORKPLANNER)
// Fuente: BASE DE PUNTOS DE CONTROL - WORKPLANNER.xlsx
// ==========================================
export interface BaseHitoMacroCpcEntry {
  codigoCpc: string;
  hitoMacro: string; // Nombre del Punto de Control
  tipoAgrupacion: string;
  nombreReferencia: string;
  tipoContrato: TipoContratacionSLA;
}

export const WBS_HITOS_MACRO_OPTIONS: string[] = [
  'Preliminares y movimiento de tierra',
  'Urbanismo',
  'Zonas comunes esenciales',
  'Zonas comunes no esenciales',
  'Cimentación',
  'Estructura (Tradicional - industrializada)',
  'Cubierta (Impermeabilización y acabado)',
  'Mamposteria (Muros divisorios/drywall)',
  'Acabados obra gris (Morteros y frisos)',
  'Acabados obra blanca (Pisos/Enchapes/Pintura)',
  'Redes hidrosanitarias-Gas-RCI',
  'Redes eléctricas y comunicaciones',
  'Carpintería de madera (Puertas/Muebles)',
  'Carpintería metálica (Puertas/Barandas)',
  'Fachadas y ventanería',
  'Ascensor',
  'Alistamiento y entrega'
];

export const WBS_PUNTOS_CONTROL_OPTIONS = WBS_HITOS_MACRO_OPTIONS;

export const GENERAL_PUNTOS_CONTROL_SET = new Set<string>([
  'Preliminares y movimiento de tierra',
  'Urbanismo',
  'Zonas comunes esenciales',
  'Zonas comunes no esenciales',
  'Urbanismo y movimiento de tierra',
  'Zonas comune no esenciales',
]);

export const BASE_HITOS_MACRO_CPC_CATALOG: BaseHitoMacroCpcEntry[] = [
  { codigoCpc: '50101510', hitoMacro: 'Preliminares y movimiento de tierra', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'PRELIMINARES', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101515', hitoMacro: 'Preliminares y movimiento de tierra', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'MOVIMIENTO DE TIERRA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101520', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'ESTRUCTURA DE CONTENCION', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101530', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'SOTANOS', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101540', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED DE AGUA POTABLE', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101545', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED DE ALCANTARILLADO SANITARIO', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101550', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED DE ALCANTARILLADO PLUVIAL', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101555', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED DE GAS', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101560', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED CONTRAINCENDIO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101565', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'RED ELECTRICA Y TELEFONICA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101570', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'VIAS DE ACCESO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101571', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'PARQUEADEROS EN SUPERFICIE', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101575', hitoMacro: 'Urbanismo', tipoAgrupacion: 'URBANISMO', nombreReferencia: 'ZONAS VERDES', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '50101580', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'ZONAS DURAS', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '50101585', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CERRAMIENTO PERIMETRAL', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159010', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'PORTERIA Y RECEPCION', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159015', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'INSTALACION PORTONES DE ACCESO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159020', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'TANQUE DE ALMACENAMIENTO', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159030', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CUARTO DE BASURAS', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159035', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CUARTO DE SUBESTACION ELECTRICA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159040', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CUARTO PLANTA EMERGENCIA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159045', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CUARTO TABLEROS ELECTRICOS', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159050', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'PARQUEADERO', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159051', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'LOCAL', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159054', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'SALA FITNESS ROOFTOP', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159060', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'POOL HOUSE', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159061', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'ADMINISTRACION', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159062', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'SALON DE EVENTOS', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159064', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'SALA DE REUNIONES', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159065', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'PISCINA ADULTOS', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010159070', hitoMacro: 'Zonas comunes esenciales', tipoAgrupacion: 'ZONA COMUN ESENCIAL', nombreReferencia: 'CUARTO DE MAQUINAS PISCINA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159080', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'TURCO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159081', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'GIMNASIO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159083', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'COWORKING', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159090', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'CANCHA DE PADEL', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159094', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'ZONA BBQ', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010159096', hitoMacro: 'Zonas comunes no esenciales', tipoAgrupacion: 'ZONA COMUN NO ESENCIAL', nombreReferencia: 'ZONA PARA MASCOTAS (PET SPA)', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010201010', hitoMacro: 'Cimentación', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'LOCALIZACION', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201015', hitoMacro: 'Cimentación', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'CIMENTACION', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201030', hitoMacro: 'Estructura (Tradicional - industrializada)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'ESTRUCTURA', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201035', hitoMacro: 'Cubierta (Impermeabilización y acabado)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'CUBIERTA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010201040', hitoMacro: 'Mamposteria (Muros divisorios/drywall)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'MAMPOSTERIA', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201045', hitoMacro: 'Acabados obra gris (Morteros y frisos)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'FRISO', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201055', hitoMacro: 'Acabados obra blanca (Pisos/Enchapes/Pintura)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'PISOS', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201060', hitoMacro: 'Acabados obra blanca (Pisos/Enchapes/Pintura)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'ENCHAPES', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '5010201065', hitoMacro: 'Redes hidrosanitarias-Gas-RCI', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'INSTALACIONES HIDROSANITARIAS-GAS-RCI', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010201075', hitoMacro: 'Redes eléctricas y comunicaciones', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'INSTALACIONES ELECTRICAS', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '5010201080', hitoMacro: 'Carpintería de madera (Puertas/Muebles)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'CARPINTERIA DE MADERA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '501020108510', hitoMacro: 'Carpintería metálica (Puertas/Barandas)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'CARPINTERIA METALICA', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '501020108515', hitoMacro: 'Fachadas y ventanería', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'CARPINTERIA ALUMINIO', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '501020109040', hitoMacro: 'Ascensor', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'ASCENSOR', tipoContrato: 'MANO_OBRA_22D' },
  { codigoCpc: '501020109710', hitoMacro: 'Acabados obra blanca (Pisos/Enchapes/Pintura)', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'PINTURA APTOS', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '501020109720', hitoMacro: 'Fachadas y ventanería', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'ACABADO EXTERIOR', tipoContrato: 'TODO_COSTO_64D' },
  { codigoCpc: '603510', hitoMacro: 'Alistamiento y entrega', tipoAgrupacion: 'VIVIENDA', nombreReferencia: 'Alistamiento', tipoContrato: 'NO_APLICA' }
];

export const ZONAS_COMUNES_NO_ESENCIALES_CPC_SET = new Set<string>(
  BASE_HITOS_MACRO_CPC_CATALOG.filter((e) => e.tipoAgrupacion === 'ZONA COMUN NO ESENCIAL').map(
    (e) => e.codigoCpc
  )
);

export const CPC_TO_BASE_ENTRY_MAP = new Map<string, BaseHitoMacroCpcEntry>(
  BASE_HITOS_MACRO_CPC_CATALOG.map((entry) => [entry.codigoCpc, entry])
);

const OFFICIAL_TO_LEGACY_MAP: Record<string, HitoMacro> = {
  'Preliminares y movimiento de tierra': 'URBANISMO',
  'Urbanismo': 'URBANISMO',
  'Urbanismo y movimiento de tierra': 'URBANISMO',
  'Zonas comunes esenciales': 'ZONAS_COMUNES_ESENCIALES',
  'Zonas comunes no esenciales': 'ZONAS_COMUNES_ESENCIALES',
  'Zonas comune no esenciales': 'ZONAS_COMUNES_ESENCIALES',
  'Cimentación': 'CIMENTACION',
  'Estructura (Tradicional - industrializada)': 'ESTRUCTURA',
  'Cubierta (Impermeabilización y acabado)': 'ESTRUCTURA',
  'Mamposteria (Muros divisorios/drywall)': 'MAMPOSTERIA',
  'Acabados obra gris (Morteros y frisos)': 'ACABADOS_OBRA_GRIS',
  'Acabados obra blanca (Pisos/Enchapes/Pintura)': 'ACABADOS_OBRA_BLANCA',
  'Redes hidrosanitarias-Gas-RCI': 'REDES_HIDROSANITARIAS',
  'Redes eléctricas y comunicaciones': 'REDES_ELECTRICAS_GAS',
  'Carpintería de madera (Puertas/Muebles)': 'CARPINTERIAS',
  'Carpintería metálica (Puertas/Barandas)': 'CARPINTERIAS',
  'Fachadas y ventanería': 'FACHADAS',
  'Ascensor': 'EQUIPOS_ESPECIALES',
  'Alistamiento y entrega': 'CIERRE_ENTREGAS',
};

export function getHitoMacroByCodigoCpc(codigoCpc?: string | number | null): string | undefined {
  if (codigoCpc === undefined || codigoCpc === null) return undefined;
  const clean = String(codigoCpc).trim();
  return CPC_TO_BASE_ENTRY_MAP.get(clean)?.hitoMacro;
}

export function getTipoContratoByCodigoCpc(codigoCpc?: string | number | null): TipoContratacionSLA {
  if (codigoCpc === undefined || codigoCpc === null) return 'TODO_COSTO_64D';
  const clean = String(codigoCpc).trim();
  return CPC_TO_BASE_ENTRY_MAP.get(clean)?.tipoContrato ?? 'TODO_COSTO_64D';
}

export function isAlistamientoCodigoCpc(codigoCpc?: string | number | null): boolean {
  if (codigoCpc === undefined || codigoCpc === null) return false;
  return String(codigoCpc).trim() === '603510';
}

export function mapOfficialHitoToLegacyEnum(value?: string): HitoMacro | null {
  if (!value) return null;
  if (value in HITO_MACRO_LABELS) return value as HitoMacro;
  return OFFICIAL_TO_LEGACY_MAP[value] || null;
}

export function getHitoMacroDisplayLabel(value?: string): string {
  if (!value) return '';
  if (value in HITO_MACRO_LABELS) return HITO_MACRO_LABELS[value as HitoMacro];
  return value;
}

export interface BaselineMappingValidation {
  isValid: boolean;
  totalHitos: number;
  hitosAsignados: number;
  hitosFaltantes: HitoMacro[];
  totalTareasAsignadas: number;
}

export class MacroMilestoneService {
  /**
   * Clasifica automáticamente una tarea de Workplanner en un Hito Macro
   * basándose en su código EDT, nombre y nivel de esquema.
   */
  static autoClassifyTask(task: { edt: string; nombre: string; nivel?: number; agrupacion?: string }): HitoMacro | null {
    const edt = task.edt || '';
    const nom = (task.nombre || '').toLowerCase();
    const agrup = (task.agrupacion || '').toLowerCase();

    // 1. Zonas Comunes Esenciales (Prioridad si nombra tanques, cubiertas parqueadero o subestaciones comunales)
    if (
      nom.includes('tanque a torre') ||
      nom.includes('tanque de agua') ||
      nom.includes('cubierta parqueadero') ||
      nom.includes('piscina') ||
      nom.includes('subestacion electrica') ||
      agrup.includes('tanque')
    ) {
      return 'ZONAS_COMUNES_ESENCIALES';
    }

    // 2. Cierre y Entregas
    if (
      edt.startsWith('1.9') ||
      nom.includes('alistamiento') ||
      nom.includes('manual del propietario') ||
      nom.includes('planos record') ||
      nom.includes('1era entrega') ||
      nom.includes('primera entrega') ||
      nom.includes('aseo final') ||
      nom.includes('desmanche')
    ) {
      return 'CIERRE_ENTREGAS';
    }

    // 3. Equipos Especiales
    if (
      nom.includes('torre grua') ||
      nom.includes('torre grúa') ||
      nom.includes('ascensor') ||
      nom.includes('planta de emergencia') ||
      nom.includes('planta emergencia')
    ) {
      return 'EQUIPOS_ESPECIALES';
    }

    // 4. Fachadas
    if (
      nom.includes('fachada') ||
      nom.includes('empaste fachada') ||
      nom.includes('graniplast') ||
      nom.includes('koraza') ||
      nom.includes('ventaneria fachada') ||
      nom.includes('puerta ventana fachada')
    ) {
      return 'FACHADAS';
    }

    // 5. Cimentación
    if (
      (edt.includes('.3.1.2') && !nom.includes('torre grua')) ||
      nom.includes('cimentacion') ||
      nom.includes('cimentación') ||
      nom.includes('zapatas') ||
      nom.includes('vigas de amarre') ||
      nom.includes('solado')
    ) {
      return 'CIMENTACION';
    }

    // 6. Estructura
    if (
      (edt.includes('.3.1.4') && !nom.includes('fachada')) ||
      nom.includes('muro placa') ||
      nom.includes('fundida') ||
      nom.includes('pto fijo escalera') ||
      nom.includes('est cubierta') ||
      (nom.includes('resanes') && nom.includes('est'))
    ) {
      return 'ESTRUCTURA';
    }

    // 7. Mampostería (Muros livianos / Drywall / Superboard / Ladrillo sin friso)
    if (
      (edt.includes('.3.1.6') && !nom.includes('friso')) ||
      nom.includes('drywall') ||
      nom.includes('superboard') ||
      nom.includes('mamposteria') ||
      nom.includes('mampostería')
    ) {
      return 'MAMPOSTERIA';
    }

    // 8. Acabados Obra Gris (Frisos/pañetes y Morteros de piso / afinado)
    if (
      nom.includes('friso') ||
      nom.includes('pañete') ||
      nom.includes('panete') ||
      nom.includes('revoque') ||
      nom.includes('mortero') ||
      nom.includes('afinado') ||
      edt.includes('.3.1.7') ||
      edt.includes('.3.1.9.1.1')
    ) {
      return 'ACABADOS_OBRA_GRIS';
    }

    // 9. Acabados Obra Blanca (Pisos porcelanato, Enchapes, Cielo raso, Pintura interior)
    if (
      nom.includes('porcelanato') ||
      nom.includes('enchape') ||
      nom.includes('guardaescoba') ||
      nom.includes('cielo raso') ||
      (nom.includes('pintura') && !nom.includes('fachada')) ||
      nom.includes('estuco') ||
      edt.includes('.3.1.8') ||
      edt.includes('.3.1.10') ||
      edt.includes('.3.1.18.1')
    ) {
      return 'ACABADOS_OBRA_BLANCA';
    }

    // 10. Carpinterías (Madera y Metálica / Barandas)
    if (
      nom.includes('carpinteria') ||
      nom.includes('carpintería') ||
      nom.includes('puerta ppal') ||
      nom.includes('puerta madera') ||
      nom.includes('closet') ||
      nom.includes('vestier') ||
      nom.includes('mueble cocina') ||
      nom.includes('mueble baño') ||
      nom.includes('baranda') ||
      nom.includes('pasamanos')
    ) {
      return 'CARPINTERIAS';
    }

    // 11. Redes Hidrosanitarias
    if (
      nom.includes('hidraulica') ||
      nom.includes('hidráulica') ||
      nom.includes('sanitaria') ||
      nom.includes('contraincendio') ||
      nom.includes('contra incendio') ||
      nom.includes('refrigeracion') ||
      nom.includes('refrigeración')
    ) {
      return 'REDES_HIDROSANITARIAS';
    }

    // 12. Redes Eléctricas y Gas
    if (
      nom.includes('electrica') ||
      nom.includes('eléctrica') ||
      nom.includes('gas') ||
      nom.includes('conduit') ||
      nom.includes('tableros electricos')
    ) {
      return 'REDES_ELECTRICAS_GAS';
    }

    // 13. Urbanismo (si está en la rama de urbanismo o preliminares)
    if (
      edt.startsWith('1.7.1.2') ||
      nom.includes('urbanismo') ||
      nom.includes('preliminares') ||
      nom.includes('descapote') ||
      nom.includes('vias') ||
      nom.includes('movimiento de tierra')
    ) {
      return 'URBANISMO';
    }

    return null;
  }

  /**
   * Genera el mapeo inicial sugerido de tareas de Workplanner por cada Hito Macro
   */
  static generateAutoMapping(tasks: WbsItem[]): Record<HitoMacro, string[]> {
    const mapping: Record<HitoMacro, string[]> = {
      URBANISMO: [],
      CIMENTACION: [],
      ESTRUCTURA: [],
      MAMPOSTERIA: [],
      FACHADAS: [],
      REDES_HIDROSANITARIAS: [],
      REDES_ELECTRICAS_GAS: [],
      ACABADOS_OBRA_GRIS: [],
      ACABADOS_OBRA_BLANCA: [],
      CARPINTERIAS: [],
      EQUIPOS_ESPECIALES: [],
      ZONAS_COMUNES_ESENCIALES: [],
      CIERRE_ENTREGAS: []
    };

    tasks.forEach(task => {
      // Priorizamos tareas operativas (tipo === 'task') o hitos de control
      const hito = this.autoClassifyTask(task);
      if (hito) {
        mapping[hito].push(task.edt);
      }
    });

    return mapping;
  }

  /**
   * Valida estrictamente la regla de negocio:
   * El residente NO PUEDE establecer la línea base si no ha asignado tareas
   * a TODOS y cada uno de los 13 Hitos Macro.
   */
  static validateBaselineMapping(mapping: Record<HitoMacro, string[]>): BaselineMappingValidation {
    const hitosFaltantes: HitoMacro[] = [];
    let totalTareas = 0;

    for (const hito of HITOS_MACRO_LIST) {
      const tareas = mapping[hito] || [];
      if (tareas.length === 0) {
        hitosFaltantes.push(hito);
      } else {
        totalTareas += tareas.length;
      }
    }

    const hitosAsignados = HITOS_MACRO_LIST.length - hitosFaltantes.length;

    return {
      isValid: hitosFaltantes.length === 0,
      totalHitos: HITOS_MACRO_LIST.length,
      hitosAsignados,
      hitosFaltantes,
      totalTareasAsignadas: totalTareas
    };
  }

  /**
   * Asigna el valor predeterminado de "Hito macro" cruzando exclusivamente por la columna "Codigo CPC"
   * del catálogo oficial de 54 hitos macro (sin usar la columna Nombre).
   * Propaga el valor hacia las subtareas tipo "task" que componen esa tarea resumen,
   * dejando sin asignar las tareas intermedias tipo "project".
   */
  static buildDefaultHitoByEdtFromCpc(tasks: WbsItem[]): Record<string, string> {
    const hitoByEdt: Record<string, string> = {};
    const anchors: Array<{ edt: string; hitoMacro: string }> = [];

    tasks.forEach((t) => {
      if (!t.edt) return;
      const cpc = String(t.codigoPlaneacion || '').trim();
      const entry = CPC_TO_BASE_ENTRY_MAP.get(cpc);
      if (entry) {
        hitoByEdt[t.edt] = entry.hitoMacro;
        anchors.push({ edt: t.edt, hitoMacro: entry.hitoMacro });
      }
    });

    // Ordenar anclas por longitud de EDT descendente para que toda tarea "task"
    // herede el Hito macro del ancestro resumen con Codigo CPC más específico.
    const anchorsDesc = [...anchors].sort((a, b) => b.edt.length - a.edt.length);

    tasks.forEach((t) => {
      if (!t.edt) return;
      const tipoNorm = (t.tipo || '').toLowerCase().trim();
      if (tipoNorm !== 'task') return; // No asignar a tareas intermedias tipo "project"
      if (hitoByEdt[t.edt]) return;

      for (const anc of anchorsDesc) {
        if (t.edt === anc.edt || t.edt.startsWith(`${anc.edt}.`)) {
          hitoByEdt[t.edt] = anc.hitoMacro;
          break;
        }
      }
    });

    return hitoByEdt;
  }

  /**
   * Guarda la configuración de mapeo del proyecto en almacenamiento local
   */
  static saveProjectMapping(proyectoId: string, mapping: Record<HitoMacro, string[]>): void {
    const key = `INT_MAPPING_${proyectoId}`;
    localStorage.setItem(key, JSON.stringify(mapping));
  }

  /**
   * Carga la configuración de mapeo del proyecto
   */
  static loadProjectMapping(proyectoId: string): Record<HitoMacro, string[]> | null {
    const key = `INT_MAPPING_${proyectoId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

