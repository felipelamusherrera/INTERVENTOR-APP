import {
  BitacoraDetalleActividad,
  BitacoraSemanalCabecera,
  HitoMacro,
  MomentoDesviacion,
  Sucursal,
  GerenciaTiemposConsolidado
} from '../types';

export class BitacoraCalculoService {
  /**
   * Determina el momento exacto de desviación de una actividad
   */
  static calcularMomentoDesviacion(varComien: number, varFin: number): MomentoDesviacion {
    if (varFin <= 0 && varComien <= 0) {
      return 'A_TIEMPO';
    }
    if (varComien > 0 && varFin <= varComien) {
      return 'DESVIACION_INICIO';
    }
    if (varComien <= 0 && varFin > 0) {
      return 'DESVIACION_EJECUCION';
    }
    if (varComien > 0 && varFin > varComien) {
      return 'DESVIACION_CRITICA_MIXTA';
    }
    return varFin > 0 ? 'DESVIACION_EJECUCION' : 'A_TIEMPO';
  }

  /**
   * Consolida la cabecera semanal ejecutiva (Lista 1) a partir del detalle de actividades (Lista 2)
   */
  static consolidarCabeceraSemanal(params: {
    proyectoId: string;
    sucursal: Sucursal;
    semana: number;
    anio: number;
    mes: string;
    fechaCorte: string;
    residenteNombre: string;
    actividades: BitacoraDetalleActividad[];
  }): BitacoraSemanalCabecera {
    const acts = params.actividades;
    const total = acts.length;

    if (total === 0) {
      return {
        id: `${params.proyectoId}-SEM${params.semana}-${params.anio}`,
        proyectoId: params.proyectoId,
        sucursal: params.sucursal,
        semana: params.semana,
        anio: params.anio,
        mes: params.mes,
        fechaCorte: params.fechaCorte,
        residenteNombre: params.residenteNombre,
        totalActividadesProgramadas: 0,
        actividadesIniciadasATiempo: 0,
        actividadesFinalizadasATiempo: 0,
        ppcInicioPorcentaje: 100,
        ppcFinPorcentaje: 100,
        ppcGlobalPorcentaje: 100,
        hitoMayorImpacto: 'ESTRUCTURA',
        contratistaMenorCumplimiento: 'Sin contratistas evaluados',
        contratistaMenorCumplimientoPorcentaje: 100,
        causaPrincipalDesviacion: 'Sin desviaciones',
        momentoPredominanteDesviacion: 'EQUILIBRADO',
        diasAtrasoInicioSemana: 0,
        diasAtrasoFinSemana: 0,
        diasImpactoRutaCriticaSemana: 0,
        sincronizadoSharePoint: false
      };
    }

    // 1. Conteo de cumplimiento PPC
    let iniciadasATiempo = 0;
    let finalizadasATiempo = 0;
    let diasAtrasoInicio = 0;
    let diasAtrasoFin = 0;
    let diasImpactoCritico = 0;

    // Acumuladores para diagnósticos
    const atrasoPorHito: Partial<Record<HitoMacro, number>> = {};
    const rendimientoPorContratista: Record<string, { total: number; cumplidas: number }> = {};
    const conteoCausas: Record<string, number> = {};

    acts.forEach(act => {
      // PPC Inicio y Fin
      if (act.cumpleInicio) {
        iniciadasATiempo++;
      } else {
        diasAtrasoInicio += Math.max(0, act.varComienDias);
        if (act.causaNoInicio) {
          conteoCausas[act.causaNoInicio] = (conteoCausas[act.causaNoInicio] || 0) + 1;
        }
      }

      if (act.cumpleFin) {
        finalizadasATiempo++;
      } else {
        diasAtrasoFin += Math.max(0, act.varFinDias);
        if (act.causaNoFin) {
          conteoCausas[act.causaNoFin] = (conteoCausas[act.causaNoFin] || 0) + 1;
        }
      }

      // Impacto en Ruta Crítica por Hito Macro
      if (act.esRutaCritica) {
        diasImpactoCritico += Math.max(0, act.varFinDias);
        atrasoPorHito[act.hitoMacro] = (atrasoPorHito[act.hitoMacro] || 0) + Math.max(0, act.varFinDias);
      }

      // Rendimiento por Contratista
      const cont = act.contratista ? act.contratista.trim() : 'Sin Contratista';
      if (!rendimientoPorContratista[cont]) {
        rendimientoPorContratista[cont] = { total: 0, cumplidas: 0 };
      }
      rendimientoPorContratista[cont].total++;
      if (act.cumpleInicio && act.cumpleFin) {
        rendimientoPorContratista[cont].cumplidas++;
      }
    });

    const ppcInicio = Math.round((iniciadasATiempo / total) * 100);
    const ppcFin = Math.round((finalizadasATiempo / total) * 100);
    const ppcGlobal = Math.round((ppcInicio + ppcFin) / 2);

    // 2. Diagnóstico 1: Hito Macro de Mayor Impacto
    let hitoMayorImpacto: HitoMacro = 'ESTRUCTURA';
    let maxAtrasoHito = -1;
    for (const [h, atraso] of Object.entries(atrasoPorHito)) {
      if ((atraso as number) > maxAtrasoHito) {
        maxAtrasoHito = atraso as number;
        hitoMayorImpacto = h as HitoMacro;
      }
    }

    // 3. Diagnóstico 2: Contratista con Menor Cumplimiento
    let peorContratista = 'Sin contratistas críticos';
    let peorPorcentaje = 101;
    for (const [cont, stats] of Object.entries(rendimientoPorContratista)) {
      if (stats.total >= 1) {
        const pct = Math.round((stats.cumplidas / stats.total) * 100);
        if (pct < peorPorcentaje) {
          peorPorcentaje = pct;
          peorContratista = `${cont} (${pct}% cumplimiento)`;
        }
      }
    }
    if (peorPorcentaje > 100) peorPorcentaje = 100;

    // 4. Diagnóstico 3: Causa Raíz Principal
    let causaPrincipal = 'Cumplimiento general';
    let maxConteoCausa = 0;
    for (const [causa, count] of Object.entries(conteoCausas)) {
      if (count > maxConteoCausa) {
        maxConteoCausa = count;
        causaPrincipal = causa;
      }
    }

    // 5. Diagnóstico 4: Momento Predominante de Desviación
    let momentoPredominante: 'INICIO_RESTRICCIONES' | 'EJECUCION_OBRA' | 'EQUILIBRADO' = 'EQUILIBRADO';
    if (diasAtrasoInicio > diasAtrasoFin * 1.25 && diasAtrasoInicio > 0) {
      momentoPredominante = 'INICIO_RESTRICCIONES';
    } else if (diasAtrasoFin > diasAtrasoInicio * 1.25 && diasAtrasoFin > 0) {
      momentoPredominante = 'EJECUCION_OBRA';
    }

    return {
      id: `${params.proyectoId}-SEM${params.semana}-${params.anio}`,
      proyectoId: params.proyectoId,
      sucursal: params.sucursal,
      semana: params.semana,
      anio: params.anio,
      mes: params.mes,
      fechaCorte: params.fechaCorte,
      residenteNombre: params.residenteNombre,
      totalActividadesProgramadas: total,
      actividadesIniciadasATiempo: iniciadasATiempo,
      actividadesFinalizadasATiempo: finalizadasATiempo,
      ppcInicioPorcentaje: ppcInicio,
      ppcFinPorcentaje: ppcFin,
      ppcGlobalPorcentaje: ppcGlobal,
      hitoMayorImpacto,
      contratistaMenorCumplimiento: peorContratista,
      contratistaMenorCumplimientoPorcentaje: peorPorcentaje,
      causaPrincipalDesviacion: causaPrincipal,
      momentoPredominanteDesviacion: momentoPredominante,
      diasAtrasoInicioSemana: diasAtrasoInicio,
      diasAtrasoFinSemana: diasAtrasoFin,
      diasImpactoRutaCriticaSemana: diasImpactoCritico,
      sincronizadoSharePoint: false
    };
  }

