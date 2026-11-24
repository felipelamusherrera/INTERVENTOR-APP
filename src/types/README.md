# Interventoría Type Definitions

## Overview
Canonical TypeScript domain models, interfaces, unions, and enums representing construction oversight operations for Marval S.A. Defines contracts for portfolio management, Work Breakdown Structure (WBS), Critical Path Method (CPM), Lookahead 7-gate constraints, Quality Seals (MA-SIG-CAL-001), and Role-Based Access Control (RBAC).

## Interface
- Domain Types in `index.ts`:
  - `Sucursal`: Union type (`'TODAS' | 'BUCARAMANGA' | 'BOGOTA' | 'BARRANQUILLA' | 'CARTAGENA' | 'CALI'`).
  - `PortfolioItem`: High-level executive KPI metrics per project (promised vs confirmed dates, budget consumption, quality seal %, CTO compliance %).
  - `WbsItem`: Single task row from WorkPlanner (`edt`, `nivel`, `dura`, `comien`, `fin`, `w`, `predecesora`, `agrupacion`).
  - `MacroMilestone`: Macro contractual milestones and structural phases.
  - `LookaheadGate`: Weekly readiness gate with 7 operational constraints (`diseno`, `contratacion`, `predecesora`, `materiales`, `manoObra`, `equipos`, `sstAmbiental`) and Preparation Index (`indicePreparacion`).
  - `ProductivityPoint`: TESLA quadrant productivity tracking per activity and project tower.
  - `FloorElevation`: Elevation progress matrix across vertical trades (structure, masonry, finishes, MEP).
  - `SelloInspection`: Quality inspection records complying with Marval technical standard MA-SIG-CAL-001.
  - `CriterioSello`: Result status (`'0'` Cumple, `'1'` No cumple, `'2'` No cumple por externos, `'NA'` No aplica).
- Identity and RBAC Types in `auth.ts`:
  - `Rol`: User hierarchy (`RESIDENTE_INTERVENTORIA`, `DIRECTOR_OBRA`, `DIRECTOR_INTERVENTORIA`, `GERENTE_INTERVENTORIA`, `DIRECTIVO`, `ADMINISTRADOR`).
  - `Usuario`: Registered system user profile, branch allocation, assigned projects, and approval status.
  - `ModuloSistema`: Navigable module metadata and section grouping.

## Invariants
- `[types:WbsItem]`: Level indicator `nivel` must strictly mirror the dot-delimited depth of the `edt` string (e.g. `1.1.2.3` corresponds to level 4).
- `[types:LookaheadGate]`: Preparation Index `indicePreparacion` must always equal the percentage of satisfied gates over total gates ($satisfied / 7 \times 100$).
- `[types:SelloInspection]`: Quality seal evaluation conforms strictly to the quaternary standard (`0`, `1`, `2`, `NA`).

## Side Effects
- None (pure static type definitions and immutable dictionaries).

## Verification
- Run: `npm run build`

