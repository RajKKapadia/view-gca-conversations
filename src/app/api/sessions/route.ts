import { NextResponse } from "next/server";
import { listConversations } from "@/lib/dialogflow";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const pageToken = searchParams.get('pageToken');
    
    const result = await listConversations(startDate, endDate, pageToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
