import {
  CalidadSelloMuestreo,
  HitoMacroCalidad,
  DefectoCalidadPredominante,
  Sucursal,
  SelloActivity,
  SelloInspection,
  CriterioSello,
} from '../types';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';
import { safeLocalStorageSet } from './baselineService';
import { getHitoMacroByCodigoCpc, getTipoContratoByCodigoCpc } from './macroMilestoneService';

export interface AuditLotEvaluationResult {
  indiceCumplimiento: number;
  aprobado: boolean;
  aplicaRetencion20: boolean;
  bloqueaSucesora: boolean;
  fechaLimiteSubsanacion8d: string;
  mensajeEvaluacion: string;
}

export interface WorkplannerLagAnalysis {
  unidadesEjecutadasSegunWP: number;
  unidadesMuestreoRequeridas: number;
  unidadesMuestreadasReales: number;
  desfaseUnidades: number;
  desfaseDiasAproximado: number;
  alertaDesfase: 'AL_DIA' | 'ATENCION_ATRASO_MUESTREO' | 'CRITICA_VALIDAR_AVANCE_OBRA';
  mensajeAlerta: string;
}

export interface SelloHitoMapping {
  hitoMacroCalidad: HitoMacroCalidad;
  hitoLabel: string;
  subtareaWPDefault: string;
  codigoCpc: string;
}

export interface RetencionLoteResult {
  unidadesAuditadas: number;
  unidadesAprobadas: number;
  unidadesIncumplidas: number;
  porcentajeCumplimiento: number;
  porcentajeIncumplimiento: number;
  porcentajeRetencion: number;
  valorContratoPorApto: number;
  valorTotalContratoLote: number;
  valorRetencionCalculado: number;
}

/**
 * 6 Actividades Estandarizadas Oficiales según Manual MA-SIG-CAL-001 V003
 * (VANOS DE ESTRUCTURA, VANOS DE MAMPOSTERÍA, AFINADO, DRYWALL, ENCHAPE, REDES HIDROSANITARIAS)
 */
export const STANDARD_6_SELLOS_ACTIVITIES: SelloActivity[] = [
  {
    id: 'sello-vanos-est',
    codigo: 'SEL-01',
    nombre: 'VANOS DE ESTRUCTURA',
    fase: 'Obra Gris',
    descripcion: 'Medición geométrica de vanos de puertas y ventanas en pantallas o muros de estructura tras acta de vanos.',
    tolerancia: '+5 mm / -5 mm respecto a planos',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 5,
    toleranciaNegativaMm: 5,
    criteriosManual: ['Dimensiones'],
    criterioAceptacion: 'Desviación máxima de ±5 mm en ancho y alto respecto a dimensiones de diseño.',
    herramientas: ['Flexómetro', 'Nivel', 'Plomada'],
    inspecciones: [],
  },
  {
    id: 'sello-vanos-mamp',
    codigo: 'SEL-02',
    nombre: 'VANOS DE MAMPOSTERÍA',
    fase: 'Obra Gris',
    descripcion: 'Medición de vanos en muros de mampostería e interfaces mixtas (ancho estructura / alto mampostería).',
    tolerancia: '+5 mm / -5 mm (Escuadra ≤ 6 mm)',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 5,
    toleranciaNegativaMm: 5,
    criteriosManual: [
      'Dimensiones',
      'Verticalidad',
      'Escuadras internas',
      'Acabado de mampostería',
      'Acabado de pañete',
    ],
    criterioAceptacion: 'Prioridad dimensional del vano (±5 mm), plomada ≤ 5 mm y escuadra interna ≤ 6 mm.',
    herramientas: ['Flexómetro', 'Plomada', 'Escuadra metálica'],
    inspecciones: [],
  },
  {
    id: 'sello-pisos',
    codigo: 'SEL-03',
    nombre: 'AFINADO',
    fase: 'Obra Gris',
    descripcion: 'Verificación de nivelación respecto a eje de referencia, pendiente en zonas húmedas, dilataciones y acabado.',
    tolerancia: '+10 mm / -10 mm respecto a acceso',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 10,
    toleranciaNegativaMm: 10,
    criteriosManual: ['Nivelación de piso', 'Nivel de desagüe', 'Dilataciones y acabado'],
    criterioAceptacion: 'Diferencia máxima de 10 mm entre entrada del apartamento y demás espacios; pendiente hacia sifones y dilataciones perimetrales continuas.',
    herramientas: ['Nivel láser / manguera', 'Nivel de burbuja', 'Flexómetro'],
    inspecciones: [],
  },
  {
    id: 'sello-drywall',
    codigo: 'SEL-04',
    nombre: 'DRYWALL',
    fase: 'Obra Blanca',
    descripcion: 'Inspección de superficies planas sin grietas, huecos, hendiduras o cintas visibles y empalmes uniformes.',
    tolerancia: '0 mm (Acabado continuo sin defectos)',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 0,
    toleranciaNegativaMm: 0,
    criteriosManual: ['Acabado'],
    criterioAceptacion: 'Superficies planas, juntas empastadas y pulidas sin presencia de fisuras ni cintas visibles.',
    herramientas: ['Regla metálica', 'Luz rasante', 'Inspección visual'],
    inspecciones: [],
  },
  {
    id: 'sello-enchape',
    codigo: 'SEL-05',
    nombre: 'ENCHAPE',
    fase: 'Obra Blanca',
    descripcion: 'Control de boquilla, pendiente hacia sifones, estado de tabletas (sin cocas ni garretes) y escuadras a 0 mm.',
    tolerancia: '+0 mm / -0 mm en escuadras',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 0,
    toleranciaNegativaMm: 0,
    criteriosManual: ['Brechas', 'Nivel de desagüe', 'Estado', 'Escuadras'],
    criterioAceptacion: 'Cero tolerancia en escuadras, pendiente continua a desagüe, boquilla uniforme y prueba acústica sin piezas cocas.',
    herramientas: ['Escuadra', 'Nivel de mano', 'Elemento metálico de percusión'],
    inspecciones: [],
  },
  {
    id: 'sello-hidro',
    codigo: 'SEL-06',
    nombre: 'REDES HIDROSANITARIAS',
    fase: 'Obra Gris',
    descripcion: 'Inspección de puntos hidrosanitarios, descolgados en piso inferior y verificación de formato FT-ING-OBR-002.',
    tolerancia: 'Pruebas FT-ING-OBR-002 firmadas y sin fugas',
    unidadTolerancia: 'mm',
    toleranciaPositivaMm: 0,
    toleranciaNegativaMm: 0,
    criteriosManual: ['Ubicación', 'Pruebas de presión'],
    criterioAceptacion: 'Puntos completos según diseño, tubería descolgada conectada y pruebas de presión firmadas en FT-ING-OBR-002.',
    herramientas: ['Manómetro', 'Formato FT-ING-OBR-002', 'Flexómetro'],
    inspecciones: [],
  },
];

