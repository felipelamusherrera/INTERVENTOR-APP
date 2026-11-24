# Interventoría Core Services

## Overview
Core computational engines, schedulers, parsers, and data management services for the `INTERVENTOR-APP` construction oversight platform. This layer executes critical-path method (CPM) analysis, baseline management, resident qualification lifecycles, and external synchronization with Microsoft SharePoint and Excel/CSV schedules.

## Interface
- `CpmEngine`: Static class in `cpmEngine.ts` executing forward and backward scheduling passes, lag parsing (`CC`, `FC`, `FF`, `CF`), and total/free float calculation.
  - `CpmEngine.computeSchedule(rawRows)`: Analyzes tasks and returns `{ tasks: CpmTask[], summary: CpmProjectSummary }`.
  - `CpmEngine.parsePredecesora(raw, duraTarea)`: Converts WorkPlanner string syntax into structured `PredecessoraLink[]`.
- `BaselineService`: Static class in `baselineService.ts` managing project baseline freezes, weekly Monday-to-Sunday cutoffs, qualification rules, and Lookahead bridge.
  - `BaselineService.guardarLineaBase(proyecto, tasks, usuario)`: Freezes initial project baseline in local storage.
  - `BaselineService.tieneLineaBase(proyecto)`: Checks if a frozen baseline exists.
  - `BaselineService.getSemanaCorte(fechaInput)`: Derives Monday-to-Sunday window and week number.
  - `BaselineService.filtrarActividadesSemana(proyecto, semanaInfo, cpmTasks)`: Filters activities eligible for weekly resident evaluation.
  - `BaselineService.validarCierreReporte(actividades, calificaciones)`: Validates mandatory 100% qualification of critical tasks.
  - `BaselineService.cerrarReporteSemanal(...)`: Finalizes and persists official weekly inspection report.
  - `BaselineService.getRestriccionesLookaheadFeed(proyecto)`: Aggregates active field non-compliance causes into Lookahead gates.
  - `BaselineService.guardarResolucionLookahead(...)`: Persists management resolution of Lookahead gates.
- `ScheduleService`: Static class in `scheduleService.ts` managing the centralized active schedule, weekly progress updates, and reactive synchronization across all views.
  - `ScheduleService.getActiveSchedule(proyecto)`: Retrieves the project's active schedule tasks.
  - `ScheduleService.saveActiveSchedule(proyecto, tasks, fileName, actionType, usuario)`: Persists active schedule and freezes baseline or updates weekly progress.
  - `ScheduleService.getScheduleMetadata(proyecto)`: Returns metadata and baseline status.
- `wbsParser`: Schedule file parsers in `wbsParser.ts`.
  - `parseScheduleExcel(data: ArrayBuffer)`: Parses WorkPlanner `.xlsx` binaries into normalized WBS task items.
  - `parseScheduleCsv(csvContent: string)`: Parses WorkPlanner `.csv` exports into normalized WBS task items.
- `dataReconciliationService`: Instance of `DataReconciliationService` in `dataReconciliationService.ts` reconciling schedule deviations against milestones.
- `dataStorageService`: Instance of `DataStorageService` in `dataStorageService.ts` managing portfolio items and macro-milestones in `localStorage`.
- `BudgetService`: Static class in `budgetParser.ts` parsing OPUS construction budget files and chapter summaries.
- `SharePointService`: Class in `sharepointService.ts` handling OAuth2 integration and REST synchronization with Marval SharePoint lists.
- `AuthService`: Class in `authService.ts` managing resident and director session tokens and user credentials.

## Invariants
- `[cpmEngine:computeSchedule]`: Early Start (`earlyStartDate`) and Early Finish (`earlyFinishDate`) are strictly derived from software rescheduled columns `Comien` and `Fin`, and duration from `Dura`. Planned baseline dates (`ComienPrev`, `FinPrev`) are never used for float calculation.
- `[cpmEngine:graphIntegrity]`: Orphan predecessors referencing non-existent IDs and back-edges creating circular dependencies are isolated automatically during DAG compilation to guarantee safe backward pass calculations.
- `[cpmEngine:esCritica]`: An activity is strictly flagged as critical (`esCritica === true`) if and only if Total Float is less than or equal to zero (`tf <= 0`).
- `[baselineService:guardarLineaBase]`: Once a baseline is frozen for a project, `comienzoLineaBase`, `finLineaBase`, and `duraLineaBase` are immutable across future schedule updates unless explicitly deleted via `eliminarLineaBase`.
- `[baselineService:getSemanaCorte]`: The weekly cut-off window is strictly defined from Monday `00:00:00` to Sunday `23:59:59` local time.
- `[baselineService:filtrarActividadesSemana]`: A task is eligible for weekly resident qualification if and only if:
  1. Rescheduled start (`Comien`) falls within the weekly cut-off window, OR
  2. Rescheduled finish (`Fin`) falls within the weekly cut-off window, OR
  3. WorkPlanner start date is anticipated prior to baseline start date (`Comien < comienzoLineaBase`), OR
  4. WorkPlanner finish date is anticipated prior to baseline finish date (`Fin < finLineaBase`).
- `[baselineService:validarCierreReporte]`: A weekly report cannot be closed if any critical path activity (`esCritica === true`) scheduled in that cut-off window remains unqualified.
- `[baselineService:cerrarReporteSemanal]`: In non-compliance cases (`cumple === false`), an explanatory observation text (`observaciones.trim().length > 0`) is strictly required.

## Side Effects
- Mutates browser `localStorage` under keys prefixed with `interventor_baseline_`, `interventor_bitacora_`, `interventor_lookahead_`, and `interventor_reconciled_`.
- Makes asynchronous HTTPS REST requests to Microsoft Graph / SharePoint API endpoints when sync is triggered in `sharepointService.ts`.

## Verification
- Run: `npm run build`

