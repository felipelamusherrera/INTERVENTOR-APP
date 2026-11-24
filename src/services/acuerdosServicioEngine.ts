import {
  LookaheadRestriccionItem,
  TipoCompuertaLookahead,
  TipoContratacionSLA,
  AreaResponsableSLA,
  HitoMacro,
  Sucursal
} from '../types';
import {
  getTipoContratoByCodigoCpc,
  isAlistamientoCodigoCpc,
} from './macroMilestoneService';

/**
 * Lead times contractuales estandarizados por Marval S.A.
 * para Todo Costo (64 días) y Mano de Obra (22 días) + 15 días buffer SST
 */
export const SLA_CONTRATOS_CONFIG: Record<TipoContratacionSLA, {
  diasFabricacion: number;
  diasLicitacion: number;
  diasLegalizacion: number;
  diasBufferSST: number;
  diasAnticipacionMinimaInicio: number;
}> = {
  TODO_COSTO_64D: {
    diasFabricacion: 9,
    diasLicitacion: 40,
    diasLegalizacion: 15,
    diasBufferSST: 15,
    diasAnticipacionMinimaInicio: 15
  },
  MANO_OBRA_22D: {
    diasFabricacion: 7, // FCA
    diasLicitacion: 0,
    diasLegalizacion: 15, // Contratista
    diasBufferSST: 15,
    diasAnticipacionMinimaInicio: 15
  },
  NO_APLICA: {
    diasFabricacion: 0,
    diasLicitacion: 0,
    diasLegalizacion: 0,
    diasBufferSST: 0,
    diasAnticipacionMinimaInicio: 15
  }
};

/**
 * Matriz oficial de las 6 Etapas de Compra de Materiales
 * según ACUERDOS DE SERVICIO CALI - MATERIALES, DESGLOSE_ACUERDOS_DE_SERVICIO_MARVAL
 * y Asignación de Insumos / APUs en Presupuesto Opus
 */
export type EtapaCompraMaterial = 'ETAPA_0' | 'ETAPA_1' | 'ETAPA_2' | 'ETAPA_3' | 'ETAPA_4' | 'ETAPA_5';

export interface MaterialTriggerRule {
  etapa: EtapaCompraMaterial;
  item: string;
  actividadAcuerdo: string;
  materialNombre: string;
  capituloOpus: string;
  
  // Hito Desencadenante (Trigger de solicitud en Inventory)
  hitoDesencadenante: HitoMacro;
  criterioSolicitud: string;
  
  // Hito SUCESOR para el cual es RESTRICCIÓN DE INICIO
  hitoRestringidoInicio: HitoMacro;
  hitoDestino: HitoMacro; // Alias para compatibilidad con código existente
  
  // Actividades específicas del Workplanner cuya fecha de inicio queda bloqueada si el material no se suministra
  actividadesWorkplannerRestringidas: string[];
  
  leadTimeDiasSuministro: number;
  observacionesLogistica?: string;
}

