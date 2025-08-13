"use client";

import { ThemeProvider } from "next-themes";
import { AnonymizationProvider } from "@/contexts/AnonymizationContext";
import StackProviderWrapper from "@/components/stack-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProviderWrapper>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AnonymizationProvider>
          {children}
        </AnonymizationProvider>
      </ThemeProvider>
    </StackProviderWrapper>
  );
}