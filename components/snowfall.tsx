"use client"

import { useEffect, useRef } from "react"

// 3 capas de profundidad: lejos (pequeños, lentos, redondos) → cerca (grandes, rápidos, pixel)
const LAYERS = [
  { share: 0.45, size: [1, 1.8], speed: [0.35, 0.7], opacity: [0.35, 0.55], round: true },
  { share: 0.35, size: [1.8, 2.8], speed: [0.7, 1.2], opacity: [0.55, 0.8], round: false },
  { share: 0.2, size: [2.8, 4], speed: [1.2, 1.9], opacity: [0.75, 0.95], round: false },
] as const

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const navbarHeight = 60
    let width = window.innerWidth
    let height = window.innerHeight
    let rafId = 0

    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    updateCanvasSize()

    const isMobile = width < 768
    const total = Math.min(isMobile ? 60 : 120, Math.floor((width * height) / 14000))

    const snowflakes = LAYERS.flatMap((layer) =>
      Array.from({ length: Math.round(total * layer.share) }, () => ({
        x: Math.random() * width,
        y: navbarHeight + Math.random() * (height - navbarHeight),
        radius: rand(layer.size[0], layer.size[1]),
        speed: rand(layer.speed[0], layer.speed[1]) * (reduceMotion ? 0.3 : 1),
        opacity: rand(layer.opacity[0], layer.opacity[1]),
        sway: rand(0.2, 0.6),
        windOffset: Math.random() * Math.PI * 2,
        round: layer.round,
      }))
    )

    let last = performance.now()
    const animate = (now: number) => {
      // Normalizar a 60 fps para que la velocidad no dependa del monitor
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = "#ffffff"

      for (const flake of snowflakes) {
        flake.y += flake.speed * dt
        flake.x += Math.sin(flake.y * 0.01 + flake.windOffset) * flake.sway * dt

        if (flake.x < -5) flake.x = width + 5
        if (flake.x > width + 5) flake.x = -5
        if (flake.y > height + 5) {
          flake.y = navbarHeight - 10
          flake.x = Math.random() * width
        }

        ctx.globalAlpha = flake.opacity
        if (flake.round) {
          ctx.beginPath()
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const r = flake.radius
          ctx.fillRect(Math.round(flake.x - r), Math.round(flake.y - r), Math.round(r * 2), Math.round(r * 2))
        }
      }
      ctx.globalAlpha = 1
      rafId = requestAnimationFrame(animate)
    }

    const start = () => {
      cancelAnimationFrame(rafId)
      last = performance.now()
      rafId = requestAnimationFrame(animate)
    }

    // Pausar cuando la pestaña no está visible
    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(rafId)
      else start()
    }

    const handleResize = () => {
      updateCanvasSize()
      snowflakes.forEach((flake) => {
        if (flake.x > width) flake.x = Math.random() * width
        if (flake.y > height) flake.y = navbarHeight + Math.random() * (height - navbarHeight)
      })
    }

    start()
    window.addEventListener("resize", handleResize)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-40" aria-hidden />
}
