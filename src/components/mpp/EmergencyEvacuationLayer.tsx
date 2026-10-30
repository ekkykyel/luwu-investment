import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  PRECOMPUTED_EVAC_ROUTES,
  getPointOnPrecomputedRoute,
  EVAC_ASSEMBLY_POINT,
  EVAC_CONFIG,
  RouteGeometry
} from './assets/floorplan/evacConfig';

interface EmergencyEvacuationLayerProps {
  isSimulating: boolean;
  effectiveIsDark: boolean;
  onStopSimulation: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

// Deteksi Tier Perangkat
type PerformanceTier = 'low' | 'mid' | 'high';

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'high';

  // 1. Cek prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return 'low';

  // 2. Cek Save-Data
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return 'low';

  // 3. Cek deviceMemory & hardwareConcurrency
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (typeof memory === 'number') {
    if (memory <= 2) return 'low';
    if (memory <= 4) return 'mid';
    return 'high';
  }

  // Fallback hardware concurrency jika deviceMemory tidak tersedia
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores <= 2) return 'low';

  return 'high';
}

export const EmergencyEvacuationLayer: React.FC<EmergencyEvacuationLayerProps> = ({
  isSimulating,
  effectiveIsDark,
  onStopSimulation: _onStopSimulation,
  containerRef
}) => {
  const tier = useMemo<PerformanceTier>(() => detectPerformanceTier(), []);
  const [isInView, setIsInView] = useState(true);

  // Group refs for direct DOM manipulation (zero React render overhead during rAF)
  const animGroupRef = useRef<SVGGElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Chevron refs
  const chevronRefs = useRef<Map<string, SVGPathElement>>(new Map());
  // Runner icon refs (one per route)
  const runnerRefs = useRef<Map<string, SVGGElement>>(new Map());
  // Pulse ring ref
  const pulseRingRef = useRef<SVGCircleElement | null>(null);

  // IntersectionObserver to pause when offscreen
  useEffect(() => {
    if (!isSimulating) return;

    const targetEl = containerRef?.current || document.getElementById('cad-floorplan-container');
    if (!targetEl || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry?.isIntersecting ?? true);
      },
      { threshold: 0.05 }
    );

    observer.observe(targetEl);
    return () => observer.disconnect();
  }, [isSimulating, containerRef]);

  // Page visibility listener
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    if (!isSimulating) return;

    const handleVisibility = () => {
      setIsDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isSimulating]);

  // Main rAF Animation Loop (Only for mid and high tiers, only when in view & visible)
  useEffect(() => {
    if (!isSimulating) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    // Low tier: static chevrons, no rAF
    if (tier === 'low') {
      // Place chevrons at default static spacing
      (['utara', 'selatan', 'utama'] as const).forEach((key) => {
        const route = PRECOMPUTED_EVAC_ROUTES[key];
        route.chevronPositions.forEach((initialOffset, idx) => {
          const el = chevronRefs.current.get(`${key}-${idx}`);
          if (!el) return;
          const sample = getPointOnPrecomputedRoute(route, initialOffset);
          el.setAttribute(
            'transform',
            `translate(${sample.x.toFixed(1)}, ${sample.y.toFixed(1)}) rotate(${sample.angleDeg.toFixed(1)})`
          );
          el.setAttribute('opacity', '0.9');
        });

        // Place runner static near exit door
        const runnerEl = runnerRefs.current.get(key);
        if (runnerEl) {
          const sample = getPointOnPrecomputedRoute(route, route.totalLength - 80);
          runnerEl.setAttribute(
            'transform',
            `translate(${sample.x.toFixed(1)}, ${sample.y.toFixed(1)}) rotate(${sample.angleDeg.toFixed(1)})`
          );
          runnerEl.setAttribute('opacity', '1');
        }
      });
      return;
    }

    // Active animation for mid & high tiers
    const chevronSpeed = 75; // units per second
    const runnerSpeed = 130; // units per second
    const frameInterval = tier === 'mid' ? 33.3 : 16.6; // 30fps for mid, 60fps for high

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      // Throttle for mid-tier
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = timestamp;
        const elapsedSec = (timestamp - startTimeRef.current) / 1000;

        // 1. Update Chevrons along all 3 routes
        (['utara', 'selatan', 'utama'] as const).forEach((key) => {
          const route = PRECOMPUTED_EVAC_ROUTES[key];
          const distOffset = elapsedSec * chevronSpeed;

          route.chevronPositions.forEach((initialOffset, idx) => {
            const el = chevronRefs.current.get(`${key}-${idx}`);
            if (!el) return;

            const currentDist = (initialOffset + distOffset) % route.totalLength;
            const sample = getPointOnPrecomputedRoute(route, currentDist);

            // Opacity fade in near hub (0-100) and fade out near exit
            let opacity = 1.0;
            if (currentDist < 100) {
              opacity = Math.max(0.1, currentDist / 100);
            } else if (currentDist > route.totalLength - 100) {
              opacity = Math.max(0.1, (route.totalLength - currentDist) / 100);
            }

            el.setAttribute(
              'transform',
              `translate(${sample.x.toFixed(1)}, ${sample.y.toFixed(1)}) rotate(${sample.angleDeg.toFixed(1)})`
            );
            el.setAttribute('opacity', opacity.toFixed(2));
          });

          // 2. Update Running Person Pictogram along route
          const runnerEl = runnerRefs.current.get(key);
          if (runnerEl) {
            const runnerDist = (elapsedSec * runnerSpeed) % route.totalLength;
            const runnerSample = getPointOnPrecomputedRoute(route, runnerDist);

            let runnerOpacity = 1.0;
            if (runnerDist < 80) {
              runnerOpacity = Math.max(0.2, runnerDist / 80);
            } else if (runnerDist > route.totalLength - 80) {
              runnerOpacity = Math.max(0.2, (route.totalLength - runnerDist) / 80);
            }

            runnerEl.setAttribute(
              'transform',
              `translate(${runnerSample.x.toFixed(1)}, ${runnerSample.y.toFixed(1)}) rotate(${runnerSample.angleDeg.toFixed(1)})`
            );
            runnerEl.setAttribute('opacity', runnerOpacity.toFixed(2));
          }
        });

        // 3. Update pulsing ring at WP_HUB
        if (pulseRingRef.current) {
          const pulseT = (elapsedSec * 1.2) % 1; // 0 to 1 cycle
          const r = 28 + pulseT * 40;
          const op = (1 - pulseT) * 0.45;
          pulseRingRef.current.setAttribute('r', r.toFixed(1));
          pulseRingRef.current.setAttribute('opacity', op.toFixed(2));
        }
      }

      if (isInView && isDocumentVisible) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        rafIdRef.current = null;
      }
    };

    if (isInView && isDocumentVisible) {
      rafIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isSimulating, tier, isInView, isDocumentVisible]);

  if (!isSimulating) return null;

  // Colors per theme
  const routeColor = effectiveIsDark ? '#4ade80' : '#15803d';
  const bandColor = '#22c55e';
  const chevronColor = effectiveIsDark ? '#4ade80' : '#15803d';

  return (
    <g
      id="emergency-evacuation-layer"
      ref={animGroupRef}
      className="pointer-events-none transition-opacity duration-300"
    >
      {/* ── DEFINE SYMBOLS (Zero Filters) ── */}
      <defs>
        {/* Chevron Glyph: V-pointing forward (along positive X axis) */}
        <path
          id="evac-chevron-glyph"
          d="M -9 -13 L 7 0 L -9 13"
          fill="none"
          stroke={chevronColor}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Running Person Pictogram Symbol (ISO 7010 / K3 style) */}
        <g id="evac-runner-glyph">
          {/* Background Rounded Shield */}
          <rect
            x={-22}
            y={-18}
            width={44}
            height={36}
            rx={8}
            fill="#15803d"
            stroke="#ffffff"
            strokeWidth={2.5}
          />
          {/* Running Person Head */}
          <circle cx={4} cy={-9} r={3.2} fill="#ffffff" />
          {/* Running Person Body & Limbs */}
          <path
            d="M 1 -4 L -1 3 L 5 4 M -1 3 L -7 9 M 1 -4 L 7 -2 L 10 3 M 1 -4 L -4 -2 L -8 -6"
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      {/* ── 1. ROUTE BUFFER BANDS (Underneath) ── */}
      <g id="evac-buffer-bands">
        {(['utara', 'selatan', 'utama'] as const).map((key) => {
          const route: RouteGeometry = PRECOMPUTED_EVAC_ROUTES[key];
          return (
            <path
              key={`band-${key}`}
              d={route.d}
              fill="none"
              stroke={bandColor}
              strokeWidth={44}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={effectiveIsDark ? 0.22 : 0.18}
            />
          );
        })}
      </g>

      {/* ── 2. ROUTE CENTERLINE GUIDES ── */}
      <g id="evac-centerlines">
        {(['utara', 'selatan', 'utama'] as const).map((key) => {
          const route: RouteGeometry = PRECOMPUTED_EVAC_ROUTES[key];
          return (
            <path
              key={`centerline-${key}`}
              d={route.d}
              fill="none"
              stroke={routeColor}
              strokeWidth={3}
              strokeOpacity={0.45}
              strokeDasharray="10 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>

      {/* ── 3. ANIMATED CHEVRONS ALONG ROUTES ── */}
      <g id="evac-chevrons">
        {(['utara', 'selatan', 'utama'] as const).map((key) => {
          const route = PRECOMPUTED_EVAC_ROUTES[key];
          return route.chevronPositions.map((_, idx) => (
            <use
              key={`chev-${key}-${idx}`}
              href="#evac-chevron-glyph"
              ref={(el) => {
                if (el) chevronRefs.current.set(`${key}-${idx}`, el as unknown as SVGPathElement);
                else chevronRefs.current.delete(`${key}-${idx}`);
              }}
              opacity={0}
            />
          ));
        })}
      </g>

      {/* ── 4. RUNNING PERSON PICTOGRAMS (1 PER ROUTE) ── */}
      <g id="evac-runners">
        {(['utara', 'selatan', 'utama'] as const).map((key) => (
          <g
            key={`runner-${key}`}
            ref={(el) => {
              if (el) runnerRefs.current.set(key, el);
              else runnerRefs.current.delete(key);
            }}
            opacity={0}
          >
            <use href="#evac-runner-glyph" />
          </g>
        ))}
      </g>

      {/* ── 5. THREE EXIT DOORS (PINTU UTARA, PINTU SELATAN, PINTU UTAMA) ── */}
      <g id="evac-door-markers">
        {/* PINTU UTARA (Barat) ~(718, 793) */}
        <g transform="translate(718, 793)">
          {/* Door opening glow / highlight bar */}
          <line x1={-35} y1={-45} x2={-35} y2={45} stroke="#22c55e" strokeWidth={8} strokeLinecap="round" />
          {/* Signboard */}
          <g transform="translate(-140, -28)">
            <rect
              x={0}
              y={0}
              width={96}
              height={56}
              rx={8}
              fill="#15803d"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
            {/* White Exit Icon */}
            <path
              d="M 12 16 L 24 16 L 24 40 L 12 40"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d="M 18 28 L 30 28 M 26 23 L 31 28 L 26 33"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x={38} y={26} fill="#ffffff" fontSize={11} fontWeight="900" fontFamily="sans-serif">
              KELUAR
            </text>
            <text x={38} y={42} fill="#dcfce7" fontSize={9} fontWeight="700" fontFamily="sans-serif">
              P. UTARA
            </text>
          </g>
        </g>

        {/* PINTU SELATAN (Timur) ~(3162, 1143) */}
        <g transform="translate(3162, 1143)">
          {/* Door opening glow / highlight bar */}
          <line x1={25} y1={-45} x2={25} y2={45} stroke="#22c55e" strokeWidth={8} strokeLinecap="round" />
          {/* Signboard */}
          <g transform="translate(42, -28)">
            <rect
              x={0}
              y={0}
              width={100}
              height={56}
              rx={8}
              fill="#15803d"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
            <path
              d="M 14 16 L 26 16 L 26 40 L 14 40"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d="M 20 28 L 32 28 M 28 23 L 33 28 L 28 33"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x={40} y={26} fill="#ffffff" fontSize={11} fontWeight="900" fontFamily="sans-serif">
              KELUAR
            </text>
            <text x={40} y={42} fill="#dcfce7" fontSize={9} fontWeight="700" fontFamily="sans-serif">
              P. SELATAN
            </text>
          </g>
        </g>

        {/* PINTU UTAMA (Selatan) (1928, 1996) */}
        <g transform="translate(1928, 1996)">
          {/* Wide Door threshold highlight bar */}
          <line x1={-120} y1={2} x2={120} y2={2} stroke="#22c55e" strokeWidth={10} strokeLinecap="round" />
          {/* Center Signboard */}
          <g transform="translate(-80, 20)">
            <rect
              x={0}
              y={0}
              width={160}
              height={58}
              rx={10}
              fill="#15803d"
              stroke="#ffffff"
              strokeWidth={3}
            />
            <path
              d="M 20 18 L 32 18 L 32 40 L 20 40"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path
              d="M 26 29 L 38 29 M 34 24 L 39 29 L 34 34"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x={48} y={26} fill="#ffffff" fontSize={12} fontWeight="900" fontFamily="sans-serif">
              PINTU UTAMA
            </text>
            <text x={48} y={44} fill="#bbf7d0" fontSize={11} fontWeight="800" fontFamily="sans-serif">
              KELUAR UTAMA (EXIT)
            </text>
          </g>
        </g>
      </g>

      {/* ── 6. CENTRAL ASSEMBLY POINT AT WP_HUB (1922, 832) ── */}
      <g transform={`translate(${EVAC_ASSEMBLY_POINT.x}, ${EVAC_ASSEMBLY_POINT.y})`}>
        {/* Pulsing Outer Ring (Static if low tier) */}
        {tier !== 'low' ? (
          <circle
            ref={pulseRingRef}
            cx={0}
            cy={0}
            r={32}
            fill="#22c55e"
            opacity={0.3}
          />
        ) : (
          <circle cx={0} cy={0} r={48} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.4} strokeDasharray="6 6" />
        )}

        {/* Static Background Core Disc */}
        <circle cx={0} cy={0} r={28} fill="#15803d" stroke="#ffffff" strokeWidth={3} />

        {/* Central ISO 7010 Assembly Point Icon (4 inward corner arrows pointing to central persons) */}
        <g stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Top-Left Arrow */}
          <path d="M -16 -16 L -8 -8 M -13 -8 L -8 -8 L -8 -13" />
          {/* Top-Right Arrow */}
          <path d="M 16 -16 L 8 -8 M 13 -8 L 8 -8 L 8 -13" />
          {/* Bottom-Left Arrow */}
          <path d="M -16 16 L -8 8 M -13 8 L -8 8 L -8 13" />
          {/* Bottom-Right Arrow */}
          <path d="M 16 16 L 8 8 M 13 8 L 8 8 L 8 13" />
        </g>
        {/* Person dot at center */}
        <circle cx={0} cy={0} r={2.5} fill="#ffffff" />

        {/* Titik Kumpul Badge Pill below the hub */}
        <g transform="translate(0, 44)">
          <rect
            x={-90}
            y={-14}
            width={180}
            height={28}
            rx={14}
            fill={effectiveIsDark ? '#052e16' : '#14532d'}
            stroke="#4ade80"
            strokeWidth={2}
          />
          <text
            x={0}
            y={4}
            fill="#ffffff"
            fontSize={11}
            fontWeight="900"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing="0.05em"
          >
            TITIK KUMPUL (WP_HUB)
          </text>
        </g>

        {/* Permanent K3 Verification Badge */}
        {!EVAC_CONFIG.verified && (
          <g transform="translate(0, 76)">
            <rect
              x={-130}
              y={-12}
              width={260}
              height={24}
              rx={6}
              fill="#78350f"
              stroke="#fbbf24"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={3}
              fill="#fef3c7"
              fontSize={9.5}
              fontWeight="800"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              ⚠ {EVAC_CONFIG.verificationNote}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};
