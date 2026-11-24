# Interventor-App Source Blueprint

## System Overview
High-altitude architectural blueprint for `INTERVENTOR-APP`, a technical oversight and construction supervision platform designed for Marval S.A. The system integrates Critical Path Method (CPM) scheduling, weekly resident field logs (Bitácora), 7-gate Lookahead planning, executive collapsible Gantt charts, Quality Seals (MA-SIG-CAL-001), and structural oversight compliance (Law 1796 / NSR-10).

## Local Interface & Invariants
- `App.tsx`: Root application container managing global state, active tab routing, and responsive layout boundaries.
- `main.tsx`: React 19 bootstrap entry point rendering the root component into `#root`.
- Invariant: Root viewports strictly enforce a fluid layout (`w-full` with fluid padding `px-3 sm:px-6 lg:px-8 2xl:px-12`) without hardcoded maximum width boundaries (`max-w-7xl`).

## Subdirectories & System Boundaries
- Components: [./components/README.md](./components/README.md) - Presentation components, executive views, and shared layout headers.
- Services: [./services/README.md](./services/README.md) - Core CPM calculation engine, baseline management, weekly qualification validators, and SharePoint synchronization.
- Types: [./types/README.md](./types/README.md) - Domain data models, WBS schemas, Lookahead gate interfaces, and RBAC user permissions.

## Global Invariants
- Schedulers and critical path calculations strictly consume rescheduled columns `Comien`, `Fin`, and duration `Dura`. Planned baseline dates are preserved for variance comparisons but never drive CPM float.
- Critical path membership is strictly defined as Total Float $TF \le 0$.
- Resident weekly reporting mandates 100% qualification of critical tasks active in the Monday-to-Sunday cut-off window.
- Offline-first architecture: all user qualifications, baseline freezes, and gate mitigations persist locally in `localStorage` prior to any external cloud synchronization.

## Global Side Effects
- Browser storage persistence under `localStorage` (`interventor_*`).
- Cloud synchronization with Microsoft SharePoint lists when configured.

## System Verification
- Run: `npm run build`

