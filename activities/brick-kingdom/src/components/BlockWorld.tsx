import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PLACE_COLORS, PLACE_SHORT } from '../game/logic'

type Focus = 'all' | 0 | 1 | 2 | 3

const CAMERAS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  all: { pos: [0, 48, 78], target: [0, 4, -2] },
  0: { pos: [10, 16, 40], target: [10, 1, 13] },
  1: { pos: [-14, 18, 44], target: [-14, 4, 12] },
  2: { pos: [24, 22, 22], target: [24, 5, -18] },
  3: { pos: [-20, 28, 26], target: [-20, 5, -22] },
}

const LAYOUT = [
  {
    size: [1, 1, 1] as [number, number, number],
    pos: (i: number): [number, number, number] => [4 + (i % 10) * 1.4, 0.5, 14 - Math.floor(i / 10) * 1.8],
    label: [10.5, 5, 13] as [number, number, number],
    ring: [10.3, 0.02, 13.2] as [number, number, number],
    ringR: 8.5,
  },
  {
    size: [1, 10, 1] as [number, number, number],
    pos: (i: number): [number, number, number] => [-22 + (i % 10) * 1.8, 5, 14 - Math.floor(i / 10) * 3],
    label: [-14, 13.5, 12.5] as [number, number, number],
    ring: [-14, 0.02, 12.5] as [number, number, number],
    ringR: 10,
  },
  {
    size: [1, 10, 10] as [number, number, number],
    pos: (i: number): [number, number, number] => [14 + (i % 10) * 2.2, 5, -14 - Math.floor(i / 10) * 13],
    label: [24, 14, -18] as [number, number, number],
    ring: [24, 0.02, -20] as [number, number, number],
    ringR: 13,
  },
  {
    size: [10, 10, 10] as [number, number, number],
    pos: (i: number): [number, number, number] => [-32 + (i % 3) * 12.5, 5, -12 - Math.floor(i / 3) * 12.5],
    label: [-19.5, 15, -22] as [number, number, number],
    ring: [-19.5, 0.02, -24.5] as [number, number, number],
    ringR: 19,
  },
]

interface BlockWorldProps {
  counts: number[]
  activePlace: number | null
  focus: Focus
  equation: string | null
}

export function BlockWorld({ counts, activePlace, focus, equation }: BlockWorldProps) {
  return (
    <div className="scene-frame">
      <Canvas shadows camera={{ position: [0, 48, 78], fov: 42, near: 0.5, far: 400 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#bae6fd']} />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#ffffff', '#86efac', 0.4]} />
        <directionalLight
          position={[30, 50, 20]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-camera-far={160}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[91, 64]} />
          <meshStandardMaterial color="#6ee7b7" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[90, 64]} />
          <meshStandardMaterial color="#a7f3d0" />
        </mesh>
        <Tree position={[-62, 0, 10]} scale={1.3} />
        <Tree position={[58, 0, 12]} scale={1.1} />
        <Tree position={[-50, 0, -50]} scale={1.6} />
        <Tree position={[55, 0, -45]} scale={1.4} />
        <Tree position={[0, 0, -60]} scale={1.2} />
        <Cloud position={[-30, 40, -60]} />
        <Cloud position={[35, 46, -70]} />
        <Cloud position={[0, 44, -90]} />
        {[3, 2, 1, 0].map((place) => (
          <PlacePile
            key={place}
            place={place}
            count={Math.max(0, counts[place] ?? 0)}
            active={activePlace === place}
          />
        ))}
        <CameraRig focus={focus} />
      </Canvas>
      <div className="scene-tools">
        <span className="drag-hint">🖱️ 拖曳旋轉 · 滾輪縮放</span>
      </div>
      {equation && <div className="equation-badge">{equation}</div>}
    </div>
  )
}

function PlacePile({ place, count, active }: { place: number; count: number; active: boolean }) {
  const layout = LAYOUT[place]!
  const shown = Math.min(count, place === 0 ? 30 : 18)
  return (
    <group>
      {Array.from({ length: shown }, (_, i) => (
        <Block key={`${place}-${i}-${shown}`} position={layout.pos(i)} size={layout.size} color={PLACE_COLORS[place]!} />
      ))}
      {active && <Ring position={layout.ring} radius={layout.ringR} color={PLACE_COLORS[place]!} />}
      <Html position={layout.label} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`pile-label ${active ? 'active' : ''}`} style={{ background: PLACE_COLORS[place] }}>
          <span>{PLACE_SHORT[place]}位</span>
          <b>{count}</b>
        </div>
      </Html>
    </group>
  )
}

function Block({
  position,
  size,
  color,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  const scale = useRef(0.01)
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    scale.current = THREE.MathUtils.damp(scale.current, 1, 9, dt)
    mesh.scale.setScalar(Math.max(0.001, scale.current))
  })
  const materials = useMemo(() => {
    const base = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 })
    const shade = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 })
    shade.color.offsetHSL(0, 0, -0.06)
    return [base, base, shade, shade, base, base]
  }, [color])
  return (
    <mesh ref={ref} position={position} material={materials} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

function Ring({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.getElapsedTime()
    const s = 1 + Math.sin(t * 3) * 0.06
    mesh.scale.set(s, s, s)
    const mat = mesh.material as THREE.MeshBasicMaterial
    mat.opacity = 0.45 + Math.sin(t * 3) * 0.2
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.9, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 3, 8]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, 5, 0]} castShadow>
        <coneGeometry args={[3, 6, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 8.5, 0]} castShadow>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  )
}

function Cloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const seed = useMemo(() => Math.random() * 100, [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.x = position[0] + Math.sin(clock.getElapsedTime() * 0.15 + seed) * 4
  })
  return (
    <group ref={ref} position={position}>
      {[
        [0, 0, 0, 3],
        [3, 0.5, 0, 2.4],
        [-3, 0.3, 0, 2.2],
        [1, 1.5, 0, 2],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x!, y!, z!]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}

function CameraRig({ focus }: { focus: Focus }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const anim = useRef<{
    from: THREE.Vector3
    fromT: THREE.Vector3
    to: THREE.Vector3
    toT: THREE.Vector3
    t: number
  } | null>(null)

  useEffect(() => {
    const shot = CAMERAS[String(focus)]
    const orbit = controls.current
    if (!shot || !orbit) return
    anim.current = {
      from: camera.position.clone(),
      fromT: orbit.target.clone(),
      to: new THREE.Vector3(...shot.pos),
      toT: new THREE.Vector3(...shot.target),
      t: 0,
    }
  }, [focus, camera])

  useFrame((_, dt) => {
    const state = anim.current
    const orbit = controls.current
    if (!state || !orbit) return
    state.t = Math.min(1, state.t + dt / 1.3)
    const e = state.t < 0.5 ? 4 * state.t ** 3 : 1 - (-2 * state.t + 2) ** 3 / 2
    camera.position.lerpVectors(state.from, state.to, e)
    orbit.target.lerpVectors(state.fromT, state.toT, e)
    orbit.update()
    if (state.t >= 1) anim.current = null
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={12}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2 - 0.08}
      onStart={() => {
        anim.current = null
      }}
    />
  )
}
