// Configuración de cada edición del calendario (una por año).
// Para cambiar textos, fotos u horas de un regalo, edita solo este archivo.

export interface Gift {
  id: number
  day: number
  dayName: string
  title: string
  description: string
  fullDescription: string
  specialNote: string
  cardMessage: string
  signature: string
  // Imagen de portada (tarjetas y fondo al revelar)
  image: string
  // Fotos del carrusel en la página de detalle. Vacío = "Cargando fotos..."
  photos: string[]
  color: string
}

export interface Edition {
  year: number
  gifts: Gift[]
  // Ícono que aparece en el calendario cuando el regalo ya se abrió (mismo orden que gifts)
  icons: string[]
  // Hora de Lima (0-23) a partir de la cual se puede abrir el regalo de ese día
  unlockHour: (day: number) => number
  // Hasta esta fecha se muestra el contador
  countdownTarget: Date
  // Notitas que aparecen al abrir cada día
  notesByDay: Record<number, string[]>
  // Año pasado: todos los regalos se muestran abiertos, solo para recordar
  archived: boolean
}

export const BIRTHDAY_DAY = 11
const SIGNATURE = "Con amor, de Johan para mi Ale."
const PLACEHOLDER_IMAGE = "/snoopy_calendario.png"

// ===================== 2026 =====================
// Placeholders: reemplaza títulos, textos y fotos cuando los tengas.
// Fotos sugeridas: public/2026/regalo1_1.jpg, public/2026/regalo1_2.jpg, ...

const gifts2026: Gift[] = [
  { day: 7, dayName: "Lunes", title: "Primera Sorpresa" },
  { day: 8, dayName: "Martes", title: "Segunda Sorpresa" },
  { day: 9, dayName: "Miércoles", title: "Tercera Sorpresa" },
  { day: 10, dayName: "Jueves", title: "Cuarta Sorpresa" },
  { day: 11, dayName: "Viernes", title: "🎂 ¡Feliz Cumpleaños!" },
].map((g, i) => ({
  id: i + 1,
  day: g.day,
  dayName: g.dayName,
  title: g.title,
  description: "Muy pronto descubrirás lo que preparé para ti.",
  fullDescription: "Muy pronto descubrirás lo que preparé para ti.",
  specialNote: "Ábrelo conmigo, quiero ver tu carita.",
  cardMessage: "Cada día contigo es mi regalo favorito.",
  signature: SIGNATURE,
  image: PLACEHOLDER_IMAGE,
  photos: [],
  color: "from-red-600 to-red-700",
}))

const edition2026: Edition = {
  year: 2026,
  gifts: gifts2026,
  icons: ["🎅", "🎄", "☃️", "🦌", "🎂"],
  unlockHour: () => 16,
  countdownTarget: new Date("2026-12-07T00:00:00-05:00"),
  notesByDay: {
    7: ["Empieza nuestra semana especial.", "Gracias por existir en mi vida.", SIGNATURE],
    8: ["Tu sonrisa ilumina mis días.", "Eres mi persona favorita en el mundo.", SIGNATURE],
    9: ["Contigo todo es mejor.", "Cada momento contigo es un regalo.", SIGNATURE],
    10: ["Gracias por llenar mi vida de alegría.", "Ya casi es tu día.", SIGNATURE],
    11: [
      "Feliz cumpleaños, mi amor.",
      "Hoy celebro que existes.",
      "Eres lo mejor que me ha pasado.",
      "Te amo más de lo que las palabras pueden expresar.",
    ],
  },
  archived: false,
}

// ===================== 2025 (archivo) =====================