export const MATERIAL_TRIGGER_MATRIX: MaterialTriggerRule[] = [
  // =========================================================================
  // ETAPA 0: Desencadenada por URBANISMO (Inicio de Proyecto)
  // Restricción de Inicio para: URBANISMO y CIMENTACION
  // =========================================================================
  {
    etapa: 'ETAPA_0',
    item: '0.1',
    actividadAcuerdo: 'CERRAMIENTO PROVISIONAL',
    materialNombre: 'REJA PERIMETRAL - CERRAMIENTO',
    capituloOpus: '01000000 PRELIMINARES',
    hitoDesencadenante: 'URBANISMO',
    criterioSolicitud: 'INICIO DE PROYECTO',
    hitoRestringidoInicio: 'URBANISMO',
    hitoDestino: 'URBANISMO',
    actividadesWorkplannerRestringidas: ['1.7.1.2.1.6 Cerramiento provisional'],
    leadTimeDiasSuministro: 15,
    observacionesLogistica: 'Organizar accesos, almacenes y cerramientos acordados entre director y residente logístico.'
  },
  {
    etapa: 'ETAPA_0',
    item: '0.2',
    actividadAcuerdo: 'LAYOUT OBRA - ALMACENES',
    materialNombre: 'CONTENEDORES ALMACEN - ESTANTERIA',
    capituloOpus: '01000000 PRELIMINARES',
    hitoDesencadenante: 'URBANISMO',
    criterioSolicitud: 'INICIO DE PROYECTO',
    hitoRestringidoInicio: 'URBANISMO',
    hitoDestino: 'URBANISMO',
    actividadesWorkplannerRestringidas: ['1.7.1.2.1.7 Campamento y almacén'],
    leadTimeDiasSuministro: 15,
    observacionesLogistica: 'Configurar posicionamiento de contenedores y estanterías en patio.'
  },
  {
    etapa: 'ETAPA_0',
    item: '0.3/0.5/0.7',
    actividadAcuerdo: 'CIMENTACION SUPERFICIAL Y PROFUNDA (VIV Y PARQ)',
    materialNombre: 'ACERO CIMENTACION (HIERRO PR-60 CORRU/FIG Y MALLA ELECTROSOLDADA)',
    capituloOpus: '02000000 CIMENTACION',
    hitoDesencadenante: 'URBANISMO',
    criterioSolicitud: 'INICIO DE PROYECTO - Se pide el 100% de la cimentación',
    hitoRestringidoInicio: 'CIMENTACION',
    hitoDestino: 'CIMENTACION',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.2.1.2.1 T1 CIM Fundida cimentacion vigas',
      '1.7.1.3.1.2.1.4.1 T1 Antepiso',
      '1.7.1.2.4.2.1.2.2 SOTANO CIM Fundida cimentacion superficial vigas'
    ],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Programación por torres. Pedir el 100% del acero de vigas y zapatas.'
  },
  {
    etapa: 'ETAPA_0',
    item: '0.6',
    actividadAcuerdo: 'PROVISIONAL DE AGUA - ACUEDUCTO',
    materialNombre: 'TUBERIA PVC PROVISIONAL Y ACCESORIOS',
    capituloOpus: '01000000 PRELIMINARES',
    hitoDesencadenante: 'URBANISMO',
    criterioSolicitud: 'INICIO DE PROYECTO',
    hitoRestringidoInicio: 'URBANISMO',
    hitoDestino: 'URBANISMO',
    actividadesWorkplannerRestringidas: ['1.7.1.2.1.3 Provisional de agua'],
    leadTimeDiasSuministro: 10,
    observacionesLogistica: 'Instalación de acometida provisional requerida para mezclas de concreto y campamentos.'
  },

  // =========================================================================
  // ETAPA 1: Desencadenada por CIMENTACION (Pilotaje / Mov. Tierras)
  // Restricción de Inicio para: ESTRUCTURA, REDES_HIDROSANITARIAS y URBANISMO
  // =========================================================================
  {
    etapa: 'ETAPA_1',
    item: '1.1/1.7',
    actividadAcuerdo: 'ESTRUCTURA TORRE Y PARQUEADEROS',
    materialNombre: 'HIERRO FIGURADO Y MALLA ELECTROSOLDADA ESTRUCTURAL',
    capituloOpus: '06000000 ESTRUCTURA',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Adjudicación contrato pilotaje o movimiento de tierras (Montaje x 5 pisos)',
    hitoRestringidoInicio: 'ESTRUCTURA',
    hitoDestino: 'ESTRUCTURA',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12',
      '1.7.1.2.4.4.4 SOT EST Armado y fundida placa'
    ],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Montaje de pedidos por 5 pisos programados para mantener flujo continuo.'
  },
  {
    etapa: 'ETAPA_1',
    item: '1.2/1.3/1.4',
    actividadAcuerdo: 'DESAGUES SANITARIOS E INSTALACIONES HIDRAULICAS EMBEBIDAS',
    materialNombre: 'TUBERIA PVC SANITARIA, PVC PRESION Y ARAÑAS MURO-PLACA',
    capituloOpus: '11000000 INSTAL HIDRAULICA-SANITAR',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Adjudicación contrato pilotaje / inicio cimentación (Montaje 50% torre)',
    hitoRestringidoInicio: 'ESTRUCTURA',
    hitoDestino: 'ESTRUCTURA',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12',
      '1.7.1.3.1.11.1 T1 RED HIDRAULICA',
      '1.7.1.3.1.11.2 T1 RED SANITARIA'
    ],
    leadTimeDiasSuministro: 25,
    observacionesLogistica: 'Pases y arañas sanitarias deben estar en obra antes del vaciado de cada losa/muro.'
  },
  {
    etapa: 'ETAPA_1',
    item: '1.5',
    actividadAcuerdo: 'RED CONTRAINCENDIO (RCI)',
    materialNombre: 'TUBERIAS HG, VALVULAS RANURADAS Y ACCESORIOS RCI',
    capituloOpus: '11000000 INSTAL HIDRAULICA-SANITAR',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Adjudicación contrato pilotaje / inicio cimentación para montantes',
    hitoRestringidoInicio: 'REDES_HIDROSANITARIAS',
    hitoDestino: 'REDES_HIDROSANITARIAS',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.4 T1 RED CONTRA INCENDIO'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Montantes verticales de red seca/húmeda a instalar en paralelo con la estructura.'
  },
  {
    etapa: 'ETAPA_1',
    item: '1.6',
    actividadAcuerdo: 'ALCANTARILLADO Y ACUEDUCTO EXTERNO',
    materialNombre: 'TUBERIA NOVAFORT Y POLIETILENO PEAD',
    capituloOpus: '11000000 REDES EXTERNAS',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Adjudicación contrato pilotaje / inicio cimentación',
    hitoRestringidoInicio: 'URBANISMO',
    hitoDestino: 'URBANISMO',
    actividadesWorkplannerRestringidas: ['1.7.1.2.6.3 E1 Red Ppal Inst tuberia de alcantarillado'],
    leadTimeDiasSuministro: 20,
    observacionesLogistica: 'Pedir tramos según entregas y logística de obra para no bloquear vías de acceso.'
  },

  // =========================================================================
  // ETAPA 2: Desencadenada por CIMENTACION (Fundida 1er m³ cimentación superficial)
  // Restricción de Inicio para: MAMPOSTERIA, ACABADOS_OBRA_BLANCA y ZONAS_COMUNES_ESENCIALES
  // =========================================================================
  {
    etapa: 'ETAPA_2',
    item: '2.1',
    actividadAcuerdo: 'MAMPOSTERIA Y DIVISIONES INTERIORES',
    materialNombre: 'LADRILLO / BLOQUE DE ARCILLA Y CEMENTO',
    capituloOpus: '04000000 MAMPOSTERIA',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Se deben solicitar cuando se funda el primer m³ de cimentación superficial',
    hitoRestringidoInicio: 'MAMPOSTERIA',
    hitoDestino: 'MAMPOSTERIA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.6.1 T1 MUROS DRYWALL / MAMPOSTERIA'],
    leadTimeDiasSuministro: 45,
    observacionesLogistica: 'Disponer de espacio de almacenamiento bajo techo antes de recibir el suministro.'
  },
  {
    etapa: 'ETAPA_2',
    item: '2.2/2.4',
    actividadAcuerdo: 'PISOS Y ENCHAPES (INCLUYE PORCELANATO IMPORTADO)',
    materialNombre: 'ENCHAPES, PISOS PORCELANATO, CENEFAS Y REJILLAS DE PISO',
    capituloOpus: '09000000 PISOS / 10000000 ENCHAPES',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Se deben solicitar cuando se funda el primer m³ de cimentación superficial',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.9.1 T1 PISOS APTOS',
      '1.7.1.3.1.10.1 T1 ENCHAPES APTOS'
    ],
    leadTimeDiasSuministro: 60,
    observacionesLogistica: 'Lead time extendido de 60 días para garantizar lotes con mismo tono y calibre.'
  },
  {
    etapa: 'ETAPA_2',
    item: '2.3',
    actividadAcuerdo: 'GRIFERIAS EMPOTRADAS EN PARED',
    materialNombre: 'GRIFERIAS DE INCRUSTAR EN DUCHA Y COCINA',
    capituloOpus: '11000000 INSTAL HIDRAULICA-SANITAR',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Requeridas antes de cerrar mampostería y frisos de zonas húmedas',
    hitoRestringidoInicio: 'MAMPOSTERIA',
    hitoDestino: 'MAMPOSTERIA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.1 T1 Red hidraulica empotrada en muro'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Incrustación previa obligatoria antes de pañetes o instalación de drywall hidrófugo.'
  },
  {
    etapa: 'ETAPA_2',
    item: '2.5',
    actividadAcuerdo: 'APARATOS SANITARIOS PROYECTOS VIS',
    materialNombre: 'SANITARIOS, LAVAMANOS, COMBOS VIS, DUCHAS Y GRIFERIAS',
    capituloOpus: '13000000 APARATOS SANITARIOS',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Se deben solicitar cuando se funda el primer m³ de cimentación superficial',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.2 T1 Red sanitaria / instalación aparatos VIS'],
    leadTimeDiasSuministro: 45,
    observacionesLogistica: 'Aprovisionamiento masivo por torre para instalación trasenchape.'
  },
  {
    etapa: 'ETAPA_2',
    item: '2.6',
    actividadAcuerdo: 'ESTRUCTURA DE TANQUE Y ZONAS COMUNES',
    materialNombre: 'HIERRO FIGURADO Y MALLA TANQUE RCI / POTABLE / CLUB HOUSE',
    capituloOpus: '02000000 CIMENTACION Y ESTRUCTURA URBANISMO',
    hitoDesencadenante: 'CIMENTACION',
    criterioSolicitud: 'Se solicitan al fundir cimentación superficial para coordinar tanque RCI',
    hitoRestringidoInicio: 'ZONAS_COMUNES_ESENCIALES',
    hitoDestino: 'ZONAS_COMUNES_ESENCIALES',
    actividadesWorkplannerRestringidas: ['1.7.1.2.5 Tanque de reserva RCI y potable'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Crítico para Ley 1796: Tanque RCI debe estar certificado antes de radicación de CTO.'
  },

  // =========================================================================
  // ETAPA 3: Desencadenada por ESTRUCTURA (Fundida estructura 1er apartamento / piso 3)
  // Restricción de Inicio para: ACABADOS_OBRA_GRIS, ACABADOS_OBRA_BLANCA y CARPINTERIAS
  // =========================================================================
  {
    etapa: 'ETAPA_3',
    item: '3.1',
    actividadAcuerdo: 'FRISOS Y MORTEROS DE PEGA',
    materialNombre: 'CEMENTO GRIS Y ARENA DE PEGA',
    capituloOpus: '05000000 PAÑETES',
    hitoDesencadenante: 'ESTRUCTURA',
    criterioSolicitud: 'Se deben solicitar cuando se funda la estructura del primer apartamento (P1-P3)',
    hitoRestringidoInicio: 'ACABADOS_OBRA_GRIS',
    hitoDestino: 'ACABADOS_OBRA_GRIS',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.7.1 T1 FRISO APTOS'],
    leadTimeDiasSuministro: 20,
    observacionesLogistica: 'Suministro continuo según capacidad de silos o bodegas de cemento.'
  },
  {
    etapa: 'ETAPA_3',
    item: '3.2',
    actividadAcuerdo: 'PEGANTE Y BOQUILLA DE PISOS Y ENCHAPES',
    materialNombre: 'PEGANTE CERAMICO / PORCELANATO Y BOQUILLAS DE COLOR',
    capituloOpus: '09000000 PISOS / 10000000 ENCHAPES',
    hitoDesencadenante: 'ESTRUCTURA',
    criterioSolicitud: 'Se deben solicitar cuando se funda la estructura del primer apartamento (P1-P3)',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.9.1 T1 PISOS APTOS',
      '1.7.1.3.1.10.1 T1 ENCHAPES APTOS'
    ],
    leadTimeDiasSuministro: 25,
    observacionesLogistica: 'Pegante especial de alta adherencia para porcelanatos 60x60.'
  },
  {
    etapa: 'ETAPA_3',
    item: '3.3',
    actividadAcuerdo: 'APARATOS SANITARIOS PROYECTOS NO VIS',
    materialNombre: 'SANITARIOS, LAVAMANOS, COMBOS Y DUCHAS NO VIS',
    capituloOpus: '13000000 APARATOS SANITARIOS',
    hitoDesencadenante: 'ESTRUCTURA',
    criterioSolicitud: 'Se deben solicitar cuando se funda la estructura del primer apartamento (P1-P3)',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.2 T1 Instalación aparatos sanitarios no VIS'],
    leadTimeDiasSuministro: 45,
    observacionesLogistica: 'Especificación de alta gama según cartillas comerciales del proyecto.'
  },
  {
    etapa: 'ETAPA_3',
    item: '3.4/3.5',
    actividadAcuerdo: 'PISOS PUNTOS FIJOS Y PORTERIAS',
    materialNombre: 'ENCHAPES Y PISOS DE ALTO TRAFICO PARA PUNTOS FIJOS Y SALON SOCIAL',
    capituloOpus: '09000000 PISOS',
    hitoDesencadenante: 'ESTRUCTURA',
    criterioSolicitud: 'Se deben solicitar cuando se funda la estructura del primer apartamento (P1-P3)',
    hitoRestringidoInicio: 'ZONAS_COMUNES_ESENCIALES',
    hitoDestino: 'ZONAS_COMUNES_ESENCIALES',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.9.2 T1 PISOS PTO FIJO',
      '1.7.1.3.1.9.3 T1 PISOS ESCALERA'
    ],
    leadTimeDiasSuministro: 35,
    observacionesLogistica: 'Requerido para habilitar rutas de evacuación seguras en Torre 1.'
  },
  {
    etapa: 'ETAPA_3',
    item: '3.6',
    actividadAcuerdo: 'CARPINTERIA DE MADERA VIS',
    materialNombre: 'PUERTAS DE MADERA ENCHAPADAS (PROVISIONALES Y DEFINITIVAS)',
    capituloOpus: '14000000 CARPINTERIA DE MADERA',
    hitoDesencadenante: 'ESTRUCTURA',
    criterioSolicitud: 'Se deben solicitar cuando se funda la estructura del primer apartamento (P1-P3)',
    hitoRestringidoInicio: 'CARPINTERIAS',
    hitoDestino: 'CARPINTERIAS',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.14.2 T1 Inst de puerta ppal de madera',
      '1.7.1.3.1.14.3 T1 Inst de puertas alcobas de madera',
      '1.7.1.3.1.14.4 T1 Inst de puertas baños de madera'
    ],
    leadTimeDiasSuministro: 60,
    observacionesLogistica: 'Fabricación anticipada de marcos y alas con medidas rectificadas en obra.'
  },

  // =========================================================================
  // ETAPA 4: Desencadenada por MAMPOSTERIA (Inicio mampostería 1er apartamento)
  // Restricción de Inicio para: ACABADOS_OBRA_GRIS, ACABADOS_OBRA_BLANCA y ZONAS_COMUNES
  // =========================================================================
  {
    etapa: 'ETAPA_4',
    item: '4.1',
    actividadAcuerdo: 'ACCESORIOS DE BAÑOS',
    materialNombre: 'JABONERAS, TOALLEROS, PAPELERAS, LLAVE JARDIN, LLAVE LAVADORA, ACOPLES',
    capituloOpus: '13000000 APARATOS Y ACCESORIOS',
    hitoDesencadenante: 'MAMPOSTERIA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie la mampostería del primer apartamento',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.2 T1 Inst aparatos y accesorios de baño'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Requeridos para remates finales y entrega de zonas húmedas.'
  },
  {
    etapa: 'ETAPA_4',
    item: '4.2',
    actividadAcuerdo: 'LAVADEROS Y CAJAS DE LAVADORA',
    materialNombre: 'LAVADEROS EN FIBRA / GRANITO Y CAJAS DE LAVADORA',
    capituloOpus: '13000000 APARATOS SANITARIOS',
    hitoDesencadenante: 'MAMPOSTERIA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie la mampostería del primer apartamento',
    hitoRestringidoInicio: 'ACABADOS_OBRA_BLANCA',
    hitoDestino: 'ACABADOS_OBRA_BLANCA',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.14.5 T1 Inst lavaderos y cajas de lavadora'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Instalación coordinada con desagües de ropas.'
  },
  {
    etapa: 'ETAPA_4',
    item: '4.3',
    actividadAcuerdo: 'MORTERO AFINADO DE PISOS',
    materialNombre: 'CEMENTO GRIS Y ARENA PARA MORTERO AFINADO DE PISOS',
    capituloOpus: '05000000 PAÑETES / 09000000 PISOS',
    hitoDesencadenante: 'MAMPOSTERIA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie la mampostería del primer apartamento',
    hitoRestringidoInicio: 'ACABADOS_OBRA_GRIS',
    hitoDestino: 'ACABADOS_OBRA_GRIS',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.9.1 T1 Morteros de piso afinado'],
    leadTimeDiasSuministro: 20,
    observacionesLogistica: 'Afinado nivelado obligatorio para soporte de enchape cerámico / porcelanato.'
  },
  {
    etapa: 'ETAPA_4',
    item: '4.4',
    actividadAcuerdo: 'PRODUCTO IMPORTADO Y ZONAS COMUNES EXTERIORES',
    materialNombre: 'JUEGOS INFANTILES, JACUZZIS Y GRIFERIAS NO EMPOTRADAS',
    capituloOpus: '20000000 VARIOS URBANISMO',
    hitoDesencadenante: 'MAMPOSTERIA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie la mampostería del primer apartamento',
    hitoRestringidoInicio: 'ZONAS_COMUNES_ESENCIALES',
    hitoDestino: 'ZONAS_COMUNES_ESENCIALES',
    actividadesWorkplannerRestringidas: ['1.7.1.2.7 Urbanismo zonas verdes y recreativas'],
    leadTimeDiasSuministro: 60,
    observacionesLogistica: 'Tránsito marítimo e importación con lead time de 60 días calendario.'
  },

  // =========================================================================
  // ETAPA 5: Desencadenada por ACABADOS_OBRA_BLANCA (Inicio pisos y enchapes 1er apartamento)
  // Restricción de Inicio para: CARPINTERIAS, ZONAS_COMUNES_ESENCIALES y CIERRE_ENTREGAS
  // =========================================================================
  {
    etapa: 'ETAPA_5',
    item: '5.1',
    actividadAcuerdo: 'GASODOMESTICOS',
    materialNombre: 'ESTUFA, CAMPANA EXTRACTORA, HORNO, LAVAVAJILLAS Y AIRES ACOND.',
    capituloOpus: '16000000 APARATOS Y EQUIPOS',
    hitoDesencadenante: 'ACABADOS_OBRA_BLANCA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie pisos y enchapes del primer apartamento',
    hitoRestringidoInicio: 'CIERRE_ENTREGAS',
    hitoDestino: 'CIERRE_ENTREGAS',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.16 T1 Gasodomésticos (estufa, horno, campana)'],
    leadTimeDiasSuministro: 45,
    observacionesLogistica: 'Llegada programada para pruebas de gas y certificación previa a entrega a propietarios.'
  },
  {
    etapa: 'ETAPA_5',
    item: '5.2',
    actividadAcuerdo: 'CERRADURAS',
    materialNombre: 'CERRADURA PRINCIPAL DE SEGURIDAD, ALCOBAS Y BAÑOS',
    capituloOpus: '14000000 CARPINTERIA DE MADERA',
    hitoDesencadenante: 'ACABADOS_OBRA_BLANCA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie pisos y enchapes del primer apartamento',
    hitoRestringidoInicio: 'CARPINTERIAS',
    hitoDestino: 'CARPINTERIAS',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.14.2 T1 Cerraduras puertas de madera'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Instalación al recibir puertas definitivas de madera.'
  },
  {
    etapa: 'ETAPA_5',
    item: '5.3/5.5',
    actividadAcuerdo: 'MESONES Y LAVAPLATOS EN ACERO INOXIDABLE',
    materialNombre: 'MESON EN ACERO INOXIDABLE / GRANITO Y LAVAPLATOS',
    capituloOpus: '16000000 APARATOS Y EQUIPOS',
    hitoDesencadenante: 'ACABADOS_OBRA_BLANCA',
    criterioSolicitud: 'Se deben solicitar cuando se inicie pisos y enchapes del primer apartamento',
    hitoRestringidoInicio: 'CARPINTERIAS',
    hitoDestino: 'CARPINTERIAS',
    actividadesWorkplannerRestringidas: [
      '1.7.1.3.1.16.1 T1 Mesones cocina y baño',
      '1.7.1.3.1.14.8 T1 Muebles de cocina'
    ],
    leadTimeDiasSuministro: 35,
    observacionesLogistica: 'Coordinar con modulación de cocinas integrales.'
  },
  {
    etapa: 'ETAPA_5',
    item: '5.4',
    actividadAcuerdo: 'GABINETE CONTRA INCENDIO DOTADO',
    materialNombre: 'GABINETE RCI COMPLETO CON MANGUERA, VALVULA Y EXTINTOR',
    capituloOpus: '11000000 RCI',
    hitoDesencadenante: 'ACABADOS_OBRA_BLANCA',
    criterioSolicitud: 'Hacer llegar dotación para primera entrega de apartamento (Requisito CTO)',
    hitoRestringidoInicio: 'ZONAS_COMUNES_ESENCIALES',
    hitoDestino: 'ZONAS_COMUNES_ESENCIALES',
    actividadesWorkplannerRestringidas: ['1.7.1.3.1.11.4 T1 Red contra incendio y gabinetes'],
    leadTimeDiasSuministro: 30,
    observacionesLogistica: 'Obligatorio para radicación del CTO ante curaduría y bomberos.'
  },
  {
    etapa: 'ETAPA_5',
    item: '5.6',
    actividadAcuerdo: 'PUERTAS CORTAFUEGO',
    materialNombre: 'PUERTAS CORTAFUEGO CON BARRA ANTIPANICO CERTIFICADAS',
    capituloOpus: '15000000 CARPINTERIA METALICA',
    hitoDesencadenante: 'ACABADOS_OBRA_BLANCA',
    criterioSolicitud: 'Unificar medidas y revisión de estandarización',
    hitoRestringidoInicio: 'ZONAS_COMUNES_ESENCIALES',
    hitoDestino: 'ZONAS_COMUNES_ESENCIALES',
    actividadesWorkplannerRestringidas: ['1.7.1.2.4.8.1.1 SOT / T1 Inst puerta cortafuego'],
    leadTimeDiasSuministro: 45,
    observacionesLogistica: 'Certificación de resistencia al fuego requerida para escaleras de evacuación.'
  }
];

