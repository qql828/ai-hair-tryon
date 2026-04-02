import { getRequestContext } from "@cloudflare/next-on-pages";
import { signJWT } from "@/lib/jwt";
import { upsertUser, handleReferral } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: Request) {
  const { env } = getRequestContext();
  const e = env as any;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const ref = url.searchParams.get("state"); // 邀请人ID（通过state参数传递）

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET || !e.JWT_SECRET) {
    return new Response("OAuth credentials not configured", { status: 500 });
  }

  // 用 code 换 access_token
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

  // 获取用户信息
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userRes.json() as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  // upsert 用户到 D1（新用户自动创建并赠3次）
  const db: D1Database = e.DB;
  const user = await upsertUser(db, {
    id: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
  });

  // 处理邀请关系（如果有 ref 参数且不是自己邀请自己）
  if (ref && ref !== googleUser.id) {
    await handleReferral(db, ref, googleUser.id);
  }

  // 签发 JWT（带 plan 和 credits）
  const jwt = await signJWT(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      plan: user.plan,
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
