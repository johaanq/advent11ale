"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react"
import { 
  getLikeStatus, 
  toggleLike, 
  getComments, 
  addComment,
  subscribeToComments,
  subscribeToLikes,
  type Comment 
} from "@/lib/supabase-interactions"

interface GiftDetailPageProps {
  gift: any
  onBack: () => void
  openedGiftsCount?: number
  totalGifts?: number
}

export function GiftDetailPage({ gift, onBack, openedGiftsCount = 1, totalGifts = 4 }: GiftDetailPageProps) {
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Generar URLs de las 3 imágenes del carrusel
  const carouselImages = [
    `/regalo${gift.id}_1.jpg`,
    `/regalo${gift.id}_2.jpg`,
    `/regalo${gift.id}_3.jpg`
  ]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }
  }

  // Cargar estado inicial
  useEffect(() => {
    const loadData = async () => {
      const likeStatus = await getLikeStatus(gift.id)
      setLiked(likeStatus)
      
      const commentsData = await getComments(gift.id)
      setComments(commentsData)
    }
    
    loadData()
  }, [gift.id])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribeComments = subscribeToComments(gift.id, (newComments) => {
      setComments(newComments)
    })

    const unsubscribeLikes = subscribeToLikes(gift.id, (newLiked) => {
      setLiked(newLiked)
    })

    return () => {
      unsubscribeComments()
      unsubscribeLikes()
    }
  }, [gift.id])

  const handleLike = async () => {
    const newLiked = await toggleLike(gift.id)
    setLiked(newLiked)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    const success = await addComment(gift.id, newComment.trim())
    
    if (success) {
      setNewComment("")
    }
    
    setIsSubmitting(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} />

      <div className="min-h-[calc(100vh-60px)] p-0 sm:p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Botón para volver - Solo en desktop */}
          <button
            onClick={onBack}
            className="hidden sm:inline-flex items-center gap-2 text-amber-200 hover:text-amber-300 transition-colors text-sm mb-4"
            style={{ fontFamily: 'monospace' }}
          >
            <ChevronLeft size={18} />
            Volver
          </button>

          {/* Post estilo Instagram */}
          <div className="bg-red-900/90 border-y sm:border sm:border-red-800/50 sm:rounded-sm overflow-hidden">
            {/* Header del post */}
            <div className="p-3 sm:p-4 border-b border-red-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  J
                </div>
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base" style={{ fontFamily: 'monospace' }}>
                    Johan
                  </p>
                  <p className="text-amber-400/70 text-xs" style={{ fontFamily: 'monospace' }}>
                    {gift.dayName} {gift.day} de Diciembre
                  </p>
                </div>
              </div>
              <button onClick={onBack} className="sm:hidden text-amber-300">
                <ChevronLeft size={24} />
              </button>
            </div>

            {/* Carrusel de imágenes del regalo */}
            <div 
              className="relative aspect-square bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Imágenes del carrusel */}
              <div className="relative w-full h-full">
                {carouselImages.map((imageSrc, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img 
                      src={imageSrc} 
                      alt={`${gift.title} - Foto ${index + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.src = "/snoopy_calendario.png"
                        e.currentTarget.onerror = null
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Botones de navegación */}
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Indicadores de puntos */}
              {carouselImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`transition-all rounded-full ${
                        index === currentImageIndex
                          ? 'w-2.5 h-2.5 bg-white'
                          : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Ir a imagen ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Acciones (like, comentar) */}
            <div className="p-3 sm:p-4 space-y-3">
              {/* Botones de acción */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  className="transition-transform active:scale-90"
                >
                  <Heart 
                    size={28} 
                    className={`${liked ? 'fill-red-500 text-red-500' : 'text-white'} transition-colors`}
                  />
                </button>
                <button className="transition-transform active:scale-90">
                  <MessageCircle size={28} className="text-white" />
                </button>
              </div>

              {/* Título y descripción */}
              <div className="space-y-2">
                <h2 className="text-white font-bold text-lg sm:text-xl" style={{ fontFamily: 'monospace' }}>
                  {gift.title}
                </h2>
                <p className="text-red-100 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'monospace' }}>
                  <span className="font-semibold">Johan</span> {gift.fullDescription}
                </p>
                
                {/* Nota especial */}
                {gift.specialNote && (
                  <div className="bg-amber-100/10 border border-amber-400/30 rounded-sm p-3 mt-2">
                    <p className="text-amber-200 text-xs sm:text-sm italic" style={{ fontFamily: 'monospace' }}>
                      "{gift.specialNote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Comentarios */}
              <div className="pt-2 border-t border-red-800/30">
                <p className="text-amber-300/70 text-xs mb-3" style={{ fontFamily: 'monospace' }}>
                  {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
                </p>
                
                {/* Lista de comentarios */}
                <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide mb-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <p className="text-red-100" style={{ fontFamily: 'monospace' }}>
                        <span className="font-semibold text-white">{comment.author_name}</span>{' '}
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Input para nuevo comentario */}
                <div className="flex items-center gap-2 pt-3 border-t border-red-800/30">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Agrega un comentario..."
                    disabled={isSubmitting}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-red-300/50 text-sm"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className={`${
                      newComment.trim() && !isSubmitting
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-red-400/30'
                    } transition-colors`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
