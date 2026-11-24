# Interventoría UI Views

## Overview
Presentation components and views for the `INTERVENTOR-APP` oversight platform. Provides executive dashboards, CPM schedule visualizations, weekly resident qualification logs, lookahead constraint management, and quality control interfaces.

## Interface
- Top-level Views:
  - `BitacoraView`: Component in `BitacoraView.tsx` driving the weekly field qualification workflow. Enforces mandatory review of critical activities ($TF \le 0$) and logs root cause constraints.
  - `LookaheadView`: Component in `LookaheadView.tsx` displaying the 7-gate Lookahead matrix, live restrictions fed from Bitácora, Preparation Index (IP %), and mitigation tracking.
  - `GanttGerencialView`: Component in `GanttGerencialView.tsx` rendering the executive Gantt chart with collapsible tree hierarchy, level caps, and critical path color coding.
  - `WbsView`: Component in `WbsView.tsx` providing WBS table inspection, Excel schedule upload, and baseline initialization.
  - `TiempoView`: Component in `TiempoView.tsx` tracking macro-milestones, S-curve (Planned vs Earned Value), and schedule reconciliation.
  - `CalidadView`: Component in `CalidadView.tsx` auditing quality seals under technical standard MA-SIG-CAL-001.
  - `CtoView`: Component in `CtoView.tsx` auditing structural compliance under Law 1796 and NSR-10.
  - `ProductividadView`: Component in `ProductividadView.tsx` displaying the TESLA quadrant matrix and labor efficiency indices (ARI).
  - `ElevacionView`: Component in `ElevacionView.tsx` rendering vertical floor-by-floor trade completion.
  - `ReportePdfView`: Component in `ReportePdfView.tsx` generating printable executive reports.
  - `UsuariosView`: Component in `UsuariosView.tsx` managing user accounts, branches, and roles.
  - `ResumenView`: Component in `ResumenView.tsx` providing the high-altitude portfolio overview (Vista Cero) for Marval executives.
- Subdirectories:
  - [Residente Views](./residente/README.md): Field-level simplified capture screens for Resident Engineers.

## Invariants
- `[views:BitacoraView]`: A resident cannot submit a weekly report without qualifying 100% of critical activities scheduled for the active week.
- `[views:BitacoraView]`: Non-compliance selections (`cumple === false`) strictly require selecting an operational cause and entering an explanatory observation.
- `[views:GanttGerencialView]`: Hierarchical tree depth is strictly capped at Level 6 for groupings containing `"TORRE"` and Level 5 for all other groupings.
- `[views:GanttGerencialView]`: Bars are rendered in red (`#ef4444`) if $TF \le 0$, and green (`#22c55e`) if $TF > 0$.
- `[views:LookaheadView]`: The Preparation Index (IP %) of each activity is strictly computed as $(satisfied\_gates / 7) \times 100$.

## Side Effects
- Reads and updates application state via `baselineService.ts`, `dataStorageService.ts`, and `sharepointService.ts`.
- Manages modal viewports, filters, and local state transitions.

## Verification
- Run: `npm run build`

