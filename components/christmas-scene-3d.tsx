"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  AdaptiveDpr,
  Environment,
  Lightformer,
  PerformanceMonitor,
  RoundedBox,
  Sparkles,
  useTexture,
} from "@react-three/drei"
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from "react"
import { ChristmasTree } from "./christmas-tree-3d"
import { GiftBox3D, giftStyleFor, BIRTHDAY_GIFT_DAY } from "./gift-box-3d"
import * as THREE from "three"

interface SceneGift {
  id: number
  day: number
}

interface ChristmasScene3DProps {
  gifts: SceneGift[]
  onSelectGift: (id: number) => void
  isAnimating: boolean
  openedGifts?: Set<number>
  highlightGiftId?: number | null
  // Si devuelve false, el regalo no se anima (aún no se puede abrir)
  canStartOpening?: (id: number) => boolean
}

const CAMERA_POSITION = new THREE.Vector3(-1, 2, 6)
const CAMERA_TARGET = new THREE.Vector3(11, 3, -7)
const TREE_X = 13
const TREE_Z = -10

// Cámara fija con un leve parallax según el puntero
function CameraRig() {
  const { camera, pointer } = useThree()
  const current = useRef(new THREE.Vector2())
  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.02, delta)
    current.current.x = THREE.MathUtils.lerp(current.current.x, pointer.x, k)
    current.current.y = THREE.MathUtils.lerp(current.current.y, pointer.y, k)
    camera.position.set(
      CAMERA_POSITION.x - current.current.x * 0.25,
      CAMERA_POSITION.y + current.current.y * 0.18,
      CAMERA_POSITION.z + current.current.x * 0.45
    )
    camera.lookAt(CAMERA_TARGET)
  })
  return null
}

// Textura procedural de piso de madera (sin assets externos)
function createWoodTexture() {
  if (typeof document === "undefined") return null
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  const plankH = size / 8
  let seed = 7
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let row = 0; row < 8; row++) {
    let x = -rand() * 300
    while (x < size) {
      const len = 260 + rand() * 320
      const tone = 0.88 + rand() * 0.2
      const r = Math.round(196 * tone)
      const g = Math.round(150 * tone)
      const b = Math.round(108 * tone)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, row * plankH, len, plankH)
      // Vetas
      ctx.globalAlpha = 0.08
      for (let v = 0; v < 7; v++) {
        ctx.strokeStyle = rand() > 0.5 ? "#5a3418" : "#f3d2a8"
        ctx.lineWidth = 1 + rand() * 2
        ctx.beginPath()
        const vy = row * plankH + rand() * plankH
        ctx.moveTo(x, vy)
        ctx.bezierCurveTo(x + len * 0.3, vy + (rand() - 0.5) * 10, x + len * 0.6, vy + (rand() - 0.5) * 10, x + len, vy)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      // Junta vertical
      ctx.fillStyle = "rgba(70,40,20,0.55)"
      ctx.fillRect(x, row * plankH, 2, plankH)
      x += len
    }
    // Junta horizontal
    ctx.fillStyle = "rgba(70,40,20,0.6)"
    ctx.fillRect(0, row * plankH, size, 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 4)
  tex.anisotropy = 8
  return tex
}

function useWoodTexture() {
  const texture = useMemo(() => createWoodTexture(), [])
  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

function configurePictureTexture(texture: THREE.Texture) {
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

// Cuadro de Snoopy con marco dorado/vino
function PictureFrameContent({ position }: { position: [number, number, number] }) {
  const texture = useTexture("/snoopy.jpg", (t) => configurePictureTexture(Array.isArray(t) ? t[0] : t))

  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* Marco exterior con volumen */}
      <RoundedBox args={[3.05, 3.05, 0.14]} radius={0.05} smoothness={3} position={[0, 0, 0.02]} castShadow>
        <meshPhysicalMaterial color="#7a1e2a" roughness={0.45} clearcoat={0.6} />
      </RoundedBox>
      {/* Filete dorado */}
      <mesh position={[0, 0, 0.095]}>
        <planeGeometry args={[2.78, 2.78]} />
        <meshStandardMaterial color="#d4a843" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Paspartú */}
      <mesh position={[0, 0, 0.097]}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshStandardMaterial color="#f6efe4" roughness={0.9} />
      </mesh>
      {/* Imagen */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, Math.PI]}>
        <planeGeometry args={[2.45, 2.45]} />
        <meshStandardMaterial map={texture} roughness={0.35} metalness={0} />
      </mesh>
    </group>
  )
}

