export const runtime = "edge";

export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": "auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