export const SELLO_TO_HITO_MAP: Record<string, SelloHitoMapping> = {
  'sello-vanos-est': {
    hitoMacroCalidad: 'ESTRUCTURA_VANOS',
    hitoLabel: 'Vanos de Estructura',
    subtareaWPDefault: '1.7.1.3.1.4.1 EST VANOS',
    codigoCpc: '5010201030',
  },
  'sello-vanos-mamp': {
    hitoMacroCalidad: 'ESTRUCTURA_VANOS',
    hitoLabel: 'Vanos de Mampostería',
    subtareaWPDefault: '1.7.1.3.1.5.1 MAMPOSTERIA',
    codigoCpc: '5010201040',
  },
  'sello-pisos': {
    hitoMacroCalidad: 'AFINADO_PISO',
    hitoLabel: 'Afinado de Piso',
    subtareaWPDefault: '1.7.1.3.1.9.1.1 AFINADO',
    codigoCpc: '5010201045',
  },
  'sello-drywall': {
    hitoMacroCalidad: 'MUROS_LIVIANOS',
    hitoLabel: 'Drywall',
    subtareaWPDefault: '1.7.1.3.1.6.1 DRYWALL',
    codigoCpc: '5010201040',
  },
  'sello-enchape': {
    hitoMacroCalidad: 'ENCHAPES_MUROS',
    hitoLabel: 'Enchape',
    subtareaWPDefault: '1.7.1.3.1.10.1 ENCHAPE',
    codigoCpc: '5010201060',
  },
  'sello-hidro': {
    hitoMacroCalidad: 'REDES_HIDROSANITARIAS',
    hitoLabel: 'Redes Hidrosanitarias',
    subtareaWPDefault: '1.7.1.3.1.11.1 RED HIDROSANITARIA',
    codigoCpc: '5010201065',
  },
};

const STORAGE_SELLOS_ACTIVITIES_PREFIX = 'marval_sellos_activities_v3_';
const STORAGE_SELLOS_LOTES_PREFIX = 'marval_sellos_lotes_v3_';
const STORAGE_SELLOS_TOLERANCES_PREFIX = 'marval_sellos_tolerances_v3_';
const STORAGE_SELLOS_GLOBAL_DB_KEY = 'marval_sellos_global_db_v3';

export function extractAptoCode(apto: string): string {
  const m = apto.match(/(\d{3,4})/);
  return m ? m[1].padStart(4, '0') : apto.trim();
}

function mapCriterioToLegacyDefecto(criterio?: string): DefectoCalidadPredominante {
  const c = (criterio || '').toLowerCase();
  if (c.includes('nivel') || c.includes('vertical')) return 'PLOMOS_Y_NIVELES';
  if (c.includes('dimension') || c.includes('escuadra')) return 'VANOS_DESCUADRADOS';
  if (c.includes('prueba') || c.includes('ubicaci')) return 'FUGAS_ESTANQUEIDAD';
  if (c.includes('estado') || c.includes('brecha')) return 'DESPRENDIMIENTOS_HUECOS';
  return 'DESVIO_ESPECIFICACION';
}

export class CalidadSellosEngine {
  /**
   * Obtiene el Código CPC, Punto de Control y Modalidad de Contrato oficial vinculada al sello
   * desde BASE DE PUNTOS DE CONTROL - WORKPLANNER.
   */
  static getSelloContratoInfo(selloId: string): {
    codigoCpc: string;
    puntoControlNombre: string;
    tipoContrato: 'TODO_COSTO' | 'MANO_OBRA';
    labelContrato: 'Todo Costo' | 'Mano de Obra';
  } {
    const mapInfo = SELLO_TO_HITO_MAP[selloId];
    const cpc = mapInfo?.codigoCpc || '5010201030';
    const puntoControlNombre = getHitoMacroByCodigoCpc(cpc) || mapInfo?.hitoLabel || 'Estructura';
    const tipoSla = getTipoContratoByCodigoCpc(cpc);
    const tipoContrato: 'TODO_COSTO' | 'MANO_OBRA' =
      tipoSla === 'TODO_COSTO_64D' ? 'TODO_COSTO' : 'MANO_OBRA';

    return {
      codigoCpc: cpc,
      puntoControlNombre,
      tipoContrato,
      labelContrato: tipoContrato === 'TODO_COSTO' ? 'Todo Costo' : 'Mano de Obra',
    };
  }