const edition2025: Edition = {
  year: 2025,
  gifts: [
    {
      id: 1,
      day: 8,
      dayName: "Lunes",
      title: "Primera Sorpresa",
      description: "Un detalle pequeño pero lleno de cariño. Algo que vas a llevar cerquita siempre.",
      fullDescription: "Un detalle pequeño pero lleno de cariño. Algo que vas a llevar cerquita siempre.",
      specialNote: "Cuando estemos juntos, enciende las velitas conmigo y abre tu primera sorpresa.",
      cardMessage: "Gracias por existir en mi vida.",
      signature: SIGNATURE,
      image: PLACEHOLDER_IMAGE,
      photos: ["/regalo1_1.jpg", "/regalo1_2.jpg", "/regalo1_3.jpg"],
      color: "from-red-600 to-red-700",
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
      signature: SIGNATURE,
      image: PLACEHOLDER_IMAGE,
      photos: ["/regalo2_1.jpg", "/regalo2_2.jpg"],
      color: "from-red-700 to-red-800",
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
      signature: SIGNATURE,
      image: PLACEHOLDER_IMAGE,
      photos: [],
      color: "from-red-500 to-red-600",
    },
    {
      id: 4,
      day: 11,
      dayName: "Jueves",
      title: "🎂 ¡Feliz Cumpleaños!",
      description:
        "Hoy termina tu semana especial. Lo de aquí es algo que te acompañará cada día… y algo más que hará sonreír tu corazón.",
      fullDescription:
        "Hoy termina tu semana especial. Lo de aquí es algo que te acompañará cada día… y algo más que hará sonreír tu corazón.",
      specialNote: "Ábrelo conmigo. Prometo que este regalo habla por sí solo.",
      cardMessage: "Feliz cumpleaños, mi amor. Que todos tus deseos se hagan realidad.",
      signature: "Con todo mi amor, Johan para mi Ale.",
      image: "/regalo4_1.jpg",
      photos: ["/regalo4_1.jpg", "/regalo4_2.jpg", "/regalo4_3.jpg"],
      color: "from-red-800 to-red-900",
    },
  ],
  icons: ["🎅", "🎄", "☃️", "🦌"],
  unlockHour: (day) => (day === 8 ? 18 : day === 9 ? 17 : 16),
  countdownTarget: new Date("2025-12-08T00:10:00-05:00"),
  notesByDay: {
    8: [
      "Gracias por existir en mi vida.",
      "Cada momento contigo es un regalo.",
      "Hoy comienza algo especial para ti.",
      SIGNATURE,
    ],
    9: [
      "Hoy también es un día bonito porque tú estás.",
      "Tu sonrisa ilumina mis días.",
      "Eres mi persona favorita en el mundo.",
      SIGNATURE,
    ],
    10: [
      "Cada día a tu lado es un regalo para mí.",
      "Contigo todo es mejor.",
      "Gracias por llenar mi vida de alegría.",
      SIGNATURE,
    ],
    11: [
      "Feliz cumpleaños, mi amor.",
      "Hoy celebro que existes.",
      "Eres lo mejor que me ha pasado.",
      "Te amo más de lo que las palabras pueden expresar.",
    ],
  },
  archived: true,
}

// La primera es la que se muestra al entrar
export const EDITIONS: Edition[] = [edition2026, edition2025]
export const CURRENT_EDITION = EDITIONS[0]

export function getEdition(year: number): Edition {
  return EDITIONS.find((e) => e.year === year) ?? CURRENT_EDITION
}

// ===================== Hora de Lima =====================

export interface LimaTime {
  year: number
  month: number // 1-12
  day: number
  hour: number
}

export function limaNow(date = new Date()): LimaTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") }
}

// ¿Ya se puede abrir el regalo de ese día de diciembre?
export function isDayAvailable(edition: Edition, day: number, now: LimaTime = limaNow()): boolean {
  if (edition.archived) return true
  if (now.year !== edition.year) return now.year > edition.year
  if (now.month !== 12) return false
  if (now.day !== day) return now.day > day
  return now.hour >= edition.unlockHour(day)
}

// Mismo día (en Lima) que una fecha ISO
export function isSameLimaDay(iso: string, now: LimaTime = limaNow()): boolean {
  const t = limaNow(new Date(iso))
  return t.year === now.year && t.month === now.month && t.day === now.day
}