/**
 * Matriz oficial de las 4 Etapas de Solicitud de Equipo y Formaleta
 * Fuente: ACUERDOS DE SERVICIO - EQUIPOS.xlsx (columna CRITERIO DE SOLICITUD (CODIGO CPC))
 */
export type EtapaEquipoFormaleta = 'ETAPA_1' | 'ETAPA_2' | 'ETAPA_3' | 'ETAPA_4';

export interface EquipoFormaletaRule {
  etapa: EtapaEquipoFormaleta;
  item: string;
  actividadEquipo: string;
  tipoAlcance: 'VIVIENDA' | 'URBANISMO' | 'VIVIENDA / URBANISMO';
  job: string;
  criteriosCodigoCpc: string[];
  herramientaSolicitud: string;
  criterioIngenieria: string;
}

export const EQUIPOS_TRIGGER_MATRIX: EquipoFormaletaRule[] = [
  // ETAPA 1 — CRITERIO DE SOLICITUD (CODIGO CPC): 50101510 (PRELIMINARES)
  {
    etapa: 'ETAPA_1',
    item: '1',
    actividadEquipo: 'CIMENTACION SUPERFICIAL VIVIENDA - PARQUEADERO',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'FORMALETA MENOR',
    criteriosCodigoCpc: ['50101510'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_1',
    item: '1.1',
    actividadEquipo: 'CIMENTACION SUPERFICIAL EDIFICIOS COMUNALES',
    tipoAlcance: 'URBANISMO',
    job: 'FORMALETA MENOR',
    criteriosCodigoCpc: ['50101510'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_1',
    item: '1.2',
    actividadEquipo: 'TORRE GRUA',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'EQUIPO - MAQUINARIA',
    criteriosCodigoCpc: ['50101510'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_1',
    item: '1.3',
    actividadEquipo: 'BOMBA ESTACIONARIA',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'EQUIPO - MAQUINARIA',
    criteriosCodigoCpc: ['50101510'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },

  // ETAPA 2 — CRITERIO DE SOLICITUD (CODIGO CPC): 50101515-5010201015 (MOVIMIENTO DE TIERRA / CIMENTACION)
  {
    etapa: 'ETAPA_2',
    item: '2',
    actividadEquipo: 'ESTRUCTURA VIVIENDA (MURO, PLACA, PUNTO FIJO Y ESCALERA)',
    tipoAlcance: 'VIVIENDA',
    job: 'FORMALETA MAYOR',
    criteriosCodigoCpc: ['50101515', '5010201015'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_2',
    item: '2.1',
    actividadEquipo: 'ESTRUCTURA PARQUEADERO (COLUMNA, PLACAS, VIGAS ANTEPECHOS Y MUROS DE CONTENCION)',
    tipoAlcance: 'URBANISMO',
    job: 'FORMALETA MAYOR',
    criteriosCodigoCpc: ['50101515', '5010201015'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_2',
    item: '2.2',
    actividadEquipo: 'MINICARGADOR',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'EQUIPO - MAQUINARIA',
    criteriosCodigoCpc: ['50101515', '5010201015'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar vía QNTRL, incluir diseños y todas las consideraciones que deba tener el requerimiento',
  },

  // ETAPA 3 — CRITERIO DE SOLICITUD (CODIGO CPC): 5010201030 (ESTRUCTURA)
  {
    etapa: 'ETAPA_3',
    item: '3',
    actividadEquipo: 'EQUIPOS RESANE (ANDAMIOS COLGANTES)',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'EQUIPO - MAQUINARIA / ALQUILADO PROPIO/ALQ (LISTA DE PRECIOS JDE)',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_3',
    item: '3.1',
    actividadEquipo: 'ESTRUCTURA TANQUE',
    tipoAlcance: 'URBANISMO',
    job: 'FORMALETA MENOR',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_3',
    item: '3.2',
    actividadEquipo: 'EQUIPOS MENORES (MARTILLO, VIBBRO 3TN, BARREDORA, ETC.)',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'PROPIO/ALQ (LISTA DE PRECIOS JDE)',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por JDE (con lista de precio)',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_3',
    item: '3.4',
    actividadEquipo: 'ESTRUCTURA PORTERIA - SALON SOCIAL - CLUB HOUSE - CUARTO DE MAQUINAS - PISCINA',
    tipoAlcance: 'URBANISMO',
    job: 'FORMALETA MENOR',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_3',
    item: '3.5',
    actividadEquipo: 'ELEVADORES DE CARGA',
    tipoAlcance: 'VIVIENDA',
    job: 'EQUIPO - MAQUINARIA',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },

  // ETAPA 4 — CRITERIO DE SOLICITUD (CODIGO CPC): 5010201030 (ESTRUCTURA)
  {
    etapa: 'ETAPA_4',
    item: '4.1',
    actividadEquipo: 'EQUIPOS RESANE (ANDAMIOS COLGANTES)',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'EQUIPO - MAQUINARIA / ALQUILADO PROPIO/ALQ (LISTA DE PRECIOS JDE)',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por Qntrl',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_4',
    item: '4.2',
    actividadEquipo: 'EQUIPOS MENORES (MARTILLO, VIBBRO 3TN, BARREDORA, ETC.)',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'PROPIO/ALQ (LISTA DE PRECIOS JDE)',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por JDE (con lista de precio)',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
  {
    etapa: 'ETAPA_4',
    item: '4.3',
    actividadEquipo: 'EQUIPOS ADICIONALES (PH, MONTACARGA, BOMBAS MULTIETAPAS, PLANTAS ELECTRICAS)',
    tipoAlcance: 'VIVIENDA / URBANISMO',
    job: 'PROPIO/ALQ (LISTA DE PRECIOS JDE)',
    criteriosCodigoCpc: ['5010201030'],
    herramientaSolicitud: 'Se debe montar por JDE (con lista de precio)',
    criterioIngenieria: 'Solicitar con el formato solicitud de equipos, incluir especificaciones, fechas y todas las consideraciones que deba tener el requerimiento',
  },
];

export class AcuerdosServicioEngine {
  /**
   * Suma o resta días calendario a una fecha en formato YYYY-MM-DD
   */
  static addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calcula la diferencia de días entre dos fechas (d1 - d2)
   */
  static diffDays(d1Str: string, d2Str: string): number {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    const diffMs = d1.getTime() - d2.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene la regla de amarre de materiales según el Hito Macro restringido de inicio
   */
  static getMaterialTriggerRule(hitoRestringidoInicio: HitoMacro): MaterialTriggerRule | undefined {
    return MATERIAL_TRIGGER_MATRIX.find(r => r.hitoRestringidoInicio === hitoRestringidoInicio);
  }

  /**
   * Obtiene los materiales que son restricción de inicio para una actividad específica del Workplanner
   */
  static getMaterialesRestringidosParaActividad(idTarea: string, hitoMacro?: HitoMacro): MaterialTriggerRule[] {
    const directMatches = MATERIAL_TRIGGER_MATRIX.filter(r => 
      r.actividadesWorkplannerRestringidas.some(act => act.toLowerCase().includes(idTarea.toLowerCase()))
    );

    if (directMatches.length > 0) return directMatches;

    if (hitoMacro) {
      return MATERIAL_TRIGGER_MATRIX.filter(r => r.hitoRestringidoInicio === hitoMacro);
    }

    return [];
  }

  /**
   * Obtiene todas las reglas de materiales restringidas por un Hito Macro
   */
  static getMaterialesPorHitoRestringido(hitoMacro: HitoMacro): MaterialTriggerRule[] {
    return MATERIAL_TRIGGER_MATRIX.filter(r => r.hitoRestringidoInicio === hitoMacro);
  }

  /**
   * Obtiene todas las reglas de materiales desencadenadas por un Hito Macro
   */
  static getMaterialesPorHitoDesencadenante(hitoMacro: HitoMacro): MaterialTriggerRule[] {
    return MATERIAL_TRIGGER_MATRIX.filter(r => r.hitoDesencadenante === hitoMacro);
  }

  /**
   * Obtiene las reglas de Equipo y Formaleta disparadas por el Código CPC de la Tarea Resumen
   * según ACUERDOS DE SERVICIO - EQUIPOS.xlsx (columna CRITERIO DE SOLICITUD (CODIGO CPC)).
   */
  static getEquiposPorCodigoCpc(
    codigoCpc?: string | number | null,
    agrupacion?: string
  ): EquipoFormaletaRule[] {
    if (codigoCpc === undefined || codigoCpc === null) return [];
    const cleanCpc = String(codigoCpc).trim();
    if (!cleanCpc) return [];

    const agUpper = String(agrupacion || '').toUpperCase();
    const torreMatch = agUpper.match(/TORRE\s*0*(\d{1,2})/);
    const isTorre = Boolean(torreMatch);
    const isTorre01 = torreMatch ? parseInt(torreMatch[1], 10) === 1 : false;

    const matched = EQUIPOS_TRIGGER_MATRIX.filter((rule) => {
      if (!rule.criteriosCodigoCpc.includes(cleanCpc)) return false;

      // Cuando el criterio combina un CPC de Urbanismo (50101515) y uno de Vivienda (5010201015),
      // filtramos por alcance para no mezclar formaleta de torre en movimiento de tierras ni viceversa.
      if (cleanCpc === '50101515') {
        return rule.tipoAlcance === 'URBANISMO' || rule.tipoAlcance === 'VIVIENDA / URBANISMO';
      }
      if (cleanCpc === '5010201015') {
        return rule.tipoAlcance === 'VIVIENDA' || rule.tipoAlcance === 'VIVIENDA / URBANISMO';
      }

      // En Estructura (5010201030), los equipos exclusivos de zonas comunes / urbanismo (Tanque, Portería/Club House)
      // se disparan una sola vez en la primera torre (TORRE 01) o si no existe torre asignada.
      if (cleanCpc === '5010201030' && rule.tipoAlcance === 'URBANISMO') {
        return !isTorre || isTorre01;
      }

      return true;
    });

    // Evitar duplicados idénticos dentro del mismo CPC/agrupación (ej. 3 y 4.1 o 3.2 y 4.2 sobre 5010201030)
    const seen = new Set<string>();
    return matched.filter((r) => {
      const dedupKey = r.actividadEquipo.trim().toUpperCase();
      if (seen.has(dedupKey)) return false;
      seen.add(dedupKey);
      return true;
    });
  }

  /**
   * Calcula las fechas clave de una restricción según el Acuerdo de Servicio
   */
  static calculateGateDates(params: {
    fechaInicioLB: string;
    tipoCompuerta: TipoCompuertaLookahead;
    tipoContratacion?: TipoContratacionSLA;
    hitoMacroDestino?: HitoMacro;
    idTarea?: string;
    fechaInicioHitoDesencadenante?: string;
    equipoRule?: EquipoFormaletaRule;
  }): {
    fechaDisparoRequerida: string;
    fechaLimiteCumplimiento: string;
    areaResponsable: AreaResponsableSLA;
    criterioSLA: string;
    materialRestriccion?: MaterialTriggerRule;
    equipoRestriccion?: EquipoFormaletaRule;
  } {
    // Regla general por defecto: 15 días antes del inicio programado (sobrescrita en Diseños: -180d y SST: -7d)
    let fechaLimiteCumplimiento = this.addDays(params.fechaInicioLB, -15);

    let fechaDisparoRequerida = '';
    let areaResponsable: AreaResponsableSLA = 'OBRA_RESIDENCIA';
    let criterioSLA = '';
    let materialRestriccion: MaterialTriggerRule | undefined;
    let equipoRestriccion: EquipoFormaletaRule | undefined = params.equipoRule;

    switch (params.tipoCompuerta) {
      case 'CONTRATOS': {
        areaResponsable = 'CONTRATACIONES';
        const tipoContrato = params.tipoContratacion || 'TODO_COSTO_64D';
        const sla = SLA_CONTRATOS_CONFIG[tipoContrato];
        const leadTimeTotal = sla.diasFabricacion + sla.diasLicitacion + sla.diasLegalizacion + sla.diasBufferSST;
        fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -leadTimeTotal);
        criterioSLA =
          tipoContrato === 'TODO_COSTO_64D'
            ? 'Todo Costo (64d): 9d fabricación + 40d licitación + 15d legalización + 15d buffer SST'
            : 'Mano de Obra (22d): 7d fabricación FCA + 15d legalización contratista + 15d buffer SST';
        break;
      }

      case 'MATERIALES_INVENTORY': {
        areaResponsable = 'COMPRAS_INVENTORY';
        const matchingRules = params.idTarea
          ? this.getMaterialesRestringidosParaActividad(params.idTarea, params.hitoMacroDestino)
          : (params.hitoMacroDestino ? this.getMaterialesPorHitoRestringido(params.hitoMacroDestino) : []);

        materialRestriccion = matchingRules[0] || (params.hitoMacroDestino ? this.getMaterialTriggerRule(params.hitoMacroDestino) : undefined);

        if (materialRestriccion && params.fechaInicioHitoDesencadenante) {
          fechaDisparoRequerida = params.fechaInicioHitoDesencadenante;
          criterioSLA = `[${materialRestriccion.etapa}] ${materialRestriccion.materialNombre} · Desencadenado por [${materialRestriccion.hitoDesencadenante}]: ${materialRestriccion.criterioSolicitud}`;
        } else if (materialRestriccion) {
          fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -(materialRestriccion.leadTimeDiasSuministro || 30) - 15);
          criterioSLA = `[${materialRestriccion.etapa}] ${materialRestriccion.materialNombre} · Restricción de Inicio para [${materialRestriccion.hitoRestringidoInicio}] (Lead time: ${materialRestriccion.leadTimeDiasSuministro}d)`;
        } else {
          fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -30);
          criterioSLA = 'Prepedido Inventory y Orden de Compra estándar de materiales';
        }
        break;
      }

      case 'EQUIPOS_FORMALETA': {
        areaResponsable = 'OBRA_RESIDENCIA';
        fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -42);
        fechaLimiteCumplimiento = this.addDays(params.fechaInicioLB, -15);
        criterioSLA = equipoRestriccion
          ? `[${equipoRestriccion.etapa.replace('_', ' ')} · Ítem ${equipoRestriccion.item}] ${equipoRestriccion.actividadEquipo} · ${equipoRestriccion.job} (${equipoRestriccion.herramientaSolicitud})`
          : 'Formaleta menor y mayor / Equipos según Qntrl / JDE';
        break;
      }

      case 'DISENOS': {
        areaResponsable = 'DISENO';
        // Acuerdo de servicio: Diseños debe liberarse como mínimo 6 meses (180 días) antes del inicio programado
        fechaLimiteCumplimiento = this.addDays(params.fechaInicioLB, -180);
        fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -210);
        criterioSLA = 'Aprobación de diseños definitivos y memorias técnicas (mínimo 6 meses antes del inicio)';
        break;
      }

      case 'SST_ACCESO_PERSONAL': {
        areaResponsable = 'SST';
        // Acuerdo de servicio: Ingreso personal - SST debe liberarse como mínimo 1 semana (7 días) antes del inicio programado
        fechaLimiteCumplimiento = this.addDays(params.fechaInicioLB, -7);
        fechaDisparoRequerida = this.addDays(params.fechaInicioLB, -15);
        criterioSLA = 'Validación de ARL, parafiscales y carnetización del personal en Marval SST (mínimo 1 semana antes del inicio)';
        break;
      }
    }

    return {
      fechaDisparoRequerida,
      fechaLimiteCumplimiento,
      areaResponsable,
      criterioSLA,
      materialRestriccion,
      equipoRestriccion,
    };
  }

  /**
   * Evalúa el estado actual de una compuerta frente a la fecha de hoy
   */
  static evaluateGateStatus(
    gate: Pick<LookaheadRestriccionItem, 'fechaLimiteCumplimiento' | 'fechaCierreReal'>,
    fechaHoyStr: string = new Date().toISOString().split('T')[0]
  ): {
    estado: 'BLOQUEADA' | 'EN_GESTION' | 'LIBERADA' | 'VENCIDA_CRITICA';
    diasDesviacionSLA: number;
  } {
    if (gate.fechaCierreReal) {
      const diasDesv = this.diffDays(gate.fechaCierreReal, gate.fechaLimiteCumplimiento);
      return {
        estado: 'LIBERADA',
        diasDesviacionSLA: diasDesv > 0 ? diasDesv : 0
      };
    }

    const diasHastaLimite = this.diffDays(gate.fechaLimiteCumplimiento, fechaHoyStr);

    if (diasHastaLimite < -15) {
      return {
        estado: 'VENCIDA_CRITICA',
        diasDesviacionSLA: Math.abs(diasHastaLimite)
      };
    } else if (diasHastaLimite < 0) {
      return {
        estado: 'BLOQUEADA',
        diasDesviacionSLA: Math.abs(diasHastaLimite)
      };
    } else {
      return {
        estado: 'EN_GESTION',
        diasDesviacionSLA: 0
      };
    }
  }

  /**
   * Genera las restricciones de Lookahead para una Tarea Resumen.
   * Excluye el Punto de Control ALISTAMIENTO (CPC 603510, milestone sin acuerdos de servicio).
   */
  static generateDefaultGatesForTask(params: {
    idTarea: string;
    nombreActividad: string;
    hitoMacro: HitoMacro;
    fechaInicioLB: string;
    proyectoId: string;
    sucursal: Sucursal;
    residenteAuditor: string;
    esManoObra?: boolean;
    codigoCpc?: string;
    agrupacion?: string;
    tipoContratacion?: TipoContratacionSLA;
    fechaInicioHitoDesencadenante?: string;
  }): LookaheadRestriccionItem[] {
    if (
      isAlistamientoCodigoCpc(params.codigoCpc) ||
      params.hitoMacro === 'CIERRE_ENTREGAS' ||
      /alistamiento/i.test(params.nombreActividad || '')
    ) {
      return [];
    }

    const items: LookaheadRestriccionItem[] = [];
    const tipoContrato: TipoContratacionSLA =
      params.tipoContratacion ??
      (params.codigoCpc
        ? getTipoContratoByCodigoCpc(params.codigoCpc)
        : params.esManoObra
          ? 'MANO_OBRA_22D'
          : 'TODO_COSTO_64D');

    // 1. Restricción de Contrato (según Tipo de contrato en BASE DE PUNTOS DE CONTROL)
    if (tipoContrato !== 'NO_APLICA') {
      const datesContrato = this.calculateGateDates({
        fechaInicioLB: params.fechaInicioLB,
        tipoCompuerta: 'CONTRATOS',
        tipoContratacion: tipoContrato
      });

      items.push({
        id: `${params.proyectoId}-${params.idTarea}-CONTRATOS`,
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        idTareaWorkplanner: params.idTarea,
        nombreActividad: params.nombreActividad,
        hitoMacro: params.hitoMacro,
        esRutaCritica: true,
        tipoCompuerta: 'CONTRATOS',
        tipoContratacion: tipoContrato,
        fechaDisparoRequerida: datesContrato.fechaDisparoRequerida,
        fechaInicioLB: params.fechaInicioLB,
        fechaLimiteCumplimiento: datesContrato.fechaLimiteCumplimiento,
        estadoCompuerta: 'EN_GESTION',
        diasDesviacionSLA: 0,
        areaResponsableSLA: datesContrato.areaResponsable,
        residenteAuditor: params.residenteAuditor,
        sincronizadoSharePoint: false
      });
    }

    // 2. Restricción de Materiales (6 Etapas Inventory)
    const reglasMateriales = this.getMaterialesRestringidosParaActividad(params.idTarea, params.hitoMacro);
    const reglaMat = reglasMateriales[0] || this.getMaterialTriggerRule(params.hitoMacro);

    const datesMat = this.calculateGateDates({
      fechaInicioLB: params.fechaInicioLB,
      tipoCompuerta: 'MATERIALES_INVENTORY',
      hitoMacroDestino: params.hitoMacro,
      idTarea: params.idTarea,
      fechaInicioHitoDesencadenante: params.fechaInicioHitoDesencadenante
    });

    const infoMat = reglaMat
      ? `[${reglaMat.etapa.replace('_', ' ')}] ${reglaMat.materialNombre}`
      : 'Insumos de obra según explosión de materiales Opus';

    items.push({
      id: `${params.proyectoId}-${params.idTarea}-MATERIALES`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      idTareaWorkplanner: params.idTarea,
      nombreActividad: `${params.nombreActividad} — ${infoMat}`,
      hitoMacro: params.hitoMacro,
      esRutaCritica: true,
      tipoCompuerta: 'MATERIALES_INVENTORY',
      tipoContratacion: 'NO_APLICA',
      fechaDisparoRequerida: datesMat.fechaDisparoRequerida,
      fechaInicioLB: params.fechaInicioLB,
      fechaLimiteCumplimiento: datesMat.fechaLimiteCumplimiento,
      estadoCompuerta: 'EN_GESTION',
      diasDesviacionSLA: 0,
      areaResponsableSLA: datesMat.areaResponsable,
      residenteAuditor: params.residenteAuditor,
      sincronizadoSharePoint: false
    });

    // 3. Restricción de Equipo y formaleta (según CRITERIO DE SOLICITUD (CODIGO CPC) en ACUERDOS DE SERVICIO - EQUIPOS.xlsx)
    const equiposRules = this.getEquiposPorCodigoCpc(params.codigoCpc, params.agrupacion);
    equiposRules.forEach((eqRule) => {
      const datesEq = this.calculateGateDates({
        fechaInicioLB: params.fechaInicioLB,
        tipoCompuerta: 'EQUIPOS_FORMALETA',
        equipoRule: eqRule,
      });

      items.push({
        id: `${params.proyectoId}-${params.idTarea}-EQUIPOS-${eqRule.item}`,
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        idTareaWorkplanner: params.idTarea,
        nombreActividad: `${params.nombreActividad} — [${eqRule.etapa.replace('_', ' ')} · Ítem ${eqRule.item}] ${eqRule.actividadEquipo} (${eqRule.job})`,
        hitoMacro: params.hitoMacro,
        esRutaCritica: true,
        tipoCompuerta: 'EQUIPOS_FORMALETA',
        tipoContratacion: 'NO_APLICA',
        fechaDisparoRequerida: datesEq.fechaDisparoRequerida,
        fechaInicioLB: params.fechaInicioLB,
        fechaLimiteCumplimiento: datesEq.fechaLimiteCumplimiento,
        estadoCompuerta: 'EN_GESTION',
        diasDesviacionSLA: 0,
        areaResponsableSLA: datesEq.areaResponsable,
        residenteAuditor: params.residenteAuditor,
        sincronizadoSharePoint: false,
      });
    });

    // 4. Restricción de Diseños (para todos los puntos de control y tareas resumen: mínimo 6 meses / 180 días antes)
    const datesDiseno = this.calculateGateDates({
      fechaInicioLB: params.fechaInicioLB,
      tipoCompuerta: 'DISENOS',
    });

    items.push({
      id: `${params.proyectoId}-${params.idTarea}-DISENOS`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      idTareaWorkplanner: params.idTarea,
      nombreActividad: params.nombreActividad,
      hitoMacro: params.hitoMacro,
      esRutaCritica: true,
      tipoCompuerta: 'DISENOS',
      tipoContratacion: 'NO_APLICA',
      fechaDisparoRequerida: datesDiseno.fechaDisparoRequerida,
      fechaInicioLB: params.fechaInicioLB,
      fechaLimiteCumplimiento: datesDiseno.fechaLimiteCumplimiento,
      estadoCompuerta: 'EN_GESTION',
      diasDesviacionSLA: 0,
      areaResponsableSLA: datesDiseno.areaResponsable,
      residenteAuditor: params.residenteAuditor,
      sincronizadoSharePoint: false,
    });

    // 5. Restricción de Ingreso personal - SST (para todos los puntos de control y tareas resumen: mínimo 1 semana / 7 días antes)
    const datesSst = this.calculateGateDates({
      fechaInicioLB: params.fechaInicioLB,
      tipoCompuerta: 'SST_ACCESO_PERSONAL',
    });

    items.push({
      id: `${params.proyectoId}-${params.idTarea}-SST`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      idTareaWorkplanner: params.idTarea,
      nombreActividad: params.nombreActividad,
      hitoMacro: params.hitoMacro,
      esRutaCritica: true,
      tipoCompuerta: 'SST_ACCESO_PERSONAL',
      tipoContratacion: 'NO_APLICA',
      fechaDisparoRequerida: datesSst.fechaDisparoRequerida,
      fechaInicioLB: params.fechaInicioLB,
      fechaLimiteCumplimiento: datesSst.fechaLimiteCumplimiento,
      estadoCompuerta: 'EN_GESTION',
      diasDesviacionSLA: 0,
      areaResponsableSLA: datesSst.areaResponsable,
      residenteAuditor: params.residenteAuditor,
      sincronizadoSharePoint: false,
    });

    return items;
  }
}
