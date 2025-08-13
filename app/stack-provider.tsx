"use client";

import { useEffect, useState } from "react";

export default function StackProviderClient({ children }: { children: React.ReactNode }) {
  const [StackProvider, setStackProvider] = useState<any>(null);

  useEffect(() => {
    import("@stackframe/stack").then((module) => {
      setStackProvider(() => module.StackProvider);
    });
  }, []);

  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableKey) {
    console.warn("Stack authentication not configured");
    return <>{children}</>;
  }

  if (!StackProvider) {
    // Return children while Stack is loading
    return <>{children}</>;
  }

  return (
    <StackProvider
      app={{
        projectId,
        publishableClientKey: publishableKey,
        urls: {
          handler: "/handler",
          home: "/",
          signIn: "/handler/sign-in", 
          afterSignIn: "/",
          afterSignOut: "/",
        },
      }}
    >
      {children}
    </StackProvider>
  );
}