import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // En production, connecter à un service email ou Google Sheets
  console.log("[HAJESSI Contact]", body);
  return NextResponse.json({ success: true });
}
