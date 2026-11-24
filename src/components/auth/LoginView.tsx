import React, { useState, useMemo, useRef } from 'react';
import {
  HardHat,
  User,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Mail,
  MapPin,
  Loader2,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { ProjectService } from '../../services/projectService';
import { ROLES_OFICIALES, Rol } from '../../types/auth';
import { SUCURSALES_OFICIALES, SucursalOperativa } from '../../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const heroPanelRef = useRef<HTMLDivElement | null>(null);

  // Paralaje sutil GPU-accelerated mediante CSS custom properties (sin re-renders)
  const handleHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = heroPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    el.style.setProperty('--px', `${(nx * 12).toFixed(2)}px`);
    el.style.setProperty('--py', `${(ny * 8).toFixed(2)}px`);
  };

  const handleHeroPointerLeave = () => {
    const el = heroPanelRef.current;
    if (!el) return;
    el.style.setProperty('--px', '0px');
    el.style.setProperty('--py', '0px');
  };

  // Login form state
  const [identificador, setIdentificador] = useState<string>(() =>
    AuthService.getRememberedUsername()
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberUser, setRememberUser] = useState<boolean>(() =>
    Boolean(AuthService.getRememberedUsername())
  );
  const [forgotNotice, setForgotNotice] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Register form state
  const [regNombre, setRegNombre] = useState<string>('');
  const [regUsuario, setRegUsuario] = useState<string>('');
  const [regCorreo, setRegCorreo] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRol, setRegRol] = useState<Rol>('RESIDENTE_INTERVENTORIA');
  const [regSucursal, setRegSucursal] = useState<SucursalOperativa>('CALI');

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(
    null
  );

  // KPIs reales desde la plataforma (inician en 0 cuando está vacía)
  const stats = useMemo(() => ProjectService.getPlatformStats(), []);

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    const res = AuthService.login(identificador, password, rememberUser);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    onLoginSuccess();
  };

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = AuthService.registrarUsuario({
      nombre: regNombre,
      usuario: regUsuario,
      correo: regCorreo,
      password: regPassword,
      rolSolicitado: regRol,
      sucursal: regSucursal,
    });
    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }
    setFeedback({ type: 'success', text: res.message });
    setRegNombre('');
    setRegUsuario('');
    setRegCorreo('');
    setRegPassword('');
    setMode('LOGIN');
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 font-sans bg-slate-50">
      {/* PANEL IZQUIERDO: IDENTIDAD SITE CONTROL MARVAL CON ESCENA DE OBRA ANIMADA EN VIVO */}
      <div
        ref={heroPanelRef}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
        style={{ '--px': '0px', '--py': '0px' } as React.CSSProperties}
        className="relative overflow-hidden bg-gradient-to-br from-[#07195d] via-[#1135ae] to-[#06123f] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 min-h-[420px] lg:min-h-screen"
      >
        {/* Halos orbitales dinámicos */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-sky-400/20 blur-3xl hf-orb-drift"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-blue-400/15 blur-3xl hf-orb-drift"
          style={{ animationDelay: '-5s' }}
        />

        {/* Fondo arquitectónico 3D animado (Edificios en perspectiva + Grúa Torre 3D en celosía) */}
        <svg
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-80 transition-transform duration-300 ease-out"
          style={{
            transform: 'translate3d(var(--px), var(--py), 0) scale(1.02)',
          }}
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
        >
          <defs>
            <linearGradient id="bimScanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.72" />
            </linearGradient>
            <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.48" />
            </linearGradient>
            <linearGradient id="towerSideGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b237a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#050d2e" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="craneFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="craneSideGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>

          {/* Edificio izquierdo en volumen 3D */}
          <polygon
            points="65,450 92,434 257,434 230,450"
            fill="#3b82f6"
            fillOpacity="0.25"
            stroke="#93c5fd"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <polygon
            points="230,450 257,434 257,900 230,900"
            fill="url(#towerSideGrad)"
            stroke="#60a5fa"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
          <rect
            x="65"
            y="450"
            width="165"
            height="450"
            fill="url(#towerGrad)"
            stroke="#60a5fa"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          {[0, 1, 2, 3, 4, 5, 6].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const delayMs = ((row * 4 + col) % 8) * 400;
              const isWarm = (row + col) % 3 === 0;
              return (
                <rect
                  key={`b1-${row}-${col}`}
                  x={88 + col * 32}
                  y={480 + row * 48}
                  width="18"
                  height="24"
                  rx="3"
                  fill={isWarm ? '#fbbf24' : '#7dd3fc'}
                  className="hf-window-glow"
                  style={{ animationDelay: `${delayMs}ms` }}
                />
              );
            })
          )}

          {/* Torre Central 3D con estructura BIM iluminada */}
          <polygon
            points="265,340 296,320 511,320 480,340"
            fill="#38bdf8"
            fillOpacity="0.22"
            stroke="#7dd3fc"
            strokeOpacity="0.5"
            strokeWidth="1.2"
          />
          <polygon
            points="480,340 511,320 511,900 480,900"
            fill="url(#towerSideGrad)"
            stroke="#38bdf8"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          <rect
            x="265"
            y="340"
            width="215"
            height="560"
            fill="url(#towerGrad)"
            stroke="#38bdf8"
            strokeOpacity="0.5"
            strokeWidth="1.8"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((row) =>
            [0, 1, 2, 3, 4].map((col) => {
              const delayMs = ((row * 5 + col) % 11) * 320;
              const isWarm = (row * 3 + col) % 4 === 0;
              return (
                <rect
                  key={`b2-${row}-${col}`}
                  x={290 + col * 36}
                  y={372 + row * 48}
                  width="20"
                  height="24"
                  rx="3"
                  fill={isWarm ? '#fbbf24' : '#93c5fd'}
                  className="hf-window-glow"
                  style={{ animationDelay: `${delayMs}ms` }}
                />
              );
            })
          )}

          {/* Escáner láser Digital Twin / BIM recorriendo la Torre Central */}
          <g className="hf-bim-scan">
            <rect x="265" y="340" width="215" height="44" fill="url(#bimScanGrad)" />
            <line
              x1="258"
              y1="384"
              x2="487"
              y2="384"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />
            <circle cx="265" cy="384" r="3.5" fill="#38bdf8" />
            <circle cx="480" cy="384" r="3.5" fill="#38bdf8" />
          </g>

          {/* ===================================================== */}
          {/* GRÚA TORRE 3D VOLUMÉTRICA (MASTIL FIJO + GIRO 3D)     */}
          {/* ===================================================== */}

          {/* Arriostramientos 3D conectando mástil de grúa a Torre Central */}
          <g stroke="#38bdf8" strokeWidth="1.8" strokeOpacity="0.65">
            <line x1="480" y1="430" x2="604" y2="430" />
            <line x1="511" y1="416" x2="634" y2="416" />
            <line x1="480" y1="430" x2="634" y2="416" />
            <line x1="480" y1="650" x2="604" y2="650" />
            <line x1="511" y1="636" x2="634" y2="636" />
            <line x1="480" y1="650" x2="634" y2="636" />
          </g>

          {/* Mástil 3D en Celosía (Truss Mast: cara frontal + cara lateral profunda) */}
          <g>
            {/* Fondo sutil para dar volumen sólido al mástil */}
            <polygon
              points="622,226 634,218 634,892 622,900"
              fill="url(#craneSideGrad)"
              fillOpacity="0.52"
            />
            <rect x="604" y="226" width="18" height="674" fill="url(#craneFrontGrad)" fillOpacity="0.34" />

            {/* Módulos de celosía X en cara frontal y lateral 3D */}
            {Array.from({ length: 15 }, (_, idx) => {
              const y = 226 + idx * 44;
              const yNext = y + 44;
              return (
                <g key={`mast-bay-${idx}`}>
                  {/* Cara frontal */}
                  <line x1="604" y1={y} x2="622" y2={y} stroke="#fde68a" strokeWidth="1.3" strokeOpacity="0.85" />
                  <line x1="604" y1={y} x2="622" y2={yNext} stroke="#fbbf24" strokeWidth="1.2" strokeOpacity="0.75" />
                  <line x1="622" y1={y} x2="604" y2={yNext} stroke="#fbbf24" strokeWidth="1.2" strokeOpacity="0.75" />
                  {/* Cara lateral derecha en perspectiva */}
                  <line x1="622" y1={y} x2="634" y2={y - 8} stroke="#f59e0b" strokeWidth="1.1" strokeOpacity="0.75" />
                  <line x1="622" y1={y} x2="634" y2={yNext - 8} stroke="#d97706" strokeWidth="1.1" strokeOpacity="0.75" />
                  <line x1="634" y1={y - 8} x2="622" y2={yNext} stroke="#d97706" strokeWidth="1.1" strokeOpacity="0.75" />
                </g>
              );
            })}

            {/* Cordones verticales principales 3D del mástil */}
            <line x1="604" y1="226" x2="604" y2="900" stroke="#fef3c7" strokeWidth="2.2" />
            <line x1="622" y1="226" x2="622" y2="900" stroke="#fbbf24" strokeWidth="2.4" />
            <line x1="634" y1="218" x2="634" y2="892" stroke="#b45309" strokeWidth="2" />

            {/* Anillo de giro 3D (Slewing Ring) */}
            <ellipse cx="619" cy="226" rx="22" ry="6.5" fill="#92400e" stroke="#fde68a" strokeWidth="1.3" />
            <ellipse cx="619" cy="218" rx="22" ry="6.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
          </g>

          {/* CONJUNTO SUPERIOR GIRATORIO EN 3D (Giro en perspectiva alrededor del mástil) */}
          <g className="hf-crane-slew-3d">
            {/* Cabina Panorámica 3D del Operador */}
            <g>
              <polygon
                points="582,188 594,180 618,180 606,188"
                fill="#fde68a"
                stroke="#fef3c7"
                strokeWidth="1"
              />
              <polygon
                points="606,188 618,180 618,210 606,216"
                fill="#b45309"
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <rect
                x="582"
                y="188"
                width="24"
                height="28"
                rx="2"
                fill="#f59e0b"
                stroke="#fef3c7"
                strokeWidth="1.2"
              />
              {/* Cristal panorámico iluminado + reflejo */}
              <polygon points="585,191 603,191 603,207 585,207" fill="#38bdf8" fillOpacity="0.85" />
              <line x1="587" y1="205" x2="599" y2="193" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
            </g>

            {/* Torreta / Porta-flecha 3D (A-Frame piramidal con profundidad) */}
            <g>
              <polygon
                points="620,126 628,121 634,204 622,212"
                fill="#b45309"
                fillOpacity="0.65"
                stroke="#f59e0b"
                strokeWidth="1.3"
              />
              <polygon
                points="602,212 620,126 622,212"
                fill="#f59e0b"
                fillOpacity="0.75"
                stroke="#fde68a"
                strokeWidth="1.6"
              />
              <line x1="620" y1="126" x2="628" y2="121" stroke="#fef3c7" strokeWidth="2" />
              {/* Baliza aérea 3D en cúspide */}
              <circle cx="620" cy="122" r="5" fill="#ef4444" className="hf-beacon-pulse" />
              <circle cx="620" cy="122" r="12" fill="#f87171" fillOpacity="0.35" className="hf-beacon-pulse" />
            </g>

            {/* Contra-pluma 3D y Contrapesos Volumétricos */}
            <g>
              {/* Cara superior y lateral de la contra-pluma */}
              <polygon
                points="622,196 746,196 756,189 634,189"
                fill="#7dd3fc"
                fillOpacity="0.32"
                stroke="#bae6fd"
                strokeWidth="1.1"
              />
              <polygon
                points="622,196 746,196 746,210 622,210"
                fill="#0284c7"
                fillOpacity="0.55"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />
              {/* 3 Bloques de Contrapeso en 3D Isométrico */}
              {[0, 1, 2].map((bIdx) => {
                const bx = 698 + bIdx * 15;
                return (
                  <g key={`cw-${bIdx}`}>
                    <polygon
                      points={`${bx},202 ${bx + 11},202 ${bx + 18},196 ${bx + 7},196`}
                      fill="#e2e8f0"
                    />
                    <rect x={bx} y="202" width="11" height="28" rx="1" fill="#f59e0b" stroke="#fef3c7" strokeWidth="0.9" />
                    <polygon
                      points={`${bx + 11},202 ${bx + 18},196 ${bx + 18},224 ${bx + 11},230`}
                      fill="#92400e"
                    />
                  </g>
                );
              })}
              {/* Cables tirantes traseros dobles 3D */}
              <line x1="620" y1="126" x2="736" y2="196" stroke="#bae6fd" strokeWidth="2.2" strokeOpacity="0.8" />
              <line x1="628" y1="121" x2="746" y2="189" stroke="#7dd3fc" strokeWidth="1.6" strokeOpacity="0.6" />
            </g>

            {/* Pluma Principal 3D (Sección Triangular Espacial) */}
            <g>
              {/* Base inferior 3D en perspectiva de la pluma */}
              <polygon
                points="320,212 606,212 618,204 330,204"
                fill="#0ea5e9"
                fillOpacity="0.32"
                stroke="#38bdf8"
                strokeWidth="1.1"
              />
              {/* Cordón superior (vértice de la cercha triangular) */}
              <line x1="322" y1="189" x2="612" y2="182" stroke="#e0f2fe" strokeWidth="2.6" />
              {/* Cordón inferior frontal y cordón inferior trasero */}
              <line x1="320" y1="212" x2="606" y2="212" stroke="#38bdf8" strokeWidth="2.8" />
              <line x1="330" y1="204" x2="618" y2="204" stroke="#0284c7" strokeWidth="2" />

              {/* Diagonales espaciales 3D a lo largo de la pluma */}
              {Array.from({ length: 14 }, (_, idx) => {
                const x = 328 + idx * 20;
                const xNext = x + 20;
                return (
                  <g key={`jib-bay-${idx}`}>
                    {/* Cara triangular frontal */}
                    <line x1={x} y1="212" x2={x + 10} y2="187" stroke="#bae6fd" strokeWidth="1.2" strokeOpacity="0.85" />
                    <line x1={x + 10} y1="187" x2={xNext} y2="212" stroke="#bae6fd" strokeWidth="1.2" strokeOpacity="0.85" />
                    {/* Arista transversal hacia el riel trasero */}
                    <line x1={x} y1="212" x2={x + 10} y2="204" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
                    <line x1={x + 10} y1="204" x2={x + 10} y2="187" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.6" />
                  </g>
                );
              })}

              {/* Punta 3D de la pluma + baliza preventiva */}
              <polygon
                points="320,212 322,189 330,204"
                fill="#fbbf24"
                fillOpacity="0.8"
                stroke="#fef3c7"
                strokeWidth="1.2"
              />
              <circle cx="320" cy="202" r="4" fill="#fbbf24" className="hf-beacon-pulse" />

              {/* Cables tirantes delanteros dobles en perspectiva */}
              <line x1="620" y1="126" x2="324" y2="189" stroke="#e0f2fe" strokeWidth="2.2" strokeOpacity="0.82" />
              <line x1="620" y1="126" x2="452" y2="186" stroke="#bae6fd" strokeWidth="1.8" strokeOpacity="0.68" />
              <line x1="628" y1="121" x2="333" y2="185" stroke="#7dd3fc" strokeWidth="1.5" strokeOpacity="0.55" />
            </g>

            {/* Carro Viajero 3D + Cables Dobles + Carga Prefabricada en Volumen 3D */}
            <g className="hf-trolley-travel">
              {/* Carro 3D isométrico deslizándose sobre los 2 rieles de la pluma */}
              <polygon
                points="374,214 406,214 415,207 383,207"
                fill="#fde68a"
                stroke="#ffffff"
                strokeWidth="0.9"
              />
              <rect x="374" y="214" width="32" height="9" rx="1.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" />
              <polygon points="406,214 415,207 415,216 406,223" fill="#b45309" />
              {/* Ruedas/poleas del carro */}
              <circle cx="381" cy="214" r="2.5" fill="#0f172a" stroke="#fde68a" strokeWidth="1" />
              <circle cx="399" cy="214" r="2.5" fill="#0f172a" stroke="#fde68a" strokeWidth="1" />

              {/* Cables dobles paralelos retráctiles */}
              <line
                x1="386"
                y1="223"
                x2="386"
                y2="368"
                stroke="#e0f2fe"
                strokeWidth="2.2"
                className="hf-cable-scale"
              />
              <line
                x1="396"
                y1="220"
                x2="396"
                y2="365"
                stroke="#7dd3fc"
                strokeWidth="1.8"
                className="hf-cable-scale"
              />

              {/* Aparejo 3D y Módulo Prefabricado Isométrico subiendo y bajando */}
              <g className="hf-load-hoist">
                {/* Motón / Bloque de polea 3D */}
                <polygon points="382,366 398,366 402,362 386,362" fill="#fde68a" />
                <rect x="382" y="366" width="16" height="10" rx="2" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" />
                <polygon points="398,366 402,362 402,372 398,376" fill="#92400e" />

                {/* 4 Eslingas hacia las esquinas superiores del volumen 3D */}
                <line x1="390" y1="376" x2="364" y2="395" stroke="#e0f2fe" strokeWidth="1.5" />
                <line x1="390" y1="376" x2="408" y2="395" stroke="#e0f2fe" strokeWidth="1.5" />
                <line x1="394" y1="374" x2="378" y2="385" stroke="#7dd3fc" strokeWidth="1.3" strokeOpacity="0.8" />
                <line x1="394" y1="374" x2="422" y2="385" stroke="#7dd3fc" strokeWidth="1.3" strokeOpacity="0.8" />

                {/* Módulo Prefabricado 3D Isométrico */}
                {/* Cara superior */}
                <polygon
                  points="364,395 408,395 422,385 378,385"
                  fill="#fde68a"
                  stroke="#ffffff"
                  strokeWidth="1.1"
                />
                {/* Cara frontal */}
                <rect
                  x="364"
                  y="395"
                  width="44"
                  height="26"
                  rx="1.5"
                  fill="#f59e0b"
                  stroke="#fef3c7"
                  strokeWidth="1.2"
                />
                {/* Vano de ventana dentro del módulo */}
                <rect x="372" y="401" width="28" height="14" rx="1.5" fill="#0f172a" fillOpacity="0.65" stroke="#bae6fd" strokeWidth="0.9" />
                {/* Cara lateral derecha en sombra 3D */}
                <polygon
                  points="408,395 422,385 422,411 408,421"
                  fill="#92400e"
                  stroke="#d97706"
                  strokeWidth="1.1"
                />
              </g>
            </g>
          </g>
        </svg>

        {/* Top Brand */}
        <div
          className="relative z-10 flex items-center gap-3 hf-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-black tracking-wider text-base leading-none">MARVAL</div>
            <div className="text-[11px] text-blue-200 tracking-[0.22em] font-semibold mt-1">
              CONSTRUCTORES
            </div>
          </div>
        </div>

        {/* Center Hero Copy & KPIs */}
        <div className="relative z-10 my-10 space-y-6 max-w-lg">
          <div className="hf-fade-up" style={{ animationDelay: '60ms' }}>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08]">
              <span className="block text-white">Site Control</span>
              <span className="block text-sky-400 mt-1">Marval</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base text-blue-100/95 leading-relaxed">
              La plataforma de interventoría que{' '}
              <strong className="text-white font-bold">registra, mide y analiza</strong> la
              productividad de cada actividad constructiva en tiempo real.
            </p>
          </div>

          {/* 3 Feature Pills */}
          <div
            className="flex flex-wrap gap-2.5 hf-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-blue-50 transition-colors hover:bg-white/20">
              <Building2 className="w-3.5 h-3.5 text-sky-300" />
              Registro en obra
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-blue-50 transition-colors hover:bg-white/20">
              <ClipboardCheck className="w-3.5 h-3.5 text-sky-300" />
              Seguimiento por torre y piso
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-blue-50 transition-colors hover:bg-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              Auditoría completa
            </span>
          </div>

          {/* 3 KPI Cards reales */}
          <div
            className="grid grid-cols-3 gap-3 pt-2 max-w-md hf-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <div className="rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{stats.proyectosActivos}</div>
              <div className="text-[11px] text-blue-100 font-medium mt-1">Proyectos activos</div>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{stats.torresEnObra}</div>
              <div className="text-[11px] text-blue-100 font-medium mt-1">Torres en obra</div>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/20 backdrop-blur-md p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/20">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{stats.actividades}</div>
              <div className="text-[11px] text-blue-100 font-medium mt-1">Actividades</div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div
          className="relative z-10 flex items-center justify-between text-xs text-blue-200/85 pt-4 border-t border-white/15 hf-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <span>© 2026 Marval Constructores</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema operativo
          </span>
        </div>
      </div>

      {/* PANEL DERECHO: TARJETA DE INICIO DE SESIÓN / REGISTRO */}
      <div
        className="flex flex-col items-center justify-center p-6 sm:p-10 relative"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(37, 99, 235, 0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full max-w-md hf-fade-up" style={{ animationDelay: '90ms' }}>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
            {/* Barra superior luminosa animada */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 hf-shimmer-bar" />

            <div className="p-7 sm:p-9">
              <div key={mode} className="space-y-6 hf-card-morph">
                {mode === 'LOGIN' ? (
                  <>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Iniciar sesión
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Acceda al sistema de control de productividad de obra
                      </p>
                    </div>

                    {feedback && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 hf-card-morph ${
                          feedback.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : feedback.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        {feedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <span>{feedback.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Nombre de usuario
                        </label>
                        <div className="relative group">
                          <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={identificador}
                            onChange={(e) => setIdentificador(e.target.value)}
                            placeholder="usuario o correo"
                            autoComplete="username"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-150"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                          <button
                            type="button"
                            onClick={() => setForgotNotice(!forgotNotice)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            ¿Olvidó su contraseña?
                          </button>
                        </div>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-150"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {forgotNotice && (
                          <p className="mt-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 hf-card-morph">
                            Contacte al usuario <strong>Administrador</strong> para restablecer su acceso.
                          </p>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberUser}
                          onChange={(e) => setRememberUser(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Recordar usuario en este equipo</span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2 hf-press"
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Ingresar al sistema</span>
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setMode('REGISTER');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors hf-press cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>¿No tiene cuenta? Registrarse</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          Solicitud de registro
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Su cuenta quedará pendiente de aprobación del Administrador
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setMode('LOGIN');
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors hf-press"
                        title="Volver a iniciar sesión"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {feedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 hf-card-morph ${
                          feedback.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{feedback.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitRegister} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={regNombre}
                          onChange={(e) => setRegNombre(e.target.value)}
                          placeholder="Ej. Ing. Laura Rodríguez"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Usuario *
                          </label>
                          <div className="relative group">
                            <User className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={regUsuario}
                              onChange={(e) => setRegUsuario(e.target.value)}
                              placeholder="laura.rodriguez"
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Correo corporativo *
                          </label>
                          <div className="relative group">
                            <Mail className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              required
                              value={regCorreo}
                              onChange={(e) => setRegCorreo(e.target.value)}
                              placeholder="usuario@marval.com.co"
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Rol de acceso *
                          </label>
                          <select
                            value={regRol}
                            onChange={(e) => setRegRol(e.target.value as Rol)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                          >
                            {ROLES_OFICIALES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sucursal *
                          </label>
                          <div className="relative group">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                              value={regSucursal}
                              onChange={(e) => setRegSucursal(e.target.value as SucursalOperativa)}
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                            >
                              {SUCURSALES_OFICIALES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          required
                          minLength={4}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-150"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer mt-1 hf-press"
                      >
                        Enviar solicitud de registro
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setMode('LOGIN');
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        Ya tengo cuenta · Volver a iniciar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-5 hf-fade-up" style={{ animationDelay: '220ms' }}>
            © 2026 Marval Constructores · Interventoría de obra
          </p>
        </div>
      </div>
    </div>
  );
};
