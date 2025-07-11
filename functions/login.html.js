export async function onRequest(context) {
  const { request, env } = context;
  
  console.log("处理登录选择页面请求");
  
  // 读取登录页面HTML
  const loginHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>考勤系统 - 登录</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      background-image: linear-gradient(135deg, #1c3d5a, #3a6186);
    }
    .login-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .login-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }
    .login-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .github-login {
      background-color: #24292e;
      color: white;
    }
    .github-login:hover {
      background-color: #1b1f23;
    }
    .gitee-login {
      background-color: #c71d23;
      color: white;
    }
    .gitee-login:hover {
      background-color: #a01a1f;
    }
    .login-button img {
      margin-right: 0.5rem;
      width: 24px;
      height: 24px;
    }
    .error-message {
      color: #e74c3c;
      margin-top: 1rem;
      padding: 0.5rem;
      background-color: #fdf2f2;
      border-radius: 4px;
      display: none;
    }
    .error-message.show {
      display: block;
    }
    .system-title {
      color: #333;
      font-size: 2rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid #3a6186;
      padding-bottom: 0.5rem;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1 class="system-title">考勤系统</h1>
    <p>欢迎使用考勤系统，此系统可帮助您轻松记录和管理考勤信息。请选择以下方式登录以继续操作。</p>
    <div id="error-message" class="error-message"></div>
    <div class="login-buttons">
      <a href="/login?provider=github" class="login-button github-login">
        <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo">
        使用 GitHub 账号登录
      </a>
      <a href="/gitee-login?provider=gitee" class="login-button gitee-login">
        <img src="https://gitee.com/static/images/logo-black.svg" alt="Gitee Logo">
        使用 Gitee 账号登录
      </a>
    </div>
    <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
      <p>提示：本地开发环境下，请确保 GitHub 或 Gitee OAuth 应用已正确配置</p>
      <p>本地回调 URL: <code>http://localhost:8788/oauth/callback</code></p>
    </div>
  </div>

  <script>
    // 检查URL参数中是否有错误信息
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      const errorMessage = document.getElementById('error-message');
      errorMessage.textContent = decodeURIComponent(error);
      errorMessage.classList.add('show');
    }
  </script>
</body>
</html>`;
  
  // 返回登录页面
  return new Response(loginHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
} 