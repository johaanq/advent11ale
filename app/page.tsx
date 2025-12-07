"use client"

import { useState, useEffect, useCallback, memo, lazy, Suspense, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { WelcomeSection } from "@/components/welcome-section"
import { GiftDetailPage } from "@/components/gift-detail-page"
import { GiftQuizPage } from "@/components/gift-quiz-page"
import { OpenedGiftsPage } from "@/components/opened-gifts-page"
import { CountdownLock } from "@/components/countdown-lock"
import Snowfall from "@/components/snowfall"

// Lazy load del componente 3D pesado
const ChristmasScene3D = lazy(() => import("@/components/christmas-scene-3d").then(module => ({ default: module.ChristmasScene3D })))
import { getOpenedGifts, openGift, getLastGiftOpenedDate, subscribeToOpenedGifts } from "@/lib/supabase-gifts"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [selectedGift, setSelectedGift] = useState<number | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOpenedGifts, setShowOpenedGifts] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  
  // Fecha objetivo: Lunes 8 de diciembre de 2024 (o el año actual)
  const getTargetDate = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    // Crear fecha para el 8 de diciembre a las 00:00:00
    const targetDate = new Date(currentYear, 11, 8, 0, 0, 0, 0) // Mes 11 = diciembre (0-indexed)
    
    // Si ya pasó el 8 de diciembre de este año, usar el del próximo año
    if (now > targetDate) {
      return new Date(currentYear + 1, 11, 8, 0, 0, 0, 0)
    }
    
    return targetDate
  }
  
  const targetDate = getTargetDate()
  
  // Estado inicial vacío para evitar problemas de hidratación
  const [openedGifts, setOpenedGifts] = useState<Set<number>>(new Set())
  const [lastGiftOpenedDate, setLastGiftOpenedDate] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Verificar si ya se puede acceder
  useEffect(() => {
    const now = new Date()
    if (now >= targetDate) {
      setIsUnlocked(true)
    }
  }, [targetDate])

  // Función para verificar si ya se abrió un regalo hoy
  const canOpenGiftToday = (): boolean => {
    if (!lastGiftOpenedDate) return true
    
    const lastDate = new Date(lastGiftOpenedDate)
    const today = new Date()
    
    // Comparar año, mes y día (no hora)
    const lastYear = lastDate.getFullYear()
    const lastMonth = lastDate.getMonth()
    const lastDay = lastDate.getDate()
    
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()
    
    // Si es el mismo día, no se puede abrir
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
        setShowQuiz(false)
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
      description: "El comienzo de algo especial",
      fullDescription:
        "Esta es la primera de las sorpresas que preparé especialmente para ti. Cada día que pase te acercará más a tu día especial, y quiero que disfrutes cada momento de este camino juntos.",
      image: "/gift-wrap-present-red.jpg",
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
      description: "Un detalle pensado en ti",
      fullDescription: "Cada sorpresa que abres es un recordatorio de lo especial que eres para mí. Este regalo es una muestra de todo el cariño que siento por ti.",
      image: "/luxury-gift-box.jpg",
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
      description: "Cada día más cerca de tu día especial",
      fullDescription: "Faltan muy pocos días para tu cumpleaños. Este regalo es un adelanto de toda la magia y el amor que te espera en tu día más especial.",
      image: "/birthday-present-celebration.jpg",
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
      description: "La sorpresa final para tu día más especial",
      fullDescription: "¡Hoy es tu día! Este es el regalo final y el más especial de todos. Quiero que sepas lo mucho que te amo y lo agradecido que estoy de tenerte en mi vida. ¡Feliz cumpleaños, mi amor!",
      image: "/birthday-cake-party-celebration.jpg",
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

  const handleSelectGift = useCallback((giftId: number) => {
    // Verificar si ya se abrió un regalo hoy (máximo 1 por día)
    if (!canOpenGiftToday()) {
      return
    }
    
    // Verificar que sea a partir del 8 de diciembre
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth() + 1
    
    // Solo permitir abrir regalos a partir del 8 de diciembre
    if (currentMonth !== 12 || currentDay < 8) {
      return
    }
    
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
    
    // Mostrar el formulario de preguntas del regalo que debe abrirse (no el que se hizo clic)
    setSelectedGift(giftToOpen.id)
    setShowQuiz(true)
    
  }, [gifts, openedGifts, isAnimating, canOpenGiftToday])

  const handleQuizSuccess = useCallback(async () => {
    const giftId = selectedGift
    if (giftId === null) return
    
    // Verificar nuevamente que se pueda abrir (por si acaso)
    if (!canOpenGiftToday()) {
      return
    }
    
    // Verificar nuevamente que sea a partir del 8 de diciembre
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth() + 1
    
    if (currentMonth !== 12 || currentDay < 8) {
      return
    }
    
    setIsAnimating(true)
    setShowQuiz(false)
    
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
  }, [selectedGift, canOpenGiftToday])

  // Si se muestra la página de regalos abiertos
  if (showOpenedGifts) {
    return (
      <OpenedGiftsPage
        openedGifts={openedGifts}
        gifts={gifts}
        onBack={() => setShowOpenedGifts(false)}
        onSelectGift={(giftId) => {
          setShowOpenedGifts(false)
          // Si el regalo ya está abierto, mostrar directamente el detalle
          if (openedGifts.has(giftId)) {
            setSelectedGift(giftId)
            setShowQuiz(false)
          } else {
            // Si no está abierto, mostrar el quiz
            setSelectedGift(giftId)
            setShowQuiz(true)
          }
        }}
      />
    )
  }

  // Si se muestra el formulario de preguntas
  if (showQuiz && selectedGift !== null) {
    const gift = gifts.find((g) => g.id === selectedGift)!
    return (
      <GiftQuizPage
        gift={gift}
        questions={gift.questions || []}
        onBack={() => {
          setShowQuiz(false)
          setSelectedGift(null)
        }}
        onSuccess={handleQuizSuccess}
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
    <main className="min-h-screen overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Snowfall />
      <Navbar 
        openedGiftsCount={openedGifts.size} 
        totalGifts={gifts.length}
        onShowOpenedGifts={() => setShowOpenedGifts(true)}
      />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)]">
        <WelcomeSection openedGifts={openedGifts} gifts={gifts} />
        <div className="w-full lg:w-3/5 h-[50vh] lg:h-full">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">Cargando escena 3D...</div>}>
            <ChristmasScene3D 
              gifts={gifts} 
              onSelectGift={handleSelectGift} 
              isAnimating={isAnimating} 
              openedGifts={openedGifts} 
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
