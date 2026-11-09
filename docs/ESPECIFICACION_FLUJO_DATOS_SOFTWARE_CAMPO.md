# Especificación Técnica del Flujo de Información: Software Base ↔ Captura en Campo (Marval S.A.S.)

> **Código:** ET-PCO-DATAFLOW-001  
> **Versión:** 1.0.0  
> **Fecha:** Noviembre 2026  
> **Alineado con:** `docs/CONTEXTO_Y_ESTADO_DEL_PROYECTO.md` y `docs/pco-arquitectura-ui-ux-blueprint.md`  
> **Skills Aplicadas:** `spec-driven-development`, `schema-mapping`, `data-autocleaning`, `api-and-interface-design`, `mobile-native`, `marval-report-design`

---

## 1. Problema y Objetivo de la Arquitectura

Actualmente existe una **desconexión crítica** entre los reportes emitidos por el software corporativo y la realidad operativa de los frentes de obra:

1. **Los reportes de software (WorkPlanner, JD Edwards, Control, ARI)** ofrecen la foto de lo planificado y lo contractual, pero **no explican el "por qué" de las desviaciones** ni registran las alertas tempranas que solo el interventor y el residente ven en campo.
2. **La captura en campo actual** se encuentra atomizada en chats de WhatsApp, libretas personales, Excels aislados o formatos físicos propensos a pérdida y desactualización.
3. **El objetivo de este flujo** es crear un puente bidireccional automatizado: **inyectar la estructura del software oficial** (WBS, fechas contractuales, presupuesto) y **enriquecerla en tiempo real con la captura en campo** (causas de atraso, sellos de calidad MA-SIG-CAL-001, compuertas Lookahead, personal real y CTO Ley 1796), produciendo un dataset unificado auditable y exportable a Aconex y a la Alta Gerencia.

---

## 2. Arquitectura Global del Flujo de Datos

```mermaid
flowchart TD
    subgraph FUENTES_SOFTWARE["1. SOFTWARE BASE (SISTEMAS OFICIALES)"]
        WP["WorkPlanner / Primavera<br/>(Cronograma WBS, Fechas Previstas, Curva S)"]
        JD["JD Edwards (ERP)<br/>(Presupuesto VIV/URB/ADMINIS, Inventarios)"]
        CTRL["Control de Contratos<br/>(Fechas Contratación, Anticipos, OW)"]
        ARI["ARI<br/>(Ingreso de Personal Huella/Torniquete)"]
    end

    subgraph INGESTA["2. MOTOR DE EXTRACCIÓN Y LIMPIEZA"]
        EXTRACT["Parser Ingestor (wbsParser.ts / markitdown)<br/>Extracción de CSV, XLSX y Reportes"]
        CLEAN["data-autocleaning<br/>Reglas de Coherencia, Fechas y Formatos"]
        WP --> EXTRACT
        JD --> EXTRACT
        CTRL --> EXTRACT
        ARI --> EXTRACT
        EXTRACT --> CLEAN
    end

    subgraph HUB["3. HUB DE DATOS UNIFICADO (MODELO MAESTRO)"]
        CANONICAL[("Dataset Maestro Consolidado<br/>(SharePoint Lists / Fabric Lakehouse / Local Store)")]
        CLEAN --> CANONICAL
    end

    subgraph CAPTURA["4. APLICATIVO DE CAMPO (MÓVIL / PWA)"]
        APP["interventor-app (PWA Móvil)<br/>mobile-native + antislop-layoutmobile"]
        M1["Módulo 04: Bitácora Semanal 3 min (5 Causas CNC)"]
        M2["Módulo 05: Lookahead 7 Compuertas (Índice IP %)"]
        M3["Módulo 08: Calidad Sellos (MA-SIG-CAL-001)"]
        M4["Módulo 09: Inspección CTO (Ley 1796)"]
        M5["Módulo 06: Conteo Cuadrillas vs ARI"]
        APP --- M1 & M2 & M3 & M4 & M5
    end

    CANONICAL <-->|Sincronización Bidireccional (Offline-First)| APP

    subgraph SALIDAS["5. GOBERNANZA Y PRODUCTOS FINALES"]
        V0["Vista Cero: Sábana Gerencial (Dr. Sergio)"]
        ACONEX["Reporte PDF 1-Página para Aconex (Óscar Tapias)"]
        BSC["Informe Mensual Ejecutivo BSC (Rubén Darío Ortega)"]
        PBI["Tablero Fabric / Power BI"]
    end

    CANONICAL --> V0 & ACONEX & BSC & PBI
```

---

## 3. Mapping Manifesto: Matriz de Integración de Esquemas

La clave del éxito del flujo radica en definir **qué campos provienen del software** y **cuáles son agregados exclusivamente en campo**:

