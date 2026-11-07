# Plataforma de Control de Proyectos e Interventoría (Marval S.A.S.)

Plataforma Web Integral de Supervisión Técnica, Control de Plazo, Productividad y Cumplimiento Normativo (Aconex, Sellos MA-SIG-CAL-001 y CTO Ley 1796/NSR-10).

---

## 🏗️ Contexto y Alcance
* **Organización:** Marval S.A.S. (Líder en construcción e inmobiliaria en Colombia).
* **Alcance:** Supervisión y control de más de 100 proyectos activos en 5 sucursales: Bucaramanga, Bogotá, Barranquilla, Cartagena y Cali.
* **Metodología:** Estandarización de 12 Macro-Hitos con métricas duales `I` (Inicio) y `E` (Ejecución), Bitácora de 5 Causas Raíz, Sellos de Calidad y Modelo de Productividad "Tesla".

---

## 🧩 Catálogo de Módulos (Suite 10 Módulos)

1. **00. Vista Cero (Sábana Gerencial de Portafolio):** Matriz ejecutiva para Alta Gerencia y Vicepresidencia (Dr. Sergio) con compuertas a 12M, 6M y 3M, apertura presupuestal (VIV/URB/ADMINIS), Sellos de Calidad (%) y CTO (%).
2. **01. Ficha Ejecutiva 1-Página (Formato Aconex):** Reporte ejecutivo de 1 página con diseño Tesla y firmas técnicas, listo para exportar a PDF y radicar en Aconex.
3. **02. Tablero TIEMPO:** Timeline de los 12 Macro-Hitos con deltas `I` y `E`, Curva S con proyección a ritmo real (regla de oro: 4% a 7% mensual) y tarjeta de Mayores Atrasos.
4. **03. WBS Explorer e Ingesta Automática:** Cero digitación manual. Parser directo de cronogramas CSV/Excel exportados de WorkPlanner/Primavera.
5. **04. Bitácora Semanal Móvil:** Flujo rápido de 3 minutos en celular para residentes de interventoría con clasificación en las 5 causas corporativas y Pareto CNC acumulado.
6. **05. Lookahead Preventivo:** Matriz de 7 compuertas (Diseño, Contratos, Predecesora, Materiales, Mano de obra, Equipos, SST/Ambiental) con cálculo dinámico del Índice de Preparación (`IP %`).
7. **06. Productividad "Tesla":** Dispersión en cuadrantes (% Productividad vs. Unidades Planeadas), cruce con personal real en obra (ARI) y monitoreo de las 4 actividades Pareto.
8. **07. Elevación Vertical:** Visor piso por piso (P1 al 12 y Sótano) de la torre con semaforización de frentes y sellos aprobados.
9. **08. Calidad: Sellos de Obra Gris y Blanca:** Implementación de la norma interna **MA-SIG-CAL-001 v.003** para 13 actividades constructivas y evaluación bajo criterios oficiales (0: Cumple, 1: No cumple, 2: No cumple por externos, NA: No aplica).
10. **09. CTO Proyectos (Certificado Técnico de Ocupación):** Seguimiento del marco legal de la **Ley 1796 de 2016 y NSR-10** a través de 56 criterios distribuidos en 6 categorías maestras.

---

## 🚀 Puesta en Marcha

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

---

## 🛠️ Stack Tecnológico
* **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts.
* **Gobernanza:** Sincronizable con Microsoft 365 (SharePoint Lists / Fabric Lakehouse / Power BI).