function PictureFrame({ position }: { position: [number, number, number] }) {
  return (
    <Suspense fallback={null}>
      <PictureFrameContent position={position} />
    </Suspense>
  )
}

function Room() {
  const wood = useWoodTexture()
  const wallColor = "#f3e7d7"
  const trimColor = "#e6d6c0"

  return (
    <group>
      {/* PISO DE MADERA */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial map={wood ?? undefined} color={wood ? "#ffffff" : "#c89a6c"} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* PARED TRASERA */}
      <mesh position={[0, 4, -12]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Molduras y zócalo trasero */}
      <mesh position={[0, 6, -11.95]}>
        <boxGeometry args={[30, 0.12, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2, -11.95]}>
        <boxGeometry args={[30, 0.12, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.14, -11.94]} receiveShadow>
        <boxGeometry args={[30, 0.28, 0.1]} />
        <meshStandardMaterial color="#f8f1e6" roughness={0.5} />
      </mesh>

      {/* PARED DERECHA */}
      <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      <mesh position={[14.95, 6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[25, 0.12, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      <mesh position={[14.95, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[25, 0.12, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      <mesh position={[14.94, 0.14, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[25, 0.28, 0.1]} />
        <meshStandardMaterial color="#f8f1e6" roughness={0.5} />
      </mesh>

      {/* TECHO */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#f7efe4" roughness={0.9} />
      </mesh>

      {/* ALFOMBRA bajo el árbol */}
      <group position={[TREE_X, 0, TREE_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
          <circleGeometry args={[3.5, 64]} />
          <meshStandardMaterial color="#7a1e2a" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <ringGeometry args={[3.38, 3.46, 64]} />
          <meshStandardMaterial color="#d4a843" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <ringGeometry args={[2.95, 2.99, 64]} />
          <meshStandardMaterial color="#d4a843" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

function Lights() {
  const [target] = useState(() => new THREE.Object3D())
  const [frameTarget] = useState(() => new THREE.Object3D())
  return (
    <>
      <primitive object={target} position={[TREE_X - 1, 1, TREE_Z + 2]} />
      <primitive object={frameTarget} position={[14.6, 3.9, -7]} />
      <ambientLight intensity={0.28} color="#ffe8d0" />
      <hemisphereLight intensity={0.45} color="#fff1e0" groundColor="#3a1518" />
      {/* Luz principal cálida con sombras */}
      <directionalLight
        position={[4, 12, 4]}
        target={target}
        intensity={1.5}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      {/* Luces de acento */}
      <pointLight position={[-4, 3.5, 4]} intensity={6} distance={18} decay={1.6} color="#ffc98a" />
      <pointLight position={[6, 3.5, 2]} intensity={5} distance={16} decay={1.6} color="#ff8a80" />
      {/* Luz para el cuadro */}
      <spotLight
        position={[12.5, 6.8, -7]}
        target={frameTarget}
        angle={0.5}
        penumbra={0.8}
        intensity={14}
        distance={8}
        decay={2}
        color="#fff0d6"
      />
    </>
  )
}

function Effects({ highQuality }: { highQuality: boolean }) {
  return (
    <EffectComposer multisampling={highQuality ? 4 : 0}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={highQuality ? 0.9 : 0.6} radius={0.7} />
      <Vignette offset={0.25} darkness={0.55} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export function ChristmasScene3D({
  gifts,
  onSelectGift,
  isAnimating,
  openedGifts = new Set(),
  highlightGiftId = null,
  canStartOpening,
}: ChristmasScene3DProps) {
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null)
  const [highQuality, setHighQuality] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleSelectGift = useCallback(
    (id: number) => {
      if (isAnimating || selectedGiftId !== null) return
      const giftToOpen = gifts.find((g) => g.id === id)
      if (!giftToOpen) return
      // Regalo ya abierto: ver su detalle sin animación
      if (openedGifts.has(giftToOpen.id)) {
        onSelectGift(id)
        return
      }
      if (canStartOpening && !canStartOpening(id)) return

      setSelectedGiftId(id)
      // Esperar a que termine la animación (1.8 s) antes de cambiar de página
      timeoutRef.current = setTimeout(() => {
        onSelectGift(id)
        setSelectedGiftId(null)
      }, 1800)
    },
    [gifts, openedGifts, isAnimating, selectedGiftId, onSelectGift, canStartOpening]
  )

  const placedGifts = useMemo(() => {
    // Lugar alrededor del árbol según el tipo de caja (mismo orden que los estilos)
    const daySpots = [
      { dist: 3.3, angle: Math.PI * 0.5 },
      { dist: 3.1, angle: Math.PI * 0.68 },
      { dist: 3.2, angle: Math.PI * 0.85 },
      // 5º regalo: delante, entre la caja verde y la roja (visible desde la cámara)
      { dist: 4.5, angle: Math.PI * 0.6 },
    ]
    const birthdaySpot = { dist: 3.0, angle: Math.PI * 1.08 }

    const regularDays = gifts
      .map((g) => g.day)
      .filter((day) => day !== BIRTHDAY_GIFT_DAY)
      .sort((a, b) => a - b)

    return gifts.map((gift) => {
      const isBirthday = gift.day === BIRTHDAY_GIFT_DAY
      const index = isBirthday ? 0 : regularDays.indexOf(gift.day)
      const style = giftStyleFor(gift.day, index)
      const setup = isBirthday ? birthdaySpot : daySpots[index % daySpots.length]
      return {
        gift,
        style,
        x: TREE_X + Math.cos(setup.angle) * setup.dist,
        z: TREE_Z + Math.sin(setup.angle) * setup.dist,
        // Apoyar la base exactamente sobre la alfombra
        height: style.size[1] / 2 + 0.012,
        rotation: setup.angle + Math.PI,
      }
    })
  }, [gifts])

  return (
    <div className="w-full h-full relative overflow-hidden bg-wine">
      <Canvas
        shadows="soft"
        camera={{ position: CAMERA_POSITION.toArray(), fov: 30, near: 0.1, far: 80 }}
        dpr={[1, highQuality ? 2 : 1.25]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          alpha: false,
        }}
        onCreated={({ camera }) => camera.lookAt(CAMERA_TARGET)}
      >
        <color attach="background" args={["#3a1416"]} />
        <fog attach="fog" args={["#3a1416", 26, 60]} />

        <PerformanceMonitor onDecline={() => setHighQuality(false)} onIncline={() => setHighQuality(true)} flipflops={3} />
        <AdaptiveDpr pixelated={false} />
        <CameraRig />
        <Lights />

        <Suspense fallback={null}>
          <Environment resolution={128} frames={1} environmentIntensity={0.55}>
            <Lightformer form="rect" intensity={2} color="#fff1dc" position={[0, 6, 6]} scale={[10, 4, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#ffc6a0" position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
            <Lightformer form="ring" intensity={3} color="#ffd27a" position={[6, 5, -6]} scale={2} />
          </Environment>

          <Room />
          <PictureFrame position={[14.6, 3.9, -7]} />

          {/* ÁRBOL DE NAVIDAD */}
          <group position={[TREE_X, 0, TREE_Z]} scale={1.35}>
            <ChristmasTree />
          </group>

          {/* Destellos mágicos alrededor del árbol */}
          <Sparkles
            count={highQuality ? 70 : 35}
            position={[TREE_X, 3.4, TREE_Z]}
            scale={[5, 6, 5]}
            size={3}
            speed={0.35}
            opacity={0.8}
            color="#FFD98A"
          />

          {/* REGALOS */}
          {placedGifts.map(({ gift, style, x, z, height, rotation }) => {
            const isCurrentlyAnimating = selectedGiftId === gift.id
            const isDisabled = (isAnimating || selectedGiftId !== null) && !isCurrentlyAnimating
            return (
              <group key={gift.id} position={[x, height, z]} rotation={[0, rotation, 0]}>
                <GiftBox3D
                  gift={gift}
                  style={style}
                  position={[0, 0, 0]}
                  onClick={() => handleSelectGift(gift.id)}
                  isAnimating={isCurrentlyAnimating}
                  isDisabled={isDisabled}
                  isOpened={openedGifts.has(gift.id)}
                  isHighlighted={highlightGiftId === gift.id}
                />
              </group>
            )
          })}
        </Suspense>

        <Effects highQuality={highQuality} />
      </Canvas>

      {/* Viñeta suave para fundir el canvas con el panel lateral */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(30,6,8,0.55)]" />
    </div>
  )
}
