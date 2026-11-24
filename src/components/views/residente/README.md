# Residente Obra Views

## Overview
Field-optimized user interfaces tailored for Resident Engineers (`RESIDENTE_INTERVENTORIA`). Focused on rapid field data capture, daily inspections, trade contractor headcounts (ARI), quality seals checklists, and decentralized progress logging.

## Interface
- `ResidenteProgramacionView`: Weekly planning and daily field log entry.
- `ResidenteCalidadView`: Fast mobile-oriented inspection capture for quality seals (MA-SIG-CAL-001).
- `ResidenteCtoView`: Technical oversight checklist aligned with Law 1796 of 2016 and NSR-10.
- `ResidentePresupuestoView`: Daily quantity verification and budget chapter tracking.
- `ResidenteProductividadView`: Daily headcount tracking (ARI) vs planned workforce.

## Invariants
- `[residente:ResidenteCalidadView]`: Quality seals evaluations must use valid standard codes (`0` Cumple, `1` No Cumple, `2` No Cumple por Externos, `NA` No Aplica).
- `[residente:ResidenteProgramacionView]`: Entries submitted by the resident must reference an active, valid WBS activity ID.

## Side Effects
- Mutates browser `localStorage` state for local resident drafts.
- Emits qualification updates consumed by parent oversight dashboards.

## Verification
- Run: `npm run build`

