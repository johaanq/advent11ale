"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, useTexture } from "@react-three/drei"
import { Suspense, useState, useMemo, useCallback } from "react"
import { ChristmasTree } from "./christmas-tree-3d"
import { GiftBox3D } from "./gift-box-3d"
import * as THREE from "three"

interface ChristmasScene3DProps {
  gifts: any[]
  onSelectGift: (id: number) => void
  isAnimating: boolean
  openedGifts?: Set<number>
}

// Componente interno que carga la textura
function PictureFrameContent({ position }: { position: [number, number, number] }) {
  // Cargar la textura de la imagen de Snoopy
  const texture = useTexture('/snoopy.jpg')
  
  // Configurar la textura correctamente para mejor calidad sin rayas
  if (texture) {
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.anisotropy = 16
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
  }

  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* Marco del cuadro - Rojo - Plano, sin grosor */}
      <mesh>
        {/* Marco exterior - Plano, pegado a la pared */}
        <planeGeometry args={[3.0, 3.0]} />
        <meshStandardMaterial 
          color="rgb(120, 30, 40)" 
          roughness={0.6}
        />
      </mesh>
      
      {/* Marco interior - Borde plano */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[2.8, 2.8]} />
        <meshStandardMaterial 
          color="rgb(100, 25, 35)" 
          roughness={0.7}
        />
      </mesh>

      {/* Imagen de Snoopy - Cuadrada 236x236 - Rotada 180 grados en Z para corregir orientación - Plana */}
      <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial 
          map={texture}
          color="#ffffff"
          roughness={0.1}
          metalness={0}
        />
      </mesh>
    </group>
  )
}

// Componente wrapper que maneja errores
function PictureFrame({ position }: { position: [number, number, number] }) {
  return (
    <Suspense fallback={
      <group position={position} rotation={[0, -Math.PI / 2, 0]}>
        {/* Marco del cuadro - Rojo (placeholder mientras carga) - Plano */}
        <mesh>
          <planeGeometry args={[3.0, 3.0]} />
          <meshStandardMaterial 
            color="rgb(120, 30, 40)" 
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[2.8, 2.8]} />
          <meshStandardMaterial 
            color="rgb(100, 25, 35)" 
            roughness={0.7}
          />
        </mesh>
        {/* Placeholder gris */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[2.5, 2.5]} />
          <meshStandardMaterial 
            color="rgb(220, 220, 220)"
            roughness={0.3}
          />
        </mesh>
      </group>
    }>
      <PictureFrameContent position={position} />
    </Suspense>
  )
}

