"use client"

export default function ChristmasTree() {
  const decorations = ["🎄", "⭐", "🎅", "🎀", "❄️", "🕯️"]

  return (
    <div className="flex flex-col items-center">
      {/* Tree Layers */}
      <div className="relative">
        {/* Top */}
        <div className="text-center text-6xl sm:text-7xl lg:text-8xl drop-shadow-lg filter">🎄</div>
        <div className="text-center text-5xl sm:text-6xl lg:text-7xl drop-shadow-lg filter mt-2">🎄</div>
        <div className="text-center text-4xl sm:text-5xl lg:text-6xl drop-shadow-lg filter mt-2">🎄</div>

        {/* Star on top */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl sm:text-5xl animate-pulse">⭐</div>
      </div>

      {/* Trunk */}
      <div className="w-12 h-16 sm:w-16 sm:h-20 lg:w-20 lg:h-24 bg-amber-900 rounded-sm mt-2 drop-shadow-lg" />

      {/* Decorations around */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl sm:text-3xl animate-pulse"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + i * 5}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {decorations[i % decorations.length]}
          </div>
        ))}
      </div>
    </div>
  )
}
