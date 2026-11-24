import {
  Sucursal,
  HitoMacro,
  AreaResponsableSLA,
  HitoMacroCalidad,
  DefectoCalidadPredominante,
  GerenciaTiemposConsolidado,
  GerenciaLookaheadConsolidado,
  GerenciaCalidadConsolidado,
  GerenciaCtoConsolidado,
  EstadoRevisionSupervisor
} from '../types';
import { BaselineService } from './baselineService';

export class GerenciaService {
  /**
   * Obtiene el consolidado gerencial mensual y acumulado multi-proyecto para TIEMPO
   */
  static getConsolidadoTiempos(mes: string = '2026-11', sucursal: Sucursal = 'TODAS'): GerenciaTiemposConsolidado {
    // 1. Días de atraso en ruta crítica por Hito Macro Estandarizado (13 hitos)
    const baseDiasPorHito: Record<HitoMacro, number> = {
      ESTRUCTURA: sucursal === 'CALI' ? 42 : sucursal === 'BOGOTA' ? 55 : sucursal === 'BUCARAMANGA' ? 68 : 142,
      FACHADAS: sucursal === 'CALI' ? 28 : sucursal === 'BOGOTA' ? 35 : sucursal === 'BUCARAMANGA' ? 44 : 98,
      CIMENTACION: sucursal === 'CALI' ? 18 : sucursal === 'BOGOTA' ? 22 : sucursal === 'BUCARAMANGA' ? 31 : 65,
      MAMPOSTERIA: sucursal === 'CALI' ? 21 : sucursal === 'BOGOTA' ? 24 : sucursal === 'BUCARAMANGA' ? 29 : 58,
      ACABADOS_OBRA_GRIS: sucursal === 'CALI' ? 14 : sucursal === 'BOGOTA' ? 19 : sucursal === 'BUCARAMANGA' ? 22 : 47,
      ACABADOS_OBRA_BLANCA: sucursal === 'CALI' ? 12 : sucursal === 'BOGOTA' ? 16 : sucursal === 'BUCARAMANGA' ? 18 : 39,
      REDES_HIDROSANITARIAS: sucursal === 'CALI' ? 9 : sucursal === 'BOGOTA' ? 14 : sucursal === 'BUCARAMANGA' ? 15 : 32,
      REDES_ELECTRICAS_GAS: sucursal === 'CALI' ? 7 : sucursal === 'BOGOTA' ? 11 : sucursal === 'BUCARAMANGA' ? 13 : 26,
      CARPINTERIAS: sucursal === 'CALI' ? 6 : sucursal === 'BOGOTA' ? 8 : sucursal === 'BUCARAMANGA' ? 10 : 21,
      EQUIPOS_ESPECIALES: sucursal === 'CALI' ? 5 : sucursal === 'BOGOTA' ? 6 : sucursal === 'BUCARAMANGA' ? 9 : 18,
      ZONAS_COMUNES_ESENCIALES: sucursal === 'CALI' ? 8 : sucursal === 'BOGOTA' ? 12 : sucursal === 'BUCARAMANGA' ? 14 : 29,
      URBANISMO: sucursal === 'CALI' ? 4 : sucursal === 'BOGOTA' ? 7 : sucursal === 'BUCARAMANGA' ? 8 : 16,
      CIERRE_ENTREGAS: sucursal === 'CALI' ? 2 : sucursal === 'BOGOTA' ? 3 : sucursal === 'BUCARAMANGA' ? 4 : 8
    };

    // Ajustar si es acumulado
    const factorAcumulado = mes === 'ACUMULADO_2026' ? 2.4 : 1.0;
    const diasAtrasoPorHitoMacro = Object.fromEntries(
      Object.entries(baseDiasPorHito).map(([k, v]) => [k, Math.round(v * factorAcumulado)])
    ) as Record<HitoMacro, number>;

    // Encontrar hito de mayor impacto
    let maxHito: HitoMacro = 'ESTRUCTURA';
    let maxDias = -1;
    for (const [h, d] of Object.entries(diasAtrasoPorHitoMacro)) {
      if (d > maxDias) {
        maxDias = d;
        maxHito = h as HitoMacro;
      }
    }

    // 2. Ranking de Contratistas con Menor Cumplimiento por Sucursal / Proyecto
    const todosContratistas = [
      {
        contratista: 'ESTRUCTURAS & CONCRETOS S.A.S.',
        sucursal: 'CALI' as Sucursal,
        tipoContrato: 'TODO_COSTO' as const,
        tareasProgramadas: 28,
        tareasCumplidas: 14,
        porcentajeCumplimiento: 50,
        diasAtrasoTotal: 46
      },
      {
        contratista: 'INGENIERIA DE FACHADAS DEL VALLE',
        sucursal: 'CALI' as Sucursal,
        tipoContrato: 'MANO_OBRA' as const,
        tareasProgramadas: 22,
        tareasCumplidas: 12,
        porcentajeCumplimiento: 55,
        diasAtrasoTotal: 34
      },
      {
        contratista: 'CONSTRUCTORA ANDINA DE PISOS S.A.',
        sucursal: 'BOGOTA' as Sucursal,
        tipoContrato: 'TODO_COSTO' as const,
        tareasProgramadas: 34,
        tareasCumplidas: 20,
        porcentajeCumplimiento: 59,
        diasAtrasoTotal: 41
      },
      {
        contratista: 'REDES HIDRAULICAS DE SANTANDER',
        sucursal: 'BUCARAMANGA' as Sucursal,
        tipoContrato: 'MANO_OBRA' as const,
        tareasProgramadas: 26,
        tareasCumplidas: 16,
        porcentajeCumplimiento: 62,
        diasAtrasoTotal: 29
      },
      {
        contratista: 'DRYWALL & ACABADOS DEL CARIBE',
        sucursal: 'BARRANQUILLA' as Sucursal,
        tipoContrato: 'MANO_OBRA' as const,
        tareasProgramadas: 20,
        tareasCumplidas: 13,
        porcentajeCumplimiento: 65,
        diasAtrasoTotal: 24
      },
      {
        contratista: 'INSTALACIONES ELECTRICAS BOLIVAR',
        sucursal: 'CARTAGENA' as Sucursal,
        tipoContrato: 'TODO_COSTO' as const,
        tareasProgramadas: 18,
        tareasCumplidas: 12,
        porcentajeCumplimiento: 67,
        diasAtrasoTotal: 22
      },
      {
        contratista: 'CARPINTERIAS METALICAS DE OCCIDENTE',
        sucursal: 'CALI' as Sucursal,
        tipoContrato: 'TODO_COSTO' as const,
        tareasProgramadas: 16,
        tareasCumplidas: 11,
        porcentajeCumplimiento: 69,
        diasAtrasoTotal: 19
      }
    ];

    const rankingFiltrado = todosContratistas
      .filter(c => sucursal === 'TODAS' || c.sucursal === sucursal)
      .sort((a, b) => a.porcentajeCumplimiento - b.porcentajeCumplimiento);

    // 3. Pareto 80/20 de Causas Raíz de Desviación
    const causasRaw = [
      { causa: '01. Falta de frentes liberados por contratista predecesor', frecuencia: 46 },
      { causa: '03. Retraso en suministro de materiales de inventario / compras', frecuencia: 38 },
      { causa: '02. Mano de obra insuficiente del contratista', frecuencia: 29 },
      { causa: '07. Modificaciones o indefinición de diseños de ingeniería', frecuencia: 21 },
      { causa: '04. Atraso en legalización de contrato / acta de inicio', frecuencia: 17 },
      { causa: '06. Retest o corrección de no conformidades de calidad', frecuencia: 13 },
      { causa: '05. Condiciones climáticas adversas (lluvias)', frecuencia: 9 },
      { causa: '08. Incumplimiento de requisitos de SST / permisos de trabajo', frecuencia: 6 }
    ];

    const totalFrecuencia = causasRaw.reduce((acc, c) => acc + c.frecuencia, 0);
    let acumulado = 0;
    const paretoCausas = causasRaw.map(c => {
      const pct = Math.round((c.frecuencia / totalFrecuencia) * 100);
      acumulado += pct;
      return {
        causa: c.causa,
        frecuencia: c.frecuencia,
        porcentaje: pct,
        porcentajeAcumulado: Math.min(100, acumulado)
      };
    });

    // 4. Momento Predominante de Desviación (VarComien vs VarFin)
    const baseInicio = sucursal === 'CALI' ? 48 : sucursal === 'BOGOTA' ? 62 : 158;
    const baseFin = sucursal === 'CALI' ? 112 : sucursal === 'BOGOTA' ? 144 : 348;
    const totalDiasAtrasoInicio = Math.round(baseInicio * factorAcumulado);
    const totalDiasAtrasoFin = Math.round(baseFin * factorAcumulado);
    const totalDias = totalDiasAtrasoInicio + totalDiasAtrasoFin;
    const pctInicio = Math.round((totalDiasAtrasoInicio / totalDias) * 100);
    const pctFin = Math.round((totalDiasAtrasoFin / totalDias) * 100);

    const momentoPredominante: 'INICIO_RESTRICCIONES' | 'EJECUCION_OBRA' | 'EQUILIBRADO' =
      pctFin > 60 ? 'EJECUCION_OBRA' : pctInicio > 60 ? 'INICIO_RESTRICCIONES' : 'EQUILIBRADO';

    const ppcPromedioMes = sucursal === 'CALI' ? 71 : sucursal === 'BOGOTA' ? 74 : sucursal === 'BUCARAMANGA' ? 76 : 73;
    const proyectosEvaluados = sucursal === 'CALI' ? 4 : sucursal === 'BOGOTA' ? 8 : sucursal === 'BUCARAMANGA' ? 12 : 28;

    return {
      mes,
      sucursalFiltro: sucursal,
      hitoMacroMayorImpacto: maxHito,
      diasAtrasoPorHitoMacro,
      rankingContratistas: rankingFiltrado,
      paretoCausas,
      ratioInicioVsFin: {
        totalDiasAtrasoInicio,
        totalDiasAtrasoFin,
        momentoPredominante,
        porcentajeDesviacionInicio: pctInicio,
        porcentajeDesviacionFin: pctFin
      },
      ppcPromedioMes,
      proyectosEvaluados
    };
  }

