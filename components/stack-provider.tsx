"use client";

import { StackProvider } from "@stackframe/stack";
import { getStackConfig } from "@/lib/stack-client";
import NoSSR from "./no-ssr";
import { useEffect, useState } from "react";

export default function StackProviderWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const stackConfig = getStackConfig();
    if (stackConfig) {
      setConfig(stackConfig);
    }
  }, []);

  if (!config) {
    return <>{children}</>;
  }

  return (
    <NoSSR>
      <StackProvider app={config}>
        {children}
      </StackProvider>
    </NoSSR>
  );
}