"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react"
import {
  getLikeStatus,
  toggleLike,
  getComments,
  addComment,
  subscribeToComments,
  subscribeToLikes,
  type Comment,
} from "@/lib/api"

interface GiftDetailPageProps {
  gift: {
    id: number
    day: number
    dayName: string
    title: string
    fullDescription: string
    specialNote?: string
  }
  onBack: () => void
  openedGiftsCount?: number
  totalGifts?: number
}

export function GiftDetailPage({ gift, onBack, openedGiftsCount = 1, totalGifts = 4 }: GiftDetailPageProps) {
  const [liked, setLiked] = useState(false)
  const [likeAnimKey, setLikeAnimKey] = useState(0)
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const touchStartRef = useRef(0)
  const touchEndRef = useRef(0)
  const lastTapRef = useRef(0)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // Imágenes del carrusel (2 para regalo 2, 3 para los demás)
  const carouselImages =
    gift.id === 2
      ? [`/regalo${gift.id}_1.jpg`, `/regalo${gift.id}_2.jpg`]
      : [`/regalo${gift.id}_1.jpg`, `/regalo${gift.id}_2.jpg`, `/regalo${gift.id}_3.jpg`]
  const hasCarousel = gift.id !== 3

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX
    touchEndRef.current = 0
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX
  }
  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return
    const distance = touchStartRef.current - touchEndRef.current
    if (distance > 50) nextImage()
    if (distance < -50) prevImage()
  }

  // Cargar estado inicial
  useEffect(() => {
    const loadData = async () => {
      setLiked(await getLikeStatus(gift.id))
      setComments(await getComments(gift.id))
    }
    loadData()
  }, [gift.id])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribeComments = subscribeToComments(gift.id, setComments)
    const unsubscribeLikes = subscribeToLikes(gift.id, setLiked)
    return () => {
      unsubscribeComments()
      unsubscribeLikes()
    }
  }, [gift.id])

  const handleLike = async () => {
    const newLiked = await toggleLike(gift.id)
    setLiked(newLiked)
    if (newLiked) setLikeAnimKey((k) => k + 1)
  }

  // Doble toque en la foto = me gusta
  const handleImageTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setShowHeartBurst(true)
      setTimeout(() => setShowHeartBurst(false), 900)
      if (!liked) handleLike()
      else setLikeAnimKey((k) => k + 1)
    }
    lastTapRef.current = now
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return
    setIsSubmitting(true)
    const success = await addComment(gift.id, newComment.trim())
    if (success) setNewComment("")
    setIsSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }

  return (
    <div className="min-h-screen bg-wine-gradient animate-page-in">
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} />

      <div className="min-h-[calc(100vh-60px)] p-0 sm:p-4 lg:p-8">
        <div className="max-w-2xl mx-auto animate-slide-up">
          {/* Volver - solo desktop */}
          <button
            onClick={onBack}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 mb-3 text-amber-200 hover:text-amber-100 hover:bg-white/5 transition-colors text-sm"
          >
            <ChevronLeft size={18} />
            Volver
          </button>

          {/* Post estilo Instagram */}
          <article
            className="overflow-hidden border-y border-amber-200/15 sm:border sm:rounded-xl"
            style={{
              background: "linear-gradient(180deg, rgba(127,29,29,0.92) 0%, rgba(80,14,16,0.95) 100%)",
              boxShadow: "0 24px 50px -20px rgba(0,0,0,0.75)",
            }}
          >
            {/* Header */}
            <div className="px-3 py-3 sm:px-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-900 flex items-center justify-center font-display text-white font-semibold text-sm sm:text-base">
                    J
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">Johan</p>
                  <p className="text-amber-300/75 text-xs">
                    {gift.dayName} {gift.day} de Diciembre
                  </p>
                </div>
              </div>
              <button onClick={onBack} className="sm:hidden text-amber-300 p-1 -mr-1" aria-label="Volver">
                <ChevronLeft size={24} />
              </button>
            </div>

            {/* Carrusel */}
            <div
              className="relative aspect-square bg-gradient-to-br from-red-800 to-red-950 flex items-center justify-center overflow-hidden"
              onTouchStart={hasCarousel ? handleTouchStart : undefined}
              onTouchMove={hasCarousel ? handleTouchMove : undefined}
              onTouchEnd={hasCarousel ? handleTouchEnd : undefined}
              onClick={hasCarousel ? handleImageTap : undefined}
            >
              {!hasCarousel ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-amber-400/25 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-amber-400 rounded-full animate-spin" />
                  </div>
                  <p className="text-amber-200 text-sm sm:text-base">Cargando fotos...</p>
                </div>
              ) : (
                <>
                  <div
                    className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {carouselImages.map((imageSrc, index) => (
                      <img
                        key={imageSrc}
                        src={imageSrc}
                        alt={`${gift.title} - Foto ${index + 1}`}
                        className="h-full w-full shrink-0 object-cover select-none"
                        draggable={false}
                        onError={(e) => {
                          e.currentTarget.src = "/snoopy_calendario.png"
                          e.currentTarget.onerror = null
                        }}
                      />
                    ))}
                  </div>

                  {/* Corazón grande al hacer doble toque */}
                  {showHeartBurst && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                      <Heart size={110} className="fill-white text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)] animate-heart-burst" />
                    </div>
                  )}

                  {carouselImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 backdrop-blur-sm text-white rounded-full p-1.5 sm:p-2 transition-all z-10 border border-white/15"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 backdrop-blur-sm text-white rounded-full p-1.5 sm:p-2 transition-all z-10 border border-white/15"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight size={22} />
                      </button>

                      {/* Contador */}
                      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/45 backdrop-blur-sm px-2.5 py-0.5 text-xs text-white/90 tabular-nums">
                        {currentImageIndex + 1}/{carouselImages.length}
                      </span>

                      {/* Indicadores */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 rounded-full bg-black/25 backdrop-blur-sm px-2 py-1.5">
                        {carouselImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentImageIndex(index)
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentImageIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                            }`}
                            aria-label={`Ir a imagen ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="transition-transform active:scale-90" aria-label="Me gusta">
                  <Heart
                    key={likeAnimKey}
                    size={28}
                    className={`${liked ? "fill-red-500 text-red-500 animate-heart-pop" : "text-white hover:text-white/70"} transition-colors`}
                  />
                </button>
                <button
                  onClick={() => commentInputRef.current?.focus()}
                  className="transition-transform active:scale-90"
                  aria-label="Comentar"
                >
                  <MessageCircle size={28} className="text-white hover:text-white/70 transition-colors" />
                </button>
              </div>

              {/* Título y descripción */}
              <div className="space-y-2">
                <h2 className="font-display text-white font-semibold text-xl sm:text-2xl text-shadow-pixel">{gift.title}</h2>
                <p className="text-red-100 text-sm sm:text-base leading-relaxed">
                  <span className="font-semibold text-white">Johan</span> {gift.fullDescription}
                </p>

                {gift.specialNote && (
                  <div className="relative rounded-lg border border-amber-300/30 bg-amber-100/[0.07] px-4 py-3 mt-3">
                    <span className="absolute -top-2 left-3 bg-red-900 px-1.5 text-[10px] text-amber-300/90 tracking-widest uppercase">
                      Nota
                    </span>
                    <p className="text-amber-100 text-xs sm:text-sm italic">“{gift.specialNote}”</p>
                  </div>
                )}
              </div>

              {/* Comentarios */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-amber-300/70 text-xs mb-3">
                  {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide mb-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 animate-fadeIn">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-600 text-[10px] font-bold text-white uppercase">
                        {comment.author_name?.[0] ?? "?"}
                      </div>
                      <p className="rounded-2xl rounded-tl-sm bg-black/20 px-3 py-1.5 text-sm text-red-50">
                        <span className="font-semibold text-white">{comment.author_name}</span> {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Nuevo comentario */}
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 pl-4 pr-1.5 py-1.5 focus-within:border-amber-300/50 transition-colors">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Agrega un comentario..."
                    disabled={isSubmitting}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-red-200/45 text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className={`rounded-full p-2 transition-all ${
                      newComment.trim() && !isSubmitting
                        ? "bg-amber-400 text-red-950 hover:bg-amber-300"
                        : "text-red-300/35"
                    }`}
                    aria-label="Enviar comentario"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