  /**
   * Obtiene el consolidado gerencial mensual de LOOKAHEAD y acuerdos de servicio (SLAs)
   */
  static getConsolidadoLookahead(mes: string = '2026-11', sucursal: Sucursal = 'TODAS'): GerenciaLookaheadConsolidado {
    const cumplimientoSlaPorArea: Record<AreaResponsableSLA, {
      total: number;
      aTiempo: number;
      vencidas: number;
      porcentajeCumplimiento: number;
      diasDemoraPromedio: number;
    }> = {
      COMPRAS_INVENTORY: {
        total: 58,
        aTiempo: 39,
        vencidas: 19,
        porcentajeCumplimiento: 67,
        diasDemoraPromedio: 14
      },
      CONTRATACIONES: {
        total: 42,
        aTiempo: 26,
        vencidas: 16,
        porcentajeCumplimiento: 62,
        diasDemoraPromedio: 18
      },
      DISENO: {
        total: 24,
        aTiempo: 17,
        vencidas: 7,
        porcentajeCumplimiento: 71,
        diasDemoraPromedio: 9
      },
      SST: {
        total: 35,
        aTiempo: 32,
        vencidas: 3,
        porcentajeCumplimiento: 91,
        diasDemoraPromedio: 3
      },
      OBRA_RESIDENCIA: {
        total: 65,
        aTiempo: 52,
        vencidas: 13,
        porcentajeCumplimiento: 80,
        diasDemoraPromedio: 6
      }
    };

    const compuertasTotales = Object.values(cumplimientoSlaPorArea).reduce((acc, c) => acc + c.total, 0);
    const compuertasLiberadasATiempo = Object.values(cumplimientoSlaPorArea).reduce((acc, c) => acc + c.aTiempo, 0);
    const compuertasVencidasCriticas = Object.values(cumplimientoSlaPorArea).reduce((acc, c) => acc + c.vencidas, 0);

    return {
      mes,
      compuertasTotales,
      compuertasLiberadasATiempo,
      compuertasVencidasCriticas,
      cumplimientoSlaPorArea
    };
  }

