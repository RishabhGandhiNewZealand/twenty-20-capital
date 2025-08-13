import { stackServerApp } from "@/lib/stack";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return await stackServerApp.handler(req);
}

export async function POST(req: NextRequest) {
  return await stackServerApp.handler(req);
}