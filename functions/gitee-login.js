export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const state = crypto.randomUUID();
  
  console.log("Gitee登录请求:", {
    url: url.toString(),
    returnTo: returnTo,
    state: state
  });
  
  console.log("Gitee OAuth配置:", {
    clientId: env.GITEE_CLIENT_ID ? "已设置" : "未设置",
    redirectUri: env.GITEE_REDIRECT_URI
  });
  
  // Gitee只支持单个回调地址
  const authUrl = `https://gitee.com/oauth/authorize?client_id=${env.GITEE_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITEE_REDIRECT_URI)}&response_type=code&state=${state}`;
  
  // 设置状态cookie
  const headers = new Headers({
    "Location": authUrl
  });
  
  // 检测是否为本地环境
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const secureCookie = isLocalhost ? "" : "Secure; ";
  
  // 设置cookie
  headers.append("Set-Cookie", `gitee_oauth_state=${state}; Path=/; ${secureCookie}HttpOnly; Max-Age=600; SameSite=Lax`);
  headers.append("Set-Cookie", `gitee_return_to=${returnTo}; Path=/; ${secureCookie}HttpOnly; Max-Age=600; SameSite=Lax`);
  
  console.log("重定向到Gitee OAuth授权页面:", authUrl);
  
  return new Response("", {
    status: 302,
    headers
  });
}