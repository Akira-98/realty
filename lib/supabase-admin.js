import { jsonError, requiredEnv } from "./http";

const ACCESS_TOKEN_COOKIE = "realt_admin_access_token";
const REFRESH_TOKEN_COOKIE = "realt_admin_refresh_token";

export function supabaseBaseUrl() {
  return requiredEnv("SUPABASE_URL").replace(/\/$/, "");
}

export function supabaseHeaders(key, extraHeaders = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extraHeaders,
  };
}

function adminConfig() {
  return {
    supabaseUrl: supabaseBaseUrl(),
    anonKey: requiredEnv("SUPABASE_ANON_KEY"),
    adminEmail: requiredEnv("ADMIN_EMAIL").trim().toLowerCase(),
  };
}

function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function cookieToken(request, name) {
  return request.cookies.get(name)?.value || "";
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function setAdminSessionCookies(response, session) {
  if (!session?.access_token || !session?.refresh_token) {
    return response;
  }

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.access_token,
    cookieOptions(session.expires_in || 3600),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refresh_token,
    cookieOptions(60 * 60 * 24 * 30),
  );
  return response;
}

export function clearAdminSessionCookies(response) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", cookieOptions(0));
  return response;
}

function isAdminUser(user, adminEmail) {
  const email = String(user?.email || "").trim().toLowerCase();
  return Boolean(email && email === adminEmail);
}

function forbiddenAdminError() {
  return jsonError("This user is not allowed to manage buildings.", 403);
}

export async function passwordSignIn(email, password) {
  let config;
  try {
    config = adminConfig();
  } catch (error) {
    return { error: jsonError(error.message, 500) };
  }

  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { error: jsonError("Invalid email or password.", 401) };
  }

  const session = await response.json();
  if (!isAdminUser(session.user, config.adminEmail)) {
    return { error: forbiddenAdminError() };
  }

  return { session, user: session.user };
}

async function refreshSession(refreshToken, supabaseUrl, anonKey) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchUser(accessToken, supabaseUrl, anonKey) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function requireAdmin(request) {
  let config;
  try {
    config = adminConfig();
  } catch (error) {
    return { error: jsonError(error.message, 500) };
  }

  let token = bearerToken(request) || cookieToken(request, ACCESS_TOKEN_COOKIE);
  if (!token) {
    return { error: jsonError("Admin authorization is required.", 401) };
  }

  let session = null;
  let user = await fetchUser(token, config.supabaseUrl, config.anonKey);

  if (!user) {
    const refreshToken = cookieToken(request, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      return { error: jsonError("Invalid admin session.", 401) };
    }
    session = await refreshSession(
      refreshToken,
      config.supabaseUrl,
      config.anonKey,
    );
    token = session?.access_token;
    user = token
      ? await fetchUser(token, config.supabaseUrl, config.anonKey)
      : null;
    if (!user) {
      return { error: jsonError("Invalid admin session.", 401) };
    }
  }

  if (!isAdminUser(user, config.adminEmail)) {
    return { error: forbiddenAdminError() };
  }

  return { user, session };
}