  /**
   * Agrega el reporte gerencial consolidado mensual entre múltiples proyectos
   */
  static consolidarGerenciaTiemposMensual(
    cabeceras: BitacoraSemanalCabecera[],
    mesFiltro: string,
    sucursalFiltro: Sucursal = 'TODAS'
  ): GerenciaTiemposConsolidado {
    const filtradas = cabeceras.filter(c => {
      const matchMes = c.mes === mesFiltro;
      const matchSuc = sucursalFiltro === 'TODAS' || c.sucursal === sucursalFiltro;
      return matchMes && matchSuc;
    });

    const diasAtrasoPorHito: Record<HitoMacro, number> = {
      URBANISMO: 0,
      CIMENTACION: 0,
      ESTRUCTURA: 0,
      MAMPOSTERIA: 0,
      FACHADAS: 0,
      REDES_HIDROSANITARIAS: 0,
      REDES_ELECTRICAS_GAS: 0,
      ACABADOS_OBRA_GRIS: 0,
      ACABADOS_OBRA_BLANCA: 0,
      CARPINTERIAS: 0,
      EQUIPOS_ESPECIALES: 0,
      ZONAS_COMUNES_ESENCIALES: 0,
      CIERRE_ENTREGAS: 0
    };

    let totalInicio = 0;
    let totalFin = 0;
    let sumaPpc = 0;

    filtradas.forEach(c => {
      diasAtrasoPorHito[c.hitoMayorImpacto] += c.diasImpactoRutaCriticaSemana;
      totalInicio += c.diasAtrasoInicioSemana;
      totalFin += c.diasAtrasoFinSemana;
      sumaPpc += c.ppcGlobalPorcentaje;
    });

    // Encontrar hito macro nacional con mayor impacto
    let maxHito: HitoMacro = 'ESTRUCTURA';
    let maxDias = -1;
    for (const [h, d] of Object.entries(diasAtrasoPorHito)) {
      if (d > maxDias) {
        maxDias = d;
        maxHito = h as HitoMacro;
      }
    }

    const totalDias = totalInicio + totalFin;
    const pctInicio = totalDias > 0 ? Math.round((totalInicio / totalDias) * 100) : 50;
    const pctFin = totalDias > 0 ? Math.round((totalFin / totalDias) * 100) : 50;

    let momento: 'INICIO_RESTRICCIONES' | 'EJECUCION_OBRA' | 'EQUILIBRADO' = 'EQUILIBRADO';
    if (pctInicio > 60) momento = 'INICIO_RESTRICCIONES';
    else if (pctFin > 60) momento = 'EJECUCION_OBRA';

    return {
      mes: mesFiltro,
      sucursalFiltro,
      hitoMacroMayorImpacto: maxHito,
      diasAtrasoPorHitoMacro: diasAtrasoPorHito,
      rankingContratistas: [],
      paretoCausas: [],
      ratioInicioVsFin: {
        totalDiasAtrasoInicio: totalInicio,
        totalDiasAtrasoFin: totalFin,
        momentoPredominante: momento,
        porcentajeDesviacionInicio: pctInicio,
        porcentajeDesviacionFin: pctFin
      },
      ppcPromedioMes: filtradas.length > 0 ? Math.round(sumaPpc / filtradas.length) : 0,
      proyectosEvaluados: filtradas.length
    };
  }
}

