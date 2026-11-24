# EGM Drift Detection Report — 2026-11-12

## src/services/README.md

* **Desconexión entre WbsView y servicios de programación**: `wbsParser.ts` extrae correctamente tareas de archivos WorkPlanner `.xlsx` y `.csv`, pero `WbsView.tsx` almacena el resultado únicamente en su estado React local (`useState`) sin propagar los datos cargados a `BaselineService` ni a `dataStorageService`. Como consecuencia, `BitacoraView.tsx` y `GanttGerencialView.tsx` continúan leyendo datos estáticos de `initialWbsData` en lugar de la sábana recién cargada.
* **Proyecto por defecto en Lookahead Feed**: En `baselineService.ts`, el método `BaselineService.getRestriccionesLookaheadFeed(proyecto: string = 'Belaterra Pietra')` tiene cableado un valor por defecto que puede enmascarar la ausencia del proyecto seleccionado en llamadas sin argumentos.
* **Modo Offline y Mock en SharePointService**: `SharePointService` no implementa cola de reintentos offline (`IndexedDB` o `localStorage buffer`) cuando la conexión REST con Microsoft Graph falla en campo.

## src/components/views/README.md

* **Falta de exportación CSV en Bitácora**: `BitacoraView.tsx` almacena los datos de calificación en el histórico `ReporteSemanalBitacora`, pero no cuenta con un botón directo para exportar a CSV/Excel la sábana calificada con las columnas contractuales requeridas (`Sucursal`, `Proyecto`, `Agrupacion`, `EDT`, `Nombre actividad`, `W`, `Comienzo Línea Base`, `Fin Línea Base`, `Comienzo Real`, `Fin Real`, `Cumple/No Cumple`, `Causa`, `Comentarios`).
* **Ausencia de acción "Congelar Línea Base" en WbsView**: `WbsView.tsx` permite cargar archivos de cronograma, pero no expone el botón de acción para invocar `BaselineService.guardarLineaBase()`, obligando al usuario a realizar este proceso exclusivamente desde el modal de advertencia de `BitacoraView.tsx`.
* **Fuente estática en Gantt Gerencial**: `GanttGerencialView.tsx` inicializa el motor CPM (`CpmEngine.computeSchedule`) directamente desde `initialWbsData` estático, sin consultar si el usuario ha congelado o cargado una sábana actualizada en `BaselineService`.

## src/types/README.md

* **Divergencia entre WeeklyLog y CalificacionActividad**: `src/types/index.ts` mantiene la interfaz legacy `WeeklyLog` con un enum de 8 `CausaRaiz`, mientras que el nuevo motor de Bitácora y Lookahead (`src/services/baselineService.ts`) utiliza `CalificacionActividad` desacoplada en 7 causas Lookahead (`RESTRICCIONES_LOOKAHEAD`) y 5 causas operativas de fin (`CAUSAS_OPERATIVAS_NO_FIN`).

## README.md

* **Desfase de versión de React**: El archivo `README.md` indica `React 18` en la sección de stack tecnológico, pero el archivo `package.json` tiene instalada la versión `React 19` (`^19.3.1`).
* **Catálogo de módulos incompleto**: No incluye en la lista de módulos el nuevo `Gantt Gerencial Ejecutivo` (con restricción de profundidad a Nivel 6 Torre / Nivel 5 resto y semaforización de holguras) ni el motor CPM bidireccional integrado en la Bitácora.

