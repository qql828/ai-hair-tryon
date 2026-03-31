import { getRequestContext } from "@cloudflare/next-on-pages";
import { signJWT } from "@/lib/jwt";

export const runtime = "edge";

export async function GET(req: Request) {
  const { env } = getRequestContext();
  const e = env as any;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET || !e.JWT_SECRET) {
    return new Response("OAuth credentials not configured", { status: 500 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: e.GOOGLE_CLIENT_ID,
      client_secret: e.GOOGLE_CLIENT_SECRET,
      redirect_uri: "https://hairtryon.shop/api/auth/callback",
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokens.access_token) {
    return new Response("OAuth failed: " + tokens.error, { status: 400 });
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as { email: string; name: string; picture: string };

  const jwt = await signJWT(
    {
      email: user.email,
      name: user.name,
      picture: user.picture,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    e.JWT_SECRET
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": `auth=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}
