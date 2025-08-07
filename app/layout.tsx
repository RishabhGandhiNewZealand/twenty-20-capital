import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rish Invests",
  description: "Track your personal investing journey and portfolio performance",
  generator: 'v0.dev',
  icons: {
    icon: '/logo-favicon.png',
    shortcut: '/logo-favicon.png',
    apple: '/logo-favicon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navigation />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
