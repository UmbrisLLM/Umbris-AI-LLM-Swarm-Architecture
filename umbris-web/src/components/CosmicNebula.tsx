"use client";

/**
 * CosmicNebula — slow drifting violet/void nebula behind the Eclipse.
 *
 * Implementation: a fullscreen GLSL fragment shader on a flat plane
 * inside a small Three.js scene. fBm noise + slow time evolution
 * gives the cosmic dust backdrop · tinted in cosmic violet with deep
 * void at the centre, so the 3D Eclipse sits in front cleanly.
 *
 * Renders only once mounted (no SSR). Respects prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    // Slowly drifting nebula field.
    vec2 q = uv * 1.4;
    q.x += uTime * 0.008;
    q.y += uTime * 0.004;

    float n = fbm(q + fbm(q + fbm(q)));
    n = smoothstep(0.35, 0.92, n);

    // Strong radial vignette — keep the centre pure void so the
    // Eclipse silhouette reads cleanly.
    float radial = smoothstep(0.0, 1.3, length(uv));
    n *= mix(0.0, 1.0, radial);

    // Cosmic violet tint — never pure white, never blue.
    // #9C7BD9 = (0.612, 0.482, 0.851)
    vec3 violet = vec3(0.612, 0.482, 0.851);
    vec3 col = violet * n * uIntensity;

    // Add a faint deep-purple/black floor everywhere so the nebula
    // never disappears into pure black completely.
    col += vec3(0.02, 0.012, 0.045) * (1.0 - radial * 0.4);

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface CosmicNebulaProps {
  intensity?: number;
  className?: string;
}

export function CosmicNebula({ intensity = 0.45, className }: CosmicNebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = containerRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
      uIntensity: { value: intensity },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let raf = 0;
    const start = performance.now();

    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      uniforms.uTime.value = reduced ? 0 : t;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      material.dispose();
      quad.geometry.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      aria-hidden
    />
  );
}
