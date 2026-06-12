import { NextResponse } from "next/server";

import {
  clearAdminSessionCookies,
  requireAdmin,
  setAdminSessionCookies,
} from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return clearAdminSessionCookies(admin.error);
  }

  const response = NextResponse.json({
    user: {
      email: admin.user.email,
    },
  });
  return setAdminSessionCookies(response, admin.session);
}
