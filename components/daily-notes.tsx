"use client"

import { useState, useEffect, useRef } from 'react'

interface DailyNotesProps {
  openedGifts: Set<number>
  gifts: any[]
}

export function DailyNotes({ openedGifts, gifts }: DailyNotesProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleNoteIndices, setVisibleNoteIndices] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Notitas por día (4 por cada día)
  const notesByDay: Record<number, string[]> = {
    8: [
      "Gracias por existir en mi vida.",
      "Cada momento contigo es un regalo.",
      "Hoy comienza algo especial para ti.",
      "Con amor, de Johan para mi Ale."
    ],
    9: [
      "Hoy también es un día bonito porque tú estás.",
      "Tu sonrisa ilumina mis días.",
      "Eres mi persona favorita en el mundo.",
      "Con amor, de Johan para mi Ale."
    ],
    10: [
      "Cada día a tu lado es un regalo para mí.",
      "Contigo todo es mejor.",
      "Gracias por llenar mi vida de alegría.",
      "Con amor, de Johan para mi Ale."
    ],
    11: [
      "Feliz cumpleaños, mi amor.",
      "Hoy celebro que existes.",
      "Eres lo mejor que me ha pasado.",
      "Te amo más de lo que las palabras pueden expresar."
    ]
  }

  useEffect(() => {
    // Mostrar después de un pequeño delay para mejor UX
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer para detectar cuando las notitas entran/salen del viewport
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-note-index') || '0')
          
          if (entry.isIntersecting) {
            // La notita entró al viewport - agregar a visibles
            setVisibleNoteIndices(prev => new Set([...prev, index]))
          } else {
            // La notita salió del viewport - remover de visibles
            setVisibleNoteIndices(prev => {
              const newSet = new Set(prev)
              newSet.delete(index)
              return newSet
            })
          }
        })
      },
      {
        threshold: 0.3, // Activar cuando el 30% de la notita es visible
        rootMargin: '-50px' // Margen para activar un poco antes/después
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Observar cada notita cuando se renderizan
  useEffect(() => {
    const noteElements = document.querySelectorAll('[data-note-index]')
    
    noteElements.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element)
      }
    })

    return () => {
      noteElements.forEach((element) => {
        if (observerRef.current) {
          observerRef.current.unobserve(element)
        }
      })
    }
  }, [openedGifts])

  // Obtener las notitas según los regalos abiertos
  const getVisibleNotes = () => {
    const notes: string[] = []
    
    // Ordenar los regalos por día
    const sortedGifts = [...gifts].sort((a, b) => a.day - b.day)
    
    sortedGifts.forEach(gift => {
      if (openedGifts.has(gift.id)) {
        const dayNotes = notesByDay[gift.day] || []
        notes.push(...dayNotes)
      }
    })
    
    return notes
  }

  const visibleNotes = getVisibleNotes()

  if (visibleNotes.length === 0) {
    return null
  }

  return (
    <div 
      className={`w-full transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Título de la sección */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 
            className="text-xl sm:text-2xl font-bold text-amber-300 mb-3"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              letterSpacing: '0.05em'
            }}
          >
            Notitas
          </h2>
          <div className="h-px bg-amber-400/30 max-w-xs mx-auto"></div>
        </div>

        {/* Notitas con animación que se reinicia al scrollear */}
        <div className="space-y-6 sm:space-y-8">
          {visibleNotes.map((note, index) => {
            const isNoteVisible = visibleNoteIndices.has(index)
            return (
              <div
                key={index}
                data-note-index={index}
                className={`text-center transition-all duration-600 ${
                  isNoteVisible ? 'animate-fadeIn opacity-100' : 'opacity-0'
                }`}
              >
                <p 
                  className="text-white/90 text-sm sm:text-base lg:text-lg italic leading-relaxed max-w-md mx-auto px-4"
                  style={{ 
                    fontFamily: 'monospace',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.4)'
                  }}
                >
                  "{note}"
                </p>
                
                {/* Separador decorativo */}
                {index < visibleNotes.length - 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="w-8 h-px bg-amber-400/20"></div>
                    <span className="text-amber-400/40 text-xs">❤</span>
                    <div className="w-8 h-px bg-amber-400/20"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Decoración final */}
        <div className="mt-12 pt-8 flex justify-center gap-3 text-amber-400/30 text-sm border-t border-amber-400/10">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      </div>
    </div>
  )
}

