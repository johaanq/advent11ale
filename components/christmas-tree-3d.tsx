"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"
import * as THREE from "three"

export function ChristmasTree() {
  const treeRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (treeRef.current) {
      treeRef.current.rotation.y += 0.0003 * delta * 60 // Frame-rate independent
    }
  })

  // Crear domo con ondulación y offset angular para cada capa
  const createDomeTier = (radius: number, heightRatio: number = 0.5, angleOffset: number = 0) => {
    // Crear domo (hemisferio superior de esfera)
    const geometry = new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI * heightRatio)
    
    const positionAttribute = geometry.attributes.position
    const vertices = []
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push({
        x: positionAttribute.getX(i),
        y: positionAttribute.getY(i),
        z: positionAttribute.getZ(i),
        index: i
      })
    }
    
    // Encontrar el borde (Y mínimo)
    const minY = Math.min(...vertices.map(v => v.y))
    const maxY = Math.max(...vertices.map(v => v.y))
    const borderZone = minY + (maxY - minY) * 0.2
    
    // Aplicar ondulación con desfase angular
    for (const vertex of vertices) {
      if (vertex.y < borderZone) {
        const angle = Math.atan2(vertex.z, vertex.x) + angleOffset // DESFASE aquí
        const distFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z)
        
        // Pseudo-random basado en ángulo desfasado
        const seed = (Math.sin(angle * 11.3 + angleOffset * 2) + 1) / 2
        
        // Ondas más notorias con amplitud variable
        const wave1 = Math.sin(angle * 7) * radius * (0.05 + seed * 0.08)
        const wave2 = Math.sin(angle * 11 + 1) * radius * 0.04
        const wave3 = Math.sin(angle * 4.5 + 2) * radius * (0.04 + (1 - seed) * 0.05)
        
        const totalWave = wave1 + wave2 + wave3
        
        // Intensidad solo en el borde
        const edgeIntensity = Math.max(0, 1 - (vertex.y - minY) / (borderZone - minY))
        
        const newDist = distFromCenter + totalWave * edgeIntensity
        const scaleFactor = newDist / (distFromCenter || 1)
        
        positionAttribute.setX(vertex.index, vertex.x * scaleFactor)
        positionAttribute.setZ(vertex.index, vertex.z * scaleFactor)
      }
    }
    
    positionAttribute.needsUpdate = true
    geometry.computeVertexNormals()
    
    return geometry
  }

  // Crear las 5 capas - Cada una con desfase angular ALEATORIO
  const tiers = useMemo(() => [
    { geometry: createDomeTier(1.45, 0.54, 0), y: 0.85, r: 1.45 },        // Tier 1 - Sin offset
    { geometry: createDomeTier(1.2, 0.54, 0.73), y: 1.65, r: 1.2 },       // Tier 2 - Rotado ~42°
    { geometry: createDomeTier(0.95, 0.54, 1.47), y: 2.4, r: 0.95 },      // Tier 3 - Rotado ~84°
    { geometry: createDomeTier(0.72, 0.54, 2.35), y: 3.1, r: 0.72 },      // Tier 4 - Rotado ~135°
    { geometry: createDomeTier(0.52, 0.54, 3.89), y: 3.75, r: 0.52 },     // Tier 5 - Rotado ~223°
  ], [])

  return (
    <group ref={treeRef}>
      {/* TRONCO/BASE - Cilindro más alto para que toque el árbol */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 1.0, 24]} />
        <meshStandardMaterial 
          color="#8B4513"
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* RELLENO INTERIOR MEJORADO - Cubre espacios vacíos */}
      {[
        { y: 1.05, r: 1.35, h: 0.75 },
        { y: 1.85, r: 1.12, h: 0.7 },
        { y: 2.58, r: 0.9, h: 0.65 },
        { y: 3.25, r: 0.68, h: 0.6 },
        { y: 3.88, r: 0.48, h: 0.5 },
      ].map((fill, i) => (
        <mesh key={`fill-${i}`} position={[0, fill.y, 0]} receiveShadow>
          <cylinderGeometry args={[fill.r * 0.65, fill.r * 0.95, fill.h, 24]} />
          <meshStandardMaterial 
            color="#2d4a3d"
            roughness={0.92}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Capas adicionales de relleno entre tiers */}
      {[
        { y: 1.2, r: 1.25 },
        { y: 2.0, r: 1.0 },
        { y: 2.72, r: 0.78 },
        { y: 3.42, r: 0.58 },
      ].map((extra, i) => (
        <mesh key={`extra-${i}`} position={[0, extra.y, 0]} receiveShadow>
          <sphereGeometry args={[extra.r, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          <meshStandardMaterial 
            color="#3d5a4d"
            roughness={0.88}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {/* CAPAS DEL ÁRBOL - 5 domos gruesos */}
      {tiers.map((tier, idx) => (
        <mesh 
          key={`tier-${idx}`} 
          position={[0, tier.y, 0]} 
          geometry={tier.geometry} 
          castShadow 
          receiveShadow
        >
          <meshStandardMaterial 
            color="#4a7c59"
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* Punta final pequeña */}
      <mesh position={[0, 4.35, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.24, 0.5, 24]} />
        <meshStandardMaterial 
          color="#4a7c59"
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* ESTRELLA DE 5 PUNTAS TRADICIONAL PARADA */}
      <group position={[0, 4.75, 0]}>
        {/* Centro de la estrella */}
        <mesh castShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial
            color="#FFEB3B"
            emissive="#FFD700"
            emissiveIntensity={3.8}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
        
        {/* 5 puntas VERTICALES apuntando hacia afuera */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
          return (
            <group key={i} rotation={[0, angle, 0]}>
              {/* Punta cónica */}
              <mesh position={[0.3, 0, 0]} castShadow>
                <coneGeometry args={[0.1, 0.35, 4]} />
                <meshStandardMaterial
                  color="#FFEB3B"
                  emissive="#FFD700"
                  emissiveIntensity={3.5}
                  metalness={0.7}
                  roughness={0.2}
                />
              </mesh>
              {/* Esfera en la punta */}
              <mesh position={[0.48, 0, 0]}>
                <sphereGeometry args={[0.07, 14, 14]} />
                <meshStandardMaterial
                  color="#FFEB3B"
                  emissive="#FFD700"
                  emissiveIntensity={4.0}
                  metalness={0.7}
                  roughness={0.2}
                />
              </mesh>
            </group>
          )
        })}
        
        <pointLight color="#FFD700" intensity={4.5} distance={6} />
      </group>

      {/* GUIRNALDA DE LUCES - Colores variados bien ancladas */}
      {Array.from({ length: 48 }).map((_, i) => {
        const t = i / 48
        const angle = t * Math.PI * 2 * 5.5
        
        // Interpolar posiciones entre tiers
        const tierY = [0.85, 1.65, 2.4, 3.1, 3.75]
        const tierR = [1.45, 1.2, 0.95, 0.72, 0.52]
        
        const tierIdx = t * (tierY.length - 1)
        const base = Math.floor(tierIdx)
        const next = Math.min(base + 1, tierY.length - 1)
        const blend = tierIdx - base
        
        const yPos = tierY[base] * (1 - blend) + tierY[next] * blend
        const radius = (tierR[base] * (1 - blend) + tierR[next] * blend) * 1.04
        
        // GRAN VARIEDAD de colores navideños
        const lightColors = [
          "#FFA500", // Naranja
          "#FFD700", // Dorado
          "#FF4444", // Rojo
          "#44FF44", // Verde
          "#FFFF00", // Amarillo
          "#FF69B4", // Rosa
          "#00CED1", // Cyan
          "#FF8C00", // Naranja oscuro
        ]
        const lightColor = lightColors[i % lightColors.length]

        return (
          <group 
            key={`light-${i}`} 
            position={[Math.cos(angle) * radius, yPos, Math.sin(angle) * radius]}
          >
            {/* Cable de conexión al árbol - para que no flote */}
            <mesh position={[0, 0.08, 0]} rotation={[0, angle, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.16, 6]} />
              <meshStandardMaterial color="#1a4a1a" roughness={0.9} />
            </mesh>
            
            {/* Base plateada */}
            <mesh position={[0, 0.025, 0]}>
              <cylinderGeometry args={[0.014, 0.017, 0.05, 12]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.1} />
            </mesh>
            
            {/* Bombilla ovalada */}
            <mesh position={[0, -0.015, 0]} scale={[1, 1.2, 1]}>
              <sphereGeometry args={[0.048, 14, 14]} />
              <meshStandardMaterial 
                color={lightColor} 
                emissive={lightColor}
                emissiveIntensity={3.0}
                transparent
                opacity={0.98}
              />
            </mesh>
            <pointLight position={[0, -0.015, 0]} intensity={0.5} distance={1.4} color={lightColor} />
          </group>
        )
      })}

      {/* ORNAMENTOS ESFÉRICOS - Más cantidad sin exagerar */}
      {[
        { count: 10, y: 1.15, r: 1.52, tier: 1 },
        { count: 9, y: 1.9, r: 1.26, tier: 2 },
        { count: 8, y: 2.62, r: 1.0, tier: 3 },
        { count: 6, y: 3.32, r: 0.76, tier: 4 },
        { count: 5, y: 3.98, r: 0.55, tier: 5 },
      ].map(({ count, y, r, tier }) => (
        Array.from({ length: count }).map((_, i) => {
          const angle = (i / count) * Math.PI * 2 + tier * 0.3
          const colors = ["#DC143C", "#4169E1", "#FFD700"]
          const color = colors[(i + tier) % colors.length]
          
          return (
            <group 
              key={`orn-${tier}-${i}`} 
              position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}
            >
              {/* Cable/rama que conecta al árbol - NO flota */}
              <mesh 
                position={[Math.cos(angle + Math.PI) * 0.05, 0.055, Math.sin(angle + Math.PI) * 0.05]}
                rotation={[0, angle + Math.PI, Math.PI / 6]}
              >
                <cylinderGeometry args={[0.006, 0.006, 0.11, 6]} />
                <meshStandardMaterial color="#2d4a2d" roughness={0.9} />
              </mesh>
              
              {/* Gancho dorado */}
              <mesh position={[0, 0.032, 0]}>
                <torusGeometry args={[0.02, 0.004, 10, 20]} />
                <meshStandardMaterial color="#B8860B" metalness={0.95} roughness={0.08} />
              </mesh>
              
              {/* Esfera del ornamento */}
              <mesh castShadow>
                <sphereGeometry args={[0.095, 28, 28]} />
                <meshStandardMaterial color={color} metalness={0.92} roughness={0.08} />
              </mesh>
            </group>
          )
        })
      ))}
    </group>
  )
}
