"use client";

/**
 * PlanetarySystem3D · the convocation, in real 3D.
 *
 * Replaces the flat SVG diagrams in §3 The Convocation and §4 Live
 * Convocation. The Umbra holds the centre as a pitch-black sphere
 * ringed by a violet corona with a diamond-ring flash. Eight planetary
 * agents float in 3D space at varying z-depths · not on a flat ring ·
 * so the system reads as a cosmic body, not a circuit diagram.
 *
 * Glowing violet thread lines connect each planet to the Umbra. When an
 * agent is active (deliberating), its thread pulses and a particle
 * travels along it from the planet inward · the visual signal that
 * this planet is currently writing to the substrate. Hovered planets
 * surface a single floating info card beneath the canvas.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  AGENT_DESCRIPTORS,
  SIGIL_UNICODE,
  type AgentRole,
} from "@umbris/design";

const VIOLET = "#9C7BD9";
const CORONA = "#FAE6B0";
const LUNAR  = "#DCDEE7";
const GREY   = "#4A4D5C";

// ──────────────────────────────────────────────────────────────────
// Layout · 8 planets in 3D space (varying z-depths)
// ──────────────────────────────────────────────────────────────────

interface PlanetSpec {
  role: AgentRole;
  label: string;
  angleDeg: number;
  radius: number;
  z: number;
}

const PLANETS: PlanetSpec[] = [
  { role: "MERCURIUS", label: "Mercurius", angleDeg:   0, radius: 2.2, z:  0.45 },
  { role: "VENUS",     label: "Venus",     angleDeg:  45, radius: 2.4, z: -0.30 },
  { role: "MARS",      label: "Mars",      angleDeg:  90, radius: 2.2, z:  0.20 },
  { role: "SOL",       label: "Sol",       angleDeg: 135, radius: 2.0, z: -0.55 },
  { role: "IUPPITER",  label: "Iuppiter",  angleDeg: 180, radius: 2.3, z:  0.35 },
  { role: "SATURNUS",  label: "Saturnus",  angleDeg: 225, radius: 2.2, z: -0.45 },
  { role: "LUNA",      label: "Luna",      angleDeg: 270, radius: 2.0, z:  0.50 },
  { role: "STELLA",    label: "Stella",    angleDeg: 315, radius: 2.3, z: -0.25 },
];

function planetPos(p: PlanetSpec): [number, number, number] {
  const a = (p.angleDeg * Math.PI) / 180;
  return [Math.cos(a) * p.radius, Math.sin(a) * p.radius, p.z];
}

// ──────────────────────────────────────────────────────────────────
// Umbra · centre · pure void sphere + violet corona + flash
// ──────────────────────────────────────────────────────────────────

function Umbra() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {[
        { r: 0.555, w: 0.018, op: 0.95 },
        { r: 0.590, w: 0.030, op: 0.6 },
        { r: 0.660, w: 0.060, op: 0.32 },
        { r: 0.780, w: 0.140, op: 0.16 },
      ].map((c, i) => (
        <mesh key={i}>
          <ringGeometry args={[c.r, c.r + c.w, 96]} />
          <meshBasicMaterial
            color={VIOLET}
            transparent
            opacity={c.op}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
      <DiamondFlash />
    </group>
  );
}

function DiamondFlash() {
  const ref = useRef<THREE.Mesh>(null);
  const angle = Math.PI / 2 - Math.PI / 6;
  const x = Math.cos(angle) * 0.56;
  const y = Math.sin(angle) * 0.56;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 2.4 + 1.2 * Math.sin((t / 2.4) * Math.PI * 2);
  });
  return (
    <mesh ref={ref} position={[x, y, 0.04]}>
      <sphereGeometry args={[0.022, 16, 16]} />
      <meshStandardMaterial
        color={LUNAR}
        emissive={CORONA}
        emissiveIntensity={2.4}
        roughness={0.15}
      />
    </mesh>
  );
}

// ──────────────────────────────────────────────────────────────────
// Planet · one orb at its 3D position
// ──────────────────────────────────────────────────────────────────

function Planet({
  spec,
  isActive,
  isCompleted,
  isHovered,
  onHover,
  onClick,
}: {
  spec: PlanetSpec;
  isActive: boolean;
  isCompleted: boolean;
  isHovered: boolean;
  onHover: (r: AgentRole | null) => void;
  onClick?: (r: AgentRole) => void;
}) {
  const pos = planetPos(spec);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!core.current || !halo.current) return;
    const t = state.clock.elapsedTime;
    const m = core.current.material as THREE.MeshStandardMaterial;
    const haloM = halo.current.material as THREE.MeshBasicMaterial;
    if (isActive) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      m.emissiveIntensity = 1.6 + pulse * 1.2;
      halo.current.scale.setScalar(1.4 + pulse * 0.35);
      haloM.opacity = 0.35 + pulse * 0.25;
    } else if (isHovered) {
      m.emissiveIntensity = 1.3;
      halo.current.scale.setScalar(1.35);
      haloM.opacity = 0.45;
    } else if (isCompleted) {
      m.emissiveIntensity = 0.9;
      halo.current.scale.setScalar(1.2);
      haloM.opacity = 0.18;
    } else {
      m.emissiveIntensity = 0.55;
      halo.current.scale.setScalar(1.15);
      haloM.opacity = 0.12;
    }
  });

  return (
    <group
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(spec.role);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={() => onClick?.(spec.role)}
    >
      <mesh ref={halo}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshStandardMaterial
          color={LUNAR}
          emissive={VIOLET}
          emissiveIntensity={0.55}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// Thread · line from planet to Umbra, glows + particles when active
// ──────────────────────────────────────────────────────────────────

function Thread({
  to,
  isActive,
  isCompleted,
}: {
  to: [number, number, number];
  isActive: boolean;
  isCompleted: boolean;
}) {
  const ref = useRef<THREE.LineSegments>(null);
  const particle = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([0, 0, 0, to[0], to[1], to[2]]),
        3,
      ),
    );
    return g;
  }, [to]);

  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.LineBasicMaterial;
    if (isActive) {
      m.color.set(VIOLET);
      m.opacity = 0.85;
    } else if (isCompleted) {
      m.color.set(LUNAR);
      m.opacity = 0.42;
    } else {
      m.color.set(GREY);
      m.opacity = 0.28;
    }
    if (particle.current) {
      const pm = particle.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const t = (state.clock.elapsedTime * 0.7) % 1;
        const k = 1 - t;
        particle.current.position.set(to[0] * k, to[1] * k, to[2] * k);
        pm.opacity = Math.sin(t * Math.PI);
      } else {
        pm.opacity = 0;
      }
    }
  });

  return (
    <group>
      <lineSegments ref={ref} geometry={geometry}>
        <lineBasicMaterial
          color={GREY}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </lineSegments>
      <mesh ref={particle}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial
          color={VIOLET}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// Starfield
// ──────────────────────────────────────────────────────────────────

function StarField({ count = 240 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 12 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({
      color: LUNAR,
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
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
// Rotating scene root with mouse parallax tilt
// ──────────────────────────────────────────────────────────────────

function SceneRoot({
  activeAgents,
  completedAgents,
  hovered,
  onHover,
  onClick,
  interactive,
}: {
  activeAgents: ReadonlySet<AgentRole>;
  completedAgents: ReadonlySet<AgentRole>;
  hovered: AgentRole | null;
  onHover: (r: AgentRole | null) => void;
  onClick?: (r: AgentRole) => void;
  interactive: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive]);

  useFrame((_, dt) => {
    if (!group.current) return;
    current.current.x += (target.current.x - current.current.x) * 0.04;
    current.current.y += (target.current.y - current.current.y) * 0.04;
    group.current.rotation.y += dt * 0.04;
    group.current.rotation.x = current.current.y * 0.18;
    group.current.rotation.z = current.current.x * -0.05;
  });

  return (
    <group ref={group}>
      <Umbra />
      {PLANETS.map((p) => (
        <Thread
          key={`t-${p.role}`}
          to={planetPos(p)}
          isActive={activeAgents.has(p.role)}
          isCompleted={completedAgents.has(p.role)}
        />
      ))}
      {PLANETS.map((p) => (
        <Planet
          key={p.role}
          spec={p}
          isActive={activeAgents.has(p.role)}
          isCompleted={completedAgents.has(p.role)}
          isHovered={hovered === p.role}
          onHover={onHover}
          onClick={onClick}
        />
      ))}
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────
// Top-level
// ──────────────────────────────────────────────────────────────────

export interface PlanetarySystem3DProps {
  activeAgents?: ReadonlySet<AgentRole>;
  completedAgents?: ReadonlySet<AgentRole>;
  onAgentClick?: (r: AgentRole) => void;
  height?: number;
  className?: string;
  interactive?: boolean;
  emptyPrompt?: string;
}

const EMPTY: ReadonlySet<AgentRole> = new Set();

export function PlanetarySystem3D({
  activeAgents = EMPTY,
  completedAgents = EMPTY,
  onAgentClick,
  height = 520,
  className,
  interactive = true,
  emptyPrompt = "hover or focus a planet",
}: PlanetarySystem3DProps) {
  const [hovered, setHovered] = useState<AgentRole | null>(null);

  return (
    <div
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{ height }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.6]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 2, 2]} intensity={0.7} color={VIOLET} />
        <pointLight position={[-2, -1, 3]} intensity={0.3} color={LUNAR} />
        <StarField />
        <SceneRoot
          activeAgents={activeAgents}
          completedAgents={completedAgents}
          hovered={hovered}
          onHover={setHovered}
          onClick={onAgentClick}
          interactive={interactive}
        />
        <EffectComposer>
          <Bloom
            intensity={1.25}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.55}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* HUD overlay · single info card on hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6">
        <div
          className={`max-w-md text-center transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-60"
          }`}
        >
          {hovered ? (
            <div className="inline-flex items-baseline gap-3 border border-umbris-violet/60 bg-umbris-void/80 px-5 py-2 backdrop-blur-sm">
              <span className="text-umbris-violet text-lg leading-none">
                {SIGIL_UNICODE[hovered]}
              </span>
              <span className="umbris-display text-umbris-lunar text-sm tracking-widest">
                {hovered}
              </span>
              <span className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
                ·
              </span>
              <span className="umbris-serif italic text-umbris-stellar text-sm">
                {AGENT_DESCRIPTORS[hovered]}
              </span>
            </div>
          ) : (
            <p className="umbris-mono text-umbris-grey text-[10px] uppercase tracking-widest">
              {emptyPrompt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
