"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { ChevronLeft } from "lucide-react"
import Snowfall from "@/components/snowfall"

interface Question {
  question: string
  options: string[]
  correctAnswer: number // índice de la respuesta correcta
}

interface GiftQuizPageProps {
  gift: any
  questions: Question[]
  onBack: () => void
  onSuccess: () => void
  openedGiftsCount?: number
  totalGifts?: number
}

export function GiftQuizPage({ 
  gift, 
  questions, 
  onBack, 
  onSuccess,
  openedGiftsCount = 0,
  totalGifts = 4
}: GiftQuizPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showError, setShowError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[currentQuestionIndex] = answerIndex
      return newAnswers
    })
    setShowError(false)
  }

  const handleNext = () => {
    if (selectedAnswers[currentQuestionIndex] === undefined) {
      setShowError(true)
      return
    }

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowError(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setShowError(false)
    }
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    
    // TEMPORAL: Para testing - Todas las respuestas son correctas
    const allCorrect = true
    // CÓDIGO ORIGINAL (comentado para testing):
    // const allCorrect = questions.every((question, index) => {
    //   return selectedAnswers[index] === question.correctAnswer
    // })

    if (allCorrect) {
      // Esperar un momento antes de llamar onSuccess para mejor UX
      setTimeout(() => {
        onSuccess()
      }, 500)
    } else {
      setShowError(true)
      setIsSubmitting(false)
      // Resetear al inicio si hay respuestas incorrectas
      setTimeout(() => {
        setCurrentQuestionIndex(0)
        setSelectedAnswers([])
        setShowError(false)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: 'lab(20 46.5 22.89 / 1)' }}>
      <Snowfall />
      <Navbar openedGiftsCount={openedGiftsCount} totalGifts={totalGifts} />
      
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
          {/* Botón para volver */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-amber-200 hover:text-amber-300 transition-colors text-sm sm:text-base"
            style={{ fontFamily: 'monospace' }}
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Volver al calendario</span>
            <span className="sm:hidden">Volver</span>
          </button>

          {/* Contenedor del formulario */}
          <div 
            className="bg-red-900/80 border-3 border-amber-200/50 rounded-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
            style={{ 
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
              imageRendering: 'pixelated'
            }}
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-white"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                }}
              >
                Desbloquear Regalo del Día {gift.day}
              </h1>
              <p 
                className="text-amber-200 text-xs sm:text-sm lg:text-base"
                style={{ fontFamily: 'monospace' }}
              >
                Responde correctamente para desbloquear tu sorpresa
              </p>
            </div>

            {/* Indicador de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] sm:text-xs text-amber-200/80" style={{ fontFamily: 'monospace' }}>
                <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-red-800/50 rounded-full h-2 border border-amber-200/30">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Pregunta actual */}
            <div className="space-y-3 sm:space-y-4">
              <h2 
                className="text-base sm:text-lg lg:text-xl font-semibold text-white"
                style={{ 
                  fontFamily: 'monospace',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.5)'
                }}
              >
                {currentQuestion.question}
              </h2>

              {/* Opciones de respuesta */}
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === index
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isSubmitting}
                      className={`w-full text-left p-3 sm:p-4 rounded-sm border-2 transition-all text-sm sm:text-base ${
                        isSelected
                          ? 'bg-amber-400/30 border-amber-400 text-white'
                          : 'bg-red-800/30 border-amber-200/30 text-red-100 hover:border-amber-200/60 hover:bg-red-800/50'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ 
                        fontFamily: 'monospace',
                        boxShadow: isSelected ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'none'
                      }}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* Mensaje de error */}
              {showError && (
                <div 
                  className="bg-red-800/80 border-2 border-red-500 rounded-sm p-3 text-center"
                  style={{ fontFamily: 'monospace' }}
                >
                  <p className="text-red-100 text-sm">
                    {isLastQuestion && selectedAnswers[currentQuestionIndex] !== undefined
                      ? '❌ Algunas respuestas son incorrectas. Intenta de nuevo.'
                      : '⚠️ Por favor selecciona una respuesta'}
                  </p>
                </div>
              )}
            </div>

            {/* Botones de navegación */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isSubmitting}
                className={`w-full sm:flex-1 py-2 sm:py-3 rounded-sm border-2 transition-all text-sm sm:text-base ${
                  currentQuestionIndex === 0 || isSubmitting
                    ? 'bg-red-800/30 border-amber-200/20 text-red-300/50 cursor-not-allowed'
                    : 'bg-red-800/50 border-amber-200/50 text-white hover:bg-red-800/70 hover:border-amber-200/70'
                }`}
                style={{ 
                  fontFamily: 'monospace',
                  boxShadow: currentQuestionIndex === 0 ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className={`w-full sm:flex-1 py-2 sm:py-3 rounded-sm border-2 transition-all text-sm sm:text-base ${
                  isSubmitting
                    ? 'bg-amber-400/50 border-amber-400/50 text-white/70 cursor-not-allowed'
                    : 'bg-amber-400 border-amber-500 text-red-950 font-bold hover:bg-amber-500 hover:border-amber-600'
                }`}
                style={{ 
                  fontFamily: 'monospace',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {isSubmitting ? 'Verificando...' : isLastQuestion ? 'Desbloquear Regalo' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

