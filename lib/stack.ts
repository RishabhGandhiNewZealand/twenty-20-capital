import { StackServerApp } from "@stackframe/stack";

// Get the app URL from environment or construct it
const getAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: getAppUrl(),
    signIn: `${getAppUrl()}/api/auth/stack`,
    afterSignIn: getAppUrl(),
    afterSignOut: getAppUrl(),
  },
});