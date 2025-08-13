import { StackHandler, StackServerApp } from "@stackframe/stack"

export default function Page(props: any) {
  const app = new StackServerApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "",
    tokenStore: "nextjs-cookie",
  })
  return StackHandler({ app, fullPage: true, routeProps: props })
}