"use client"

import { useRef, useMemo, useLayoutEffect, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"
import * as THREE from "three"

// Capas del árbol (posición y radio) — compartidas por luces y adornos
const TIER_Y = [0.85, 1.65, 2.4, 3.1, 3.75]
const TIER_R = [1.45, 1.2, 0.95, 0.72, 0.52]

const DARK_GREEN = new THREE.Color("#173d26")
const MID_GREEN = new THREE.Color("#2f6b3f")
const LIGHT_GREEN = new THREE.Color("#5f9e62")

// Domo ondulado con colores por vértice para dar volumen
function createDomeTier(radius: number, heightRatio: number, angleOffset: number) {
  const geometry = new THREE.SphereGeometry(radius, 40, 14, 0, Math.PI * 2, 0, Math.PI * heightRatio)
  const pos = geometry.attributes.position

  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const borderZone = minY + (maxY - minY) * 0.22

  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const angle = Math.atan2(z, x) + angleOffset

    if (y < borderZone) {
      const distFromCenter = Math.sqrt(x * x + z * z)
      const seed = (Math.sin(angle * 11.3 + angleOffset * 2) + 1) / 2
      const wave1 = Math.sin(angle * 7) * radius * (0.05 + seed * 0.08)
      const wave2 = Math.sin(angle * 11 + 1) * radius * 0.04
      const wave3 = Math.sin(angle * 4.5 + 2) * radius * (0.04 + (1 - seed) * 0.05)
      const edgeIntensity = Math.max(0, 1 - (y - minY) / (borderZone - minY))
      const newDist = distFromCenter + (wave1 + wave2 + wave3) * edgeIntensity
      const scaleFactor = newDist / (distFromCenter || 1)
      pos.setX(i, x * scaleFactor)
      pos.setZ(i, z * scaleFactor)
    }

    // Borde inferior más claro (puntas de las ramas), parte superior más oscura (bajo la siguiente capa)
    const f = 1 - (y - minY) / (maxY - minY || 1)
    const noise = (Math.sin(angle * 23.7 + y * 17.1) + 1) * 0.5
    if (f > 0.5) c.copy(MID_GREEN).lerp(LIGHT_GREEN, (f - 0.5) * 2 * (0.65 + noise * 0.35))
    else c.copy(DARK_GREEN).lerp(MID_GREEN, f * 2)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  pos.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

// Estrella de 5 puntas extruida
function createStarGeometry(outer = 0.36, inner = 0.15) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
  })
  geo.center()
  return geo
}

// Paleta de foquitos cálida y cohesiva
const LIGHT_COLORS = ["#FFC861", "#FF4D4D", "#FFE9B0", "#FF9A3C", "#FFD24A", "#FF6F91", "#7FE3C4", "#FFB347"]
const ORNAMENT_COLORS = ["#B3122E", "#E2B23C", "#F3E7D3", "#1E3A73", "#8E1B3A"]

