"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { isDayAvailable, limaNow, type Edition, type LimaTime } from "@/lib/editions"

interface WelcomeSectionProps {
  openedGifts?: Set<number>
  edition: Edition
}

// Rotaciones pseudo-aleatorias pero estables por día
const pocketRotation = (day: number) => {
  const seed = day * 7 + 13
  const random = ((seed * 9301 + 49297) % 233280) / 233280
  const rotation = random * 6 - 3
  return Math.abs(rotation) < 0.5 ? (rotation > 0 ? 1 : -1) : rotation
}

const iconRotation = (day: number) => {
  const seed = day * 11 + 23
  const random = ((seed * 9301 + 49297) % 233280) / 233280
  return (5 + random * 5) * (random > 0.5 ? 1 : -1)
}

export const WelcomeSection = memo(function WelcomeSection({ openedGifts = new Set(), edition }: WelcomeSectionProps) {
  const gifts = edition.gifts

  // Hora de Lima, actualizada cada minuto
  const [now, setNow] = useState<LimaTime>(() => limaNow())

  useEffect(() => {
    const interval = setInterval(() => setNow(limaNow()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Estrellas de fondo - generadas solo en el cliente para evitar errores de hidratación
  const [stars, setStars] = useState<
    Array<{ left: number; top: number; size: number; duration: number; delay: number }>
  >([])

  useEffect(() => {
    setStars(
      Array.from({ length: 26 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.25 ? 4 : Math.random() < 0.6 ? 3 : 2,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 3,
      }))
    )
  }, [])

  const pockets = useMemo(() => {
    const giftsMap = new Map(gifts.map((g) => [g.day, g]))
    const iconByDay = new Map(
      [...gifts].sort((a, b) => a.day - b.day).map((g, i) => [g.day, edition.icons[i] ?? "🎁"])
    )
    const isTimeAvailable = (day: number) => isDayAvailable(edition, day, now)

    // Primer regalo disponible y sin abrir (en orden)
    const firstAvailableDay = gifts
      .map((g) => g.day)
      .sort((a, b) => a - b)
      .find((day) => {
        const g = giftsMap.get(day)
        return g && isTimeAvailable(day) && !openedGifts.has(g.id)
      })

    return Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
      const gift = giftsMap.get(day)
      const hasGift = gift !== undefined
      const isOpened = gift ? openedGifts.has(gift.id) : false
      const isGiftAvailable = hasGift && isTimeAvailable(day)
      return {
        day,
        hasGift,
        isOpened,
        isGiftAvailable,
        isTodayAvailable: isGiftAvailable && !isOpened && firstAvailableDay === day,
        icon: iconByDay.get(day) ?? null,
        rotation: pocketRotation(day),
        iconRotation: iconRotation(day),
      }
    })
  }, [gifts, edition, openedGifts, now])

  return (
    <div className="w-full flex items-start justify-start p-3 sm:p-4 lg:p-5 relative overflow-hidden lg:min-h-screen bg-wine-gradient">
      {/* Estrellas de fondo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute animate-twinkle rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: 0.25,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.8)`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ramitas decorativas en las esquinas */}
      {["top-0 left-0", "bottom-0 right-0 rotate-180"].map((pos) => (
        <div key={pos} className={`absolute ${pos} w-32 h-32 opacity-15 pointer-events-none`} aria-hidden>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M20,80 Q30,60 40,70 Q50,80 60,70 Q70,60 80,70"
              stroke="#fde68a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="35" cy="65" r="3" fill="#fca5a5" />
            <circle cx="55" cy="65" r="3" fill="#fde68a" />
          </svg>
        </div>
      ))}

      <div className="relative z-10 w-full py-3.5 h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-lg mx-auto space-y-5 animate-slide-up">
          {/* Título principal */}
          <div className="text-center space-y-2.5">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-white leading-[1.1] tracking-wide text-gold-glow">
              CALENDARIO
              <br />
              DE ADVIENTO
            </h1>

            {/* Separador decorativo */}
            <div className="flex items-center justify-center gap-2.5 max-w-xs mx-auto">
              <div className="gold-divider flex-1" />
              <span className="text-amber-300/80 text-[10px]">✦</span>
              <span className="text-[10px] sm:text-xs text-amber-100/80 font-semibold tracking-[0.2em] text-shadow-soft">
                {gifts.length} SORPRESAS
              </span>
              <span className="text-amber-300/80 text-[10px]">✦</span>
              <div className="gold-divider flex-1" />
            </div>

            <p className="text-white/85 text-xs sm:text-sm lg:text-[0.95rem] leading-relaxed max-w-md mx-auto px-2 sm:px-4 text-shadow-soft">
              Mi amor, cada día hasta tu cumpleaños será una sorpresa especialmente diseñada para ti
            </p>
          </div>

          {/* Calendario navideño */}
          <div className="relative w-full max-w-[290px] sm:max-w-sm mx-auto">
            {/* Snoopy en su casa, pegado al calendario */}
            <div className="relative flex justify-center">
              <img
                src="/snoopy_calendario.png"
                alt="Snoopy en su casa navideña"
                className="max-w-full h-auto max-h-[140px] sm:max-h-[190px] drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
                style={{ imageRendering: "pixelated", objectFit: "contain", marginBottom: "-2px" }}
              />
            </div>

            {/* Panel con los bolsillos */}
            <div
              className="relative rounded-b-md p-2 sm:p-2.5"
              style={{
                background: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.18), 0 10px 24px -8px rgba(0,0,0,0.55)",
              }}
            >
              {/* Costura decorativa */}
              <div
                className="pointer-events-none absolute inset-1 rounded-b-sm border border-dashed border-white/25"
                aria-hidden
              />
              <div className="relative grid grid-cols-7 gap-1.5">
                {pockets.map((p) => (
                  <div
                    key={p.day}
                    className={`relative transition-transform duration-200 ${
                      p.isGiftAvailable && !p.isOpened ? "hover:-translate-y-0.5 hover:scale-105" : ""
                    }`}
                    style={{
                      rotate: `${p.rotation}deg`,
                      filter: p.isOpened
                        ? "brightness(1.05)"
                        : p.hasGift && !p.isGiftAvailable
                          ? "brightness(0.82)"
                          : !p.hasGift
                            ? "brightness(0.88) saturate(0.9)"
                            : "none",
                    }}
                  >
                    <div
                      className={`relative aspect-square flex items-center justify-center rounded-[3px] ${
                        p.isOpened ? "bg-amber-50" : "bg-white"
                      } ${p.isTodayAvailable ? "animate-glow-pulse" : ""}`}
                      style={{
                        backgroundImage: p.isOpened
                          ? "linear-gradient(160deg, #fffbeb, #fde68a55)"
                          : "linear-gradient(180deg, #ffffff 0%, #f3f0ec 100%)",
                        boxShadow:
                          p.hasGift && p.isGiftAvailable
                            ? "0 2px 4px rgba(0,0,0,0.18), inset 0 -2px 0 rgba(0,0,0,0.06)"
                            : "0 1px 2px rgba(0,0,0,0.15), inset 0 -2px 0 rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Borde superior del bolsillo */}
                      <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-[3px] bg-black/[0.06]" aria-hidden />

                      {p.isOpened ? (
                        <span
                          className="absolute inset-0 flex items-center justify-center z-10 text-[1.7rem] sm:text-[2rem]"
                          style={{
                            filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.45))",
                            rotate: `${p.iconRotation}deg`,
                          }}
                        >
                          {p.icon}
                        </span>
                      ) : (
                        <span
                          className="font-mono relative z-10 font-extrabold leading-none text-base sm:text-lg"
                          style={{ color: p.hasGift && p.isGiftAvailable ? "#dc2626" : "#9f1d1d" }}
                        >
                          {p.day}
                        </span>
                      )}

                      {/* Puntito dorado en los días con regalo aún cerrados */}
                      {p.hasGift && !p.isOpened && (
                        <span
                          className="absolute bottom-[3px] right-[3px] h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.9)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-5 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-white/65 font-semibold uppercase tracking-[0.18em] text-shadow-soft">
                  Sorpresas
                </span>
                <span className="font-mono text-2xl lg:text-[1.7rem] font-extrabold text-white text-shadow-pixel">
                  {openedGifts.size}
                  <span className="text-white/45 text-lg">/{gifts.length}</span>
                </span>
              </div>

              <div className="h-4 w-px bg-white/25" />

              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-white/65 font-semibold uppercase tracking-[0.18em] text-shadow-soft">
                  Diciembre
                </span>
                <span className="font-mono text-2xl lg:text-[1.7rem] font-extrabold text-white text-shadow-pixel">{edition.year}</span>
              </div>
            </div>

            <div className="gold-divider max-w-xs mx-auto" />

            <p className="text-xs text-amber-100/75 font-medium text-shadow-soft">
              {edition.archived
                ? `✦ Así fue nuestro diciembre ${edition.year} ✦`
                : "✦ Selecciona un regalo en el árbol para descubrirlo ✦"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
