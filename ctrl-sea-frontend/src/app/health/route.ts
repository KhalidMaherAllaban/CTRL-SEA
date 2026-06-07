import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ctrl-sea-frontend",
    backendProxy: process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000/api"
  });
}
