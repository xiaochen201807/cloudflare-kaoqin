export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const state = crypto.randomUUID();
  
  // Gitee只支持单个回调地址
  const authUrl = `https://gitee.com/oauth/authorize?client_id=${env.GITEE_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITEE_REDIRECT_URI)}&response_type=code&state=${state}`;
  
  // 设置状态cookie
  const headers = new Headers({
    "Location": authUrl
  });
  
  // 设置cookie
  headers.append("Set-Cookie", `gitee_oauth_state=${state}; Path=/; Secure; HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `gitee_return_to=${returnTo}; Path=/; Secure; HttpOnly; Max-Age=600; SameSite=Lax`);
  
  return new Response("", {
    status: 302,
    headers
  });
}