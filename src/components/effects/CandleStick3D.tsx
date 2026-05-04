/// <reference types="@react-three/fiber" />
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface OHLCV { open: number; high: number; low: number; close: number }

interface BarProps {
  isUp: boolean
  x: number
  z: number
  bodyH: number
  bodyY: number
  wickH: number
  wickY: number
  rotY: number
}

function CandleBar({ isUp, x, z, bodyH, bodyY, wickH, wickY, rotY }: BarProps) {
  const color   = isUp ? '#C9A84C' : '#EF4D6A'
  const emissive = isUp ? '#7A5010' : '#7A0A20'
  const ei = isUp ? 3.5 : 3.0

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Wick */}
      <mesh position={[0, wickY, 0]}>
        <cylinderGeometry args={[0.025, 0.025, Math.max(wickH, 0.08), 6]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei * 0.6} toneMapped={false} />
      </mesh>
      {/* Body */}
      <mesh position={[0, bodyY, 0]}>
        <boxGeometry args={[0.5, Math.max(bodyH, 0.1), 0.3]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} transparent opacity={0.97} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Ring({ data }: { data: OHLCV[] }) {
  const groupRef = useRef<THREE.Group>(null!)

  const sample = useMemo(
    () => data.filter((_, i) => i % 4 === 0).slice(0, 72),
    [data],
  )

  const prices   = useMemo(() => data.map(d => d.close), [data])
  const allHigh  = useMemo(() => data.map(d => d.high),  [data])
  const allLow   = useMemo(() => data.map(d => d.low),   [data])
  const minPrice = useMemo(() => Math.min(...prices),     [prices])
  const maxPrice = useMemo(() => Math.max(...prices),     [prices])
  const minLow   = useMemo(() => Math.min(...allLow),     [allLow])
  const maxHigh  = useMemo(() => Math.max(...allHigh),    [allHigh])
  const priceRange = maxHigh - minLow || 1

  const bars: BarProps[] = useMemo(() => sample.map((d, i) => {
    const angle  = (i / sample.length) * Math.PI * 2
    const radius = 6.5
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const rotY = -angle + Math.PI / 2

    // Normalize heights to [0.05 .. 2.5] range
    const heightScale = 3.8 / priceRange

    const rawBodyH = Math.abs(d.close - d.open)
    const bodyH    = Math.max(rawBodyH * heightScale, 0.06)
    const bodyY    = ((d.open + d.close) / 2 - minLow) * heightScale - 1.5

    const wickH = (d.high - d.low) * heightScale
    const wickY = ((d.high + d.low) / 2 - minLow) * heightScale - 1.5

    const norm  = (d.close - minPrice) / (maxPrice - minPrice)
    const y     = norm * 1.2 - 0.6

    return { isUp: d.close >= d.open, x: x + Math.cos(angle)*0, z: z + Math.sin(angle)*0, bodyH, bodyY: bodyY + y*0, wickH, wickY: wickY + y*0, rotY }
  }), [sample, priceRange, minLow, minPrice, maxPrice])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.06
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {bars.map((b, i) => <CandleBar key={i} {...b} />)}
    </group>
  )
}

function GlowCore() {
  const outerRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (outerRef.current) outerRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.12)
    if (innerRef.current) innerRef.current.scale.setScalar(1 + Math.sin(t * 2.1 + 1) * 0.08)
  })
  return (
    <group position={[0, -0.5, 0]}>
      {/* Outer halo */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.4, 24, 24]} />
        <meshStandardMaterial color="#C9A84C" emissive="#C9A84C" emissiveIntensity={1.5} transparent opacity={0.06} toneMapped={false} />
      </mesh>
      {/* Inner core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial color="#FFD97A" emissive="#FFD97A" emissiveIntensity={6} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      {/* Ring disk */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.5, 0.04, 6, 120]} />
        <meshStandardMaterial color="#C9A84C" emissive="#C9A84C" emissiveIntensity={2} toneMapped={false} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

export default function CandleStick3D({ data }: { data: OHLCV[] }) {
  return (
    <Canvas
      camera={{ position: [0, 2, 11], fov: 68 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
      dpr={[1, 2]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 8, 0]}   intensity={6}   color="#C9A84C" distance={20} decay={2} />
      <pointLight position={[8, 1, 8]}   intensity={3}   color="#00D4FF" distance={22} decay={2} />
      <pointLight position={[-8, 1, -8]} intensity={2}   color="#4E7EE0" distance={22} decay={2} />
      <pointLight position={[0, -3, 0]}  intensity={1.5} color="#EF4D6A" distance={15} decay={2} />

      {/* Fog: near bars bright, far bars fade */}
      <fog attach="fog" args={['#050608', 12, 28]} />
      {/* Stars background */}
      <Stars radius={90} depth={60} count={5000} factor={3} saturation={0} fade speed={0.4} />

      {/* 3D content */}
      <Ring data={data} />
      <GlowCore />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.2}
      />
    </Canvas>
  )
}