export function ChristmasScene3D({ gifts, onSelectGift, isAnimating, openedGifts = new Set() }: ChristmasScene3DProps) {
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null)

  const handleSelectGift = useCallback((id: number) => {
    // Prevenir si ya hay una animación en curso
    if (isAnimating) {
      return
    }
    
    // Determinar qué regalo debe abrirse según el orden
    // Primer regalo abierto = día 8, segundo = día 9, tercero = día 10, cuarto = día 11
    const openedCount = openedGifts.size
    const giftOrder = [8, 9, 10, 11] // Orden de días que deben abrirse
    const dayToOpen = giftOrder[openedCount]
    
    // Si ya se abrieron todos los regalos, no hacer nada
    if (openedCount >= giftOrder.length) {
      return
    }
    
    // Buscar el regalo correspondiente al día que debe abrirse
    const giftToOpen = gifts.find(g => g.day === dayToOpen)
    if (!giftToOpen) {
      return
    }
    
    // Prevenir si el regalo que debe abrirse ya está abierto
    if (openedGifts.has(giftToOpen.id)) {
      return
    }
    
    setSelectedGiftId(id) // Usar el ID del regalo clicado para la animación
    // Esperar a que termine la animación (1.8 segundos) antes de cambiar de página
    // Pasar el ID del regalo que debe abrirse, no el que se hizo clic
    setTimeout(() => {
      onSelectGift(giftToOpen.id)
      setSelectedGiftId(null)
    }, 1800)
  }, [gifts, openedGifts, isAnimating, onSelectGift])

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Canvas 
        shadows={false}
        camera={{ position: [-1, 2, 6], fov: 30 }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
        gl={{ 
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        <OrbitControls 
          target={[11, 3, -7]}
          enableZoom={false}
          autoRotate={false}
          enablePan={false}
          enableRotate={false}
          minDistance={3}
          maxDistance={16}
        />

        {/* Iluminación ambiental cálida */}
        <ambientLight intensity={0.4} color="#fff5e6" />
        
        {/* Luz principal (simula luz de ventana) - Sin sombras para mejor rendimiento */}
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.0}
          color="#ffffff"
        />
        
        {/* Luces de acento */}
        <pointLight position={[-5, 3, 5]} intensity={0.8} color="#ffd700" />
        <pointLight position={[5, 3, 5]} intensity={0.8} color="#ff6b6b" />
        
        {/* Luz ambiental suave desde abajo */}
        <hemisphereLight intensity={0.3} color="#fff5e6" groundColor="#2d1616" />

        <Suspense fallback={null}>
          {/* Componente de cuadro con imagen */}
          <PictureFrame position={[14.6, 3.9, -7]} />
          
          {/* Luz adicional para iluminar mejor el cuadro */}
          <pointLight 
            position={[13, 4, -6]} 
            intensity={0.6} 
            color="#ffffff"
            distance={5}
            decay={2}
          />

          {/* CUARTO - Caja con paredes */}
          
          {/* PISO BLANCO */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[30, 25]} />
            <meshStandardMaterial 
              color="#f5f5f5" 
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>

          {/* Detalles del piso - Líneas decorativas */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <planeGeometry args={[30, 0.1]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <planeGeometry args={[0.1, 25]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>

          {/* PARED TRASERA BLANCA */}
          <mesh position={[0, 4, -12]}>
            <planeGeometry args={[30, 8]} />
            <meshStandardMaterial 
              color="#ffffff" 
              roughness={0.7}
              side={2}
            />
          </mesh>

          {/* Detalles decorativos en pared trasera - Molduras */}
          <mesh position={[0, 6, -11.9]}>
            <boxGeometry args={[28, 0.15, 0.1]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
          <mesh position={[0, 2, -11.9]}>
            <boxGeometry args={[28, 0.15, 0.1]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>

          {/* PARED DERECHA BLANCA */}
          <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[25, 8]} />
            <meshStandardMaterial 
              color="#ffffff" 
              roughness={0.7}
              side={2}
            />
          </mesh>

          {/* Detalles decorativos en pared derecha */}
          <mesh position={[14.9, 6, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[23, 0.15, 0.1]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
          <mesh position={[14.9, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[23, 0.15, 0.1]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>

          {/* TECHO BLANCO */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
            <planeGeometry args={[30, 25]} />
            <meshStandardMaterial 
              color="#fafafa" 
              roughness={0.8}
              side={2}
            />
          </mesh>

          {/* ALFOMBRA ROJA DEBAJO DEL ÁRBOL - Ligeramente elevada */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13, 0.005, -10]}>
            <circleGeometry args={[3.5, 32]} />
            <meshStandardMaterial 
              color="rgb(120, 30, 40)" 
              roughness={0.9}
              metalness={0}
            />
          </mesh>

          {/* Borde dorado de la alfombra */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13, 0.01, -10]}>
            <ringGeometry args={[3.4, 3.5, 32]} />
            <meshStandardMaterial 
              color="#DAA520" 
              roughness={0.4}
              metalness={0.7}
            />
          </mesh>

          {/* VENTANA CON NIEVE - Pared trasera (visible desde la cámara) */}
          <group position={[5, 4, -11.85]} rotation={[0, 0, 0]}>
            {/* Marco de ventana BLANCO */}
            <mesh castShadow>
              <boxGeometry args={[5, 3.5, 0.15]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.7} />
            </mesh>
            
            {/* Cristal azul (vista al exterior nevando) */}
            <mesh position={[0, 0, -0.08]}>
              <planeGeometry args={[4.6, 3.1]} />
              <meshStandardMaterial 
                color="#87CEEB" 
                transparent
                opacity={0.5}
                roughness={0.05}
                metalness={0.2}
              />
            </mesh>
            
            {/* Marco cruz divisoria BLANCO */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[5.1, 0.1, 0.12]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 3.6, 0.12]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.8} />
            </mesh>
          </group>



          {/* ÁRBOL DE NAVIDAD - Pegado a la esquina derecha trasera */}
          <group position={[13, 0, -10]} scale={1.35}>
            <ChristmasTree />
          </group>

          {/* REGALOS ALREDEDOR DEL ÁRBOL - Solo mostrar los que no están abiertos */}
          {useMemo(() => {
            const giftSetup = [
              { dist: 3.3, angle: Math.PI * 0.50 },  // Regalo 1 (verde) - Más lejos
              { dist: 3.1, angle: Math.PI * 0.68 },  // Regalo 2 (rojo) - Más lejos
              { dist: 3.2, angle: Math.PI * 0.85 },  // Regalo 3 (rosa) - Más izquierda para no tapar
              { dist: 3.0, angle: Math.PI * 1.08 },  // Regalo 4 (azul) - Más lejos
            ]
            const heights = [0.42, 0.77, 0.55, 0.45]
            const treeX = 13
            const treeZ = -10
            
            return gifts
              .filter(gift => !openedGifts.has(gift.id))
              .map((gift) => {
                // Encontrar el índice original del regalo para usar la configuración correcta
                const originalIndex = gifts.findIndex(g => g.id === gift.id)
                const setup = giftSetup[originalIndex]
                const x = treeX + Math.cos(setup.angle) * setup.dist
                const z = treeZ + Math.sin(setup.angle) * setup.dist

                const isCurrentlyAnimating = selectedGiftId === gift.id
                const isDisabled = (isAnimating || selectedGiftId !== null) && !isCurrentlyAnimating
                
                return {
                  gift,
                  x,
                  z,
                  height: heights[originalIndex],
                  rotation: setup.angle + Math.PI,
                  isCurrentlyAnimating,
                  isDisabled
                }
              })
            }, [gifts, openedGifts, selectedGiftId, isAnimating, handleSelectGift]).map(({
              gift,
              x,
              z,
              height,
              rotation,
              isCurrentlyAnimating,
              isDisabled
            }) => (
              <group key={gift.id} position={[x, height, z]} rotation={[0, rotation, 0]}>
                <GiftBox3D
                  gift={gift}
                  position={[0, 0, 0]}
                  onClick={() => !isDisabled && handleSelectGift(gift.id)}
                  isAnimating={isCurrentlyAnimating}
                  isDisabled={isDisabled}
                />
              </group>
            ))}

        </Suspense>
      </Canvas>

    </div>
  )
}
