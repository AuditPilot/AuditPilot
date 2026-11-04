import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { motion } from "framer-motion";

/**
 * Hero3D — procedural floating shield rendered with React Three Fiber.
 * - Continuous rotation + pointer-parallax (damped, low amplitude).
 * - Offline-safe: geometry is procedural and the "environment" is generated
 *   from <Lightformer> children (no remote HDR files).
 * - Graceful degradation: shows an animated SVG fallback on small screens,
 *   when the user prefers reduced motion, when WebGL is unavailable, or if
 *   the canvas throws. A spinner covers initialization so nothing blocks.
 */

/* ---------------------------------- scene ---------------------------------- */

/** Heater-shield outline as a 2D Shape. */
function buildShieldShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.05);
  s.quadraticCurveTo(0.86, 1.0, 0.86, 0.62);
  s.lineTo(0.86, -0.12);
  s.quadraticCurveTo(0.86, -0.82, 0, -1.1);
  s.quadraticCurveTo(-0.86, -0.82, -0.86, -0.12);
  s.lineTo(-0.86, 0.62);
  s.quadraticCurveTo(-0.86, 1.0, 0, 1.05);
  return s;
}

/** Beveled, extruded shield body. */
function buildShieldGeometry(): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(buildShieldShape(), {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 32,
  });
  geo.center();
  return geo;
}

/** One arm of the checkmark as a capsule (rotated to its segment angle). */
function CheckArm({
  from,
  to,
  radius = 0.05,
  tolerance,
}: {
  from: [number, number];
  to: [number, number];
  radius?: number;
  tolerance: number;
}) {
  const { pos, len, rot } = useMemo(() => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const full = Math.hypot(dx, dy);
    const len = Math.max(0.06, full - radius * 2);
    return {
      pos: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, tolerance] as [number, number, number],
      len,
      rot: Math.atan2(-dx, dy),
    };
  }, [from, to, radius, tolerance]);

  return (
    <mesh position={pos} rotation={[0, 0, rot]}>
      <capsuleGeometry args={[radius, len, 4, 12]} />
      <meshStandardMaterial
        color="#67e8f9"
        emissive="#22d3ee"
        emissiveIntensity={1.4}
        metalness={0.1}
        roughness={0.25}
      />
    </mesh>
  );
}

/** Spinning shield with orbiting satellites + particles, all in one group. */
function ShieldAssembly() {
  const shieldGeo = useMemo(buildShieldGeometry, []);
  const spinner = useRef<THREE.Group>(null);
  const satRing = useRef<THREE.Group>(null);
  const dust = useRef<THREE.Points>(null);

  // Mesh ring around the shield, tilted like Saturn.
  const ringTilt: [number, number, number] = [Math.PI / 2.6, 0.35, 0];

  // Star dust on a spherical shell.
  const dustGeo = useMemo(() => {
    const COUNT = 260;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 2.3 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.75; // squash vertically a touch
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => () => shieldGeo.dispose(), [shieldGeo]);
  useEffect(() => () => dustGeo.dispose(), [dustGeo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // Continuous sweep so the checkmark face stays presentable; the ring,
    // satellites and dust provide the full-circle "spin" feel.
    if (spinner.current) {
      spinner.current.rotation.y = Math.sin(t * 0.55) * 0.62;
      spinner.current.rotation.x = Math.sin(t * 0.45) * 0.06;
      spinner.current.position.y = Math.sin(t * 0.8) * 0.09;
    }
    // Satellites orbit counter to the shell dust.
    if (satRing.current) {
      satRing.current.rotation.z = state.pointer.x * 0.08;
      satRing.current.children.forEach((sat, i) => {
        const angle = t * 0.55 + (i * Math.PI * 2) / 3;
        sat.position.set(Math.cos(angle) * 1.62, Math.sin(angle) * 1.62, 0);
        sat.rotation.y += delta * 1.2;
      });
    }
    if (dust.current) {
      dust.current.rotation.y = -t * 0.05;
    }
  });

  return (
    <group>
      {/* continuous body spin */}
      <group ref={spinner}>
        <mesh geometry={shieldGeo} rotation={[0, 0, 0]}>
          <meshPhysicalMaterial
            color="#312e81"
            metalness={0.85}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.12}
            reflectivity={0.9}
          />
        </mesh>
        {/* CHECK embedded on the face — two capsule arms */}
        <CheckArm from={[-0.34, 0.08]} to={[-0.12, -0.2]} tolerance={0.14} />
        <CheckArm from={[-0.12, -0.2]} to={[0.38, 0.32]} tolerance={0.14} />
      </group>

      {/* orbit ring + satellites */}
      <group rotation={ringTilt}>
        <mesh ref={satRing} rotation={[Math.PI / 2, 0, 0]}>
          {[
            <mesh key="a"><octahedronGeometry args={[0.085, 0]} /><meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.9} metalness={0.6} roughness={0.2} /></mesh>,
            <mesh key="b"><octahedronGeometry args={[0.08, 0]} /><meshStandardMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={0.9} metalness={0.6} roughness={0.2} /></mesh>,
            <mesh key="c"><octahedronGeometry args={[0.07, 0]} /><meshStandardMaterial color="#e879f9" emissive="#a21caf" emissiveIntensity={0.9} metalness={0.6} roughness={0.2} /></mesh>,
          ]}
        </mesh>
        <mesh>
          <torusGeometry args={[1.62, 0.022, 12, 96]} />
          <meshStandardMaterial
            color="#a5b4fc"
            emissive="#6366f1"
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial
          size={0.022}
          sizeAttenuation
          color="#818cf8"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Outer group: damped pointer parallax + soft float. */
function ParallaxRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const px = state.pointer.x * 0.32;
    const py = state.pointer.y * 0.18;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, px, 3, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -py, 3, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, state.pointer.y * 0.12, 3, delta);
  });
  return <group ref={group}>{children}</group>;
}

function ShieldScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 6]} intensity={1.7} color="#e0e7ff" />
      <pointLight position={[-5, -2, -3]} intensity={30} distance={16} decay={2} color="#6366f1" />
      <pointLight position={[4, 3, 4]} intensity={22} distance={14} decay={2} color="#22d3ee" />

      <Environment resolution={128}>
        {/* offline "studio": soft rect lights instead of remote HDRs */}
        <Lightformer intensity={2} position={[0, 0, 5]} scale={[10, 10, 1]} color="#c7d2fe" />
        <Lightformer intensity={4} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#818cf8" />
        <Lightformer intensity={3} position={[5, -1, 0]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#22d3ee" />
        <Lightformer intensity={1.5} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} color="#a78bfa" />
      </Environment>

      <ParallaxRig>
        <ShieldAssembly />
      </ParallaxRig>
    </>
  );
}

/* --------------------------------- fuselage -------------------------------- */

let webglSupported: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  try {
    const canvas = document.createElement("canvas");
    webglSupported = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[Hero3D] WebGL scene failed, using static fallback:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** High-quality static stand-in (mobile / reduced-motion / no WebGL). */
function StaticShield() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="will-change-transform"
        style={{ animation: "float-y 5s ease-in-out infinite" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-indigo-500/25 blur-3xl" />
          <svg width="230" height="264" viewBox="0 0 100 115" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="shieldFill" x1="0" y1="0" x2="100" y2="115">
                <stop offset="0%" stopColor="#4338ca" />
                <stop offset="55%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="shieldEdge" x1="0" y1="0" x2="100" y2="115">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="60%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="97" rx="46" ry="12" fill="#6366f1" opacity="0.12" />
            <path
              d="M50 6 C68 14 84 16 90 16 L90 52 C90 80 72 101 50 112 C28 101 10 80 10 52 L10 16 C16 16 32 14 50 6 Z"
              fill="url(#shieldFill)"
              stroke="url(#shieldEdge)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M31 56 L45 70 L71 40"
              stroke="#22d3ee"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

export default function Hero3D() {
  const [ready, setReady] = useState(false);
  const [sizeOk, setSizeOk] = useState(() => typeof window === "undefined" ? false : window.innerWidth >= 1024);
  const reducedMotion = useReducedMotionFlag();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setSizeOk(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const canRender = sizeOk && !reducedMotion && hasWebGL();

  return (
    <div className="relative h-[360px] w-full sm:h-[440px] lg:h-[540px]">
      {canRender ? (
        <WebGLBoundary fallback={<StaticShield />}>
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0, 4.6], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            style={{ width: "100%", height: "100%" }}
            onCreated={() => setReady(true)}
          >
            <Suspense fallback={null}>
              <ShieldScene />
            </Suspense>
          </Canvas>
        </WebGLBoundary>
      ) : (
        <StaticShield />
      )}

      {/* Loading state — fades out once the GL context is live. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-10 flex items-center justify-center bg-transparent transition-opacity duration-500 ${
          ready || !canRender ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
      </div>
    </div>
  );
}

/** Tiny reduced-motion hook (keeps framer's hook out of the fallback path). */
function useReducedMotionFlag(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
