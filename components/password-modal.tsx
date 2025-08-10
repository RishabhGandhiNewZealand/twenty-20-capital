"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { EyeOff, Eye, Loader2 } from "lucide-react"

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordModal({ open, onOpenChange }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAnonymized } = useAnonymization()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      // Call the API endpoint to verify the password
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Authentication failed. Please try again.")
        return
      }
      
      if (data.success) {
        // Correct password - disable anonymization
        setAnonymized(false)
        setPassword("")
        setError("")
        onOpenChange(false)
      } else {
        // Incorrect password
        setError("Incorrect password. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setError("Failed to verify password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setShowPassword(false)
    setIsLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Enter the admin password to view actual portfolio values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter password"
                  className="pr-10"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Authenticate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}