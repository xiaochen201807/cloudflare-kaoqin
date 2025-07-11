export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const state = crypto.randomUUID();
  
  // 获取请求的来源URL
  const origin = url.searchParams.get("origin") || "";
  
  // 支持多个回调地址，以逗号分隔
  const redirectUris = env.REDIRECT_URI.split(",").map(uri => uri.trim());
  let redirectUri = redirectUris[0]; // 默认使用第一个
  
  if (origin && redirectUris.length > 1) {
    // 查找包含origin的回调地址
    const matchedUri = redirectUris.find(uri => uri.includes(origin));
    if (matchedUri) {
      redirectUri = matchedUri;
    }
  }
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email`;
  
  // 设置状态cookie
  const headers = new Headers({
    "Location": authUrl
  });
  
  // 设置cookie
  headers.append("Set-Cookie", `oauth_state=${state}; Path=/; Secure; HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `return_to=${returnTo}; Path=/; Secure; HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `selected_redirect_uri=${redirectUri}; Path=/; Secure; HttpOnly; Max-Age=600; SameSite=Lax`);
  
  return new Response("", {
    status: 302,
    headers
  });
}