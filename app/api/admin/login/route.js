import { NextResponse } from "next/server";

import { jsonError } from "../../../../lib/http";
import {
  passwordSignIn,
  setAdminSessionCookies,
} from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");
  if (!email || !password) {
    return jsonError("email and password are required.");
  }

  const result = await passwordSignIn(email, password);
  if (result.error) {
    return result.error;
  }

  const response = NextResponse.json({
    user: {
      email: result.user.email,
    },
  });
  return setAdminSessionCookies(response, result.session);
}
