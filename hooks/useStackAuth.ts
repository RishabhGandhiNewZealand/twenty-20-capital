"use client";

import { useStackApp, useUser } from "@stackframe/stack";

export function useStackAuth() {
  try {
    const stackApp = useStackApp();
    const user = useUser();
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
  try {
    return useUser();
  } catch (error) {
    return null;
  }
}

export function useStackApp() {
  try {
    return useStackApp();
  } catch (error) {
    return null;
  }
}