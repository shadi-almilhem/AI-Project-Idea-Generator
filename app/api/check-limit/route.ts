import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const DAILY_LIMIT = 3;

async function getIPGenerationCount(ip: string): Promise<number> {
  const key = `ip:${ip}:generations:${new Date().toISOString().split("T")[0]}`;
  const count = (await kv.get(key)) as number;
  return count || 0;
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";

    if (ip === "unknown") {
      return NextResponse.json(
        { error: "Unable to determine IP address" },
        { status: 400 }
      );
    }

    const currentCount = await getIPGenerationCount(ip);
    const remainingGenerations = Math.max(0, DAILY_LIMIT - currentCount);

    return NextResponse.json({ remainingGenerations });
  } catch (error) {
    console.error("Error in check-limit API route:", error);
    return NextResponse.json(
      { error: "An error occurred while checking the usage limit." },
      { status: 500 }
    );
  }
}
