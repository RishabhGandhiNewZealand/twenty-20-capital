import { StackServerApp } from "@stackframe/stack"

let stackServerApp: StackServerApp<boolean, string> | null = null

function assertEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is not set`)
  }
  return value
}

export function getStackServerApp() {
  if (!stackServerApp) {
    const projectId = assertEnv("NEXT_PUBLIC_STACK_PROJECT_ID")
    const publishableClientKey = assertEnv("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY")
    const secretServerKey = assertEnv("STACK_SECRET_SERVER_KEY")

    stackServerApp = new StackServerApp({
      projectId,
      publishableClientKey,
      secretServerKey,
      tokenStore: "nextjs-cookie",
    })
  }

  return stackServerApp
}
