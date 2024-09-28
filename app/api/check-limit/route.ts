import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const DAILY_LIMIT = 3;

async function getUserGenerationCount(userId: string): Promise<number> {
  const key = `user:${userId}:generations:${
    new Date().toISOString().split("T")[0]
  }`;
  const count = (await kv.get(key)) as number;
  return count || 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const currentCount = await getUserGenerationCount(userId);
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
