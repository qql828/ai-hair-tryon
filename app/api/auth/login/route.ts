import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: Request) {
  const { env } = getRequestContext();
  const clientId = (env as any).GOOGLE_CLIENT_ID;

  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  }

  // 支持邀请码通过 state 传递到 callback
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") || "";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "https://hairtryon.shop/api/auth/callback",
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    ...(ref ? { state: ref } : {}),
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
