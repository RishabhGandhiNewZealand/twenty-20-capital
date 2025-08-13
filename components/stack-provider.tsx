"use client";

import { StackProvider } from "@stackframe/stack";
import { useEffect, useState } from "react";

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render Stack provider on server
  if (!isClient) {
    return <>{children}</>;
  }

  // Check if environment variables are configured
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableKey) {
    console.warn("Stack authentication environment variables not configured");
    return <>{children}</>;
  }

  try {
    return (
      <StackProvider app={{
        projectId,
        publishableClientKey: publishableKey,
      }}>
        {children}
      </StackProvider>
    );
  } catch (error) {
    console.error("Error initializing Stack provider:", error);
    return <>{children}</>;
  }
}