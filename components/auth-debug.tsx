'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'

export function AuthDebug() {
  const { isAuthenticated, isAdmin, password } = useAuth()
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 bg-background border rounded-lg shadow-lg text-xs">
      <div className="font-semibold mb-2">Auth Debug:</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span>Authenticated:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Admin:</span>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Password:</span>
          <Badge variant={password ? "default" : "secondary"}>
            {password ? "Set" : "Not Set"}
          </Badge>
        </div>
      </div>
    </div>
  )
}