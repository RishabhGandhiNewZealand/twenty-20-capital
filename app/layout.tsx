import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SidebarNavigation from "@/components/sidebar-navigation"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { Suspense } from "react"
import { StackProvider } from "@stackframe/stack"
import { stackServerApp } from "@/lib/stack"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Twenty 20 Capital",
  description: "Twenty 20 Capital - Capital Appreciation Fund Performance",
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
        <StackProvider app={stackServerApp}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Suspense fallback={null}>
              <SidebarNavigation />
            </Suspense>
            <main className="min-h-screen">
              {children}
            </main>
            <Analytics />
          </ThemeProvider>
        </StackProvider>
      </body>
    </html>
  )
}
