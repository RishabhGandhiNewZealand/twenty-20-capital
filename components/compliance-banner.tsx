import { AlertTriangle } from "lucide-react"

export function ComplianceBanner() {
  return (
    <div className="bg-gray-900 text-gray-400 py-2 px-4 text-xs sm:text-sm border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-500 shrink-0" />
        <span>
          Disclaimer: Content on this website is for informational purposes only and does not constitute financial advice. 
          Past performance is not indicative of future results.
        </span>
      </div>
    </div>
  )
}
