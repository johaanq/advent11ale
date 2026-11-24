"use client"

import { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Html, RoundedBox, Sparkles } from "@react-three/drei"
import type { Group } from "three"
import * as THREE from "three"

// 4 regalos ÚNICOS - diferentes tamaños y colores
export const GIFT_STYLES: { box: string; ribbon: string; metallic: boolean; size: [number, number, number] }[] = [
  // Día 8 - VERDE CON ROJO - Muy grande
  { box: "#2E7D32", ribbon: "#D21F3C", metallic: false, size: [2.0, 1.0, 1.6] },
  // Día 9 - ROJO CON DORADO - Muy alto
  { box: "#C62828", ribbon: "#F2C14E", metallic: true, size: [1.0, 1.8, 1.0] },
  // Día 10 - ROSA CON PLATEADO - Mediano
  { box: "#D81B60", ribbon: "#D9D9E0", metallic: true, size: [1.3, 1.3, 1.3] },
  // Día 11 - AZUL CON DORADO - Pequeño (CUMPLEAÑOS)
  { box: "#1565C0", ribbon: "#F2C14E", metallic: true, size: [1.1, 1.1, 1.1] },
]

interface GiftBox3DProps {
  gift: { id: number; day: number }
  position: [number, number, number]
  onClick: () => void
  isAnimating?: boolean
  isDisabled?: boolean
  isOpened?: boolean
  isHighlighted?: boolean
}

