"use client";

import { useStackApp as useOriginalStackApp, useUser as useOriginalUser } from "@stackframe/stack";
import { useEffect, useState } from "react";

export function useStackAuth() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { stackApp: null, user: null, isConfigured: false };
  }

  try {
    const stackApp = useOriginalStackApp();
    const user = useOriginalUser();
    return { stackApp, user, isConfigured: true };
  } catch (error) {
    return { stackApp: null, user: null, isConfigured: false };
  }
}

export function useStackUser() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  try {
    return useOriginalUser();
  } catch (error) {
    return null;
  }
}

export function useStackApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  try {
    return useOriginalStackApp();
  } catch (error) {
    return null;
  }
}