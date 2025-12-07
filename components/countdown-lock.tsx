"use client"

import { useState, useEffect } from "react"
import Snowfall from "@/components/snowfall"

interface CountdownLockProps {
  targetDate: Date
  onUnlock: () => void
}

export function CountdownLock({ targetDate, onUnlock }: CountdownLockProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsUnlocked(true)
        onUnlock()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    // Actualizar inmediatamente
    updateCountdown()

    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onUnlock])

  if (isUnlocked) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 sm:pt-12 lg:pt-16"
      style={{ 
        backgroundImage: 'url(/snoopy_contador.gif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Snowfall />
      <div className="relative z-10 text-center px-4 sm:px-6">
        {/* Contador */}
        <div className="grid grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Días */}
            <div className="text-center">
              <div 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base text-white uppercase tracking-wider"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
                }}
              >
                Días
              </div>
            </div>

            {/* Horas */}
            <div className="text-center">
              <div 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base text-white uppercase tracking-wider"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
                }}
              >
                Horas
              </div>
            </div>

            {/* Minutos */}
            <div className="text-center">
              <div 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base text-white uppercase tracking-wider"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
                }}
              >
                Minutos
              </div>
            </div>

            {/* Segundos */}
            <div className="text-center">
              <div 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-1 sm:mb-2"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div 
                className="text-xs sm:text-sm lg:text-base text-white uppercase tracking-wider"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
                }}
              >
                Segundos
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