| Campo Maestro | Tipo | Fuente Original | ¿Quién lo nutre? | Regla de Negocio / Transformación |
|---|---|---|---|---|
| `id_proyecto` | `string` | Software Base (JD/WP) | Ingesta Automática | Código único (ej. `BELA` para Belaterra Pietra). |
| `sucursal` | `enum` | Software Base (JD) | Ingesta Automática | `CALI`, `BUCARAMANGA`, `BOGOTA`, `BARRANQUILLA`, `CARTAGENA`. |
| `torre` | `string` | WorkPlanner (Nivel 5) | Ingesta Automática | Normalización: `Torre 1`, `Torre 2`, `Urbanismo`. |
| `wbs_codigo` | `string` | WorkPlanner (EDT) | Ingesta Automática | Código jerárquico (ej. `1.1.2.3.01`). |
| `macro_hito` | `enum` | Parser Heurístico | Ingesta Automática | Mapeo a los 12 Macro-Hitos estándar de Marval. |
| `fecha_inicio_base` | `date` | WorkPlanner (`ComienPrev`) | Ingesta Automática | Congelada en la línea base aprobada. |
| `fecha_fin_base` | `date` | WorkPlanner (`FinPrev`) | Ingesta Automática | Fecha pactada en programación oficial. |
| `fecha_fin_proyectada`| `date` | Algoritmo Curva S | Calculado | Ritmo de avance real mensual (4% a 7%). |
| `desviacion_inicio_dias` (`I`) | `integer` | WorkPlanner (`VarComien`) | Ingesta Automática | Delta entre inicio real e inicio previsto. |
| `desviacion_fin_dias` (`E`) | `integer` | WorkPlanner (`VarFin`) | Ingesta Automática | Delta de ejecución acumulado. |
| **`cumplio_semana`** | `boolean` | **Aplicativo Campo** | **Residente en Obra** | **¿Se ejecutó la meta semanal del frente?** |
| **`causa_raiz_atraso`**| `enum` | **Aplicativo Campo** | **Residente en Obra** | **Selector de las 5 causas internas Marval:**<br>1. Contratos<br>2. Contratistas/Personal<br>3. Formaleta<br>4. Equipos<br>5. Materiales/Compras<br>*(O externas: Clima, Suelos, Diseños, Licencias)*. |
| **`dias_impacto_campo`**| `integer` | **Aplicativo Campo** | **Residente en Obra** | Días netos de parálisis asignados a la causa. |
| **`compuertas_lookahead`**| `json` | **Aplicativo Campo** | **Residente / Interventor** | Estado binario de las 7 compuertas (Diseño, Contratos, Predecesora, Materiales, Mano de obra, Equipos, SST). |
| **`indice_ip_pct`** | `float` | Calculado en Campo | `interventor-app` | `(Compuertas Liberadas / 7) * 100`. |
| **`sello_calidad_resultado`**| `enum` | **Aplicativo Campo** | **Inspector de Calidad** | `0` (Cumple), `1` (No cumple), `2` (No cumple externo), `NA`. |
| **`sello_medicion_mm`**| `float` | **Aplicativo Campo** | **Inspector de Calidad** | Desviación milimétrica (regla de 3m / plomada). |
| **`personal_real_campo`**| `integer` | **Aplicativo Campo** | **Residente en Obra** | Conteo visual de oficiales y ayudantes en frente. |
| `personal_ari_molinete`| `integer` | ARI (Acceso) | Ingesta Automática | Registros biométricos de ingreso en portería. |
| **`indice_productividad`**| `float` | Cruce de Fuentes | Calculado | `(Personal Real / Personal Esperado) * Rendimiento`. |

---

## 4. Reglas de Limpieza y Calidad de Datos (`data-autocleaning`)

Para evitar contaminación de datos entre el software corporativo y la entrada de campo, se aplican 6 filtros obligatorios:

1. **Regla de Clave Compuesta Única:**  
   Cada registro se indexa como:  
   `Clave = {id_proyecto}_{torre}_{wbs_codigo}_{fecha_corte}`  
   Cualquier actualización en campo sobreescribe los campos de enriquecimiento sin duplicar la tarea del cronograma.
2. **Validación de Fechas Cronológicas:**  
   `fecha_fin_prevista >= fecha_inicio_prevista`. Si el reporte fuente viene con fechas inconsistentes por error de digitación en WorkPlanner, se activa la bandera `Alerta_Inconsistencia_WP`.
3. **Restricción de Entrada en Campo (Zero-Typing):**  
   En campo no se permite ingresar texto libre para causas de atraso principales; solo se seleccionan de las **5 causas homologadas** para garantizar la generación automática del gráfico Pareto.
4. **Tolerancia y Aprobación de Sellos (Norma MA-SIG-CAL-001):**  
   - Si `resultado == '1'` (No cumple), el campo `hallazgo_observacion` y `responsable_reproceso` son estrictamente obligatorios antes de permitir guardar.
5. **Cruce de Personal (ARI vs. Campo):**  
   Si `personal_real_campo > personal_ari_molinete * 1.05`, se genera advertencia por posible personal laborando sin registro de ingreso o ARL.

---

## 5. Experiencia de Usuario en Campo (`mobile-native`)

El aplicativo móvil en obra sigue una filosofía **"Anti-Fricción"**:

* **Tiempo máximo de diligenciamiento:** 3 minutos por residente al final de la jornada o en el comité de obra semanal.
* **Modo Offline-First:** Los datos se persisten en `localStorage` / `IndexedDB` y se sincronizan silenciosamente en cuanto el dispositivo detecta conexión Wi-Fi en el campamento o datos móviles.
* **Áreas Táctiles Optimizadas:** Botones mínimos de 48x48px utilizables incluso con guantes de seguridad o bajo luz solar intensa (alto contraste).

---

## 6. Salidas Ejecutivas Automatizadas

A partir de este flujo consolidado se alimentan directamente los módulos de reporte:

1. **Reporte Aconex (1-Página PDF):**  
   Genera automáticamente la carátula técnica con los hitos del cronograma, las 3 principales causas de atraso de la semana con su responsable y las firmas digitales de interventoría.
2. **Vista Cero (Matriz Gerencial):**  
   Calcula en tiempo real los semáforos de compuertas a **12M, 6M y 3M** antes de la fecha prometida de entrega para la Alta Gerencia (Dr. Sergio).
3. **Consolidado Mensual BSC:**  
   Exporta las métricas unificadas para el informe mensual corporativo de interventoría.

