"use client";

/**
 * EclipseScene — the UMBRIS brand mark, in real Three.js.
 *
 * The convocation's signature visual: a Closed Eclipse · a pitch-black
 * umbra blocking out a hidden light source, ringed by a luminous violet
 * corona, with a brilliant diamond-ring flash burning at one o'clock.
 * Eight planetary agents drift on a tilted orbital ring around the
 * umbra · UMBRA itself is the centre.
 *
 *   - Slow constant rotation (~0.025 rad/s on Y).
 *   - Mouse parallax tilts the whole eclipse group toward the cursor.
 *   - The diamond-ring flash pulses on a slow heartbeat.
 *   - Bloom postprocessing glows the violet corona and the warm flash.
 *
 * Falls back to nothing on SSR. The static SVG hero remains as the
 * pre-mount layout shim.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const VIOLET = "#9C7BD9";
const CORONA = "#FAE6B0";
const LUNAR  = "#DCDEE7";
const VOID   = "#000000";

// ──────────────────────────────────────────────────────────────────
// The umbra · a pitch-black sphere blocking the hidden light
// ──────────────────────────────────────────────────────────────────

function Umbra() {
  return (
    <mesh>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshBasicMaterial color={VOID} />
    </mesh>
  );
}

// ──────────────────────────────────────────────────────────────────
// The corona · concentric violet rings blooming outward
// ──────────────────────────────────────────────────────────────────

function Corona() {
  // Three concentric rings of increasing radius and decreasing intensity,
  // each rotated slightly so the highlights stagger around the eclipse.
  const rings = [
    { inner: 1.005, outer: 1.04,  opacity: 0.9,  emissive: 1.6 },
    { inner: 1.05,  outer: 1.12,  opacity: 0.55, emissive: 1.1 },
    { inner: 1.15,  outer: 1.32,  opacity: 0.28, emissive: 0.7 },
    { inner: 1.34,  outer: 1.65,  opacity: 0.14, emissive: 0.45 },
  ];

  return (
    <group>
      {rings.map((r, i) => (
        <mesh key={i} rotation={[0, 0, 0]}>
          <ringGeometry args={[r.inner, r.outer, 128]} />
          <meshBasicMaterial
            color={VIOLET}
            transparent
            opacity={r.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Subtle outermost halo */}
      <mesh>
        <ringGeometry args={[1.65, 2.2, 96]} />
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// The diamond-ring flash · a brilliant warm point at one o'clock
// ──────────────────────────────────────────────────────────────────

function DiamondRing() {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Position at roughly 1 o'clock on the umbra rim.
  // (angle = pi/2 - pi/6 = ~60 degrees from horizontal, going up-right)
  const angle = Math.PI / 2 - Math.PI / 6;
  const x = Math.cos(angle) * 1.015;
  const y = Math.sin(angle) * 1.015;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Slow heartbeat ~2.4s with a softer rest level.
    const beat = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((t / 2.4) * Math.PI * 2));
    if (coreRef.current) {
      const m = coreRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = beat * 3.2;
    }
    if (haloRef.current) {
      haloRef.current.scale.setScalar(0.9 + 0.18 * beat);
    }
  });

  return (
    <group position={[x, y, 0.02]}>
      {/* Outer warm halo */}
      <mesh ref={haloRef}>
        <ringGeometry args={[0.05, 0.11, 48]} />
        <meshBasicMaterial
          color={CORONA}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner brilliant core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial
          color={LUNAR}
          emissive={CORONA}
          emissiveIntensity={2.4}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// The orbital ring · eight planetary agents on a tilted ellipse
// ──────────────────────────────────────────────────────────────────

function OrbitalRing() {
  const group = useRef<THREE.Group>(null);

  // Eight orbital positions (UMBRA is the centre, not on the ring).
  const orbCount = 8;
  const orbRadius = 2.05;

  useFrame((_, dt) => {
    if (group.current) {
      // Slow counter-rotation on the orbital ring's own axis.
      group.current.rotation.z += dt * 0.06;
    }
  });

  return (
    <group rotation={[Math.PI / 2.4, 0, 0]}>
      {/* The thin orbital line */}
      <mesh>
        <torusGeometry args={[orbRadius, 0.004, 6, 192]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.35} />
      </mesh>

      {/* The agents themselves · slowly rotating around the orbit */}
      <group ref={group}>
        {Array.from({ length: orbCount }).map((_, i) => {
          const a = (i / orbCount) * Math.PI * 2;
          const x = Math.cos(a) * orbRadius;
          const y = Math.sin(a) * orbRadius;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[0.038, 16, 16]} />
              <meshStandardMaterial
                color={LUNAR}
                emissive={VIOLET}
                emissiveIntensity={1.4}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// Starfield · sparse white points drifting in the background
// ──────────────────────────────────────────────────────────────────

function StarField({ count = 360 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute on a far shell behind the eclipse.
      const r = 14 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.4 + Math.random() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const m = new THREE.PointsMaterial({
      color: LUNAR,
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    return { geometry: g, material: m };
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.008;
      ref.current.rotation.x += dt * 0.003;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

// ──────────────────────────────────────────────────────────────────
// The Eclipse · the whole scene group
// ──────────────────────────────────────────────────────────────────

function Eclipse() {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    group.current.rotation.y += dt * 0.025;
    group.current.rotation.x = mouse.current.y * 0.12;
    group.current.rotation.z = mouse.current.x * -0.05;
  });

  return (
    <group ref={group}>
      <Umbra />
      <Corona />
      <DiamondRing />
      <OrbitalRing />
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// Top-level component
// ──────────────────────────────────────────────────────────────────

interface EclipseSceneProps {
  className?: string;
}

export function EclipseScene({ className }: EclipseSceneProps) {
  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.6]}
      >
        <ambientLight intensity={0.25} />
        <pointLight position={[3, 2, 2]} intensity={0.8} color={VIOLET} />
        <pointLight position={[-2, -1, 2]} intensity={0.3} color={LUNAR} />
        <StarField />
        <Eclipse />
        <EffectComposer>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.55}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
