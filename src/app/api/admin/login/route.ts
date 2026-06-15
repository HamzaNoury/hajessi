import { NextResponse } from "next/server";
import {
  verifyAdminPassword,
  setAdminSession,
  clearAdminSession,
} from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
