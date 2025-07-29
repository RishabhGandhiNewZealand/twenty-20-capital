import { EarningsCalendar } from "@/components/earnings-calendar"
import { Calendar } from "lucide-react"

export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Earnings Calendar</h1>
          </div>
          <p className="text-gray-600">
            Track upcoming earnings announcements for all companies in your portfolio (past and present).
            Stay informed about key financial events that could impact your investments.
          </p>
        </div>
        
        <EarningsCalendar />
      </div>
    </div>
  )
}