export function ChristmasTree() {
  const treeRef = useRef<Group>(null)
  const starRef = useRef<THREE.Mesh>(null)
  const bulbsRef = useRef<THREE.InstancedMesh>(null)
  const ornamentsRef = useRef<THREE.InstancedMesh>(null)
  const capsRef = useRef<THREE.InstancedMesh>(null)

  const tiers = useMemo(
    () => [
      { geometry: createDomeTier(1.45, 0.54, 0), y: 0.85 },
      { geometry: createDomeTier(1.2, 0.54, 0.73), y: 1.65 },
      { geometry: createDomeTier(0.95, 0.54, 1.47), y: 2.4 },
      { geometry: createDomeTier(0.72, 0.54, 2.35), y: 3.1 },
      { geometry: createDomeTier(0.52, 0.54, 3.89), y: 3.75 },
    ],
    []
  )
  const starGeometry = useMemo(() => createStarGeometry(), [])

  useEffect(() => {
    return () => {
      tiers.forEach((t) => t.geometry.dispose())
      starGeometry.dispose()
    }
  }, [tiers, starGeometry])

  // Posiciones de los foquitos (espiral sobre las capas)
  const bulbs = useMemo(() => {
    const count = 56
    return Array.from({ length: count }, (_, i) => {
      const t = i / count
      const angle = t * Math.PI * 2 * 5.5
      const tierIdx = t * (TIER_Y.length - 1)
      const base = Math.floor(tierIdx)
      const next = Math.min(base + 1, TIER_Y.length - 1)
      const blend = tierIdx - base
      const y = TIER_Y[base] * (1 - blend) + TIER_Y[next] * blend
      const radius = (TIER_R[base] * (1 - blend) + TIER_R[next] * blend) * 1.03
      return {
        position: new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
        color: new THREE.Color(LIGHT_COLORS[i % LIGHT_COLORS.length]),
        phase: (i * 2.399) % (Math.PI * 2),
        speed: 1.2 + ((i * 7) % 5) * 0.35,
      }
    })
  }, [])

  // Posiciones de los adornos
  const ornaments = useMemo(() => {
    const rows = [
      { count: 10, y: 1.15, r: 1.5, tier: 1 },
      { count: 9, y: 1.9, r: 1.24, tier: 2 },
      { count: 8, y: 2.62, r: 0.99, tier: 3 },
      { count: 6, y: 3.32, r: 0.75, tier: 4 },
      { count: 5, y: 3.98, r: 0.54, tier: 5 },
    ]
    const list: { position: THREE.Vector3; color: THREE.Color; scale: number }[] = []
    rows.forEach(({ count, y, r, tier }) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + tier * 0.3
        list.push({
          position: new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r),
          color: new THREE.Color(ORNAMENT_COLORS[(i + tier) % ORNAMENT_COLORS.length]),
          scale: 0.85 + ((i * 13 + tier * 7) % 5) * 0.06,
        })
      }
    })
    return list
  }, [])

  // Colocar instancias una sola vez
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    if (bulbsRef.current) {
      bulbs.forEach((b, i) => {
        dummy.position.copy(b.position)
        dummy.scale.set(1, 1.25, 1)
        dummy.updateMatrix()
        bulbsRef.current!.setMatrixAt(i, dummy.matrix)
        bulbsRef.current!.setColorAt(i, b.color)
      })
      bulbsRef.current.instanceMatrix.needsUpdate = true
      if (bulbsRef.current.instanceColor) bulbsRef.current.instanceColor.needsUpdate = true
    }
    if (ornamentsRef.current && capsRef.current) {
      ornaments.forEach((o, i) => {
        dummy.position.copy(o.position)
        dummy.scale.setScalar(o.scale)
        dummy.updateMatrix()
        ornamentsRef.current!.setMatrixAt(i, dummy.matrix)
        ornamentsRef.current!.setColorAt(i, o.color)

        dummy.position.set(o.position.x, o.position.y + 0.095 * o.scale, o.position.z)
        dummy.scale.setScalar(o.scale)
        dummy.updateMatrix()
        capsRef.current!.setMatrixAt(i, dummy.matrix)
      })
      ornamentsRef.current.instanceMatrix.needsUpdate = true
      if (ornamentsRef.current.instanceColor) ornamentsRef.current.instanceColor.needsUpdate = true
      capsRef.current.instanceMatrix.needsUpdate = true
    }
  }, [bulbs, ornaments])

  useLayoutEffect(() => {
    treeRef.current?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [])

  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (treeRef.current) treeRef.current.rotation.y += delta * 0.02
    if (starRef.current) {
      // La estrella siempre mira a la cámara, con un leve balanceo
      starRef.current.lookAt(state.camera.position)
      starRef.current.rotateY(Math.sin(t * 0.6) * 0.35)
      starRef.current.rotateZ(Math.sin(t * 0.8) * 0.05)
      const s = 1 + Math.sin(t * 2) * 0.04
      starRef.current.scale.setScalar(s)
    }
    // Parpadeo suave de los foquitos (colores > 1 para que el bloom los haga brillar)
    const mesh = bulbsRef.current
    if (mesh) {
      bulbs.forEach((b, i) => {
        const twinkle = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase)
        tmpColor.copy(b.color).multiplyScalar(1.2 + twinkle * 3.2)
        mesh.setColorAt(i, tmpColor)
      })
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <group ref={treeRef}>
      {/* MACETA */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.58, 0.46, 0.56, 40]} />
        <meshPhysicalMaterial color="#7a1f2b" roughness={0.45} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.035, 12, 48]} />
        <meshStandardMaterial color="#d4a843" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.49, 0.02, 10, 48]} />
        <meshStandardMaterial color="#d4a843" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* TRONCO */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.6, 20]} />
        <meshStandardMaterial color="#5b3720" roughness={0.9} />
      </mesh>

      {/* Relleno interior (cubre huecos entre capas) */}
      {[
        { y: 1.05, r: 1.35, h: 0.75 },
        { y: 1.85, r: 1.12, h: 0.7 },
        { y: 2.58, r: 0.9, h: 0.65 },
        { y: 3.25, r: 0.68, h: 0.6 },
        { y: 3.88, r: 0.48, h: 0.5 },
      ].map((fill, i) => (
        <mesh key={`fill-${i}`} position={[0, fill.y, 0]}>
          <cylinderGeometry args={[fill.r * 0.65, fill.r * 0.95, fill.h, 24]} />
          <meshStandardMaterial color="#173d26" roughness={0.95} />
        </mesh>
      ))}

      {/* CAPAS DEL ÁRBOL */}
      {tiers.map((tier, idx) => (
        <mesh key={`tier-${idx}`} position={[0, tier.y, 0]} geometry={tier.geometry}>
          <meshStandardMaterial vertexColors roughness={0.8} metalness={0} />
        </mesh>
      ))}

      {/* Punta */}
      <mesh position={[0, 4.35, 0]}>
        <coneGeometry args={[0.24, 0.5, 24]} />
        <meshStandardMaterial color="#2f6b3f" roughness={0.8} />
      </mesh>

      {/* ESTRELLA */}
      <group position={[0, 4.82, 0]}>
        <mesh ref={starRef} geometry={starGeometry}>
          <meshStandardMaterial
            color="#FFE08A"
            emissive="#FFB300"
            emissiveIntensity={2.6}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
        <pointLight color="#FFD27A" intensity={6} distance={6} decay={2} />
      </group>

      {/* FOQUITOS (una sola draw call) */}
      <instancedMesh ref={bulbsRef} args={[undefined, undefined, bulbs.length]}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Brillo conjunto del árbol */}
      <pointLight position={[0, 2.3, 0.6]} intensity={3} distance={5} color="#FFC46B" decay={2} />

      {/* ADORNOS (bolas lacadas) */}
      <instancedMesh ref={ornamentsRef} args={[undefined, undefined, ornaments.length]}>
        <sphereGeometry args={[0.095, 28, 20]} />
        <meshPhysicalMaterial metalness={0.55} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
      </instancedMesh>
      {/* Tapitas doradas */}
      <instancedMesh ref={capsRef} args={[undefined, undefined, ornaments.length]}>
        <cylinderGeometry args={[0.025, 0.03, 0.035, 10]} />
        <meshStandardMaterial color="#C9A23F" metalness={0.95} roughness={0.2} />
      </instancedMesh>
    </group>
  )
}