  /**
   * Calcula la retención automática de un lote evaluado en una misma fecha:
   * Retención = N_lote * (1 - Cumplimiento) * (% Retención) * Valor_Contrato_Por_Apto
   */
  static calcularRetencionLote(params: {
    unidadesAuditadas: number;
    unidadesAprobadas: number;
    valorContratoPorApto: number;
    porcentajeRetencion: number;
  }): RetencionLoteResult {
    const unidadesAuditadas = Math.max(0, Math.round(params.unidadesAuditadas));
    const unidadesAprobadas = Math.min(unidadesAuditadas, Math.max(0, Math.round(params.unidadesAprobadas)));
    const unidadesIncumplidas = Math.max(0, unidadesAuditadas - unidadesAprobadas);
    const valorContratoPorApto = Math.max(0, Number(params.valorContratoPorApto) || 0);
    const porcentajeRetencion = Math.max(0, Math.min(100, Number(params.porcentajeRetencion) || 0));

    const porcentajeCumplimiento =
      unidadesAuditadas > 0 ? Math.round((unidadesAprobadas / unidadesAuditadas) * 1000) / 10 : 0;
    const porcentajeIncumplimiento =
      unidadesAuditadas > 0 ? Math.round((100 - porcentajeCumplimiento) * 10) / 10 : 0;

    const cumplimientoRatio = unidadesAuditadas > 0 ? unidadesAprobadas / unidadesAuditadas : 1;
    const incumplimientoRatio = Math.max(0, 1 - cumplimientoRatio);
    const valorTotalContratoLote = Math.round(unidadesAuditadas * valorContratoPorApto);
    const valorRetencionCalculado = Math.round(
      unidadesAuditadas * incumplimientoRatio * (porcentajeRetencion / 100) * valorContratoPorApto
    );

    return {
      unidadesAuditadas,
      unidadesAprobadas,
      unidadesIncumplidas,
      porcentajeCumplimiento,
      porcentajeIncumplimiento,
      porcentajeRetencion,
      valorContratoPorApto,
      valorTotalContratoLote,
      valorRetencionCalculado,
    };
  }

  static addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  static evaluateLotQuality(params: {
    unidadesAuditadas: number;
    unidadesAprobadas: number;
    fechaAuditoria: string;
  }): AuditLotEvaluationResult {
    const unidadesAuditadas = Math.max(0, params.unidadesAuditadas);
    const unidadesAprobadas = Math.max(0, params.unidadesAprobadas);

    if (unidadesAuditadas === 0) {
      return {
        indiceCumplimiento: 0,
        aprobado: false,
        aplicaRetencion20: false,
        bloqueaSucesora: false,
        fechaLimiteSubsanacion8d: '',
        mensajeEvaluacion: 'Sin unidades auditadas registradas.',
      };
    }

    const indiceCumplimiento = Math.round((unidadesAprobadas / unidadesAuditadas) * 100);
    const aprobado = indiceCumplimiento >= 80;
    const aplicaRetencion20 = !aprobado;
    const bloqueaSucesora = !aprobado;
    const fechaLimiteSubsanacion8d = !aprobado ? this.addDays(params.fechaAuditoria, 8) : '';

    const mensajeEvaluacion = aprobado
      ? `Lote APROBADO: ${indiceCumplimiento}% de cumplimiento técnico.`
      : `Lote RECHAZADO: ${indiceCumplimiento}% de cumplimiento (< 80%). Aplica retención del 20%, 8 días para subsanar y bloqueo de frentes sucesores.`;

    return {
      indiceCumplimiento,
      aprobado,
      aplicaRetencion20,
      bloqueaSucesora,
      fechaLimiteSubsanacion8d,
      mensajeEvaluacion,
    };
  }

  static analyzeWorkplannerSamplingLag(params: {
    totalUnidadesAlcance: number;
    porcentajeAvanceWorkplanner: number;
    unidadesMuestreadasAcumuladas: number;
    diasDesdeUltimoMuestreo?: number;
  }): WorkplannerLagAnalysis {
    const pct = Math.min(100, Math.max(0, params.porcentajeAvanceWorkplanner));
    const unidadesEjecutadasSegunWP = Math.round(params.totalUnidadesAlcance * (pct / 100));
    const unidadesMuestreoRequeridas = Math.ceil(unidadesEjecutadasSegunWP * 0.5);
    const desfaseUnidades = unidadesMuestreoRequeridas - params.unidadesMuestreadasAcumuladas;
    const diasDesfaseAprox = desfaseUnidades > 0 ? Math.round(desfaseUnidades * 3) : 0;

    let alertaDesfase: 'AL_DIA' | 'ATENCION_ATRASO_MUESTREO' | 'CRITICA_VALIDAR_AVANCE_OBRA' = 'AL_DIA';
    let mensajeAlerta = 'Muestreo de sellos al día con el avance reportado en Workplanner.';

    if (diasDesfaseAprox > 60 || desfaseUnidades >= 15) {
      alertaDesfase = 'CRITICA_VALIDAR_AVANCE_OBRA';
      mensajeAlerta = `Desfase > 2 meses: según Workplanner (${pct}% avance) se han ejecutado ${unidadesEjecutadasSegunWP} inmuebles (muestreo requerido: ${unidadesMuestreoRequeridas}), con ${params.unidadesMuestreadasAcumuladas} sellos registrados.`;
    } else if (diasDesfaseAprox > 15 || desfaseUnidades >= 5) {
      alertaDesfase = 'ATENCION_ATRASO_MUESTREO';
      mensajeAlerta = `Atraso en muestreo (> 15 días): desfase de ${desfaseUnidades} unidades respecto al avance de Workplanner.`;
    }

    return {
      unidadesEjecutadasSegunWP,
      unidadesMuestreoRequeridas,
      unidadesMuestreadasReales: params.unidadesMuestreadasAcumuladas,
      desfaseUnidades,
      desfaseDiasAproximado: diasDesfaseAprox,
      alertaDesfase,
      mensajeAlerta,
    };
  }