const ANIMATION_DURATION = 1.8
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t: number) => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function GiftBox3D({
  gift,
  position,
  onClick,
  isAnimating = false,
  isDisabled = false,
  isOpened = false,
  isHighlighted = false,
}: GiftBox3DProps) {
  const groupRef = useRef<Group>(null)
  const lidRef = useRef<Group>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)

  // Datos de la animación de apertura (en coordenadas locales del padre)
  const anim = useRef<{
    start: number | null
    from: THREE.Vector3
    to: THREE.Vector3
    fromQuat: THREE.Quaternion
    targetScale: number
  }>({
    start: null,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    fromQuat: new THREE.Quaternion(),
    targetScale: 1,
  })

  const style = GIFT_STYLES[gift.id - 1] ?? GIFT_STYLES[0]
  const [w, h, d] = style.size
  const isBirthday = gift.day === 11

  // Materiales compartidos (uno por tipo, no uno por mesh)
  const boxMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: style.box,
        roughness: 0.42,
        metalness: 0.05,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
      }),
    [style.box]
  )
  const ribbonMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: style.ribbon,
        roughness: style.metallic ? 0.28 : 0.45,
        metalness: style.metallic ? 0.75 : 0.1,
        sheen: 1,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color(style.ribbon).lerp(new THREE.Color("#ffffff"), 0.4),
        clearcoat: 0.4,
      }),
    [style.ribbon, style.metallic]
  )
  const innerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color(style.box).multiplyScalar(0.35), roughness: 0.9 }),
    [style.box]
  )
  const sparkleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#FFD700",
        emissive: "#FFB300",
        emissiveIntensity: 3,
        metalness: 0.9,
        roughness: 0.2,
      }),
    []
  )

  useEffect(() => {
    return () => {
      boxMaterial.dispose()
      ribbonMaterial.dispose()
      innerMaterial.dispose()
      sparkleMaterial.dispose()
    }
  }, [boxMaterial, ribbonMaterial, innerMaterial, sparkleMaterial])

  // Sombras para todos los meshes del regalo
  useLayoutEffect(() => {
    groupRef.current?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }, [])

  // Cursor de mano al pasar por encima
  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = "pointer"
    return () => {
      document.body.style.cursor = ""
    }
  }, [hovered])

  // Reiniciar la animación cuando se desactiva
  useEffect(() => {
    if (!isAnimating) anim.current.start = null
  }, [isAnimating])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return
    const t = state.clock.elapsedTime
    const k = 1 - Math.pow(0.001, delta) // lerp independiente del framerate

    // Intensidad de la luz propia (hover / cumpleaños)
    if (lightRef.current) {
      const target = isBirthday ? (hovered ? 3 : 2.2) : hovered || isAnimating ? 1.8 : 0
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, target, k)
    }

    // Halo dorado del regalo que toca abrir
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      const target = isHighlighted && !isOpened && !isAnimating ? 0.35 + Math.sin(t * 2.4) * 0.2 : 0
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, k)
      haloRef.current.visible = mat.opacity > 0.01
    }

    // ===== ANIMACIÓN DE APERTURA =====
    if (isAnimating) {
      const a = anim.current
      if (a.start === null && group.parent) {
        a.start = t
        a.from.copy(group.position)
        a.fromQuat.copy(group.quaternion)

        // Punto frente a la cámara (en mundo) → coordenadas locales del padre
        const dist = 5
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        const worldTarget = camera.position.clone().add(dir.multiplyScalar(dist))
        group.parent.updateWorldMatrix(true, false)
        a.to.copy(group.parent.worldToLocal(worldTarget))

        // Escala para que quepa bien en pantalla
        const persp = camera as THREE.PerspectiveCamera
        const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2))
        const visible = Math.min(visH, visH * persp.aspect)
        const parentScale = group.parent.getWorldScale(new THREE.Vector3()).x
        a.targetScale = (visible * 0.42) / (Math.max(w, h, d) * parentScale)
      }
      if (a.start === null) return

      const elapsed = t - a.start
      const p = Math.min(elapsed / ANIMATION_DURATION, 1)
      const move = easeInOutCubic(Math.min(p / 0.7, 1))

      group.position.lerpVectors(a.from, a.to, move)
      // Pequeño arco hacia arriba durante el vuelo
      group.position.y += Math.sin(move * Math.PI) * 0.6

      const s = THREE.MathUtils.lerp(1, a.targetScale, easeOutBack(Math.min(p / 0.7, 1)))
      group.scale.setScalar(s)

      // Giro elegante: una vuelta completa que se detiene de frente
      group.rotation.set(Math.sin(elapsed * 3) * 0.12 * (1 - p), move * Math.PI * 2, Math.cos(elapsed * 2.5) * 0.06 * (1 - p))

      // La tapa salta y se aparta en la última parte
      if (lidRef.current) {
        const lp = THREE.MathUtils.clamp((p - 0.55) / 0.45, 0, 1)
        const le = 1 - Math.pow(1 - lp, 3)
        lidRef.current.position.set(le * w * 0.25, h * 0.48 + le * (h * 0.35 + 0.35), -le * d * 0.55)
        lidRef.current.rotation.set(-le * 1.1, 0, le * 0.25)
      }
      return
    }

    // ===== ABIERTO: tapa descansando en el suelo =====
    if (isOpened) {
      group.position.set(position[0], position[1], position[2])
      group.scale.setScalar(1)
      group.rotation.set(0, 0, 0)
      if (lidRef.current) {
        const lidThickness = h * 0.12
        lidRef.current.position.set(w * 0.5, -h / 2 + lidThickness / 2 + 0.035, d * 0.85)
        lidRef.current.rotation.set(0.1, 0.5, 0.05)
      }
      return
    }

    // ===== HOVER: flota y gira suavemente =====
    if (hovered && !isDisabled) {
      const targetY = position[1] + 0.3 + Math.sin(t * 2) * 0.04
      group.position.x = THREE.MathUtils.lerp(group.position.x, position[0], k)
      group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, k)
      group.position.z = THREE.MathUtils.lerp(group.position.z, position[2], k)
      const sc = THREE.MathUtils.lerp(group.scale.x, 1.12, k)
      group.scale.setScalar(sc)
      group.rotation.y += delta * 0.9
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, Math.sin(t * 1.5) * 0.08, k)
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, k)
    } else {
      // Reposo: pequeño "latido" si es el que toca abrir
      const breathe = isHighlighted && !isDisabled ? Math.max(0, Math.sin(t * 2.4)) * 0.06 : 0
      group.position.x = THREE.MathUtils.lerp(group.position.x, position[0], k)
      group.position.y = THREE.MathUtils.lerp(group.position.y, position[1] + breathe, k)
      group.position.z = THREE.MathUtils.lerp(group.position.z, position[2], k)
      const sc = THREE.MathUtils.lerp(group.scale.x, 1, k)
      group.scale.setScalar(sc)

      // Volver a la rotación original por el camino más corto
      let currentY = group.rotation.y % (Math.PI * 2)
      if (currentY > Math.PI) currentY -= Math.PI * 2
      if (currentY < -Math.PI) currentY += Math.PI * 2
      group.rotation.y = THREE.MathUtils.lerp(currentY, 0, k)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, k)
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, k)
    }

    if (lidRef.current) {
      lidRef.current.position.x = THREE.MathUtils.lerp(lidRef.current.position.x, 0, k)
      lidRef.current.position.y = THREE.MathUtils.lerp(lidRef.current.position.y, h * 0.48, k)
      lidRef.current.position.z = THREE.MathUtils.lerp(lidRef.current.position.z, 0, k)
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, 0, k)
      lidRef.current.rotation.y = THREE.MathUtils.lerp(lidRef.current.rotation.y, 0, k)
      lidRef.current.rotation.z = THREE.MathUtils.lerp(lidRef.current.rotation.z, 0, k)
    }
  })

  const wall = 0.045
  const band = 0.18

  return (
    <group ref={groupRef} position={position}>
      {/* Halo en el suelo para el regalo que toca abrir */}
      <mesh ref={haloRef} position={[0, -h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[Math.max(w, d) * 0.62, Math.max(w, d) * 0.85, 48]} />
        <meshBasicMaterial color="#FFD86B" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>

      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          if (!isDisabled && !isOpened) setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!isDisabled) onClick()
        }}
      >
        {/* CAJA HUECA (5 paredes) para que parezca vacía al abrirse */}
        <group>
          <RoundedBox args={[w, h, wall]} radius={0.018} smoothness={2} position={[0, 0, -d / 2 + wall / 2]} material={boxMaterial} />
          <RoundedBox args={[w, h, wall]} radius={0.018} smoothness={2} position={[0, 0, d / 2 - wall / 2]} material={boxMaterial} />
          <RoundedBox args={[wall, h, d - wall * 2]} radius={0.018} smoothness={2} position={[-w / 2 + wall / 2, 0, 0]} material={boxMaterial} />
          <RoundedBox args={[wall, h, d - wall * 2]} radius={0.018} smoothness={2} position={[w / 2 - wall / 2, 0, 0]} material={boxMaterial} />
          <RoundedBox args={[w, wall, d]} radius={0.018} smoothness={2} position={[0, -h / 2 + wall / 2, 0]} material={boxMaterial} />
          {/* Interior oscuro para dar profundidad */}
          <mesh position={[0, -h / 2 + wall + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={innerMaterial}>
            <planeGeometry args={[w - wall * 2, d - wall * 2]} />
          </mesh>
        </group>

        {/* TAPA */}
        <group ref={lidRef} position={[0, h * 0.48, 0]}>
          <RoundedBox args={[w * 1.04, h * 0.12, d * 1.04]} radius={Math.min(0.04, h * 0.05)} smoothness={3} material={boxMaterial} />

          {/* Listones sobre la tapa */}
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[w * 1.06, h * 0.12 + 0.012, band]} />
          </mesh>
          <mesh material={ribbonMaterial}>
            <boxGeometry args={[band, h * 0.12 + 0.012, d * 1.06]} />
          </mesh>

          {/* MOÑO */}
          <group position={[0, h * 0.06 + 0.08, 0]}>
            <mesh material={ribbonMaterial} scale={[1, 0.8, 1]}>
              <sphereGeometry args={[0.09, 20, 16]} />
            </mesh>
            <group position={[-0.15, 0.05, 0]} rotation={[0, 0, Math.PI / 2.6]}>
              <mesh material={ribbonMaterial} scale={[1, 1, 0.55]}>
                <torusGeometry args={[0.13, 0.045, 12, 28, Math.PI * 1.15]} />
              </mesh>
            </group>
            <group position={[0.15, 0.05, 0]} rotation={[0, Math.PI, Math.PI / 2.6]}>
              <mesh material={ribbonMaterial} scale={[1, 1, 0.55]}>
                <torusGeometry args={[0.13, 0.045, 12, 28, Math.PI * 1.15]} />
              </mesh>
            </group>
            <mesh position={[-0.11, -0.05, 0.06]} rotation={[0.25, 0, -0.9]} material={ribbonMaterial}>
              <boxGeometry args={[0.075, 0.26, 0.02]} />
            </mesh>
            <mesh position={[0.11, -0.05, 0.06]} rotation={[0.25, 0, 0.9]} material={ribbonMaterial}>
              <boxGeometry args={[0.075, 0.26, 0.02]} />
            </mesh>
          </group>
        </group>

        {/* LISTÓN VERTICAL alrededor de la caja */}
        <mesh position={[0, 0, d / 2 + 0.006]} material={ribbonMaterial}>
          <boxGeometry args={[band, h * 0.98, 0.012]} />
        </mesh>
        <mesh position={[0, 0, -d / 2 - 0.006]} material={ribbonMaterial}>
          <boxGeometry args={[band, h * 0.98, 0.012]} />
        </mesh>
        <mesh position={[w / 2 + 0.006, 0, 0]} material={ribbonMaterial}>
          <boxGeometry args={[0.012, h * 0.98, band]} />
        </mesh>
        <mesh position={[-w / 2 - 0.006, 0, 0]} material={ribbonMaterial}>
          <boxGeometry args={[0.012, h * 0.98, band]} />
        </mesh>

        {/* Luz de hover / cumpleaños */}
        {/* Siempre montada (montar/desmontar luces fuerza recompilar todos los shaders) */}
        <pointLight
          ref={lightRef}
          position={[0, h * 0.9, 0]}
          intensity={isBirthday ? 2.2 : 0}
          distance={3.5}
          decay={2}
          color={isBirthday ? "#FFD27A" : style.box}
        />

        {/* Destellos dorados para cumpleaños */}
        {isBirthday &&
          [0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * w * 0.62, h * 0.62, Math.sin(a) * d * 0.62]}
                rotation={[0, a, 0]}
                material={sparkleMaterial}
              >
                <octahedronGeometry args={[0.055, 0]} />
              </mesh>
            )
          })}
      </group>

      {/* Explosión de destellos al abrir */}
      {isAnimating && (
        <Sparkles
          count={45}
          scale={[w * 1.8, h * 1.6, d * 1.8]}
          position={[0, h * 0.4, 0]}
          size={7}
          speed={1.6}
          color="#FFD86B"
          noise={1.5}
        />
      )}

      {/* Tooltip con el día */}
      {hovered && !isAnimating && (
        <Html position={[0, h * 0.75 + 0.45, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div
            className="font-mono font-semibold whitespace-nowrap rounded-md px-2.5 py-1 text-sm text-amber-100"
            style={{
              background: "rgba(60, 14, 18, 0.88)",
              border: "1px solid rgba(253, 230, 138, 0.45)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            {isBirthday ? "🎂 " : "🎁 "}Día {gift.day}
          </div>
        </Html>
      )}
    </group>
  )
}
