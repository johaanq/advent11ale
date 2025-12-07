"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { Mesh, Group } from "three"
import * as THREE from "three"

interface GiftBox3DProps {
  gift: any
  position: [number, number, number]
  onClick: () => void
  isAnimating?: boolean
  isDisabled?: boolean
}

export function GiftBox3D({ gift, position, onClick, isAnimating = false, isDisabled = false }: GiftBox3DProps) {
  const groupRef = useRef<Group>(null)
  const lidRef = useRef<Group>(null)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null)
  const [initialPosition, setInitialPosition] = useState<[number, number, number]>(position)
  const animationDuration = 1.8 // Duración de la animación en segundos

  // Iniciar animación cuando isAnimating cambia a true
  useEffect(() => {
    if (isAnimating && !animationStartTime) {
      setInitialPosition([
        groupRef.current?.position.x || position[0],
        groupRef.current?.position.y || position[1],
        groupRef.current?.position.z || position[2]
      ])
      setAnimationStartTime(Date.now())
    } else if (!isAnimating && animationStartTime) {
      setAnimationStartTime(null)
    }
  }, [isAnimating, animationStartTime, position])

  // Memoizar valores calculados para evitar recrearlos en cada frame
  const targetScale = useMemo(() => new THREE.Vector3(1.15, 1.15, 1.15), [])
  const defaultScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])

  useFrame((state) => {
    if (!groupRef.current) return
    
    // Optimización: Saltar frame si está deshabilitado y no hay animación
    if (isDisabled && !isAnimating && !hovered) return

    // ANIMACIÓN DE CLICK: Mover al centro de la pantalla, girar y abrir
    if (isAnimating && animationStartTime) {
      const elapsed = (Date.now() - animationStartTime) / 1000
      const progress = Math.min(elapsed / animationDuration, 1)
      
      // Función de easing para suavizar la animación
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)

      // Calcular posición del centro de la pantalla en coordenadas 3D
      // Usar la posición de la cámara como referencia y mover hacia adelante
      const centerX = camera.position.x
      const centerY = camera.position.y
      const centerZ = camera.position.z - 3 // Más cerca de la cámara

      // Interpolar posición
      groupRef.current.position.x = THREE.MathUtils.lerp(initialPosition[0], centerX, easedProgress)
      groupRef.current.position.y = THREE.MathUtils.lerp(initialPosition[1], centerY, easedProgress)
      groupRef.current.position.z = THREE.MathUtils.lerp(initialPosition[2], centerZ, easedProgress)

      // Escalar (hacer más grande)
      const animationScale = 1.8
      const currentScale = THREE.MathUtils.lerp(1, animationScale, easedProgress)
      groupRef.current.scale.set(currentScale, currentScale, currentScale)

      // Rotación continua mientras se mueve
      groupRef.current.rotation.y = elapsed * 3 // Gira más rápido
      groupRef.current.rotation.x = Math.sin(elapsed * 4) * 0.2
      groupRef.current.rotation.z = Math.cos(elapsed * 3) * 0.1

      // Animar tapa abriéndose
      if (lidRef.current) {
        const lidOpenAngle = easedProgress * Math.PI * 0.6 // Abre hasta ~108 grados
        lidRef.current.rotation.x = -lidOpenAngle
        // Mover la tapa un poco hacia arriba mientras se abre
        lidRef.current.position.y = h * 0.48 + Math.sin(lidOpenAngle) * h * 0.15
      }

      return
    }

    // Comportamiento normal cuando NO está animando
    // Skip updates for disabled non-hovered gifts to improve performance
    if (isDisabled && !hovered) {
      return
    }

    // Optimización: Solo calcular time y vibraciones si es necesario
    if (hovered && !isDisabled) {
      const time = state.clock.elapsedTime
      const vibrationX = Math.sin(time * 8 + position[0]) * 0.008
      const vibrationZ = Math.cos(time * 6 + position[2]) * 0.008
      
      // Elevación más pronunciada (simplificada)
      groupRef.current.position.y = position[1] + 0.3 + Math.sin(time * 2.5) * 0.05
      groupRef.current.position.x = position[0] + vibrationX * 2
      groupRef.current.position.z = position[2] + vibrationZ * 2
      groupRef.current.scale.lerp(targetScale, 0.15)
      // Rotación suave y continua (simplificada)
      groupRef.current.rotation.y = time * 0.5
      groupRef.current.rotation.x = Math.sin(time * 1.5) * 0.1
      
      // Mantener tapa cerrada
      if (lidRef.current) {
        lidRef.current.rotation.x = 0
        lidRef.current.position.y = h * 0.48
      }
    } else {
      // Solo calcular vibraciones si no está deshabilitado
      if (!isDisabled) {
        const time = state.clock.elapsedTime
        const vibrationX = Math.sin(time * 8 + position[0]) * 0.008
        const vibrationZ = Math.cos(time * 6 + position[2]) * 0.008
        groupRef.current.position.x = position[0] + vibrationX
        groupRef.current.position.z = position[2] + vibrationZ
      } else {
        groupRef.current.position.x = position[0]
        groupRef.current.position.z = position[2]
      }
      groupRef.current.position.y = position[1]
      groupRef.current.scale.lerp(defaultScale, 0.1)
      // Volver a la rotación original suavemente - normalizar ángulos primero
      let targetY = 0
      let targetX = 0
      
      // Normalizar la rotación actual al rango [-PI, PI] para evitar saltos
      let currentY = groupRef.current.rotation.y
      let currentX = groupRef.current.rotation.x
      
      // Normalizar Y
      while (currentY > Math.PI) currentY -= Math.PI * 2
      while (currentY < -Math.PI) currentY += Math.PI * 2
      
      // Usar el ángulo más corto para la interpolación
      let diffY = targetY - currentY
      if (diffY > Math.PI) diffY -= Math.PI * 2
      if (diffY < -Math.PI) diffY += Math.PI * 2
      
      groupRef.current.rotation.y = currentY + diffY * 0.15
      groupRef.current.rotation.x = THREE.MathUtils.lerp(currentX, targetX, 0.15)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.15)
      
      // Mantener tapa cerrada
      if (lidRef.current) {
        lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, 0, 0.15)
        lidRef.current.position.y = THREE.MathUtils.lerp(lidRef.current.position.y, h * 0.48, 0.15)
      }
    }
  })

  // 4 regalos ÚNICOS - diferentes tamaños y colores
  const giftStyles = [
    // Día 8 - VERDE CON ROJO - Muy grande
    { box: "#2E7D32", ribbon: "#DC143C", size: [2.0, 1.0, 1.6] },
    // Día 9 - ROJO CON DORADO - Muy alto
    { box: "#C62828", ribbon: "#FFD700", size: [1.0, 1.8, 1.0] },
    // Día 10 - ROSA CON PLATEADO - Mediano
    { box: "#D81B60", ribbon: "#C0C0C0", size: [1.3, 1.3, 1.3] },
    // Día 11 - AZUL CON DORADO - Pequeño (CUMPLEAÑOS)
    { box: "#1565C0", ribbon: "#FFD700", size: [1.1, 1.1, 1.1] },
  ]

  const style = giftStyles[gift.id - 1]
  const [w, h, d] = style.size

  return (
      <group ref={groupRef} position={position}>
      <group
        onPointerEnter={(e) => {
          e.stopPropagation()
          if (!isDisabled) {
            setHovered(true)
          }
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={isDisabled ? undefined : onClick}
      >
        {/* CAJA PRINCIPAL con acabado glossy - Geometría optimizada (reducida de 32 a 8 segmentos) */}
        <mesh>
          <boxGeometry args={[w, h, d, 8, 8, 8]} />
          <meshStandardMaterial
            color={style.box}
            roughness={0.22}
            metalness={0.18}
          />
        </mesh>

        {/* TAPA - Capa superior ligeramente más grande - Con ref para animación */}
        <group ref={lidRef} position={[0, h * 0.48, 0]}>
          <mesh>
            <boxGeometry args={[w * 1.04, h * 0.12, d * 1.04, 8, 8, 8]} />
            <meshStandardMaterial
              color={style.box}
              roughness={0.18}
              metalness={0.25}
            />
          </mesh>


          {/* LISTÓN SOBRE LA TAPA (horizontal) */}
          <mesh>
            <boxGeometry args={[w * 1.08, 0.18, 0.24]} />
            <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
          </mesh>

          {/* LISTÓN SOBRE LA TAPA (vertical) */}
          <mesh>
            <boxGeometry args={[0.24, 0.18, d * 1.08]} />
            <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
          </mesh>

          {/* MOÑO REAL - Sobre la tapa - Dentro del grupo de la tapa */}
          <group position={[0, h * 0.06 + 0.12, 0]}>
            {/* Centro/nudo del moño */}
            <mesh>
              <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color={style.ribbon}
              roughness={0.1}
              metalness={0.75}
            />
            </mesh>

            {/* Loop IZQUIERDO - se levanta hacia arriba */}
            <group position={[-0.15, 0.08, 0]} rotation={[0, 0, Math.PI / 2.5]}>
              <mesh>
                <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI]} />
            <meshStandardMaterial
              color={style.ribbon}
              roughness={0.1}
              metalness={0.75}
            />
              </mesh>
            </group>

            {/* Loop DERECHO - se levanta hacia arriba */}
            <group position={[0.15, 0.08, 0]} rotation={[0, 0, -Math.PI / 2.5]}>
              <mesh>
                <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI]} />
            <meshStandardMaterial
              color={style.ribbon}
              roughness={0.1}
              metalness={0.75}
            />
              </mesh>
            </group>

            {/* Cola IZQUIERDA - cuelga hacia afuera */}
            <mesh position={[-0.14, -0.18, 0]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[0.09, 0.28, 0.04]} />
            <meshStandardMaterial
              color={style.ribbon}
              roughness={0.1}
              metalness={0.75}
            />
            </mesh>

            {/* Cola DERECHA - cuelga hacia afuera */}
            <mesh position={[0.14, -0.18, 0]} rotation={[0, 0, 0.15]}>
              <boxGeometry args={[0.09, 0.28, 0.04]} />
            <meshStandardMaterial
              color={style.ribbon}
              roughness={0.1}
              metalness={0.75}
            />
            </mesh>
          </group>
        </group>

        {/* LISTÓN HORIZONTAL - Banda estrecha alrededor del medio */}
        
        {/* Frente */}
        <mesh position={[0, 0, d * 0.52]}>
          <boxGeometry args={[w * 1.05, 0.18, 0.02]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Lado DERECHO */}
        <mesh position={[w * 0.52, 0, 0]}>
          <boxGeometry args={[0.02, 0.18, d * 1.05]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Lado IZQUIERDO */}
        <mesh position={[-w * 0.52, 0, 0]}>
          <boxGeometry args={[0.02, 0.18, d * 1.05]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Atrás */}
        <mesh position={[0, 0, -d * 0.52]}>
          <boxGeometry args={[w * 1.05, 0.18, 0.02]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* LISTÓN VERTICAL - Cruz sobre la tapa */}
        
        {/* Frente a tapa */}
        <mesh position={[0, 0, d * 0.52]}>
          <boxGeometry args={[0.18, h * 1.05, 0.02]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Sobre la tapa */}
        <mesh position={[0, h * 0.52, 0]}>
          <boxGeometry args={[0.18, 0.02, d * 1.05]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Atrás */}
        <mesh position={[0, 0, -d * 0.52]}>
          <boxGeometry args={[0.18, h * 1.05, 0.02]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Lado DERECHO vertical */}
        <mesh position={[w * 0.52, 0, 0]}>
          <boxGeometry args={[0.02, h * 1.05, 0.18]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Lado IZQUIERDO vertical */}
        <mesh position={[-w * 0.52, 0, 0]}>
          <boxGeometry args={[0.02, h * 1.05, 0.18]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* ABAJO vertical */}
        <mesh position={[0, -h * 0.52, 0]}>
          <boxGeometry args={[0.18, 0.02, d * 1.05]} />
          <meshStandardMaterial 
            color={style.ribbon} 
            roughness={0.1} 
            metalness={0.7}
          />
        </mesh>

        {/* Luz cuando hover o cumpleaños */}
        {(hovered || gift.day === 11) && (
          <pointLight
            position={[0, h * 0.8, 0]}
            intensity={gift.day === 11 ? 1.8 : 1.2}
            distance={3.5}
            color={gift.day === 11 ? "#FFD700" : style.box}
          />
        )}

        {/* Destellos dorados para cumpleaños */}
        {gift.day === 11 && (
          <>
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * w * 0.55, h * 0.55, Math.sin(a) * d * 0.55]}
                  rotation={[0, a, 0]}
                >
                  <coneGeometry args={[0.028, 0.11, 4]} />
                  <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FFD700"
                    emissiveIntensity={2.2}
                    metalness={0.95}
                  />
                </mesh>
              )
            })}
          </>
        )}
      </group>
    </group>
  )
}
