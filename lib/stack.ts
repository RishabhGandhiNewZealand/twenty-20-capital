import { StackServerApp } from "@stackframe/stack";

// Get the app URL from environment or construct it
const getAppUrl = () => {
  // For Vercel deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});