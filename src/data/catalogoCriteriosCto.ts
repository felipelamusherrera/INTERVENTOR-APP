import { HitoMacro } from '../types';

export interface CatalogoCriterioCtoItem {
  numGeneral: number;
  categoriaCto: string;
  itemCategoria: number;
  criterioEvaluacion: string;
  responsableDocumentacion: string;
  hitoRelacionadoTexto: string;
  hitoMacro: HitoMacro;
  tareasWorkplannerAsociadas: string[];
  marcoLegal: string;
}

/**
 * Catálogo maestro oficial de los 56 criterios CTO extraído de:
 * Consolidado de obs SST y CTO CALI.xlsm (hoja Catalogo_Criterios).
 */
export const CATALOGO_CRITERIOS_CTO: CatalogoCriterioCtoItem[] = [
  {
    "numGeneral": 1,
    "categoriaCto": "1. Planos Récord",
    "itemCategoria": 1,
    "criterioEvaluacion": "Último cuadro de control de versión de planos",
    "responsableDocumentacion": "A cargo de la Supervisión",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Ley 1796/2016 - Título VI NSR-10"
  },
  {
    "numGeneral": 2,
    "categoriaCto": "1. Planos Récord",
    "itemCategoria": 2,
    "criterioEvaluacion": "Planos en PDF organizados según módulo estructural (sólo últimas versiones)",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Ley 1796/2016 - Título VI NSR-10"
  },
  {
    "numGeneral": 3,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 1,
    "criterioEvaluacion": "Documento información general de proyecto aprobado por Obra, Jurídica y Arquitectura",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Inicio de proyecto",
    "hitoMacro": "URBANISMO",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.1.2 Topografia",
      "1.7.1.2.1.6 Cerramiento provisional"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 4,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 2,
    "criterioEvaluacion": "Licencias de construcción con sus adendas y modificaciones",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Inicio de proyecto",
    "hitoMacro": "URBANISMO",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.1.2 Topografia",
      "1.7.1.2.1.6 Cerramiento provisional"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 5,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 3,
    "criterioEvaluacion": "Estudio de suelos del proyecto",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Movimiento de tierra",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.2.3 T1 Excavacion a maquina",
      "1.7.1.2.2.1 E1 PQDERO Conformacion terraza"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 6,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 4,
    "criterioEvaluacion": "Planos firmados Ingeniero Geotecnista",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 7,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 5,
    "criterioEvaluacion": "Comunicaciones Ingeniero Estructural y Geotecnista",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 8,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 6,
    "criterioEvaluacion": "Comunicaciones escrito en bitácora Ingeniero Estructural y Geotecnista",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 9,
    "categoriaCto": "2. Constancia del Geotecnista",
    "itemCategoria": 7,
    "criterioEvaluacion": "Certificando aval de estratificación según requisito de estudio de suelos de geotecnista.",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título H NSR-10 (Geotecnia) / Ley 1796"
  },
  {
    "numGeneral": 10,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 1,
    "criterioEvaluacion": "Documentación concretos proveedores",
    "responsableDocumentacion": "A cargo de la Supervisión",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 11,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 2,
    "criterioEvaluacion": "Certificado de calidad del proveedor de concreto, acero, roscados, tipo cap lock",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 12,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 3,
    "criterioEvaluacion": "Diseños de mezcla de los concretos contratados",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 13,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 4,
    "criterioEvaluacion": "Valor de F'cr de los concretos utilizados",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 14,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 5,
    "criterioEvaluacion": "Curvas de evolución de resistencia",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 15,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 6,
    "criterioEvaluacion": "Certificado de calidad del cemento utilizado",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Morteros y frisos",
    "hitoMacro": "ACABADOS_OBRA_GRIS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.3.1.6.1 T1 Muros mamposteria / drywall",
      "1.7.1.3.1.7.1 T1 Friso aptos"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 16,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 7,
    "criterioEvaluacion": "Fichas técnicas de los concretos",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 17,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 8,
    "criterioEvaluacion": "Reportes de calidad de acero despachado a obra",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 18,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 9,
    "criterioEvaluacion": "Certificación del equipo roscador y operario",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 19,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 10,
    "criterioEvaluacion": "Ficha técnica y hoja de vida donde indique los mantenimientos realizados al equipo roscador",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 20,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 11,
    "criterioEvaluacion": "Ensayos practicados a los conectores",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 21,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 12,
    "criterioEvaluacion": "Resultados de concretos y promedio móvil",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 22,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 13,
    "criterioEvaluacion": "Seguimiento a muestras bajas de concreto (No pueden tener muestras bajas sin cierre)",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 23,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 14,
    "criterioEvaluacion": "Ensayos de aceros barras corrugadas y malla",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación y Estructura",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 24,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 15,
    "criterioEvaluacion": "Resultados otros ensayos (Suelos, mampostería, barandas, etc.)",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 25,
    "categoriaCto": "3. Procedencia de Materiales",
    "itemCategoria": 16,
    "criterioEvaluacion": "Pruebas PIT (Min. 10% de totalidad de pilotes – c/torre)",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación",
    "hitoMacro": "CIMENTACION",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.2.1.2.2 CIM Fundida cimentacion vigas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título C, D y F NSR-10 / NTC aplicables"
  },
  {
    "numGeneral": 26,
    "categoriaCto": "4. Especificaciones Técnicas",
    "itemCategoria": 1,
    "criterioEvaluacion": "Especificaciones técnicas del proyecto",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Inicio de proyecto",
    "hitoMacro": "URBANISMO",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.1.2 Topografia",
      "1.7.1.2.1.6 Cerramiento provisional"
    ],
    "marcoLegal": "Diseño Estructural / Pliego Especificaciones"
  },
  {
    "numGeneral": 27,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 1,
    "criterioEvaluacion": "Acta de Inicio del Proyecto",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Inicio de proyecto",
    "hitoMacro": "URBANISMO",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.1.2 Topografia",
      "1.7.1.2.1.6 Cerramiento provisional"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 28,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 2,
    "criterioEvaluacion": "Programa de calidad firmado por el director de la obra",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 29,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 3,
    "criterioEvaluacion": "Actas mensuales de Supervisión Técnica",
    "responsableDocumentacion": "A cargo de la Supervisión",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 30,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 4,
    "criterioEvaluacion": "Especificaciones técnicas y Normas aplicables a ensayos",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Inicio de proyecto",
    "hitoMacro": "URBANISMO",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.1.2 Topografia",
      "1.7.1.2.1.6 Cerramiento provisional"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 31,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 5,
    "criterioEvaluacion": "Acta de entrega de estructura",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Estructura",
    "hitoMacro": "ESTRUCTURA",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.4.8 EST Muro placa y losas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 32,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 6,
    "criterioEvaluacion": "Informe de estanquidad",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Tanque de agua",
    "hitoMacro": "ZONAS_COMUNES_ESENCIALES",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.5.4 T1 Excavacion tanque a torre 1",
      "1.7.1.2.5.5 T1 Inst tuberia tanque a torre 1"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 33,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 7,
    "criterioEvaluacion": "Atención observaciones",
    "responsableDocumentacion": "A cargo de la Supervisión",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 34,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 8,
    "criterioEvaluacion": "Control Verticalidad",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Estructura",
    "hitoMacro": "ESTRUCTURA",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.4.8 EST Muro placa y losas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 35,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 9,
    "criterioEvaluacion": "Control Asentamientos",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Estructura",
    "hitoMacro": "ESTRUCTURA",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.4.8 EST Muro placa y losas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 36,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 10,
    "criterioEvaluacion": "Registro Medición de sellos obra gris",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Estructura",
    "hitoMacro": "ESTRUCTURA",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.4.8 EST Muro placa y losas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 37,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 11,
    "criterioEvaluacion": "Informes mensuales Supervisión",
    "responsableDocumentacion": "A cargo de la Supervisión",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 38,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 12,
    "criterioEvaluacion": "Memoria revisión estructural",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Estructura",
    "hitoMacro": "ESTRUCTURA",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.4.4.8 EST Muro placa y losas",
      "1.7.1.3.1.4.1.1 T1 EST Muro placa P1-P12"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 39,
    "categoriaCto": "5. Programa de Calidad",
    "itemCategoria": 13,
    "criterioEvaluacion": "Planos de construcción",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título I NSR-10 (Supervisión Técnica Itinerante/Continua)"
  },
  {
    "numGeneral": 40,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 1,
    "criterioEvaluacion": "Certificados de calidad de las piezas de mampostería, ventanería, barandas/pasamanos, estructura metálica, red contraincendios",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 41,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 2,
    "criterioEvaluacion": "Fichas técnicas de las unidades de mampostería, barandas/pasamanos, estructura metálica (pinturas y anticorrosivos), red contraincendios",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Cimentación/Estructura/Elementos no estructurales",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 42,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 3,
    "criterioEvaluacion": "Diseños de mezcla de los morteros utilizados",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Morteros y frisos",
    "hitoMacro": "ACABADOS_OBRA_GRIS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.3.1.6.1 T1 Muros mamposteria / drywall",
      "1.7.1.3.1.7.1 T1 Friso aptos"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 43,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 4,
    "criterioEvaluacion": "Procedimiento y/o planos de instalación de los enchapes en fachada, avalado por diseñador de ENOES",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Enchapes/Muro liviano fachada)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 44,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 5,
    "criterioEvaluacion": "Planos de mampostería interna/fachada y grado de desempeño",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Mampostería/Muro liviano interno y fachada)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 45,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 6,
    "criterioEvaluacion": "Ensayos realizados a la mampostería (bloque, mortero, grouting utilizado)",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Mampostería/Morteros/Frisos",
    "hitoMacro": "ACABADOS_OBRA_GRIS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.3.1.6.1 T1 Muros mamposteria / drywall",
      "1.7.1.3.1.7.1 T1 Friso aptos"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 46,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 7,
    "criterioEvaluacion": "Memorias de cálculo firmadas por diseñador para ventanería, barandas/pasamanos, fachada",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Ventanería/barandas/muro liviano fachada/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 47,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 8,
    "criterioEvaluacion": "Planos y detalles de instalación firmados por diseñador para ventanería, barandas/pasamanos, estructura metálica, fachada, red contra incendio",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Ventanería/barandas/muro liviano fachada/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 48,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 9,
    "criterioEvaluacion": "Planos de taller según lineamientos de K.4 NSR-10, debidamente firmados por diseñador para ventanería, barandas/pasamanos, estructura metálica",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Ventanería/barandas/muro liviano fachada/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 49,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 10,
    "criterioEvaluacion": "Certificados de soldadores y soldadura utilizada",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (barandas/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 50,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 11,
    "criterioEvaluacion": "Prueba de empuje de barandas",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (barandas)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 51,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 12,
    "criterioEvaluacion": "Certificado de calidad en la instalación por parte del proveedor, de acuerdo con lo indicado en la NSR-10 de ascensores, estructura metálica, fachada, red contra incendio",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (Ascensor, barandas/cubierta metalica/red contra incendio/muro liviano fachada)",
    "hitoMacro": "EQUIPOS_ESPECIALES",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.9.1.1 PQDERO Arreglos foso ascensor",
      "1.7.1.3.1.17.1 T1 Instalacion ascensores"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 52,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 13,
    "criterioEvaluacion": "Certificado de garantía de los ascensores instalados",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Ascensor",
    "hitoMacro": "EQUIPOS_ESPECIALES",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.9.1.1 PQDERO Arreglos foso ascensor",
      "1.7.1.3.1.17.1 T1 Instalacion ascensores"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 53,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 14,
    "criterioEvaluacion": "Planos y especificaciones de los ascensores",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Ascensor",
    "hitoMacro": "EQUIPOS_ESPECIALES",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.9.1.1 PQDERO Arreglos foso ascensor",
      "1.7.1.3.1.17.1 T1 Instalacion ascensores"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 54,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 15,
    "criterioEvaluacion": "Procedimiento de soldadura, limpieza y pintura estructura metálica",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (barandas/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 55,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 16,
    "criterioEvaluacion": "Soportes de compra o facturas de los materiales utilizados",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (barandas/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  },
  {
    "numGeneral": 56,
    "categoriaCto": "6. Elementos No Estructurales",
    "itemCategoria": 17,
    "criterioEvaluacion": "Certificados y fichas técnicas de los electrodos de estructura metálica",
    "responsableDocumentacion": "A cargo del Proyecto",
    "hitoRelacionadoTexto": "Elementos no estructurales (barandas/Cubierta metálica)",
    "hitoMacro": "FACHADAS",
    "tareasWorkplannerAsociadas": [
      "1.7.1.2.16.6.8.2.1 Inst ventaneria aluminio",
      "1.7.1.2.4.8.1.3 Inst barandas",
      "1.7.1.3.1.6.1 Elementos no estructurales"
    ],
    "marcoLegal": "Título J y K NSR-10 (Elementos No Estructurales)"
  }
];
