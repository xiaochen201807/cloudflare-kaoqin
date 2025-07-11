export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log("中间件处理请求:", {
    path: path,
    url: url.toString(),
    params: Object.fromEntries(url.searchParams)
  });
  
  // 静态资源直接通过
  if (path.endsWith(".html") || path.endsWith(".css") || path.endsWith(".js") || 
      path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".svg") || 
      path.endsWith(".ico")) {
    console.log("静态资源请求，直接通过");
    return await next();
  }
  
  // 处理API请求和OAuth回调的路由
  if (path.startsWith("/api/") || path === "/oauth/callback") {
    console.log("API或OAuth回调请求，直接通过");
    return await next();
  }
  
  // 处理登录路径
  if (path === "/login" || path === "/gitee-login") {
    // 检查是否有provider参数
    const provider = url.searchParams.get("provider");
    console.log(`登录请求 ${path}，provider=${provider}`);
    
    if (!provider) {
      // 如果没有provider参数，重定向到登录选择页面
      console.log("没有provider参数，重定向到登录选择页面");
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/login.html"
        }
      });
    }
    
    // 有provider参数，继续处理OAuth流程
    console.log(`有provider参数(${provider})，继续处理OAuth流程`);
    return await next();
  }
  
  // 处理根路径，检查用户是否已登录
  if (path === "/" || path === "") {
    // 检查用户是否已登录
    const session = await getUserSession(context);
    if (!session) {
      // 未登录，重定向到登录选择页面
      console.log("访问根路径，未登录，重定向到登录选择页面");
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/login.html"
        }
      });
    }
    // 已登录，重定向到主页面
    console.log("访问根路径，已登录，重定向到主页面");
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/index.html"
      }
    });
  }
  
  // 对于其他页面，检查用户是否已登录
  const session = await getUserSession(context);
  if (!session && !path.startsWith("/public/")) {
    // 未登录且不是公共资源，重定向到登录选择页面
    console.log(`访问其他页面(${path})，未登录，重定向到登录选择页面`);
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/login.html"
      }
    });
  }
  
  // 继续处理请求
  console.log(`其他请求(${path})，继续处理`);
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