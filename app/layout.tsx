import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { AnonymizationProvider } from "@/contexts/AnonymizationContext"
import { StackProvider, StackServerApp } from "@stackframe/stack"
import { Suspense } from "react"
import SidebarNavigation from "@/components/sidebar-navigation"
import { FinancialDisclosure } from "@/components/financial-disclosure"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Twenty 20 Capital — Capital Appreciation Fund",
  description: "Private reporting console for the Capital Appreciation Fund. Admin access only.",
  generator: "v0.dev",
  icons: {
    icon: "/logo-favicon.png",
    shortcut: "/logo-favicon.png",
    apple: "/logo-favicon.png",
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
                <div className="px-4 py-6">
                  <div className="max-w-5xl mx-auto">
                    <FinancialDisclosure />
                  </div>
                </div>
                <Analytics />
              </AnonymizationProvider>
            </ThemeProvider>
          </StackProvider>
        </body>
      </html>
    )
}
