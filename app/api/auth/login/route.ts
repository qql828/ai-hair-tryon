import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: Request, context: any) {
  try {
    // Try to get env from context parameter first
    let clientId = context?.env?.GOOGLE_CLIENT_ID;
    
    // Fallback to getRequestContext
    if (!clientId) {
      const { env } = getRequestContext();
      clientId = (env as Record<string, string>).GOOGLE_CLIENT_ID;
    }

    if (!clientId) {
      return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: "https://hairtryon.shop/api/auth/callback",
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
    });

    return Response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    );
  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }
}
