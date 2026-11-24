// app/api/health/route.ts — Simple health check endpoint
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "DineFlow",
    phase: 1,
    timestamp: new Date().toISOString(),
  });
}
