"use client";

import { StackProvider } from "@stackframe/stack";
import { useEffect, useState } from "react";

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Stack provider during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID || !process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
    console.warn("Stack authentication environment variables not configured");
    return <>{children}</>;
  }

  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}

const stackApp = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
  urls: {
    handler: "/api/auth/stack",
  },
};