  /**
   * Obtiene el consolidado gerencial de CALIDAD (Sellos, Retenciones 20%, Desfase de Muestreo)
   */
  static getConsolidadoCalidad(mes: string = '2026-11', sucursal: Sucursal = 'TODAS'): GerenciaCalidadConsolidado & {
    desfasesMuestreo: {
      alertasAtraso15d: number;
      alertasCriticas2m: number;
      detalleDesfases: Array<{
        proyecto: string;
        actividad: string;
        avanceWorkplannerPct: number;
        unidadesEjecutadas: number;
        unidadesMuestreadas: number;
        desfaseDias: number;
        estado: 'ALERTA_15D' | 'CRITICA_2M_VALIDAR_LEAN';
      }>;
    };
  } {
    const calidadPorHitoMacro: Record<HitoMacroCalidad, number> = {
      ESTRUCTURA_VANOS: 84,
      REDES_HIDROSANITARIAS: 89,
      MUROS_LIVIANOS: 78,
      AFINADO_PISO: 81,
      FRISOS_MUROS: 74,
      PISOS_ENCHAPES: 79,
      ENCHAPES_MUROS: 76
    };

    const rankingContratistasRetenciones = [
      {
        contratista: 'ACABADOS & FRISOS S.A.S.',
        sucursal: 'CALI' as Sucursal,
        lotesAuditados: 12,
        lotesAprobados: 7,
        retencionesAplicadas: 5,
        indiceCalidad: 58
      },
      {
        contratista: 'DRYWALL & PISOS ANDINOS',
        sucursal: 'BOGOTA' as Sucursal,
        lotesAuditados: 16,
        lotesAprobados: 11,
        retencionesAplicadas: 4,
        indiceCalidad: 69
      },
      {
        contratista: 'ENCHAPES DEL VALLE LTDA.',
        sucursal: 'CALI' as Sucursal,
        lotesAuditados: 14,
        lotesAprobados: 10,
        retencionesAplicadas: 4,
        indiceCalidad: 71
      },
      {
        contratista: 'CONSTRUCTORA DE REVOQUES DEL ORIENTE',
        sucursal: 'BUCARAMANGA' as Sucursal,
        lotesAuditados: 10,
        lotesAprobados: 7,
        retencionesAplicadas: 3,
        indiceCalidad: 70
      }
    ].filter(c => sucursal === 'TODAS' || c.sucursal === sucursal);

    const paretoDefectos: Array<{ defecto: DefectoCalidadPredominante; conteo: number; porcentaje: number }> = [
      { defecto: 'PLOMOS_Y_NIVELES', conteo: 48, porcentaje: 34 },
      { defecto: 'VANOS_DESCUADRADOS', conteo: 36, porcentaje: 26 },
      { defecto: 'DESPRENDIMIENTOS_HUECOS', conteo: 24, porcentaje: 17 },
      { defecto: 'FISURAS_GRIETAS', conteo: 18, porcentaje: 13 },
      { defecto: 'DESVIO_ESPECIFICACION', conteo: 9, porcentaje: 6 },
      { defecto: 'FUGAS_ESTANQUEIDAD', conteo: 6, porcentaje: 4 }
    ];

    const detalleDesfases = [
      {
        proyecto: 'Belaterra Pietra (Torre 1)',
        actividad: 'Frisos de Muros y Morteros de Piso',
        avanceWorkplannerPct: 65,
        unidadesEjecutadas: 26,
        unidadesMuestreadas: 6,
        desfaseDias: 68,
        estado: 'CRITICA_2M_VALIDAR_LEAN' as const
      },
      {
        proyecto: 'Belaterra Pietra (Torre 1)',
        actividad: 'Enchapes y Pisos Porcelanato',
        avanceWorkplannerPct: 40,
        unidadesEjecutadas: 16,
        unidadesMuestreadas: 4,
        desfaseDias: 22,
        estado: 'ALERTA_15D' as const
      },
      {
        proyecto: 'Country Park (Torre 2)',
        actividad: 'Mampostería y Vanos Estructurales',
        avanceWorkplannerPct: 75,
        unidadesEjecutadas: 38,
        unidadesMuestreadas: 10,
        desfaseDias: 74,
        estado: 'CRITICA_2M_VALIDAR_LEAN' as const
      },
      {
        proyecto: 'Reserva de Alcalá',
        actividad: 'Redes Hidrosanitarias Interiores',
        avanceWorkplannerPct: 50,
        unidadesEjecutadas: 20,
        unidadesMuestreadas: 7,
        desfaseDias: 18,
        estado: 'ALERTA_15D' as const
      }
    ];

    const alertasAtraso15d = detalleDesfases.filter(d => d.estado === 'ALERTA_15D').length;
    const alertasCriticas2m = detalleDesfases.filter(d => d.estado === 'CRITICA_2M_VALIDAR_LEAN').length;

    return {
      mes,
      indiceCalidadCorporativo: 82,
      totalUnidadesAuditadas: 486,
      totalRetenciones20Aplicadas: 16,
      valorTotalRetencionesEstimado: 124500000, // ~124.5M COP
      calidadPorHitoMacro,
      rankingContratistasRetenciones,
      paretoDefectos,
      desfasesMuestreo: {
        alertasAtraso15d,
        alertasCriticas2m,
        detalleDesfases
      }
    };
  }

