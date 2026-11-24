# Common UI Components

## Overview
Shared layout and navigation components used across all application views in `INTERVENTOR-APP`.

## Interface
- `Header`: Main application header component in `Header.tsx`. Provides:
  - Branch (`Sucursal`) and Project dropdown filters.
  - Tower (`Torre`) selection and Cut-off Date (`Fecha de Corte`) picker.
  - Navigation tab bar across modules.
  - User profile modal, role badge, and session logout trigger.

## Invariants
- `[common:Header]`: Layout uses fluid responsive sizing (`w-full` with responsive horizontal padding `px-3 sm:px-6 lg:px-8 2xl:px-12`) without rigid maximum-width containers (`max-w-7xl`).

## Side Effects
- Emits project and branch filter changes to the global state in `App.tsx`.

## Verification
- Run: `npm run build`

