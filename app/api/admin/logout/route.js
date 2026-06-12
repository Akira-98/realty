import { NextResponse } from "next/server";

import { clearAdminSessionCookies } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  return clearAdminSessionCookies(NextResponse.json({ ok: true }));
}
