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
import { EyeOff, Eye } from "lucide-react"

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordModal({ open, onOpenChange }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { setAnonymized } = useAnonymization()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check password against environment variable
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error("NEXT_PUBLIC_ADMIN_PASSWORD not configured")
      setError("Authentication not configured. Please contact administrator.")
      return
    }
    
    if (password === adminPassword) {
      // Correct password - disable anonymization
      setAnonymized(false)
      setPassword("")
      setError("")
      onOpenChange(false)
    } else {
      // Incorrect password
      setError("Incorrect password. Please try again.")
    }
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setShowPassword(false)
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Authenticate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}