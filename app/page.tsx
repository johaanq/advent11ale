"use client"

import { useState, useEffect, useCallback, lazy, Suspense, useMemo, useSyncExternalStore } from "react"
import { Navbar } from "@/components/navbar"
import { WelcomeSection } from "@/components/welcome-section"
import { GiftDetailPage } from "@/components/gift-detail-page"
import { GiftReveal } from "@/components/gift-reveal"
import { OpenedGiftsPage } from "@/components/opened-gifts-page"
import { CountdownLock } from "@/components/countdown-lock"
import { DailyNotes } from "@/components/daily-notes"
import Snowfall from "@/components/snowfall"
import { getOpenedGifts, openGift, getLastGiftOpenedDate, subscribeToOpenedGifts, resetOpenedGifts } from "@/lib/api"
import { CURRENT_EDITION, EDITIONS, getEdition, isDayAvailable, isSameLimaDay, limaNow } from "@/lib/editions"

// true solo en el navegador (false durante el render del servidor y la hidratación)
const noopSubscribe = () => () => {}
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

// Lazy load del componente 3D pesado
const ChristmasScene3D = lazy(() =>
  import("@/components/christmas-scene-3d").then((module) => ({ default: module.ChristmasScene3D }))
)

export default function Home() {
  // Año que se está viendo (el actual por defecto)
  const [year, setYear] = useState(CURRENT_EDITION.year)
  const edition = getEdition(year)
  const gifts = edition.gifts

  const [selectedGift, setSelectedGift] = useState<number | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showOpenedGifts, setShowOpenedGifts] = useState(false)
  const [returnToOpenedGifts, setReturnToOpenedGifts] = useState(false)
  const [countdownDone, setCountdownDone] = useState(false)

  // Estado inicial vacío para evitar problemas de hidratación
  const [storedOpened, setStoredOpened] = useState<Set<number>>(new Set())
  const [lastGiftOpenedDate, setLastGiftOpenedDate] = useState<string | null>(null)
  const isHydrated = useIsClient()

  // En un año archivado todos los regalos se ven abiertos
  const openedGifts = useMemo(
    () => (edition.archived ? new Set(gifts.map((g) => g.id)) : storedOpened),
    [edition.archived, gifts, storedOpened]
  )

  // El contador solo aplica al año actual
  const [mountedAt] = useState(() => Date.now())
  const isUnlocked =
    edition.archived || countdownDone || (isHydrated && mountedAt >= edition.countdownTarget.getTime())

  // Al cambiar de año, volver a la vista principal
  const changeYear = useCallback((next: number) => {
    setYear(next)
    setSelectedGift(null)
    setShowReveal(false)
    setShowOpenedGifts(false)
    setReturnToOpenedGifts(false)
    setIsAnimating(false)
    setStoredOpened(new Set())
    setLastGiftOpenedDate(null)
  }, [])

  const isGiftTimeAvailable = useCallback((day: number) => isDayAvailable(edition, day), [edition])

  // Máximo un regalo por día (hora de Lima)
  const canOpenGiftToday = useCallback(
    () => !lastGiftOpenedDate || !isSameLimaDay(lastGiftOpenedDate),
    [lastGiftOpenedDate]
  )

  // Cargar regalos abiertos del año (no bloquea el render inicial)
  useEffect(() => {
    if (edition.archived) return
    let cancelled = false
    const load = async () => {
      const [giftIds, lastDate] = await Promise.all([getOpenedGifts(year), getLastGiftOpenedDate(year)])
      if (cancelled) return
      setStoredOpened(giftIds)
      setLastGiftOpenedDate(lastDate)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [year, edition.archived])

  // Sincronización entre dispositivos
  useEffect(() => {
    if (!isHydrated || edition.archived) return
    return subscribeToOpenedGifts(year, (giftIds) => {
      setStoredOpened(giftIds)
      getLastGiftOpenedDate(year).then(setLastGiftOpenedDate)
    })
  }, [isHydrated, year, edition.archived])

  // Reinicio desde la consola: resetGifts("token") — vuelve a cerrar los regalos del año que se ve
  const resetGifts = useCallback(
    async (token?: string) => {
      const ok = await resetOpenedGifts(year, token)
      if (ok) {
        setStoredOpened(new Set())
        setLastGiftOpenedDate(null)
        setSelectedGift(null)
        setShowReveal(false)
        setIsAnimating(false)
      }
      return ok
    },
    [year]
  )

  useEffect(() => {
    const w = window as Window & { resetGifts?: (token?: string) => Promise<void> }
    w.resetGifts = async (token?: string) => {
      if (await resetGifts(token)) window.location.reload()
    }
  }, [resetGifts])

  // Orden secuencial de apertura (por día)
  const giftOrder = useMemo(() => [...gifts].sort((a, b) => a.day - b.day), [gifts])
  const nextGift = giftOrder[openedGifts.size]

  // Regalo que toca abrir ahora mismo (para resaltarlo en el árbol)
  const highlightGiftId = useMemo(() => {
    if (!isHydrated || edition.archived || !nextGift) return null
    if (!isGiftTimeAvailable(nextGift.day) || !canOpenGiftToday()) return null
    return nextGift.id
  }, [isHydrated, edition.archived, nextGift, isGiftTimeAvailable, canOpenGiftToday])

  // ¿Se puede empezar a abrir este regalo? (la escena solo anima si es así)
  const canStartOpening = useCallback(
    (giftId: number) => {
      if (edition.archived || isAnimating || !nextGift) return false
      if (nextGift.id !== giftId || openedGifts.has(giftId)) return false
      const now = limaNow()
      const firstDay = giftOrder[0]?.day ?? 1
      if (now.year < edition.year || (now.year === edition.year && (now.month !== 12 || now.day < firstDay))) {
        return false
      }
      return canOpenGiftToday() && isGiftTimeAvailable(nextGift.day)
    },
    [edition, isAnimating, nextGift, openedGifts, giftOrder, canOpenGiftToday, isGiftTimeAvailable]
  )

  const handleSelectGift = useCallback(
    (giftId: number) => {
      // Regalo ya abierto: ir directo al detalle
      if (openedGifts.has(giftId)) {
        setSelectedGift(giftId)
        setShowReveal(false)
        return
      }
      if (!canStartOpening(giftId)) return
      setSelectedGift(giftId)
      setShowReveal(true)
    },
    [openedGifts, canStartOpening]
  )

  const handleReveal = useCallback(async () => {
    const giftId = selectedGift
    if (giftId === null) return

    // Verificaciones finales antes de guardar
    if (!canOpenGiftToday()) return
    const gift = gifts.find((g) => g.id === giftId)
    if (gift && !isGiftTimeAvailable(gift.day)) return

    setIsAnimating(true)
    setShowReveal(false)

    const success = await openGift(year, giftId)
    if (!success) {
      console.error("Error al guardar el regalo abierto")
      setIsAnimating(false)
      return
    }
    setStoredOpened((prev) => new Set([...prev, giftId]))
    setLastGiftOpenedDate(await getLastGiftOpenedDate(year))

    setTimeout(() => setIsAnimating(false), 1800)
  }, [selectedGift, canOpenGiftToday, gifts, isGiftTimeAvailable, year])

  const years = useMemo(() => EDITIONS.map((e) => e.year), [])

  if (showOpenedGifts) {
    return (
      <OpenedGiftsPage
        openedGifts={openedGifts}
        gifts={gifts}
        year={year}
        onBack={() => setShowOpenedGifts(false)}
        onSelectGift={(giftId) => {
          setShowOpenedGifts(false)
          setReturnToOpenedGifts(true)
          setSelectedGift(giftId)
          setShowReveal(!openedGifts.has(giftId))
        }}
      />
    )
  }

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
        year={year}
      />
    )
  }

  if (selectedGift !== null && openedGifts.has(selectedGift)) {
    return (
      <GiftDetailPage
        gift={gifts.find((g) => g.id === selectedGift)!}
        year={year}
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

  if (!isUnlocked) {
    const previous = EDITIONS.find((e) => e.archived)
    return (
      <CountdownLock
        targetDate={edition.countdownTarget}
        onUnlock={() => setCountdownDone(true)}
        archiveYear={previous?.year}
        onViewArchive={previous ? () => changeYear(previous.year) : undefined}
      />
    )
  }

  return (
    <main key={year} className="min-h-screen lg:overflow-hidden bg-wine animate-page-in">
      <Snowfall />
      <Navbar
        openedGiftsCount={openedGifts.size}
        totalGifts={gifts.length}
        onShowOpenedGifts={() => setShowOpenedGifts(true)}
        year={year}
        years={years}
        onYearChange={changeYear}
      />
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-60px)]">
        <div className="w-full lg:w-2/5 lg:h-full lg:overflow-y-auto scrollbar-hide order-2 lg:order-1">
          <WelcomeSection openedGifts={openedGifts} edition={edition} />
          <DailyNotes openedGifts={openedGifts} edition={edition} />
        </div>
        <div className="w-full lg:w-3/5 h-[50vh] lg:h-full order-1 lg:order-2">
          <Suspense
            fallback={
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
            }
          >
            <ChristmasScene3D
              gifts={gifts}
              onSelectGift={handleSelectGift}
              canStartOpening={canStartOpening}
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
