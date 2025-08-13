"use client";

import { ThemeProvider } from "next-themes";
import { AnonymizationProvider } from "@/contexts/AnonymizationContext";
import StackProviderClient from "./stack-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProviderClient>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AnonymizationProvider>
          {children}
        </AnonymizationProvider>
      </ThemeProvider>
    </StackProviderClient>
  );
}