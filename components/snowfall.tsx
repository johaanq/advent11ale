"use client"

import { useEffect, useRef } from "react"

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Altura del navbar (aprox 60px)
    const navbarHeight = 60

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    updateCanvasSize()

    // Crear copos de nieve - Adaptativo según el dispositivo para mejor rendimiento
    const isMobile = window.innerWidth < 768
    const baseCount = isMobile ? 50 : 100
    const snowflakeCount = Math.min(baseCount, Math.floor((canvas.width * canvas.height) / 20000))
    const snowflakes = Array.from({ length: snowflakeCount }, () => ({
      x: Math.random() * canvas.width, // Distribución aleatoria en todo el ancho
      y: navbarHeight + Math.random() * (canvas.height - navbarHeight), // Empezar desde navbar hacia abajo
      radius: Math.random() * 2.5 + 1.5,
      speed: Math.random() * 1.5 + 0.8,
      opacity: Math.random() * 0.7 + 0.5,
      sway: Math.random() * 0.5 + 0.2, // Movimiento lateral más pronunciado
      windOffset: Math.random() * Math.PI * 2, // Offset para movimiento único
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Optimización: usar fillRect en lugar de arc para mejor rendimiento
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      snowflakes.forEach((flake) => {
        // Caída vertical
        flake.y += flake.speed
        
        // Movimiento lateral suave (oscilación)
        flake.x += Math.sin(flake.y * 0.01 + flake.windOffset) * flake.sway
        
        // Si sale por los lados, hacer wrap
        if (flake.x < 0) flake.x = canvas.width
        if (flake.x > canvas.width) flake.x = 0

        // Si cae más abajo del canvas, reiniciar desde el navbar
        if (flake.y > canvas.height) {
          flake.y = navbarHeight - 10 // Empezar justo arriba del navbar
          flake.x = Math.random() * canvas.width // Nueva posición aleatoria horizontal
        }

        // Dibujar el copo de nieve (optimizado: usar fillRect en lugar de arc)
        ctx.globalAlpha = flake.opacity
        ctx.fillRect(flake.x - flake.radius, flake.y - flake.radius, flake.radius * 2, flake.radius * 2)
      })
      ctx.globalAlpha = 1.0

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      updateCanvasSize()
      // Reposicionar copos que estén fuera de los nuevos límites
      snowflakes.forEach((flake) => {
        if (flake.x > canvas.width) flake.x = Math.random() * canvas.width
        if (flake.y > canvas.height) flake.y = navbarHeight + Math.random() * (canvas.height - navbarHeight)
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-40" />
}
