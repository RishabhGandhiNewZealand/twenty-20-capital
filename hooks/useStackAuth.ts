"use client";

export function useStackAuth() {
  try {
    // Dynamically require Stack hooks only on client
    const { useStackApp, useUser } = require("@stackframe/stack");
    const stackApp = useStackApp();
    const user = useUser();
    
    return { 
      stackApp, 
      user, 
      isConfigured: true,
      isLoading: false 
    };
  } catch (error) {
    // Stack not loaded yet or not in provider
    return { 
      stackApp: null, 
      user: null, 
      isConfigured: false,
      isLoading: true 
    };
  }
}

export function useStackUser() {
  try {
    const { useUser } = require("@stackframe/stack");
    return useUser();
  } catch (error) {
    return null;
  }
}

export function useStackApp() {
  try {
    const { useStackApp } = require("@stackframe/stack");
    return useStackApp();
  } catch (error) {
    return null;
  }
}