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
  
  // 支持多个回调地址，以逗号分隔
  const redirectUris = env.GITEE_REDIRECT_URI.split(",").map(uri => uri.trim());

  // 根据当前访问的域名选择对应的回调地址
  const currentHost = url.hostname;
  const isLocalhost = currentHost === "localhost" || currentHost === "127.0.0.1";

  let redirectUri;
  if (isLocalhost) {
    // 本地环境，选择 localhost 回调地址
    redirectUri = redirectUris.find(uri => uri.includes("localhost")) || redirectUris[0];
  } else {
    // 生产环境，选择非 localhost 的回调地址
    redirectUri = redirectUris.find(uri => !uri.includes("localhost")) || redirectUris[0];
  }

  console.log("Gitee OAuth配置:", {
    clientId: env.GITEE_CLIENT_ID ? "已设置" : "未设置",
    redirectUri: redirectUri,
    currentHost: currentHost,
    isLocalhost: isLocalhost
  });

  const authUrl = `https://gitee.com/oauth/authorize?client_id=${env.GITEE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  
  // 设置状态cookie
  const headers = new Headers({
    "Location": authUrl
  });
  
  // 使用之前已经声明的 isLocalhost 变量
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