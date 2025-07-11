import * as jose from 'jose';

// 创建错误页面HTML
function createErrorPage(title, message, details = null, returnUrl = '/login.html') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 考勤系统</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .error-container { max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .error-icon { font-size: 48px; color: #e74c3c; text-align: center; margin-bottom: 20px; }
    h1 { color: #e74c3c; text-align: center; margin-bottom: 20px; }
    .message { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; font-family: monospace; font-size: 14px; }
    .actions { text-align: center; margin-top: 30px; }
    .btn { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 0 10px; }
    .btn:hover { background: #2980b9; }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">⚠️</div>
    <h1>${title}</h1>
    <div class="message">${message}</div>
    ${details ? `<div class="details">${details}</div>` : ''}
    <div class="actions">
      <a href="${returnUrl}" class="btn">返回登录</a>
      <a href="/api/health" class="btn">系统状态</a>
    </div>
  </div>
</body>
</html>`;
}

// 记录详细的错误日志
function logError(context, error, additionalInfo = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: error.message || error,
    stack: error.stack,
    url: context.request?.url,
    userAgent: context.request?.headers.get('User-Agent'),
    ...additionalInfo
  };

  console.error('OAuth Callback Error:', JSON.stringify(logData, null, 2));
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // 处理OAuth提供商返回的错误
  if (error) {
    logError(context, new Error(`OAuth Provider Error: ${error}`), {
      error,
      errorDescription,
      state
    });

    const errorPage = createErrorPage(
      "OAuth 认证失败",
      `认证过程中发生错误：${errorDescription || error}`,
      `错误代码: ${error}\n状态: ${state || 'N/A'}`
    );

    return new Response(errorPage, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (!code) {
    logError(context, new Error("Authorization code missing"), { state });

    const errorPage = createErrorPage(
      "授权码缺失",
      "OAuth 认证过程中未收到授权码，请重试登录。",
      `状态: ${state || 'N/A'}\n请检查OAuth应用配置是否正确`
    );

    return new Response(errorPage, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
  
  // 获取cookies
  const cookieHeader = request.headers.get("Cookie") || "";
  console.log("收到的Cookie头:", cookieHeader);
  
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [name, ...value] = c.split("=");
      return [name, value.join("=")];
    })
  );
  
  console.log("解析的Cookies:", JSON.stringify(cookies));
  console.log("收到的状态:", state);
  console.log("Cookie中的状态:", cookies.oauth_state || cookies.gitee_oauth_state);
  
  // 判断是GitHub还是Gitee的回调
  if (cookies.gitee_oauth_state) {
    return handleGiteeCallback(context, code, state, cookies);
  } else {
    return handleGitHubCallback(context, code, state, cookies);
  }
}

async function handleGitHubCallback(context, code, state, cookies) {
  const { env, request } = context;

  try {
    // 验证状态 - 本地开发环境下临时禁用状态验证
    const reqUrl = new URL(request.url);
    const isLocalDev = reqUrl.hostname === "localhost" || reqUrl.hostname === "127.0.0.1";
    
    if (!isLocalDev && state !== cookies.oauth_state) {
      logError(context, new Error("OAuth state mismatch"), {
        expectedState: cookies.oauth_state,
        receivedState: state,
        provider: "github"
      });

      const errorPage = createErrorPage(
        "状态验证失败",
        "OAuth 状态验证失败，可能存在安全风险。请重新登录。",
        `期望状态: ${cookies.oauth_state || 'N/A'}\n接收状态: ${state || 'N/A'}`
      );

      return new Response(errorPage, {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 获取选择的回调地址
    const selectedRedirectUri = cookies.selected_redirect_uri || env.REDIRECT_URI?.split(",")[0];

    if (!selectedRedirectUri) {
      logError(context, new Error("No redirect URI configured"), {
        provider: "github",
        envRedirectUri: env.REDIRECT_URI
      });

      const errorPage = createErrorPage(
        "配置错误",
        "OAuth 回调地址未正确配置。",
        "请检查 REDIRECT_URI 环境变量配置"
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 使用授权码交换访问令牌
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: selectedRedirectUri
      })
    });

    if (!tokenResponse.ok) {
      logError(context, new Error(`GitHub token request failed: ${tokenResponse.status}`), {
        provider: "github",
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      });

      const errorPage = createErrorPage(
        "令牌获取失败",
        "无法从 GitHub 获取访问令牌。",
        `HTTP状态: ${tokenResponse.status}\n请检查OAuth应用配置`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logError(context, new Error("GitHub access token missing"), {
        provider: "github",
        tokenData: tokenData,
        error: tokenData.error,
        errorDescription: tokenData.error_description
      });

      const errorPage = createErrorPage(
        "访问令牌无效",
        "GitHub 返回的访问令牌无效。",
        `错误: ${tokenData.error || 'unknown'}\n描述: ${tokenData.error_description || 'N/A'}`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  
    // 获取用户信息
    console.log("尝试获取 GitHub 用户信息，使用令牌: " + tokenData.access_token.substring(0, 5) + "...");
    
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${tokenData.access_token}`,
        "User-Agent": "CloudflareWorker-KaoQin",
        "Accept": "application/vnd.github.v3+json"
      }
    });

    // 记录响应详情以便调试
    console.log("GitHub API Response:", {
      status: userResponse.status,
      statusText: userResponse.statusText,
      headers: Object.fromEntries([...userResponse.headers.entries()]),
      token: tokenData.access_token.substring(0, 5) + "..." // 只记录令牌的一部分，保护安全
    });

    if (!userResponse.ok) {
      // 尝试读取响应体以获取更多错误信息
      let responseText = "";
      try {
        responseText = await userResponse.text();
        console.log("GitHub API Error Response:", responseText);
      } catch (e) {
        console.log("无法读取错误响应:", e);
      }

      logError(context, new Error(`GitHub user info request failed: ${userResponse.status}`), {
        provider: "github",
        status: userResponse.status,
        statusText: userResponse.statusText,
        responseText
      });

      const errorPage = createErrorPage(
        "用户信息获取失败",
        "无法从 GitHub 获取用户信息。",
        `HTTP状态: ${userResponse.status}\n响应: ${responseText || '无法获取详细错误信息'}\n请检查访问令牌权限和客户端密钥`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const userData = await userResponse.json();

    if (!userData.id) {
      logError(context, new Error("Invalid GitHub user data"), {
        provider: "github",
        userData: userData
      });

      const errorPage = createErrorPage(
        "用户数据无效",
        "GitHub 返回的用户数据无效。",
        "请重试登录或联系管理员"
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 创建会话
    const sessionId = crypto.randomUUID();
    const session = {
      user: {
        ...userData,
        provider: "github"
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 一周后过期
    };

    // 使用KV存储会话
    await context.env.SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60 // 一周有效期
    });

    // 获取登录时保存的最终重定向地址
    const returnTo = cookies.return_to || "/";

    // 设置会话cookie并重定向
    const headers = new Headers({
      "Location": returnTo
    });

    // 检测是否为本地环境
    const url = new URL(request.url);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const secureCookie = isLocalhost ? "" : "Secure; ";

    headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; ${secureCookie}HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);

    return new Response("", {
      status: 302,
      headers
    });

  } catch (error) {
    logError(context, error, {
      provider: "github",
      code: code,
      state: state
    });

    const errorPage = createErrorPage(
      "GitHub 登录失败",
      "处理 GitHub 登录时发生未知错误。",
      `错误信息: ${error.message}\n请重试登录或联系管理员`
    );

    return new Response(errorPage, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function handleGiteeCallback(context, code, state, cookies) {
  const { env, request } = context;

  try {
    // 验证状态 - 本地开发环境下临时禁用状态验证
    const reqUrl = new URL(request.url);
    const isLocalDev = reqUrl.hostname === "localhost" || reqUrl.hostname === "127.0.0.1";
    
    if (!isLocalDev && state !== cookies.gitee_oauth_state) {
      logError(context, new Error("Gitee OAuth state mismatch"), {
        expectedState: cookies.gitee_oauth_state,
        receivedState: state,
        provider: "gitee"
      });

      const errorPage = createErrorPage(
        "状态验证失败",
        "Gitee OAuth 状态验证失败，可能存在安全风险。请重新登录。",
        `期望状态: ${cookies.gitee_oauth_state || 'N/A'}\n接收状态: ${state || 'N/A'}`
      );

      return new Response(errorPage, {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 获取正确的回调地址
    const redirectUris = env.GITEE_REDIRECT_URI.split(",").map(uri => uri.trim());
    const currentHost = reqUrl.hostname;
    const isLocalhost = currentHost === "localhost" || currentHost === "127.0.0.1";

    let redirectUri;
    if (isLocalhost) {
      // 本地环境，选择 localhost 回调地址
      redirectUri = redirectUris.find(uri => uri.includes("localhost")) || redirectUris[0];
    } else {
      // 生产环境，选择非 localhost 的回调地址
      redirectUri = redirectUris.find(uri => !uri.includes("localhost")) || redirectUris[0];
    }

    // 使用授权码交换访问令牌
    const tokenResponse = await fetch(`https://gitee.com/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: env.GITEE_CLIENT_ID,
        client_secret: env.GITEE_CLIENT_SECRET,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      logError(context, new Error(`Gitee token request failed: ${tokenResponse.status}`), {
        provider: "gitee",
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      });

      const errorPage = createErrorPage(
        "令牌获取失败",
        "无法从 Gitee 获取访问令牌。",
        `HTTP状态: ${tokenResponse.status}\n请检查OAuth应用配置`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      logError(context, new Error("Gitee access token missing"), {
        provider: "gitee",
        tokenData: tokenData,
        error: tokenData.error,
        errorDescription: tokenData.error_description
      });

      const errorPage = createErrorPage(
        "访问令牌无效",
        "Gitee 返回的访问令牌无效。",
        `错误: ${tokenData.error || 'unknown'}\n描述: ${tokenData.error_description || 'N/A'}`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  
    // 获取用户信息
    const userResponse = await fetch(`https://gitee.com/api/v5/user?access_token=${tokenData.access_token}`, {
      method: "GET"
    });

    if (!userResponse.ok) {
      logError(context, new Error(`Gitee user info request failed: ${userResponse.status}`), {
        provider: "gitee",
        status: userResponse.status,
        statusText: userResponse.statusText
      });

      const errorPage = createErrorPage(
        "用户信息获取失败",
        "无法从 Gitee 获取用户信息。",
        `HTTP状态: ${userResponse.status}\n请检查访问令牌权限`
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const userData = await userResponse.json();

    if (!userData.id) {
      logError(context, new Error("Invalid Gitee user data"), {
        provider: "gitee",
        userData: userData
      });

      const errorPage = createErrorPage(
        "用户数据无效",
        "Gitee 返回的用户数据无效。",
        "请重试登录或联系管理员"
      );

      return new Response(errorPage, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 创建会话
    const sessionId = crypto.randomUUID();
    const session = {
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        provider: "gitee"
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 一周后过期
    };

    // 使用KV存储会话
    await context.env.SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60 // 一周有效期
    });

    // 获取登录时保存的最终重定向地址
    const returnTo = cookies.gitee_return_to || "/";

    // 设置会话cookie并重定向
    const headers = new Headers({
      "Location": returnTo
    });

    // 检测是否为本地环境
    const url = new URL(request.url);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const secureCookie = isLocalhost ? "" : "Secure; ";

    headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; ${secureCookie}HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);

    return new Response("", {
      status: 302,
      headers
    });

  } catch (error) {
    logError(context, error, {
      provider: "gitee",
      code: code,
      state: state
    });

    const errorPage = createErrorPage(
      "Gitee 登录失败",
      "处理 Gitee 登录时发生未知错误。",
      `错误信息: ${error.message}\n请重试登录或联系管理员`
    );

    return new Response(errorPage, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}