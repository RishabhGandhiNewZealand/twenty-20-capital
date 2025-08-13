"use client";

export function getStackConfig() {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableKey) {
    return null;
  }

  // Get the current URL dynamically
  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  return {
    projectId,
    publishableClientKey: publishableKey,
    urls: {
      backend: `${getAppUrl()}/api/auth/stack`,
      home: getAppUrl(),
      signIn: `${getAppUrl()}/api/auth/stack/sign-in`,
      afterSignIn: getAppUrl(),
      afterSignOut: getAppUrl(),
    },
  };
}