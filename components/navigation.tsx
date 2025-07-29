"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Portfolio" },
    { href: "/earnings", label: "Earnings" },
    { href: "/reports", label: "Reports" },
    { href: "/analyses", label: "Analyses" },
    { href: "/about", label: "About" },
  ]

  return (
    <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Rish Investing Journey</span>
          </Link>

          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
