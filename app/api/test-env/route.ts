import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: Request, context: any) {
  try {
    const methods = [];
    
    // Method 1: context parameter
    const contextEnv = context?.env;
    methods.push({
      method: "context.env",
      hasGoogleClientId: !!contextEnv?.GOOGLE_CLIENT_ID,
      keys: contextEnv ? Object.keys(contextEnv) : []
    });
    
    // Method 2: getRequestContext
    try {
      const { env } = getRequestContext();
      methods.push({
        method: "getRequestContext()",
        hasGoogleClientId: !!(env as any).GOOGLE_CLIENT_ID,
        keys: Object.keys(env)
      });
    } catch (e) {
      methods.push({
        method: "getRequestContext()",
        error: String(e)
      });
    }
    
    // Method 3: process.env
    methods.push({
      method: "process.env",
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      keys: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
    });
    
    return Response.json({ methods }, { status: 200 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