  static createSelloRecord(params: {
    proyectoId: string;
    sucursal: Sucursal;
    torre: string;
    hitoMacroCalidad: HitoMacroCalidad;
    contratista: string;
    tipoContrato: 'TODO_COSTO' | 'MANO_OBRA';
    unidadesAuditadas: number;
    unidadesAprobadas: number;
    defectoPredominante?: DefectoCalidadPredominante;
    espaciosIncumplimiento?: string[];
    valorActaPagoSemana?: number;
    residenteAuditor: string;
    fechaAuditoria?: string;
    idTareaWorkplannerAsociada?: string;
    totalUnidadesAlcance?: number;
    porcentajeAvanceWorkplanner?: number;
  }): CalidadSelloMuestreo {
    const fechaAud = params.fechaAuditoria || new Date().toISOString().split('T')[0];
    const mes = fechaAud.substring(0, 7);

    const qualityRes = this.evaluateLotQuality({
      unidadesAuditadas: params.unidadesAuditadas,
      unidadesAprobadas: params.unidadesAprobadas,
      fechaAuditoria: fechaAud,
    });

    const unidadesRechazadas = Math.max(0, params.unidadesAuditadas - params.unidadesAprobadas);
    const valorRetencionEstimado =
      qualityRes.aplicaRetencion20 && params.valorActaPagoSemana
        ? Math.round(params.valorActaPagoSemana * 0.2)
        : 0;

    let desfaseDias: number | undefined;
    let alertaRitmo: 'AL_DIA' | 'ATENCION_ATRASO_MUESTREO' | 'CRITICA_VALIDAR_AVANCE_OBRA' | undefined;
    let mensajeRitmo: string | undefined;
    let unidadesWP: number | undefined;

    if (params.totalUnidadesAlcance && params.porcentajeAvanceWorkplanner !== undefined) {
      const lagAnalysis = this.analyzeWorkplannerSamplingLag({
        totalUnidadesAlcance: params.totalUnidadesAlcance,
        porcentajeAvanceWorkplanner: params.porcentajeAvanceWorkplanner,
        unidadesMuestreadasAcumuladas: params.unidadesAuditadas,
      });
      desfaseDias = lagAnalysis.desfaseDiasAproximado;
      alertaRitmo = lagAnalysis.alertaDesfase;
      mensajeRitmo = lagAnalysis.mensajeAlerta;
      unidadesWP = lagAnalysis.unidadesEjecutadasSegunWP;
    }

    return {
      id: `${params.proyectoId}-${params.torre}-${params.hitoMacroCalidad}-${fechaAud}-${Math.random().toString(36).slice(2, 6)}`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      torre: params.torre,
      fechaAuditoria: fechaAud,
      mes,
      hitoMacroCalidad: params.hitoMacroCalidad,
      contratistaEjecutor: params.contratista,
      tipoContrato: params.tipoContrato,
      unidadesAuditadasInterventoria: params.unidadesAuditadas,
      unidadesAprobadas: params.unidadesAprobadas,
      unidadesRechazadas,
      indiceCumplimientoLote: qualityRes.indiceCumplimiento,
      aprobado: qualityRes.aprobado,
      aplicaRetencion20: qualityRes.aplicaRetencion20,
      valorRetencionEstimado,
      defectoPredominante: params.defectoPredominante,
      espaciosIncumplimiento: params.espaciosIncumplimiento || [],
      estadoSubsanacion: qualityRes.aprobado ? 'REINSPECCIONADO_APROBADO' : 'PENDIENTE_CORRECCION_8D',
      bloqueaSucesora: qualityRes.bloqueaSucesora,
      fechaLimiteSubsanacion8d: qualityRes.fechaLimiteSubsanacion8d,
      residenteAuditor: params.residenteAuditor,
      sincronizadoSharePoint: true,
      idTareaWorkplannerAsociada: params.idTareaWorkplannerAsociada,
      porcentajeAvanceWorkplanner: params.porcentajeAvanceWorkplanner,
      unidadesEjecutadasSegunWP: unidadesWP,
      desfaseDiasMuestreo: desfaseDias,
      alertaDesfase: alertaRitmo,
      mensajeAlertaDesfase: mensajeRitmo,
    };
  }

