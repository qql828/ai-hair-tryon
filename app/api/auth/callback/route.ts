import { signJWT } from "@/lib/jwt";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: "https://hairtryon.shop/api/auth/callback",
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokens.access_token) {
    return new Response("OAuth failed: " + tokens.error, { status: 400 });
  }

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json() as { email: string; name: string; picture: string };

  // Sign JWT (7 days)
  const jwt = await signJWT(
    { email: user.email, name: user.name, picture: user.picture, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    process.env.JWT_SECRET!
  );

  // Set cookie and redirect home
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": `auth=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}
