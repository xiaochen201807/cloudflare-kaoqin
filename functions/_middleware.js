export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log("中间件处理请求:", {
    path: path,
    url: url.toString(),
    params: Object.fromEntries(url.searchParams)
  });
  
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
    console.log(`登录请求 ${path}，provider=${provider}`);

    if (!provider) {
      // 如果没有provider参数，直接返回登录页面的HTML内容
      console.log("没有provider参数，返回登录页面HTML内容");

      // 直接返回登录页面的HTML内容
      const loginHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 考勤系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* 动态背景 */
        .animated-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-size: 400% 400%;
            animation: gradientShift 8s ease infinite;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* 浮动几何图形 */
        .floating-shapes {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        }

        .shape {
            position: absolute;
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
            top: 20%;
            left: 10%;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            animation-delay: 0s;
            animation-duration: 8s;
        }

        .shape:nth-child(2) {
            top: 60%;
            left: 80%;
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            animation-delay: 2s;
            animation-duration: 10s;
        }

        .shape:nth-child(3) {
            top: 80%;
            left: 20%;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation-delay: 4s;
            animation-duration: 12s;
        }

        .shape:nth-child(4) {
            top: 10%;
            left: 70%;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(45deg);
            animation-delay: 1s;
            animation-duration: 9s;
        }

        .shape:nth-child(5) {
            top: 40%;
            left: 5%;
            width: 70px;
            height: 70px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 20px;
            animation-delay: 3s;
            animation-duration: 11s;
        }

        .shape:nth-child(6) {
            top: 70%;
            left: 60%;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.18);
            border-radius: 50%;
            animation-delay: 5s;
            animation-duration: 7s;
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.1;
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.3;
            }
        }

        .login-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 50px 40px;
            box-shadow:
                0 25px 50px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(255, 255, 255, 0.2);
            text-align: center;
            max-width: 420px;
            width: 90%;
            position: relative;
            animation: containerFadeIn 1s ease-out;
            transform-style: preserve-3d;
        }

        .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            border-radius: 25px;
            z-index: -1;
        }

        @keyframes containerFadeIn {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .logo {
            font-size: 3em;
            margin-bottom: 15px;
            color: #667eea;
            animation: logoFloat 3s ease-in-out infinite, logoFadeIn 1s ease-out;
            text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }

        @keyframes logoFloat {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
            }
            50% {
                transform: translateY(-10px) rotate(5deg);
            }
        }

        @keyframes logoFadeIn {
            0% {
                opacity: 0;
                transform: scale(0.5) rotate(-180deg);
            }
            100% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
            }
        }

        h1 {
            color: #333;
            margin-bottom: 35px;
            font-weight: 300;
            font-size: 1.8em;
            animation: titleSlideUp 0.8s ease-out 0.2s both;
            background: linear-gradient(135deg, #333 0%, #667eea 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        @keyframes titleSlideUp {
            0% {
                opacity: 0;
                transform: translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .login-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .login-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px 24px;
            border: none;
            border-radius: 15px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            animation: buttonSlideIn 0.6s ease-out forwards;
            opacity: 0;
            transform: translateX(-30px);
        }

        .login-btn:nth-child(1) {
            animation-delay: 0.3s;
        }

        .login-btn:nth-child(2) {
            animation-delay: 0.5s;
        }

        .login-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .login-btn:hover::before {
            left: 100%;
        }

        @keyframes buttonSlideIn {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .github-btn {
            background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%);
            color: white;
            box-shadow: 0 8px 25px rgba(36, 41, 46, 0.3);
        }

        .github-btn:hover {
            background: linear-gradient(135deg, #1a1e22 0%, #0d1117 100%);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 35px rgba(36, 41, 46, 0.4);
        }

        .gitee-btn {
            background: linear-gradient(135deg, #c71d23 0%, #a01419 100%);
            color: white;
            box-shadow: 0 8px 25px rgba(199, 29, 35, 0.3);
        }

        .gitee-btn:hover {
            background: linear-gradient(135deg, #a01419 0%, #8b1116 100%);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 15px 35px rgba(199, 29, 35, 0.4);
        }

        .btn-icon {
            margin-right: 12px;
            width: 20px;
            height: 20px;
            fill: currentColor;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <!-- 动态背景 -->
    <div class="animated-bg"></div>

    <!-- 浮动几何图形 -->
    <div class="floating-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>

    <div class="login-container">
        <div class="logo">📋</div>
        <h1>考勤系统</h1>
        <div class="login-buttons">
            <a href="/login?provider=github" class="login-btn github-btn">
                <svg class="btn-icon" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                使用 GitHub 登录
            </a>
            <a href="/login?provider=gitee" class="login-btn gitee-btn">
                <svg class="btn-icon" viewBox="0 0 24 24">
                    <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v.593c0 .982.796 1.778 1.778 1.778h4.63c.982 0 1.778.796 1.778 1.778v1.482a.593.593 0 0 1-.593.592h-4.63c-.982 0-1.778-.796-1.778-1.778v-.593a.593.593 0 0 0-.592-.593H6.408a.593.593 0 0 1-.593-.592v-1.482c0-.327.266-.593.593-.593h1.185c.327 0 .593-.265.593-.592v-.593c0-1.963 1.593-3.556 3.556-3.556h7.852c.327 0 .593.265.593.592z"/>
                </svg>
                使用 Gitee 登录
            </a>
        </div>
    </div>
</body>
</html>`;

      return new Response(loginHTML, {
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
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

    // 直接返回主页面的HTML内容
    const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>考勤系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 2em;
            margin-bottom: 10px;
        }

        h1 {
            color: #333;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .user-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .checkin-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        label {
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }

        input, button {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .checkin-btn {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .checkin-btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .checkin-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .location-info {
            background: #e8f4fd;
            padding: 10px;
            border-radius: 8px;
            font-size: 14px;
            color: #0066cc;
        }

        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 20px;
        }

        .logout-btn:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📋</div>
            <h1>考勤系统</h1>
        </div>

        <div class="user-info">
            <p><strong>用户:</strong> <span id="username">加载中...</span></p>
            <p><strong>手机:</strong> <span id="phone">加载中...</span></p>
        </div>

        <form class="checkin-form" id="checkinForm">
            <div class="form-group">
                <label for="realName">真实姓名:</label>
                <input type="text" id="realName" name="realName" required>
            </div>

            <div class="location-info" id="locationInfo">
                正在获取位置信息...
            </div>

            <button type="submit" class="checkin-btn" id="checkinBtn" disabled>
                正在获取位置...
            </button>
        </form>

        <button class="logout-btn" onclick="logout()">退出登录</button>
    </div>

    <script>
        let currentLocation = null;

        // 页面加载时获取用户信息和位置
        window.addEventListener('DOMContentLoaded', function() {
            loadUserInfo();
            getCurrentLocation();
        });

        // 获取用户信息
        async function loadUserInfo() {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const user = await response.json();
                    document.getElementById('username').textContent = user.username || '未知';
                    document.getElementById('phone').textContent = user.phone || '未知';
                    document.getElementById('realName').value = user.realName || user.username || '';
                } else {
                    console.error('获取用户信息失败');
                }
            } catch (error) {
                console.error('获取用户信息出错:', error);
            }
        }

        // 获取当前位置
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        currentLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };

                        // 使用高德地图API获取地址信息
                        getAddressFromCoords(currentLocation.latitude, currentLocation.longitude);
                    },
                    function(error) {
                        console.error('获取位置失败:', error);
                        document.getElementById('locationInfo').textContent = '获取位置失败，请检查位置权限';
                        document.getElementById('checkinBtn').textContent = '位置获取失败';
                    }
                );
            } else {
                document.getElementById('locationInfo').textContent = '浏览器不支持位置服务';
                document.getElementById('checkinBtn').textContent = '不支持位置服务';
            }
        }

        // 使用高德地图API获取地址
        async function getAddressFromCoords(lat, lng) {
            try {
                // 这里需要配置高德地图API密钥
                const response = await fetch(\`/api/geocode?lat=\${lat}&lng=\${lng}\`);
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('locationInfo').textContent =
                        \`位置: \${data.address || '未知地址'}\`;
                } else {
                    document.getElementById('locationInfo').textContent =
                        \`位置: \${lat.toFixed(6)}, \${lng.toFixed(6)}\`;
                }

                document.getElementById('checkinBtn').disabled = false;
                document.getElementById('checkinBtn').textContent = '签到';
            } catch (error) {
                console.error('获取地址失败:', error);
                document.getElementById('locationInfo').textContent =
                    \`位置: \${lat.toFixed(6)}, \${lng.toFixed(6)}\`;
                document.getElementById('checkinBtn').disabled = false;
                document.getElementById('checkinBtn').textContent = '签到';
            }
        }

        // 处理签到表单提交
        document.getElementById('checkinForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!currentLocation) {
                alert('位置信息不可用，无法签到');
                return;
            }

            const realName = document.getElementById('realName').value.trim();
            if (!realName) {
                alert('请输入真实姓名');
                return;
            }

            const checkinBtn = document.getElementById('checkinBtn');
            checkinBtn.disabled = true;
            checkinBtn.textContent = '签到中...';

            try {
                const response = await fetch('/api/checkin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        realName: realName,
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert('签到成功！');
                } else {
                    const error = await response.json();
                    alert('签到失败: ' + (error.message || '未知错误'));
                }
            } catch (error) {
                console.error('签到出错:', error);
                alert('签到出错，请重试');
            } finally {
                checkinBtn.disabled = false;
                checkinBtn.textContent = '签到';
            }
        });

        // 退出登录
        async function logout() {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    alert('退出登录失败');
                }
            } catch (error) {
                console.error('退出登录出错:', error);
                alert('退出登录出错');
            }
        }
    </script>
</body>
</html>`;

    return new Response(indexHTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
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