  /**
   * Obtiene el consolidado gerencial de CTO (Ley 1796 de 2016)
   */
  static getConsolidadoCto(mes: string = '2026-11', sucursal: Sucursal = 'TODAS'): GerenciaCtoConsolidado & {
    distribucionFasesSupervisor: Record<EstadoRevisionSupervisor, number>;
    zonasComunesTorre1: Array<{
      zonaComun: string;
      estado: 'COMPLETADO' | 'EN_CURSO' | 'BLOQUEANTE';
      avancePct: number;
      impactoTorre1: string;
    }>;
  } {
    const madurezPromedioPorSucursal: Record<Sucursal, number> = {
      TODAS: 78,
      CALI: 74,
      BUCARAMANGA: 85,
      BOGOTA: 80,
      BARRANQUILLA: 72,
      CARTAGENA: 79,
      'SANTA MARTA': 76,
    };

    const todasAlertas = [
      {
        proyecto: 'Belaterra Pietra',
        sucursal: 'CALI' as Sucursal,
        torre: 'Torre 1',
        mesesParaAlistamiento: 2.5,
        indiceMadurez: 64,
        itemsCriticosPendientes: 12,
        responsablesIncumplimiento: ['INGENIERIA_DISENO', 'CONTRATISTA_FACHADAS', 'PROVEEDOR_ASCENSORES']
      },
      {
        proyecto: 'Cerros de Santa María',
        sucursal: 'BUCARAMANGA' as Sucursal,
        torre: 'Torre 3',
        mesesParaAlistamiento: 1.8,
        indiceMadurez: 71,
        itemsCriticosPendientes: 9,
        responsablesIncumplimiento: ['CONTRATISTA_REDES_RCI', 'VENTANERIA_CARIBE']
      },
      {
        proyecto: 'Novus Gran Reserva',
        sucursal: 'BOGOTA' as Sucursal,
        torre: 'Torre 2',
        mesesParaAlistamiento: 3.0,
        indiceMadurez: 78,
        itemsCriticosPendientes: 7,
        responsablesIncumplimiento: ['CONTRATISTA_SUBESTACION', 'DISENO_ELECTRICO']
      },
      {
        proyecto: 'Living Cartagena',
        sucursal: 'CARTAGENA' as Sucursal,
        torre: 'Torre 1',
        mesesParaAlistamiento: 2.0,
        indiceMadurez: 62,
        itemsCriticosPendientes: 14,
        responsablesIncumplimiento: ['PLANTA_TRATAMIENTO', 'DISENO_ESTRUCTURAL_ACTAS']
      }
    ];

    const alertasFiltradas = todasAlertas.filter(a => sucursal === 'TODAS' || a.sucursal === sucursal);

    const distribucionFasesSupervisor: Record<EstadoRevisionSupervisor, number> = {
      '1_ENTREGA_RESPUESTA_INGENIERIA': 28, // Incumplimiento o en espera
      '2_REVISION_SUPERVISOR_PENDIENTE': 46, // En trámite de revisión
      '3_APROBACION_SUPERVISOR_TECNICO': 142 // Cumple con aprobación formal
    };

    const zonasComunesTorre1 = [
      {
        zonaComun: 'Tanque RCI y Tanque de Agua Potable',
        estado: 'BLOQUEANTE' as const,
        avancePct: 45,
        impactoTorre1: 'Prueba de estanqueidad obligatoria para habitabilidad y radicación CTO Torre 1'
      },
      {
        zonaComun: 'Subestación Eléctrica y Cuarto de Transformadores',
        estado: 'EN_CURSO' as const,
        avancePct: 70,
        impactoTorre1: 'Certificación RETIE de áreas comunes requerida para energización definitiva'
      },
      {
        zonaComun: 'Planta Eléctrica de Emergencia',
        estado: 'COMPLETADO' as const,
        avancePct: 100,
        impactoTorre1: 'Protocolo de arranque e interconexión con tablero de transferencia certificado'
      },
      {
        zonaComun: 'Cuarto de Bombas y Red de Presión Constante',
        estado: 'EN_CURSO' as const,
        avancePct: 60,
        impactoTorre1: 'Suministro hidroneumático para primeros 12 pisos de Torre 1'
      },
      {
        zonaComun: 'Ascensores y Equipos de Transporte Vertical',
        estado: 'BLOQUEANTE' as const,
        avancePct: 40,
        impactoTorre1: 'Ajuste de guías y certificación técnica ONAC de operación segura'
      },
      {
        zonaComun: 'Vía de Acceso Principal y Portería',
        estado: 'EN_CURSO' as const,
        avancePct: 80,
        impactoTorre1: 'Ruta de evacuación y acceso peatonal/vehicular legalizado'
      }
    ];

    return {
      mes,
      torresEnSeguimiento: sucursal === 'TODAS' ? 18 : 4,
      torresEnRiesgoCritico: alertasFiltradas.length,
      torresConZonasComunesPendientes: 3,
      madurezPromedioPorSucursal,
      alertasCriticasAlistamiento: alertasFiltradas,
      distribucionFasesSupervisor,
      zonasComunesTorre1
    };
  }
}

