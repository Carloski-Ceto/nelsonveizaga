'use client';

/**
 * EyeIllustration — Vista de Fondo de Ojo (Fundoscopia)
 *
 * Simula la vista a través de un oftalmoscopio:
 *  - Vasos sanguíneos que se "dibujan" desde el disco óptico (stroke-dashoffset)
 *  - Pulso cardíaco en los vasos (stroke-width animation ~70 bpm)
 *  - Disco óptico con copa fisiológica y glow pulsante
 *  - Mácula con reflejo foveal
 *  - Haz de luz del examen que sigue el cursor (lerp suave)
 *  - Línea de escaneo OCT decorativa
 */

import { useEffect, useRef } from 'react';
import { getPublicAppName } from '@/lib/siteConfig';

export default function EyeIllustration() {
  const svgRef  = useRef<SVGSVGElement>(null);
  const spotRef = useRef<SVGGElement>(null);
  const rafRef  = useRef<number>(0);
  const target  = useRef({ x: 200, y: 200 });
  const current = useRef({ x: 200, y: 200 });

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      const { left, top, width, height } = svg.getBoundingClientRect();
      const svgX = ((e.clientX - left) / width)  * 400;
      const svgY = ((e.clientY - top)  / height) * 400;
      const dx = svgX - 200;
      const dy = svgY - 200;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 168) {
        target.current = { x: svgX, y: svgY };
      } else {
        const a = Math.atan2(dy, dx);
        target.current = { x: 200 + Math.cos(a) * 168, y: 200 + Math.sin(a) * 168 };
      }
    }

    function onMouseLeave() {
      target.current = { x: 200, y: 200 };
    }

    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.07;
      current.current.y += (target.current.y - current.current.y) * 0.07;
      if (spotRef.current) {
        const x = current.current.x.toFixed(1);
        const y = current.current.y.toFixed(1);
        spotRef.current.setAttribute('transform', `translate(${x},${y})`);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove',    onMouseMove,  { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove',    onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* Pulso cardíaco ≈ 70 bpm (0.85 s) */
  const P   = '0.85s';
  const PB  = '2.8s';              /* begin: después del draw-in */
  const KS  = '0.4 0 0.2 1;0.4 0 0.2 1';
  const KT  = '0;0.5;1';
  const brand = getPublicAppName();
  const eyeAria = brand ? `Ilustración de fondo de ojo — ${brand}` : 'Ilustración de fondo de ojo';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={eyeAria}
      style={{ cursor: 'crosshair' }}
    >
      <defs>
        {/* ── Clip circular (visor del oftalmoscopio) ── */}
        <clipPath id="fundusClip">
          <circle cx="200" cy="200" r="183" />
        </clipPath>

        {/* ── Fondo retinal ── */}
        <radialGradient id="fundusBg" cx="38%" cy="44%" r="68%">
          <stop offset="0%"   stopColor="#4e1212" />
          <stop offset="45%"  stopColor="#320808" />
          <stop offset="100%" stopColor="#120202" />
        </radialGradient>

        {/* ── Disco óptico ── */}
        <radialGradient id="discGrad" cx="38%" cy="32%" r="72%">
          <stop offset="0%"   stopColor="#f8e898" />
          <stop offset="55%"  stopColor="#d8941e" />
          <stop offset="100%" stopColor="#b87218" />
        </radialGradient>
        <radialGradient id="cupGrad" cx="42%" cy="38%" r="72%">
          <stop offset="0%"   stopColor="#fefae0" />
          <stop offset="100%" stopColor="#e8d468" />
        </radialGradient>

        {/* ── Spotlight del examen ── */}
        <radialGradient id="spotGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,235,185,0.32)" />
          <stop offset="38%"  stopColor="rgba(255,215,145,0.14)" />
          <stop offset="100%" stopColor="rgba(255,200,100,0)"    />
        </radialGradient>

        {/* ── Vignette ── */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
          <stop offset="58%"  stopColor="transparent"       />
          <stop offset="100%" stopColor="rgba(0,0,0,0.80)"  />
        </radialGradient>

        {/* ── Glow del disco ── */}
        <filter id="discGlow" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* ── Glow vasos ── */}
        <filter id="vGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* ── Glow foveal ── */}
        <filter id="fovGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g clipPath="url(#fundusClip)">

        {/* ── Fondo ── */}
        <circle cx="200" cy="200" r="183" fill="url(#fundusBg)" />

        {/* ── Mácula (región temporal) ── */}
        <ellipse cx="150" cy="202" rx="34" ry="30"
          fill="rgba(0,0,0,0.24)" />

        {/* ── Reflejo foveal ── */}
        <circle cx="150" cy="202" r="9"
          fill="rgba(255,220,130,0.45)" filter="url(#fovGlow)" />
        <circle cx="148" cy="200" r="3"
          fill="rgba(255,245,185,0.92)" />

        {/* ════════════════════════════
            VASOS SANGUÍNEOS
            Arteria = rojo brillante  (#e06050)
            Vena    = rojo oscuro     (#8a2020)
            Dibujado desde el disco hacia la periferia
        ════════════════════════════ */}

        {/* ── Arcada temporal superior ── */}
        {/* Arteria temporal superior (principal) */}
        <path d="M 272 162 C 251 128 218 103 184 89 C 158 77 128 76 101 86 C 78 95 56 114 40 148"
          stroke="#e06050" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="570" strokeDashoffset="570"
          filter="url(#vGlow)">
          <animate attributeName="stroke-dashoffset" from="570" to="0"
            dur="1.9s" begin="0.1s" fill="freeze"
            calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          <animate attributeName="stroke-width" values="2.5;3.2;2.5"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
        </path>

        {/* Vena temporal superior */}
        <path d="M 272 153 C 252 122 220 99 186 86 C 160 74 130 74 103 84 C 80 93 58 112 42 145"
          stroke="#8a2020" strokeWidth="3.0" strokeLinecap="round"
          strokeDasharray="570" strokeDashoffset="570">
          <animate attributeName="stroke-dashoffset" from="570" to="0"
            dur="1.9s" begin="0.25s" fill="freeze"
            calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          <animate attributeName="stroke-width" values="3.0;3.8;3.0"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
        </path>

        {/* Rama superior de la arteria (hacia arriba) */}
        <path d="M 184 89 C 174 70 162 58 148 52"
          stroke="#e06050" strokeWidth="1.9" strokeLinecap="round"
          strokeDasharray="135" strokeDashoffset="135">
          <animate attributeName="stroke-dashoffset" from="135" to="0"
            dur="0.9s" begin="1.6s" fill="freeze" />
          <animate attributeName="stroke-width" values="1.9;2.4;1.9"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>

        {/* Rama superior media (hacia papilomacular) */}
        <path d="M 184 89 C 188 74 193 63 198 55"
          stroke="#e06050" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="108" strokeDashoffset="108">
          <animate attributeName="stroke-dashoffset" from="108" to="0"
            dur="0.7s" begin="1.8s" fill="freeze" />
        </path>

        {/* Terciaria temporal superior */}
        <path d="M 101 86 C 89 78 76 73 62 72"
          stroke="#c04040" strokeWidth="1.4" strokeLinecap="round"
          strokeDasharray="104" strokeDashoffset="104">
          <animate attributeName="stroke-dashoffset" from="104" to="0"
            dur="0.7s" begin="2.0s" fill="freeze" />
        </path>

        {/* ── Arcada temporal inferior ── */}
        {/* Arteria temporal inferior */}
        <path d="M 272 194 C 251 228 218 253 184 267 C 158 279 128 280 101 270 C 78 261 56 242 40 208"
          stroke="#e06050" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="570" strokeDashoffset="570"
          filter="url(#vGlow)">
          <animate attributeName="stroke-dashoffset" from="570" to="0"
            dur="1.9s" begin="0s" fill="freeze"
            calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          <animate attributeName="stroke-width" values="2.5;3.2;2.5"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
        </path>

        {/* Vena temporal inferior */}
        <path d="M 272 203 C 252 234 220 255 186 268 C 160 280 130 281 103 271 C 80 262 58 244 42 211"
          stroke="#8a2020" strokeWidth="3.0" strokeLinecap="round"
          strokeDasharray="570" strokeDashoffset="570">
          <animate attributeName="stroke-dashoffset" from="570" to="0"
            dur="1.9s" begin="0.18s" fill="freeze"
            calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          <animate attributeName="stroke-width" values="3.0;3.8;3.0"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
        </path>

        {/* Rama inferior de la arteria */}
        <path d="M 184 267 C 174 286 162 298 148 304"
          stroke="#e06050" strokeWidth="1.9" strokeLinecap="round"
          strokeDasharray="135" strokeDashoffset="135">
          <animate attributeName="stroke-dashoffset" from="135" to="0"
            dur="0.9s" begin="1.7s" fill="freeze" />
          <animate attributeName="stroke-width" values="1.9;2.4;1.9"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>

        {/* Rama inferior media */}
        <path d="M 184 267 C 188 282 193 293 198 301"
          stroke="#e06050" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="108" strokeDashoffset="108">
          <animate attributeName="stroke-dashoffset" from="108" to="0"
            dur="0.7s" begin="1.9s" fill="freeze" />
        </path>

        {/* ── Arteria ciliorretinal (va del disco directamente a la mácula) ── */}
        <path d="M 258 178 C 242 182 224 190 206 194 C 188 198 170 200 154 202"
          stroke="#d85848" strokeWidth="1.6" strokeLinecap="round" opacity="0.80"
          strokeDasharray="210" strokeDashoffset="210">
          <animate attributeName="stroke-dashoffset" from="210" to="0"
            dur="1.2s" begin="1.2s" fill="freeze" />
          <animate attributeName="stroke-width" values="1.6;2.1;1.6"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>

        {/* ── Vasos nasales superiores ── */}
        <path d="M 272 162 C 282 146 297 130 314 118 C 330 107 350 101 372 100"
          stroke="#d05045" strokeWidth="2.0" strokeLinecap="round"
          strokeDasharray="235" strokeDashoffset="235">
          <animate attributeName="stroke-dashoffset" from="235" to="0"
            dur="1.3s" begin="0.4s" fill="freeze" />
          <animate attributeName="stroke-width" values="2.0;2.6;2.0"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>
        <path d="M 272 153 C 282 138 298 123 315 111 C 331 100 351 95 373 95"
          stroke="#7a1818" strokeWidth="2.4" strokeLinecap="round"
          strokeDasharray="235" strokeDashoffset="235">
          <animate attributeName="stroke-dashoffset" from="235" to="0"
            dur="1.3s" begin="0.52s" fill="freeze" />
          <animate attributeName="stroke-width" values="2.4;3.0;2.4"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>

        {/* ── Vasos nasales inferiores ── */}
        <path d="M 272 194 C 282 210 297 226 314 238 C 330 249 350 255 372 256"
          stroke="#d05045" strokeWidth="2.0" strokeLinecap="round"
          strokeDasharray="235" strokeDashoffset="235">
          <animate attributeName="stroke-dashoffset" from="235" to="0"
            dur="1.3s" begin="0.35s" fill="freeze" />
          <animate attributeName="stroke-width" values="2.0;2.6;2.0"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>
        <path d="M 272 203 C 282 217 298 231 315 243 C 331 253 351 257 373 260"
          stroke="#7a1818" strokeWidth="2.4" strokeLinecap="round"
          strokeDasharray="235" strokeDashoffset="235">
          <animate attributeName="stroke-dashoffset" from="235" to="0"
            dur="1.3s" begin="0.47s" fill="freeze" />
          <animate attributeName="stroke-width" values="2.4;3.0;2.4"
            dur={P} begin={PB} repeatCount="indefinite" />
        </path>

        {/* ══════════════════════════
            DISCO ÓPTICO
        ══════════════════════════ */}

        {/* Halo pulsante alrededor del disco */}
        <circle cx="272" cy="178" r="36" fill="rgba(210,148,30,0.18)" filter="url(#discGlow)">
          <animate attributeName="r"       values="36;39;36"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
          <animate attributeName="opacity" values="0.18;0.32;0.18"
            dur={P} begin={PB} repeatCount="indefinite" />
        </circle>

        {/* Disco principal */}
        <circle cx="272" cy="178" r="26" fill="url(#discGrad)" filter="url(#discGlow)">
          <animate attributeName="r" values="26;27.5;26"
            dur={P} begin={PB} repeatCount="indefinite"
            calcMode="spline" keySplines={KS} keyTimes={KT} />
        </circle>

        {/* Copa fisiológica (C/D ≈ 0.38) */}
        <ellipse cx="274" cy="177" rx="11" ry="10" fill="url(#cupGrad)" opacity="0.88" />

        {/* Brillo especular en la copa */}
        <ellipse cx="272" cy="175" rx="4.5" ry="3.5"
          fill="rgba(255,252,210,0.72)" />

        {/* ── Vignette ── */}
        <circle cx="200" cy="200" r="183" fill="url(#vignette)" />

        {/* ══════════════════════════
            SPOTLIGHT (sigue el cursor)
        ══════════════════════════ */}
        <g ref={spotRef} transform="translate(200,200)">
          <circle cx="0" cy="0" r="70" fill="url(#spotGrad)" />
          {/* Punto central del haz */}
          <circle cx="0" cy="0" r="5"
            fill="rgba(255,245,200,0.14)" />
        </g>

        {/* ══════════════════════════
            LÍNEA DE ESCANEO (OCT decorativo)
        ══════════════════════════ */}
        <line x1="18" y1="200" x2="382" y2="200"
          stroke="rgba(130,190,255,0.22)" strokeWidth="1">
          <animate attributeName="y1" values="22;378;22"
            dur="4s" begin="3.5s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" keyTimes="0;0.5;1" />
          <animate attributeName="y2" values="22;378;22"
            dur="4s" begin="3.5s" repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" keyTimes="0;0.5;1" />
          <animate attributeName="opacity" values="0;0.55;0.55;0"
            keyTimes="0;0.06;0.94;1" dur="4s" begin="3.5s" repeatCount="indefinite" />
        </line>

      </g>

      {/* ── Marco del oftalmoscopio ── */}
      <circle cx="200" cy="200" r="183"
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

      {/* Anillo exterior oscuro (visor) */}
      <circle cx="200" cy="200" r="200" fill="rgba(0,0,0,0)" />
      <circle cx="200" cy="200" r="183"
        fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />

      {/* Etiqueta OD (ojo derecho) */}
      <text x="36" y="232"
        fontFamily="'Courier New', monospace" fontSize="11"
        fill="rgba(255,255,255,0.22)" letterSpacing="2">OD</text>

      {/* Escala de referencia (1 diámetro de disco) */}
      <line x1="328" y1="360" x2="360" y2="360"
        stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <line x1="328" y1="357" x2="328" y2="363"
        stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <line x1="360" y1="357" x2="360" y2="363"
        stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <text x="332" y="373"
        fontFamily="'Courier New', monospace" fontSize="9"
        fill="rgba(255,255,255,0.18)">1 DD</text>
    </svg>
  );
}
