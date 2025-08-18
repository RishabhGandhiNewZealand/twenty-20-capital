import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SidebarNavigation from "@/components/sidebar-navigation"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { AnonymizationProvider } from "@/contexts/AnonymizationContext"
import { StackProvider, StackServerApp } from "@stackframe/stack"
import { Suspense } from "react"

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
  const stackApp = new StackServerApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "",
    tokenStore: "nextjs-cookie",
  })

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StackProvider app={stackApp}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AnonymizationProvider>
              <Suspense fallback={null}>
                <SidebarNavigation adminEmail={process.env.ADMIN_EMAIL || ""} />
              </Suspense>
              <main className="min-h-screen">
                {children}
              </main>
              <Analytics />
            </AnonymizationProvider>
          </ThemeProvider>
        </StackProvider>
      </body>
    </html>
  )
}
