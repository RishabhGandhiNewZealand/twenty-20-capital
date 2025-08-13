"use client";

import { useStackApp as useOriginalStackApp, useUser as useOriginalUser } from "@stackframe/stack";
import { useEffect, useState } from "react";

export function useStackAuth() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { 
      stackApp: null, 
      user: null, 
      isConfigured: false,
      isLoading: true 
    };
  }

  try {
    const stackApp = useOriginalStackApp();
    const user = useOriginalUser();
    return { 
      stackApp, 
      user, 
      isConfigured: true,
      isLoading: false 
    };
  } catch (error) {
    // Stack provider not available
    return { 
      stackApp: null, 
      user: null, 
      isConfigured: false,
      isLoading: false 
    };
  }
}

export function useStackUser() {
  const { user } = useStackAuth();
  return user;
}

export function useStackApp() {
  const { stackApp } = useStackAuth();
  return stackApp;
}