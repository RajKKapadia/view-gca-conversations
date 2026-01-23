import { NextResponse } from "next/server";
import { listConversations } from "@/lib/dialogflow";

export async function GET() {
  try {
    const sessions = await listConversations();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
