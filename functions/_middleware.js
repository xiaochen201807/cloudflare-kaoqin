import { renderTemplateFile } from './utils/template-renderer.js';

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  console.log("中间件处理请求:", {
    path: path,
    url: url.toString(),
    params: Object.fromEntries(url.searchParams)
  });

  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // 静态资源直接通过（CSS、JS、图片等，但不包括HTML文件）
  if (path.endsWith(".css") || path.endsWith(".js") ||
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
  
  // 处理登录路径 - 不使用 .html 扩展名
  if (path === "/login") {
    // 检查是否有provider参数
    const provider = url.searchParams.get("provider");
    console.log('登录请求 ' + path + '，provider=' + provider);

    if (!provider) {
      // 如果没有provider参数，直接返回登录页面的HTML内容
      console.log("没有provider参数，返回登录页面HTML内容");

      try {
        // 使用模板渲染登录页面
        const loginHTML = await renderTemplateFile('login.html', {}, context);

        return new Response(loginHTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      } catch (error) {
        console.error("渲染登录页面失败:", error);

        // 如果模板渲染失败，返回简单的错误页面
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>登录页面加载失败</title></head>
          <body>
            <h1>登录页面加载失败</h1>
            <p>错误: ${error.message}</p>
            <a href="/login">重试</a>
          </body>
          </html>
        `, {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }
    }

    // 有provider参数，继续处理OAuth流程
    console.log(`有provider参数(${provider})，继续处理OAuth流程`);
    return await next();
  }

  // 处理 gitee-login 路径
  if (path === "/gitee-login") {
    console.log("处理 gitee-login 请求");
    return await next();
  }

  // 处理主页面
  if (path === "/index") {
    // 检查用户是否已登录
    const session = await getUserSession(context);
    if (!session) {
      // 未登录，重定向到登录页面
      console.log("访问主页面，未登录，重定向到登录页面");
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/login"
        }
      });
    }
    console.log("访问主页面，已登录，返回页面内容");

    try {
      // 使用模板渲染主页面
      const indexHTML = await renderTemplateFile('index.html', {}, context);
      return new Response(indexHTML, {
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    } catch (error) {
      console.error("渲染主页面失败:", error);

      // 如果模板渲染失败，返回简单的错误页面
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>主页面加载失败</title></head>
        <body>
          <h1>主页面加载失败</h1>
          <p>错误: ${error.message}</p>
          <a href="/login">返回登录</a>
        </body>
        </html>
      `, {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }
  }
  
  // 处理根路径，检查用户是否已登录
  if (path === "/" || path === "") {
    // 检查用户是否已登录
    const session = await getUserSession(context);
    if (!session) {
      // 未登录，重定向到登录页面
      console.log("访问根路径，未登录，重定向到登录页面");
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/login"
        }
      });
    }
    // 已登录，重定向到主页面
    console.log("访问根路径，已登录，重定向到主页面");
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/index"
      }
    });
  }
  
  // 对于其他页面，检查用户是否已登录
  const session = await getUserSession(context);
  if (!session && !path.startsWith("/public/")) {
    // 未登录且不是公共资源，重定向到登录页面
    console.log(`访问其他页面(${path})，未登录，重定向到登录页面`);
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/login"
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