export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理静态文件和API请求的路由
  if (path.startsWith("/api/") || path === "/login" || path === "/gitee-login" || path === "/oauth/callback") {
    // 这些路径由特定的函数处理
    return await next();
  }
  
  // 处理根路径，检查用户是否已登录
  if (path === "/" || path === "") {
    // 检查用户是否已登录
    const session = await getUserSession(context);
    if (!session) {
      // 未登录，重定向到登录页面
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/login.html"
        }
      });
    }
    // 已登录，继续访问主页
    return await next();
  }
  
  // 对于登录页面，直接提供服务
  if (path === "/login.html") {
    return await next();
  }
  
  // 对于其他页面，检查用户是否已登录
  const session = await getUserSession(context);
  if (!session && !path.startsWith("/public/") && !path.endsWith(".css") && !path.endsWith(".js")) {
    // 未登录且不是公共资源，重定向到登录页面
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/login.html"
      }
    });
  }
  
  // 继续处理请求
  return await next();
}

// 获取用户会话
async function getUserSession(context) {
  const { request, env } = context;
  
  // 从cookie中获取会话ID
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [name, ...value] = c.split("=");
      return [name, value.join("=")];
    })
  );
  
  const sessionId = cookies.session_id;
  if (!sessionId) return null;
  
  // 从KV存储中获取会话
  const sessionData = await env.SESSIONS.get(sessionId);
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    
    // 检查会话是否过期
    if (session.expiresAt < Date.now()) {
      await env.SESSIONS.delete(sessionId);
      return null;
    }
    
    return session;
  } catch (e) {
    return null;
  }
}