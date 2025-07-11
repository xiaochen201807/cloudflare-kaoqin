export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const state = crypto.randomUUID();
  
  console.log("GitHub登录请求:", {
    url: url.toString(),
    returnTo: returnTo,
    state: state
  });
  
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
  
  console.log("GitHub OAuth配置:", {
    clientId: env.GITHUB_CLIENT_ID ? "已设置" : "未设置",
    redirectUri: redirectUri
  });
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user%20user:email%20read:user`;
  
  // 设置状态cookie
  const headers = new Headers({
    "Location": authUrl
  });
  
  // 设置cookie - 本地开发环境移除Secure标志
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const secureCookie = isLocalhost ? "" : "Secure; ";
  
  headers.append("Set-Cookie", `oauth_state=${state}; Path=/; ${secureCookie}HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `return_to=${returnTo}; Path=/; ${secureCookie}HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `selected_redirect_uri=${redirectUri}; Path=/; ${secureCookie}HttpOnly; Max-Age=600; SameSite=Lax`);
  
  console.log("重定向到GitHub OAuth授权页面:", authUrl);
  
  return new Response("", {
    status: 302,
    headers
  });
}