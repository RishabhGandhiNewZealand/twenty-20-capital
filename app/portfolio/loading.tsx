import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <div className="text-gray-500">Loading portfolio...</div>
      </div>
    </div>
  )
}