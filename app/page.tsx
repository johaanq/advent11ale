"use client"

import { useState, useEffect, useCallback, memo, lazy, Suspense, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { WelcomeSection } from "@/components/welcome-section"
import { GiftDetailPage } from "@/components/gift-detail-page"
import { GiftReveal } from "@/components/gift-reveal"
import { OpenedGiftsPage } from "@/components/opened-gifts-page"
import { CountdownLock } from "@/components/countdown-lock"
import { DailyNotes } from "@/components/daily-notes"
import Snowfall from "@/components/snowfall"

// Lazy load del componente 3D pesado
const ChristmasScene3D = lazy(() => import("@/components/christmas-scene-3d").then(module => ({ default: module.ChristmasScene3D })))
import { getOpenedGifts, openGift, getLastGiftOpenedDate, subscribeToOpenedGifts } from "@/lib/supabase-gifts"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [selectedGift, setSelectedGift] = useState<number | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOpenedGifts, setShowOpenedGifts] = useState(false)
  const [returnToOpenedGifts, setReturnToOpenedGifts] = useState(false) // Nuevo estado para controlar el retorno
  const [isUnlocked, setIsUnlocked] = useState(false)
  
  // Fecha objetivo: Lunes 8 de diciembre de 2025 a las 00:10 AM
  const getTargetDate = () => {
    // La fecha de desbloqueo es fija: 8 de Diciembre de 2025 a las 00:10:00
    return new Date(2025, 11, 8, 0, 10, 0, 0)
  }
  
  const targetDate = getTargetDate()
  
  // Estado inicial vacío para evitar problemas de hidratación
  const [openedGifts, setOpenedGifts] = useState<Set<number>>(new Set())
  const [lastGiftOpenedDate, setLastGiftOpenedDate] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Verificar si ya se puede acceder
  useEffect(() => {
    // Si ya pasó la fecha objetivo, desbloquear inmediatamente
    if (new Date() >= targetDate) {
    setIsUnlocked(true)
    } else {
      setIsUnlocked(false)
    }
  }, [targetDate])

  // Helper para chequear disponibilidad por hora (Lima, UTC-5)
  const isGiftTimeAvailable = useCallback((day: number) => {
    // Obtener hora actual en Lima
    const now = new Date()
    const limaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))
    const currentMonth = limaTime.getMonth() + 1 // 1-12
    const currentDay = limaTime.getDate()
    const currentHour = limaTime.getHours()

    // Si no es diciembre, nada (excepto testing si se quisiera)
    if (currentMonth !== 12) return false

    // Si ya pasó el día, disponible
    if (currentDay > day) return true

    // Si es el mismo día, chequear hora
    if (currentDay === day) {
      // Día 8 (lunes): disponible desde las 6:00 PM (18:00)
      if (day === 8) {
        return currentHour >= 18
      }
      // Día 9 (martes): disponible desde las 5:00 PM (17:00)
      if (day === 9) {
        return currentHour >= 17
      }
      // Días 10, 11: disponible desde las 4 PM (16:00)
      return currentHour >= 16
    }

    // Si es antes, no
    return false
  }, [])

  // Función para verificar si ya se abrió un regalo hoy
  const canOpenGiftToday = (): boolean => {
    if (!lastGiftOpenedDate) return true
    
    // Convertir fecha de apertura a hora Lima para comparar días correctamente
    const lastDate = new Date(lastGiftOpenedDate)
    const lastDateLima = new Date(lastDate.toLocaleString("en-US", { timeZone: "America/Lima" }))
    
    const now = new Date()
    const todayLima = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))
    
    // Comparar año, mes y día en zona horaria de Lima
    const lastYear = lastDateLima.getFullYear()
    const lastMonth = lastDateLima.getMonth()
    const lastDay = lastDateLima.getDate()
    
    const todayYear = todayLima.getFullYear()
    const todayMonth = todayLima.getMonth()
    const todayDay = todayLima.getDate()
    
    // Si es el mismo día, no se puede abrir otro
    if (lastYear === todayYear && lastMonth === todayMonth && lastDay === todayDay) {
      return false
    }
    
    return true
  }

  // Cargar regalos abiertos desde Supabase (no bloquea el render inicial)
  useEffect(() => {
    // Marcar como hidratado inmediatamente para no bloquear el render
    setIsHydrated(true)
    
    // Cargar datos de Supabase de forma asíncrona sin bloquear
    const loadOpenedGifts = async () => {
      try {
        const giftIds = await getOpenedGifts()
        setOpenedGifts(giftIds)
        
        // Obtener última fecha de regalo abierto
        const lastDate = await getLastGiftOpenedDate()
        if (lastDate) {
          setLastGiftOpenedDate(lastDate)
        }
      } catch (error) {
        console.error('Error al cargar regalos abiertos desde Supabase:', error)
      }
    }

    // Cargar en el siguiente tick para no bloquear el render inicial
    setTimeout(() => {
      loadOpenedGifts()
    }, 0)
  }, [])

  // Suscribirse a cambios en tiempo real para sincronización entre dispositivos
  useEffect(() => {
    if (!isHydrated) return

    const unsubscribe = subscribeToOpenedGifts((giftIds) => {
      setOpenedGifts(giftIds)
      
      // Actualizar última fecha cuando hay cambios
      getLastGiftOpenedDate().then((lastDate) => {
        if (lastDate) {
          setLastGiftOpenedDate(lastDate)
        }
      })
    })

    return () => {
      unsubscribe()
    }
  }, [isHydrated])

  // Función para reiniciar regalos y fechas
  const resetGifts = useCallback(async () => {
    try {
      // Eliminar todos los regalos abiertos de Supabase
      const { error } = await supabase
        .from('opened_gifts')
        .delete()
        .neq('gift_id', -1) // Eliminar todos (condición siempre verdadera ya que gift_id nunca es -1)
      
      if (error) {
        console.error('Error al reiniciar regalos en Supabase:', error)
      } else {
        // Actualizar estado local
        setOpenedGifts(new Set())
        setLastGiftOpenedDate(null)
        setSelectedGift(null)
        setShowReveal(false)
        setIsAnimating(false)
      }
    } catch (error) {
      console.error('Error inesperado al reiniciar regalos:', error)
    }
  }, [])

  // Exponer función de reinicio en window para uso desde consola (solo para desarrollo)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetGifts = async () => {
        await resetGifts()
        window.location.reload()
      }
    }
  }, [resetGifts])

  // Memoizar el array de regalos para evitar recrearlo en cada render
  const gifts = useMemo(() => [
    {
      id: 1,
      day: 8,
      dayName: "Lunes",
      title: "Primera Sorpresa",
      description: "Un detalle pequeño pero lleno de cariño. Algo que vas a llevar cerquita siempre.",
      fullDescription: "Un detalle pequeño pero lleno de cariño. Algo que vas a llevar cerquita siempre.",
      specialNote: "Cuando estemos juntos, enciende las velitas conmigo y abre tu primera sorpresa.",
      cardMessage: "Gracias por existir en mi vida.",
      signature: "Con amor, de Johan para mi Ale.",
      image: "/snoopy_calendario.png", // Placeholder temporal funcional
      color: "from-red-600 to-red-700",
      questions: [
        {
          question: "¿En qué mes celebramos nuestro primer aniversario?",
          options: [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril"
          ],
          correctAnswer: 0
        },
        {
          question: "¿Cuál es mi color favorito?",
          options: [
            "Azul",
            "Rojo",
            "Verde",
            "Negro"
          ],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 2,
      day: 9,
      dayName: "Martes",
      title: "Segunda Sorpresa",
      description: "Un regalo que no se marchita y uno que brilla. Ambos pensados solo para ti.",
      fullDescription: "Un regalo que no se marchita y uno que brilla. Ambos pensados solo para ti.",
      specialNote: "Guárdame este momento: quiero entregártelo en persona.",
      cardMessage: "Hoy también es un día bonito porque tú estás.",
      signature: "Con amor, de Johan para mi Ale.",
      image: "/snoopy_calendario.png", // Placeholder temporal funcional
      color: "from-red-700 to-red-800",
      questions: [
        {
          question: "¿Dónde fue nuestro primer beso?",
          options: [
            "En el parque",
            "En el cine",
            "En un restaurante",
            "En la playa"
          ],
          correctAnswer: 2
        },
        {
          question: "¿Cuál es tu comida favorita?",
          options: [
            "Pizza",
            "Sushi",
            "Pasta",
            "Hamburguesa"
          ],
          correctAnswer: 3
        }
      ]
    },
    {
      id: 3,
      day: 10,
      dayName: "Miércoles",
      title: "Tercera Sorpresa",
      description: "Un compañero suave que llega para recordarte lo mucho que te cuido.",
      fullDescription: "Un compañero suave que llega para recordarte lo mucho que te cuido.",
      specialNote: "Este te lo tengo que dar en brazos, no por pantalla.",
      cardMessage: "Cada día a tu lado es un regalo para mí.",
      signature: "Con amor, de Johan para mi Ale.",
      image: "/snoopy_calendario.png", // Placeholder temporal funcional
      color: "from-red-500 to-red-600",
      questions: [
        {
          question: "¿Cuál es el nombre de nuestra canción especial?",
          options: [
            "Perfect",
            "All of Me",
            "Thinking Out Loud",
            "A Thousand Years"
          ],
          correctAnswer: 0
        },
        {
          question: "¿Qué actividad disfrutamos hacer juntos?",
          options: [
            "Ver películas",
            "Cocinar",
            "Viajar",
            "Todas las anteriores"
          ],
          correctAnswer: 3
        }
      ]
    },
    {
      id: 4,
      day: 11,
      dayName: "Jueves",
      title: "🎂 ¡Feliz Cumpleaños!",
      description: "Hoy termina tu semana especial. Lo de aquí es algo que te acompañará cada día… y algo más que hará sonreír tu corazón.",
      fullDescription: "Hoy termina tu semana especial. Lo de aquí es algo que te acompañará cada día… y algo más que hará sonreír tu corazón.",
      specialNote: "Ábrelo conmigo. Prometo que este regalo habla por sí solo.",
      cardMessage: "Feliz cumpleaños, mi amor. Que todos tus deseos se hagan realidad.",
      signature: "Con todo mi amor, Johan para mi Ale.",
      image: "/regalo4_1.jpg", // Primera imagen del regalo 4
      color: "from-red-800 to-red-900",
      questions: [
        {
          question: "¿Cuántos años cumplimos juntos este año?",
          options: [
            "1 año",
            "2 años",
            "3 años",
            "4 años"
          ],
          correctAnswer: 1
        },
        {
          question: "¿Qué es lo que más amo de ti?",
          options: [
            "Tu sonrisa",
            "Tu personalidad",
            "Tu forma de ser",
            "Todo de ti"
          ],
          correctAnswer: 3
        }
      ]
    },
  ], [])

  // Regalo que toca abrir ahora mismo (para resaltarlo en el árbol)
  const highlightGiftId = useMemo(() => {
    if (!isHydrated) return null
    const giftOrder = [8, 9, 10, 11]
    const dayToOpen = giftOrder[openedGifts.size]
    if (dayToOpen === undefined) return null
    const next = gifts.find(g => g.day === dayToOpen)
    if (!next || !isGiftTimeAvailable(next.day) || !canOpenGiftToday()) return null
    return next.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, openedGifts, gifts, isGiftTimeAvailable, lastGiftOpenedDate])

  const handleSelectGift = useCallback((giftId: number) => {
    // 1. Verificar si ya se abrió un regalo hoy (máximo 1 por día)
    // Nota: Si ya abrí el regalo 1 hoy, no puedo abrir el 2.
    if (!canOpenGiftToday()) {
      // Opcional: Mostrar alerta "Vuelve mañana"
      return
    }
    
    // 2. Verificar que sea a partir del 8 de diciembre
    // Usamos la misma lógica de zona horaria
    const now = new Date()
    const limaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }))
    const currentMonth = limaTime.getMonth() + 1
    const currentDay = limaTime.getDate()
    
    // Solo permitir abrir regalos a partir del 8 de diciembre
    if (currentMonth !== 12 || currentDay < 8) {
      return
    }
    
    // Prevenir si ya hay una animación en curso
    if (isAnimating) {
      return
    }
    
    // 3. Determinar qué regalo debe abrirse según el orden SECUENCIAL
    // Primer regalo abierto = día 8, segundo = día 9, etc.
    const openedCount = openedGifts.size
    const giftOrder = [8, 9, 10, 11] // Orden de días que deben abrirse
    
    // Si ya se abrieron todos, nada que hacer
    if (openedCount >= giftOrder.length) {
      return
    }
    
    // El regalo que toca abrir es el siguiente en la lista
    const dayToOpen = giftOrder[openedCount]
    const giftToOpen = gifts.find(g => g.day === dayToOpen)
    
    if (!giftToOpen) return

    // 4. Verificar si el regalo seleccionado es el que toca
    // El usuario debe hacer click en CUALQUIER regalo para abrir el SIGUIENTE disponible
    // O forzar a que haga click en el correcto. Por UX, mejor si hace click en el correcto.
    // Pero si hace click en otro, podríamos redirigirlo o no hacer nada.
    // Asumamos: Debe hacer click en el regalo correcto.
    if (giftToOpen.id !== giftId) {
      return
    }

    // 5. Verificar REGLA DE HORA (4 PM Lima) para el día del regalo
    if (!isGiftTimeAvailable(giftToOpen.day)) {
      // Aún no son las 4pm del día correspondiente
      return
    }
    
    // Prevenir si el regalo ya está abierto (doble check)
    if (openedGifts.has(giftToOpen.id)) {
      return
    }
    
    // Mostrar el mensaje de revelación
    setSelectedGift(giftToOpen.id)
    setShowReveal(true)
    
  }, [gifts, openedGifts, isAnimating, canOpenGiftToday, isGiftTimeAvailable])

  const handleReveal = useCallback(async () => {
    const giftId = selectedGift
    if (giftId === null) return
    
    // Verificaciones de seguridad finales antes de guardar
    if (!canOpenGiftToday()) return
    
    const gift = gifts.find(g => g.id === giftId)
    if (gift && !isGiftTimeAvailable(gift.day)) return
    
    setIsAnimating(true)
    setShowReveal(false)
    
    // Guardar en Supabase
    const success = await openGift(giftId)
    
    if (success) {
      // Actualizar estado local
      setOpenedGifts(prev => new Set([...prev, giftId]))
      
      // Obtener y actualizar última fecha desde Supabase
      const lastDate = await getLastGiftOpenedDate()
      if (lastDate) {
        setLastGiftOpenedDate(lastDate)
      }
    } else {
      console.error('Error al guardar regalo en Supabase')
      // Revertir animación si falla
      setIsAnimating(false)
      return
    }
    
    // Esperar a que termine la animación antes de mostrar el detalle
    setTimeout(() => {
      setIsAnimating(false)
    }, 1800)
  }, [selectedGift, canOpenGiftToday, gifts, isGiftTimeAvailable])

  // Si se muestra la página de regalos abiertos
  if (showOpenedGifts) {
    return (
      <OpenedGiftsPage
        openedGifts={openedGifts}
        gifts={gifts}
        onBack={() => setShowOpenedGifts(false)}
        onSelectGift={(giftId) => {
          setShowOpenedGifts(false)
          setReturnToOpenedGifts(true) // Marcar que venimos de la lista de regalos abiertos
          // Si el regalo ya está abierto, mostrar directamente el detalle
          if (openedGifts.has(giftId)) {
            setSelectedGift(giftId)
            setShowReveal(false)
          } else {
            // Si no está abierto, mostrar el mensaje de revelación
            setSelectedGift(giftId)
            setShowReveal(true)
          }
        }}
      />
    )
  }

  // Si se muestra el mensaje de revelación
  if (showReveal && selectedGift !== null) {
    const gift = gifts.find((g) => g.id === selectedGift)!
    return (
      <GiftReveal
        gift={gift}
        onBack={() => {
          setShowReveal(false)
          setSelectedGift(null)
        }}
        onReveal={handleReveal}
        openedGiftsCount={openedGifts.size}
        totalGifts={gifts.length}
      />
    )
  }

  // Si se muestra el detalle de un regalo (solo si ya está abierto)
  if (selectedGift !== null && openedGifts.has(selectedGift)) {
    return (
      <GiftDetailPage 
        gift={gifts.find((g) => g.id === selectedGift)!} 
        onBack={() => {
          setSelectedGift(null)
          if (returnToOpenedGifts) {
            setShowOpenedGifts(true)
            setReturnToOpenedGifts(false)
          }
        }}
        openedGiftsCount={openedGifts.size}
        totalGifts={gifts.length}
      />
    )
  }

  // Si no está desbloqueado, mostrar el contador
  if (!isUnlocked) {
    return (
      <CountdownLock 
        targetDate={targetDate} 
        onUnlock={() => setIsUnlocked(true)} 
      />
    )
  }

  return (
    <main className="min-h-screen lg:overflow-hidden bg-wine animate-page-in">
      <Snowfall />
      <Navbar 
        openedGiftsCount={openedGifts.size} 
        totalGifts={gifts.length}
        onShowOpenedGifts={() => setShowOpenedGifts(true)}
      />
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-60px)]">
        <div className="w-full lg:w-2/5 lg:h-full lg:overflow-y-auto scrollbar-hide order-2 lg:order-1">
          <WelcomeSection openedGifts={openedGifts} gifts={gifts} />
          {/* Sección de notitas especiales */}
          <DailyNotes openedGifts={openedGifts} gifts={gifts} />
        </div>
        <div className="w-full lg:w-3/5 h-[50vh] lg:h-full order-1 lg:order-2">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-wine-gradient">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-300/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-300 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🎄</div>
                </div>
                <p className="font-display text-amber-100/90 text-sm tracking-wide text-shadow-soft">
                  Preparando el árbol...
                </p>
              </div>
            </div>
          }>
            <ChristmasScene3D 
              gifts={gifts} 
              onSelectGift={handleSelectGift} 
              isAnimating={isAnimating} 
              openedGifts={openedGifts}
              highlightGiftId={highlightGiftId}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
