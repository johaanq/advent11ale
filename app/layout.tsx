import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel",
})

export const metadata: Metadata = {
  title: "Advent11Ale",
  description: "Calendario de Adviento interactivo con sorpresas especiales para tu cumpleaños",
  icons: {
    icon: [
      {
        url: "/snoopy_calendario.png",
        type: "image/png",
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#5c1a1c",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${pixelify.variable}`}>
      <body className="font-mono antialiased bg-wine text-white">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