  static getTolerancesMap(
    proyectoId: string
  ): Record<string, { posMm: number; negMm: number; unidad: string }> {
    if (!proyectoId) return {};
    try {
      const raw = localStorage.getItem(`${STORAGE_SELLOS_TOLERANCES_PREFIX}${proyectoId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static saveToleranceForActivity(
    proyectoId: string,
    selloId: string,
    posMm: number,
    negMm: number,
    unidad: string = 'mm'
  ): void {
    if (!proyectoId || !selloId) return;
    const map = this.getTolerancesMap(proyectoId);
    map[selloId] = { posMm, negMm, unidad };
    safeLocalStorageSet(`${STORAGE_SELLOS_TOLERANCES_PREFIX}${proyectoId}`, JSON.stringify(map));
  }

  /**
   * Retorna exclusivamente las 6 Actividades Estandarizadas (sin datos ficticios).
   */
  static getActivities(proyectoId: string): SelloActivity[] {
    let savedById = new Map<string, SelloActivity>();
    if (proyectoId) {
      try {
        const raw = localStorage.getItem(`${STORAGE_SELLOS_ACTIVITIES_PREFIX}${proyectoId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: SelloActivity) => savedById.set(a.id, a));
          }
        }
      } catch (e) {
        console.warn('[CalidadSellosEngine] Error leyendo actividades de sellos:', e);
      }
    }

    const savedTol = this.getTolerancesMap(proyectoId);

    return STANDARD_6_SELLOS_ACTIVITIES.map((base) => {
      const existing = savedById.get(base.id);
      const tol = savedTol[base.id];
      const posMm = tol?.posMm ?? existing?.toleranciaPositivaMm ?? base.toleranciaPositivaMm ?? 0;
      const negMm = tol?.negMm ?? existing?.toleranciaNegativaMm ?? base.toleranciaNegativaMm ?? 0;
      const unidad = tol?.unidad || base.unidadTolerancia || 'mm';

      return {
        ...base,
        toleranciaPositivaMm: posMm,
        toleranciaNegativaMm: negMm,
        unidadTolerancia: unidad,
        tolerancia: `+${posMm} ${unidad} / -${negMm} ${unidad}`,
        inspecciones: Array.isArray(existing?.inspecciones) ? existing!.inspecciones : [],
      };
    });
  }

  static saveActivities(proyectoId: string, activities: SelloActivity[]): void {
    try {
      safeLocalStorageSet(
        `${STORAGE_SELLOS_ACTIVITIES_PREFIX}${proyectoId}`,
        JSON.stringify(activities)
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marval_sellos_updated', { detail: { proyectoId } }));
      }
    } catch (e) {
      console.error('[CalidadSellosEngine] Error guardando actividades de sellos:', e);
    }
  }

  /**
   * Obtiene los lotes muestreados reales del proyecto (sin registros ficticios).
   */
  static getMuestreosLotes(proyectoId: string): CalidadSelloMuestreo[] {
    if (!proyectoId) return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_SELLOS_LOTES_PREFIX}${proyectoId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[CalidadSellosEngine] Error leyendo lotes muestreados:', e);
    }
    return [];
  }

  static saveMuestreosLotes(proyectoId: string, lotes: CalidadSelloMuestreo[]): void {
    try {
      safeLocalStorageSet(`${STORAGE_SELLOS_LOTES_PREFIX}${proyectoId}`, JSON.stringify(lotes));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marval_sellos_updated', { detail: { proyectoId } }));
      }
    } catch (e) {
      console.error('[CalidadSellosEngine] Error guardando lotes muestreados:', e);
    }
  }

  /**
   * Base unificada multi-proyecto de inspecciones de sellos registradas.
   */
  static getGlobalInspections(proyectoId?: string): SelloInspection[] {
    try {
      const raw = localStorage.getItem(STORAGE_SELLOS_GLOBAL_DB_KEY);
      if (!raw) return [];
      const list: SelloInspection[] = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return proyectoId ? list.filter((i) => i.proyectoId === proyectoId) : list;
    } catch {
      return [];
    }
  }

  /**
   * Registra inspecciones en lote para múltiples apartamentos seleccionados (Matriz Piso x Serie)
   * en una fecha de ejecución específica, consolida automáticamente el lote de esa misma fecha
   * y calcula la retención proporcional según % incumplimiento, valor contrato por apto y % retención.
   */
  static registrarInspeccionesLoteBatch(params: {
    proyectoId: string;
    sucursal: Sucursal;
    selloId: string;
    torre: string;
    apartamentos: Array<{ codigo: string; piso: number }>;
    fechaEjecucion: string;
    resultado: CriterioSello;
    criterioEvaluado?: string;
    toleranciaPositivaMm?: number;
    toleranciaNegativaMm?: number;
    unidadTolerancia?: string;
    medicionMm?: number;
    hallazgo: string;
    contratista: string;
    inspector: string;
    valorContratoPorApto: number;
    porcentajeRetencion: number;
    totalUnidadesTorre?: number;
    porcentajeAvanceWP?: number;
  }): {
    updatedActivities: SelloActivity[];
    updatedLotes: CalidadSelloMuestreo[];
    loteConsolidado?: CalidadSelloMuestreo;
    retencionCalculada: RetencionLoteResult;
  } {
    const fecha = params.fechaEjecucion || new Date().toISOString().split('T')[0];
    const activities = this.getActivities(params.proyectoId);
    const targetAct = activities.find((a) => a.id === params.selloId);
    const contratoInfo = this.getSelloContratoInfo(params.selloId);
    const unidad = params.unidadTolerancia || targetAct?.unidadTolerancia || 'mm';
    const posMm =
      params.toleranciaPositivaMm !== undefined
        ? params.toleranciaPositivaMm
        : (targetAct?.toleranciaPositivaMm ?? 0);
    const negMm =
      params.toleranciaNegativaMm !== undefined
        ? params.toleranciaNegativaMm
        : (targetAct?.toleranciaNegativaMm ?? 0);

    this.saveToleranceForActivity(params.proyectoId, params.selloId, posMm, negMm, unidad);

    const criterio = params.criterioEvaluado || targetAct?.criteriosManual?.[0] || 'Criterio general';
    const toleranciaDesc = `+${posMm} ${unidad} / -${negMm} ${unidad} · ${criterio}`;
    const legacyDefecto = mapCriterioToLegacyDefecto(criterio);

    const nuevasInspecciones: SelloInspection[] = params.apartamentos.map((ap, idx) => {
      const aptoLabel = `Apto ${extractAptoCode(ap.codigo)}`;
      return {
        id: `insp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        selloId: params.selloId,
        selloNombre: targetAct?.nombre || params.selloId,
        torre: params.torre,
        apartamento: aptoLabel,
        piso: ap.piso,
        resultado: params.resultado,
        criterioEvaluado: criterio,
        medicionMm: params.medicionMm,
        toleranciaPositivaMm: posMm,
        toleranciaNegativaMm: negMm,
        unidadTolerancia: unidad,
        toleranciaTexto: toleranciaDesc,
        defectoPredominante:
          params.resultado === '1' || params.resultado === '2' ? legacyDefecto : undefined,
        hallazgo:
          params.hallazgo.trim() ||
          (params.resultado === '0'
            ? 'Conforme según tolerancia establecida.'
            : params.resultado === 'NA'
              ? 'No aplica en esta unidad / etapa.'
              : 'Inconformidad reportada en verificación de campo.'),
        contratistaResponsable: params.contratista || 'Por asignar',
        tipoContrato: contratoInfo.tipoContrato,
        fecha,
        inspector: params.inspector,
      };
    });

    // Reemplazar inspecciones previas del mismo inmueble + torre + fecha para evitar duplicidad en la misma jornada
    const newKeySet = new Set(
      nuevasInspecciones.map((ni) => `${ni.torre}::${ni.apartamento}::${ni.fecha}`)
    );
    const prevInspections = (targetAct?.inspecciones || []).filter(
      (existing) => !newKeySet.has(`${existing.torre}::${existing.apartamento}::${existing.fecha}`)
    );
    const mergedInspectionsForAct = [...nuevasInspecciones, ...prevInspections];

    const updatedActivities = activities.map((act) =>
      act.id === params.selloId
        ? {
            ...act,
            toleranciaPositivaMm: posMm,
            toleranciaNegativaMm: negMm,
            unidadTolerancia: unidad,
            tolerancia: `+${posMm} ${unidad} / -${negMm} ${unidad}`,
            inspecciones: mergedInspectionsForAct,
          }
        : act
    );
    this.saveActivities(params.proyectoId, updatedActivities);

    // Sincronizar base global multi-proyecto
    const globalList = this.getGlobalInspections().filter(
      (g) =>
        !(
          g.proyectoId === params.proyectoId &&
          g.selloId === params.selloId &&
          newKeySet.has(`${g.torre}::${g.apartamento}::${g.fecha}`)
        )
    );
    safeLocalStorageSet(
      STORAGE_SELLOS_GLOBAL_DB_KEY,
      JSON.stringify([...nuevasInspecciones, ...globalList])
    );

    // Encolar cada inspección en lista de SharePoint con su fecha de ejecución
    nuevasInspecciones.forEach((ni) => {
      SharePointService.enqueueRecord(SHAREPOINT_LISTS.CALIDAD, 'CREATE', ni.id, {
        tipoRegistro: 'INSPECCION_SELLO_APTO',
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        selloId: params.selloId,
        selloNombre: targetAct?.nombre || params.selloId,
        codigoCpc: contratoInfo.codigoCpc,
        puntoControl: contratoInfo.puntoControlNombre,
        torre: ni.torre,
        piso: ni.piso,
        apartamento: ni.apartamento,
        resultado: ni.resultado,
        criterioEvaluado: ni.criterioEvaluado,
        toleranciaPositivaMm: posMm,
        toleranciaNegativaMm: negMm,
        medicionMm: ni.medicionMm,
        contratista: ni.contratistaResponsable,
        tipoContrato: contratoInfo.tipoContrato,
        fechaEjecucion: fecha,
        inspector: ni.inspector,
      });
    });

    // Consolidación automática del lote para TODAS las unidades evaluadas en la MISMA FECHA (torre + sello + fecha)
    const evaluacionesMismaFecha = mergedInspectionsForAct.filter(
      (i) => i.torre === params.torre && i.fecha === fecha && i.resultado !== 'NA'
    );
    const unidadesAuditadas = evaluacionesMismaFecha.length;
    const unidadesAprobadas = evaluacionesMismaFecha.filter((i) => i.resultado === '0').length;

    const retencionCalculada = this.calcularRetencionLote({
      unidadesAuditadas,
      unidadesAprobadas,
      valorContratoPorApto: params.valorContratoPorApto,
      porcentajeRetencion: params.porcentajeRetencion,
    });

    const lotes = this.getMuestreosLotes(params.proyectoId);
    const mapInfo = SELLO_TO_HITO_MAP[params.selloId] || {
      hitoMacroCalidad: 'ESTRUCTURA_VANOS' as HitoMacroCalidad,
      hitoLabel: 'Estructura y Acabados',
      subtareaWPDefault: '1.7.1.3.1',
      codigoCpc: contratoInfo.codigoCpc,
    };

    let updatedLotes = [...lotes];
    let loteConsolidado: CalidadSelloMuestreo | undefined;

    if (unidadesAuditadas > 0) {
      const qualityRes = this.evaluateLotQuality({
        unidadesAuditadas,
        unidadesAprobadas,
        fechaAuditoria: fecha,
      });

      const espaciosInc = evaluacionesMismaFecha
        .filter((i) => i.resultado === '1' || i.resultado === '2')
        .map((i) => `${i.apartamento} (${i.criterioEvaluado || criterio}) - ${i.hallazgo || 'Hallazgo'}`);

      let desfaseDias: number | undefined;
      let alertaRitmo: 'AL_DIA' | 'ATENCION_ATRASO_MUESTREO' | 'CRITICA_VALIDAR_AVANCE_OBRA' | undefined;
      let mensajeRitmo: string | undefined;
      let unidadesWP: number | undefined;
      if (params.totalUnidadesTorre && params.porcentajeAvanceWP !== undefined) {
        const lag = this.analyzeWorkplannerSamplingLag({
          totalUnidadesAlcance: params.totalUnidadesTorre,
          porcentajeAvanceWorkplanner: params.porcentajeAvanceWP,
          unidadesMuestreadasAcumuladas: unidadesAuditadas,
        });
        desfaseDias = lag.desfaseDiasAproximado;
        alertaRitmo = lag.alertaDesfase;
        mensajeRitmo = lag.mensajeAlerta;
        unidadesWP = lag.unidadesEjecutadasSegunWP;
      }

      const deterministicLotId = `LOTE-${params.proyectoId}-${params.torre}-${params.selloId}-${fecha}`;
      loteConsolidado = {
        id: deterministicLotId,
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        torre: params.torre,
        fechaAuditoria: fecha,
        mes: fecha.substring(0, 7),
        hitoMacroCalidad: mapInfo.hitoMacroCalidad,
        selloId: params.selloId,
        selloNombre: targetAct?.nombre || params.selloId,
        codigoCpc: contratoInfo.codigoCpc,
        contratistaEjecutor: params.contratista || 'Marval Ingeniería',
        tipoContrato: contratoInfo.tipoContrato,
        unidadesAuditadasInterventoria: unidadesAuditadas,
        unidadesAprobadas,
        unidadesRechazadas: Math.max(0, unidadesAuditadas - unidadesAprobadas),
        indiceCumplimientoLote: Math.round(retencionCalculada.porcentajeCumplimiento),
        aprobado: qualityRes.aprobado && retencionCalculada.valorRetencionCalculado === 0,
        aplicaRetencion20: retencionCalculada.valorRetencionCalculado > 0,
        valorRetencionEstimado: retencionCalculada.valorRetencionCalculado,
        valorContratoPorApto: params.valorContratoPorApto,
        porcentajeRetencionAplicado: params.porcentajeRetencion,
        valorTotalContratoLote: retencionCalculada.valorTotalContratoLote,
        defectoPredominante:
          unidadesAprobadas < unidadesAuditadas ? legacyDefecto : undefined,
        espaciosIncumplimiento: espaciosInc,
        estadoSubsanacion:
          retencionCalculada.valorRetencionCalculado === 0
            ? 'REINSPECCIONADO_APROBADO'
            : 'PENDIENTE_CORRECCION_8D',
        bloqueaSucesora: qualityRes.bloqueaSucesora,
        fechaLimiteSubsanacion8d: qualityRes.fechaLimiteSubsanacion8d,
        residenteAuditor: params.inspector,
        sincronizadoSharePoint: true,
        idTareaWorkplannerAsociada: mapInfo.subtareaWPDefault,
        porcentajeAvanceWorkplanner: params.porcentajeAvanceWP,
        unidadesEjecutadasSegunWP: unidadesWP,
        desfaseDiasMuestreo: desfaseDias,
        alertaDesfase: alertaRitmo,
        mensajeAlertaDesfase: mensajeRitmo,
      };

      const restLotes = lotes.filter((l) => l.id !== deterministicLotId);
      updatedLotes = [loteConsolidado, ...restLotes];
      this.saveMuestreosLotes(params.proyectoId, updatedLotes);

      SharePointService.enqueueRecord(
        SHAREPOINT_LISTS.CALIDAD,
        'UPDATE',
        deterministicLotId,
        {
          tipoRegistro: 'LOTE_CONSOLIDADO_SELLO',
          ...loteConsolidado,
        }
      );
    }

    return {
      updatedActivities,
      updatedLotes,
      loteConsolidado,
      retencionCalculada,
    };
  }

  /**
   * Registra inspección individual de apartamento y alimenta la base consolidada y tablero de indicadores.
   */
  static registrarInspeccionYMuestreo(params: {
    proyectoId: string;
    sucursal: Sucursal;
    selloId: string;
    torre: string;
    piso: number;
    apartamentoCodigo: string;
    resultado: CriterioSello;
    criterioEvaluado?: string;
    toleranciaPositivaMm?: number;
    toleranciaNegativaMm?: number;
    unidadTolerancia?: string;
    medicionTexto: string;
    medicionMm?: number;
    hallazgo: string;
    contratista: string;
    tipoContrato: 'TODO_COSTO' | 'MANO_OBRA';
    defectoPredominante?: DefectoCalidadPredominante;
    inspector: string;
    registrarLote?: boolean;
    unidadesAuditadasLote?: number;
    unidadesAprobadasLote?: number;
    totalUnidadesTorre?: number;
    porcentajeAvanceWP?: number;
    valorActaPagoSemana?: number;
  }): {
    updatedActivities: SelloActivity[];
    updatedLotes: CalidadSelloMuestreo[];
  } {
    const fecha = new Date().toISOString().split('T')[0];
    const aptoLabel = `Apto ${extractAptoCode(params.apartamentoCodigo)}`;

    const activities = this.getActivities(params.proyectoId);
    const targetAct = activities.find((a) => a.id === params.selloId);
    const unidad = params.unidadTolerancia || targetAct?.unidadTolerancia || 'mm';
    const posMm =
      params.toleranciaPositivaMm !== undefined
        ? params.toleranciaPositivaMm
        : (targetAct?.toleranciaPositivaMm ?? 0);
    const negMm =
      params.toleranciaNegativaMm !== undefined
        ? params.toleranciaNegativaMm
        : (targetAct?.toleranciaNegativaMm ?? 0);

    // Guardar tolerancia oficial del sello para este proyecto (definida desde el 1er apto)
    this.saveToleranceForActivity(params.proyectoId, params.selloId, posMm, negMm, unidad);

    const toleranciaDesc = `+${posMm} ${unidad} / -${negMm} ${unidad}${
      params.medicionTexto ? ` · ${params.medicionTexto}` : ''
    }`;

    const legacyDefecto =
      params.defectoPredominante || mapCriterioToLegacyDefecto(params.criterioEvaluado);

    const nuevaInspeccion: SelloInspection = {
      id: `insp-${Date.now()}`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      selloId: params.selloId,
      selloNombre: targetAct?.nombre || params.selloId,
      torre: params.torre,
      apartamento: aptoLabel,
      piso: params.piso,
      resultado: params.resultado,
      criterioEvaluado: params.criterioEvaluado || targetAct?.criteriosManual?.[0],
      medicionMm: params.medicionMm,
      toleranciaPositivaMm: posMm,
      toleranciaNegativaMm: negMm,
      unidadTolerancia: unidad,
      toleranciaTexto: toleranciaDesc,
      defectoPredominante:
        params.resultado === '1' || params.resultado === '2' ? legacyDefecto : undefined,
      hallazgo:
        params.hallazgo.trim() ||
        (params.resultado === '0'
          ? 'Conforme según tolerancia establecida.'
          : params.resultado === 'NA'
            ? 'No aplica en esta unidad / etapa.'
            : 'Inconformidad reportada en verificación de campo.'),
      contratistaResponsable: params.contratista || 'Por asignar',
      tipoContrato: params.tipoContrato,
      fecha,
      inspector: params.inspector,
    };

    const updatedActivities = activities.map((act) =>
      act.id === params.selloId
        ? {
            ...act,
            toleranciaPositivaMm: posMm,
            toleranciaNegativaMm: negMm,
            unidadTolerancia: unidad,
            tolerancia: `+${posMm} ${unidad} / -${negMm} ${unidad}`,
            inspecciones: [nuevaInspeccion, ...act.inspecciones],
          }
        : act
    );
    this.saveActivities(params.proyectoId, updatedActivities);

    // Alimentar base de datos global multi-proyecto
    const globalList = this.getGlobalInspections();
    safeLocalStorageSet(
      STORAGE_SELLOS_GLOBAL_DB_KEY,
      JSON.stringify([nuevaInspeccion, ...globalList])
    );

    const lotes = this.getMuestreosLotes(params.proyectoId);
    const mapInfo = SELLO_TO_HITO_MAP[params.selloId] || {
      hitoMacroCalidad: 'ESTRUCTURA_VANOS' as HitoMacroCalidad,
      hitoLabel: 'Estructura y Acabados',
      subtareaWPDefault: '1.7.1.3.1',
    };

    let updatedLotes = [...lotes];
    if (params.registrarLote === true) {
      const unidadesAuditadas = Math.max(1, params.unidadesAuditadasLote || 1);
      const unidadesAprobadas =
        params.unidadesAprobadasLote !== undefined
          ? Math.min(unidadesAuditadas, Math.max(0, params.unidadesAprobadasLote))
          : params.resultado === '0' || params.resultado === 'NA'
            ? unidadesAuditadas
            : Math.max(0, unidadesAuditadas - 1);

      const espacioHallazgo =
        params.resultado === '1' || params.resultado === '2'
          ? [
              `${aptoLabel} (${params.criterioEvaluado || 'Criterio'}) - ${
                params.hallazgo || 'Hallazgo en inspección'
              }`,
            ]
          : [];

      const nuevoLote = this.createSelloRecord({
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        torre: params.torre,
        hitoMacroCalidad: mapInfo.hitoMacroCalidad,
        contratista: params.contratista || 'Marval Ingeniería',
        tipoContrato: params.tipoContrato,
        unidadesAuditadas,
        unidadesAprobadas,
        defectoPredominante:
          unidadesAprobadas < unidadesAuditadas ? legacyDefecto : undefined,
        espaciosIncumplimiento: espacioHallazgo,
        valorActaPagoSemana: params.valorActaPagoSemana || 0,
        residenteAuditor: params.inspector,
        fechaAuditoria: fecha,
        idTareaWorkplannerAsociada: mapInfo.subtareaWPDefault,
        totalUnidadesAlcance: params.totalUnidadesTorre || 48,
        porcentajeAvanceWorkplanner: params.porcentajeAvanceWP ?? 35,
      });

      updatedLotes = [nuevoLote, ...lotes];
      this.saveMuestreosLotes(params.proyectoId, updatedLotes);
    }

    SharePointService.enqueueRecord(
      SHAREPOINT_LISTS.CALIDAD,
      'CREATE',
      nuevaInspeccion.id,
      {
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        selloId: params.selloId,
        selloNombre: targetAct?.nombre || params.selloId,
        torre: params.torre,
        piso: params.piso,
        apartamento: aptoLabel,
        resultado: params.resultado,
        criterioEvaluado: nuevaInspeccion.criterioEvaluado,
        toleranciaPositivaMm: posMm,
        toleranciaNegativaMm: negMm,
        medicionMm: params.medicionMm,
        contratista: params.contratista,
        tipoContrato: params.tipoContrato,
        fecha,
        inspector: params.inspector,
      }
    );

    return { updatedActivities, updatedLotes };
  }
}
