"use client"

import { useEffect } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export default function LoginPage() {
  const stack = useStackApp()
  const user = useUser()

  useEffect(() => {
    if (user) {
      stack.redirectToAfterSignIn({ replace: true })
    }
  }, [user, stack])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Authorized Personnel Only</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => stack.signInWithOAuth("google").catch(() => stack.redirectToSignIn())}
          >
            <GoogleIcon className="h-4 w-4" />
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => stack.signInWithOAuth("github").catch(() => stack.redirectToSignIn())}
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Trouble signing in? We’ll redirect you to the standard page.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  // Minimal Google "G" SVG
  return (
    <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272v95h147.4c-6.4 34.4-25.7 63.5-54.7 83v68h88.5c51.8-47.7 80.3-118 80.3-195.8z"/>
      <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.1l-88.5-68c-24.6 16.5-56.1 26-92.3 26-70.9 0-131-47.8-152.4-112.1H27.8v70.3C72.6 487.7 166.1 544.3 272 544.3z"/>
      <path fill="#FBBC05" d="M119.6 324.1c-10.4-30.9-10.4-64.2 0-95.1v-70.3H27.8c-39.8 79.6-39.8 156 0 235.6l91.8-70.2z"/>
      <path fill="#EA4335" d="M272 106.1c39.9-.6 78.3 13.9 107.5 40.9l80.2-80.2C406.7 20.2 342.7-.2 272 0 166.1 0 72.6 56.6 27.8 156.7l91.8 70.3C141 172.7 201.1 124.9 272 124.9z"/>
    </svg>
  )
}