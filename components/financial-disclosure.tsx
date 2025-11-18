"use client"

import { ShieldAlert } from "lucide-react"

interface FinancialDisclosureProps {
  variant?: "banner" | "inline"
  className?: string
}

const statements = [
  "Information presented here is for monitoring purposes only and does not constitute investment advice or an offer to buy or sell securities.",
  "Twenty 20 Capital's Capital Appreciation Fund is a private fund and is not open for external investment or public solicitation.",
  "Past performance is not indicative of future results. All figures are unaudited unless otherwise noted.",
]

export function FinancialDisclosure({ variant = "banner", className }: FinancialDisclosureProps) {
  const baseClasses =
    "rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100"
  const spacing = variant === "banner" ? "p-4 sm:p-6" : "p-3"

  return (
    <section className={`${baseClasses} ${spacing} ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <ShieldAlert className="h-6 w-6 flex-shrink-0 text-amber-500" />
        <div className="space-y-2 text-sm leading-relaxed">
          {statements.map((statement) => (
            <p key={statement}>{statement}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
