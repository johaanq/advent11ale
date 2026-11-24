"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { Edition } from "@/lib/editions"

interface DailyNotesProps {
  openedGifts: Set<number>
  edition: Edition
}

// Leve rotación estable por notita
const noteRotation = (i: number) => (((i * 37) % 7) - 3) * 0.6

export function DailyNotes({ openedGifts, edition }: DailyNotesProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleNoteIndices, setVisibleNoteIndices] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const nodesRef = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer: las notitas aparecen al entrar en pantalla
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleNoteIndices((prev) => {
          const next = new Set(prev)
          entries.forEach((entry) => {
            const index = Number((entry.target as HTMLElement).dataset.noteIndex ?? 0)
            if (entry.isIntersecting) next.add(index)
            else next.delete(index)
          })
          return next
        })
      },
      { threshold: 0.3, rootMargin: "-40px" }
    )
    observerRef.current = observer
    nodesRef.current.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const registerNode = useCallback((index: number, node: HTMLElement | null) => {
    const prev = nodesRef.current.get(index)
    if (prev && prev !== node) observerRef.current?.unobserve(prev)
    if (node) {
      nodesRef.current.set(index, node)
      observerRef.current?.observe(node)
    } else {
      nodesRef.current.delete(index)
    }
  }, [])

  const visibleNotes = useMemo(() => {
    const notes: string[] = []
    ;[...edition.gifts]
      .sort((a, b) => a.day - b.day)
      .forEach((gift) => {
        if (openedGifts.has(gift.id)) notes.push(...(edition.notesByDay[gift.day] || []))
      })
    return notes
  }, [edition, openedGifts])

  if (visibleNotes.length === 0) return null

  return (
    <section
      className={`w-full bg-wine transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      aria-label="Notitas"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Título de la sección */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-amber-300 mb-3 tracking-wide text-gold-glow">
            Notitas
          </h2>
          <div className="gold-divider max-w-xs mx-auto" />
        </div>

        <div className="space-y-7 sm:space-y-9">
          {visibleNotes.map((note, index) => {
            const isNoteVisible = visibleNoteIndices.has(index)
            return (
              <div
                key={index}
                ref={(node) => registerNode(index, node)}
                data-note-index={index}
                className={`text-center ${isNoteVisible ? "animate-fadeIn" : "opacity-0"}`}
              >
                <div
                  className="relative mx-auto max-w-sm rounded-[3px] px-6 pt-6 pb-5"
                  style={{
                    rotate: `${noteRotation(index)}deg`,
                    background: "linear-gradient(170deg, #fff8ec 0%, #f6e7cf 100%)",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 20px -8px rgba(0,0,0,0.55)",
                  }}
                >
                  {/* Cinta adhesiva */}
                  <span
                    className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rounded-[2px]"
                    style={{
                      rotate: `${-noteRotation(index) * 2}deg`,
                      background: "rgba(253, 230, 138, 0.65)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                    }}
                    aria-hidden
                  />
                  <p className="text-[#5b1a1f] text-sm sm:text-base italic leading-relaxed">“{note}”</p>
                  <span className="mt-2 block text-[10px] text-rose-700/60" aria-hidden>
                    ❤
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Decoración final */}
        <div className="mt-12 pt-8 flex justify-center gap-3 text-amber-400/40 text-sm">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      </div>
    </section>
  )
}
