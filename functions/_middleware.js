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

        .btn-icon-text {
            margin-right: 12px;
            width: 20px;
            height: 20px;
            background: currentColor;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #c53030;
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
                <span style="margin-right: 12px; font-weight: bold; font-size: 16px;">G</span>
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

    // 直接返回主页面的HTML内容 - 带有高德地图的考勤页面
    const indexHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>考勤打卡系统</title>
    <script type="text/javascript" src="https://webapi.amap.com/maps?v=1.4.15&key=79a85def4762b3e9024547ee3b8b0e38&plugin=AMap.Geolocation"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            height: 100vh;
            overflow: hidden;
        }

        .main-container {
            display: flex;
            height: 100vh;
        }

        /* 地图容器 */
        .map-container {
            flex: 1;
            position: relative;
        }

        #mapContainer {
            width: 100%;
            height: 100%;
        }

        /* 右侧打卡面板 */
        .checkin-panel {
            width: 320px;
            background: white;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            z-index: 1000;
        }

        /* 打卡面板头部 */
        .panel-header {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }

        .panel-header h1 {
            font-size: 1.5em;
            margin-bottom: 5px;
        }

        .panel-header .user-name {
            font-size: 0.9em;
            opacity: 0.9;
        }

        /* 搜索区域 */
        .search-section {
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }

        .search-container {
            position: relative;
            margin-bottom: 10px;
        }

        .search-input {
            width: 100%;
            padding: 12px 40px 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .search-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .search-btn:hover {
            background: #5a67d8;
        }

        .coord-input-container {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .coord-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 12px;
        }

        .coord-btn {
            padding: 8px 12px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .coord-btn:hover {
            background: #218838;
        }

        /* 打卡面板内容 */
        .panel-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .location-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #28a745;
        }

        .location-info h4 {
            color: #28a745;
            margin-bottom: 10px;
            font-size: 1em;
        }

        .location-info p {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
            line-height: 1.4;
        }

        .coordinates {
            font-family: monospace;
            font-size: 0.8em;
            color: #999;
        }

        /* 历史记录和收藏 */
        .history-section {
            margin-top: 15px;
        }

        .section-title {
            font-size: 0.9em;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .clear-btn {
            background: none;
            border: none;
            color: #dc3545;
            cursor: pointer;
            font-size: 0.8em;
            padding: 2px 6px;
            border-radius: 3px;
        }

        .clear-btn:hover {
            background: #f8d7da;
        }

        .history-list, .favorite-list {
            max-height: 120px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            background: white;
        }

        .history-item, .favorite-item {
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.85em;
        }

        .history-item:hover, .favorite-item:hover {
            background: #f8f9fa;
        }

        .history-item:last-child, .favorite-item:last-child {
            border-bottom: none;
        }

        .item-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-actions {
            display: flex;
            gap: 5px;
        }

        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 0.8em;
        }

        .favorite-btn {
            color: #ffc107;
        }

        .favorite-btn:hover {
            background: #fff3cd;
        }

        .remove-btn {
            color: #dc3545;
        }

        .remove-btn:hover {
            background: #f8d7da;
        }

        .goto-btn {
            color: #007bff;
        }

        .goto-btn:hover {
            background: #d1ecf1;
        }

        .name-input {
            margin-bottom: 20px;
        }

        .name-input label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }

        .name-input input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .name-input input:focus {
            outline: none;
            border-color: #667eea;
        }

        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 10px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(40, 167, 69, 0.3);
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #5a6268;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .status-message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 0.9em;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        /* 面板底部 */
        .panel-footer {
            padding: 20px;
            border-top: 1px solid #e0e0e0;
        }

        .logout-btn {
            width: 100%;
            padding: 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }

        .logout-btn:hover {
            background: #c82333;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }

            .checkin-panel {
                width: 100%;
                height: 50vh;
                order: -1;
            }

            .map-container {
                height: 50vh;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- 地图容器 -->
        <div class="map-container">
            <div id="mapContainer"></div>
        </div>

        <!-- 右侧打卡面板 -->
        <div class="checkin-panel">
            <!-- 面板头部 -->
            <div class="panel-header">
                <h1>📍 考勤打卡</h1>
                <div class="user-name" id="userDisplayName">加载中...</div>
            </div>

            <!-- 搜索区域 -->
            <div class="search-section">
                <div class="search-container">
                    <input type="text" id="searchInput" class="search-input" placeholder="搜索地点..." />
                    <button class="search-btn" onclick="searchLocation()">🔍</button>
                </div>

                <div class="coord-input-container">
                    <input type="number" id="latInput" class="coord-input" placeholder="纬度" step="any" />
                    <input type="number" id="lngInput" class="coord-input" placeholder="经度" step="any" />
                    <button class="coord-btn" onclick="gotoCoordinates()">定位</button>
                </div>

                <!-- 搜索历史 -->
                <div class="history-section">
                    <div class="section-title">
                        🕒 搜索历史
                        <button class="clear-btn" onclick="clearHistory()">清空</button>
                    </div>
                    <div class="history-list" id="historyList">
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无搜索历史</div>
                    </div>
                </div>

                <!-- 收藏地点 -->
                <div class="history-section">
                    <div class="section-title">
                        ⭐ 收藏地点
                        <button class="clear-btn" onclick="clearFavorites()">清空</button>
                    </div>
                    <div class="favorite-list" id="favoriteList">
                        <div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无收藏地点</div>
                    </div>
                </div>
            </div>

            <!-- 面板内容 -->
            <div class="panel-content">
                <div id="statusMessage"></div>

                <div class="location-info" id="locationInfo">
                    <h4>📍 当前位置</h4>
                    <p id="locationAddress">正在获取位置信息...</p>
                    <p class="coordinates" id="locationCoords">坐标: --</p>
                    <button class="action-btn favorite-btn" id="favoriteCurrentBtn" onclick="favoriteCurrentLocation()" title="收藏当前位置">
                        ⭐ 收藏
                    </button>
                </div>

                <div class="name-input">
                    <label for="realName">真实姓名:</label>
                    <input type="text" id="realName" name="realName" placeholder="请输入您的真实姓名" required>
                </div>

                <button class="btn btn-secondary" id="refreshLocationBtn" onclick="refreshLocation()">
                    🔄 刷新位置
                </button>

                <button class="btn btn-primary" id="submitLocationBtn" onclick="submitLocation()" disabled>
                    ✅ 提交打卡
                </button>
            </div>

            <!-- 面板底部 -->
            <div class="panel-footer">
                <button class="logout-btn" onclick="logout()">退出登录</button>
            </div>
        </div>
    </div>

    <script>
        let map = null;
        let currentLocation = null;
        let locationMarker = null;
        let searchHistory = [];
        let favoriteLocations = [];
        let searchService = null;

        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', function() {
            loadUserInfo();
            initMap();
            loadStoredData();
            getCurrentLocation();
            setupEventListeners();
        });

        // 初始化高德地图
        function initMap() {
            // 创建地图实例
            map = new AMap.Map('mapContainer', {
                zoom: 15,
                center: [116.397428, 39.90923], // 默认中心点（北京）
                mapStyle: 'amap://styles/normal',
                viewMode: '2D'
            });

            // 添加地图控件
            map.addControl(new AMap.Scale());
            map.addControl(new AMap.ToolBar());

            // 初始化搜索服务
            AMap.plugin('AMap.PlaceSearch', function() {
                searchService = new AMap.PlaceSearch({
                    pageSize: 10,
                    pageIndex: 1,
                    city: '全国'
                });
            });
        }

        // 加载用户信息
        async function loadUserInfo() {
            try {
                const response = await fetch('/api/user');
                if (response.ok) {
                    const userData = await response.json();
                    const displayName = userData.user.name || userData.user.login || '未知用户';
                    document.getElementById('userDisplayName').textContent = displayName;

                    // 设置默认姓名
                    const realNameInput = document.getElementById('realName');
                    if (userData.user.name) {
                        realNameInput.value = userData.user.name;
                    }
                } else {
                    console.error('获取用户信息失败');
                    showMessage('获取用户信息失败', 'error');
                }
            } catch (error) {
                console.error('获取用户信息出错:', error);
                showMessage('获取用户信息出错', 'error');
            }
        }

        // 获取当前位置
        function getCurrentLocation() {
            showMessage('正在获取位置信息...', 'info');

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        currentLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };

                        // 更新地图中心点
                        const center = [currentLocation.longitude, currentLocation.latitude];
                        map.setCenter(center);
                        map.setZoom(16);

                        // 添加或更新位置标记
                        updateLocationMarker();

                        // 获取地址信息
                        getAddressFromCoords(currentLocation.latitude, currentLocation.longitude);
                    },
                    function(error) {
                        console.error('获取位置失败:', error);
                        let errorMsg = '获取位置失败';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMsg = '位置权限被拒绝，请允许位置访问';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMsg = '位置信息不可用';
                                break;
                            case error.TIMEOUT:
                                errorMsg = '获取位置超时';
                                break;
                        }
                        showMessage(errorMsg, 'error');
                        document.getElementById('locationAddress').textContent = errorMsg;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            } else {
                const errorMsg = '浏览器不支持位置服务';
                showMessage(errorMsg, 'error');
                document.getElementById('locationAddress').textContent = errorMsg;
            }
        }

        // 更新地图上的位置标记
        function updateLocationMarker() {
            if (!currentLocation || !map) return;

            // 移除旧标记
            if (locationMarker) {
                map.remove(locationMarker);
            }

            // 创建新标记
            locationMarker = new AMap.Marker({
                position: [currentLocation.longitude, currentLocation.latitude],
                title: '当前位置',
                icon: new AMap.Icon({
                    size: new AMap.Size(25, 34),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
                })
            });

            map.add(locationMarker);

            // 添加信息窗体
            const infoWindow = new AMap.InfoWindow({
                content: '<div style="padding: 10px;">📍 您的当前位置</div>',
                offset: new AMap.Pixel(0, -34)
            });

            locationMarker.on('click', function() {
                infoWindow.open(map, locationMarker.getPosition());
            });
        }

        // 设置事件监听器
        function setupEventListeners() {
            // 搜索框回车事件
            document.getElementById('searchInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchLocation();
                }
            });

            // 坐标输入框回车事件
            document.getElementById('latInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    gotoCoordinates();
                }
            });

            document.getElementById('lngInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    gotoCoordinates();
                }
            });
        }

        // 加载本地存储的数据
        function loadStoredData() {
            try {
                const storedHistory = localStorage.getItem('searchHistory');
                if (storedHistory) {
                    searchHistory = JSON.parse(storedHistory);
                }

                const storedFavorites = localStorage.getItem('favoriteLocations');
                if (storedFavorites) {
                    favoriteLocations = JSON.parse(storedFavorites);
                }

                updateHistoryDisplay();
                updateFavoritesDisplay();
            } catch (error) {
                console.error('加载本地数据失败:', error);
            }
        }

        // 搜索位置
        function searchLocation() {
            const keyword = document.getElementById('searchInput').value.trim();
            if (!keyword) {
                showMessage('请输入搜索关键词', 'error');
                return;
            }

            if (!searchService) {
                showMessage('搜索服务未初始化', 'error');
                return;
            }

            showMessage('正在搜索...', 'info');

            searchService.search(keyword, function(status, result) {
                if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                    const poi = result.poiList.pois[0]; // 取第一个结果
                    const location = poi.location;

                    // 更新地图位置
                    map.setCenter([location.lng, location.lat]);
                    map.setZoom(16);

                    // 更新当前位置
                    currentLocation = {
                        latitude: location.lat,
                        longitude: location.lng
                    };

                    // 更新位置标记
                    updateLocationMarker();

                    // 更新位置信息显示
                    document.getElementById('locationAddress').textContent = poi.name + ' - ' + poi.address;
                    document.getElementById('locationCoords').textContent =
                        \`坐标: \${location.lat.toFixed(6)}, \${location.lng.toFixed(6)}\`;

                    // 添加到搜索历史
                    addToHistory({
                        name: poi.name,
                        address: poi.address,
                        lat: location.lat,
                        lng: location.lng,
                        timestamp: new Date().toISOString()
                    });

                    // 启用提交按钮
                    document.getElementById('submitLocationBtn').disabled = false;

                    showMessage('搜索成功', 'success');
                } else {
                    showMessage('未找到相关位置', 'error');
                }
            });
        }

        // 使用高德地图API获取地址
        async function getAddressFromCoords(lat, lng) {
            try {
                const response = await fetch(\`/api/geocode?lat=\${lat}&lng=\${lng}\`);
                if (response.ok) {
                    const data = await response.json();
                    const address = data.address || '未知地址';
                    document.getElementById('locationAddress').textContent = address;
                    document.getElementById('locationCoords').textContent =
                        \`坐标: \${lat.toFixed(6)}, \${lng.toFixed(6)}\`;

                    showMessage('位置获取成功', 'success');
                } else {
                    throw new Error('地理编码API请求失败');
                }

                // 启用提交按钮
                document.getElementById('submitLocationBtn').disabled = false;
            } catch (error) {
                console.error('获取地址失败:', error);
                document.getElementById('locationAddress').textContent =
                    \`坐标: \${lat.toFixed(6)}, \${lng.toFixed(6)}\`;
                document.getElementById('locationCoords').textContent = '地址解析失败';

                showMessage('地址解析失败，但可以继续打卡', 'error');

                // 即使获取地址失败，也允许提交
                document.getElementById('submitLocationBtn').disabled = false;
            }
        }

        // 根据坐标定位
        function gotoCoordinates() {
            const lat = parseFloat(document.getElementById('latInput').value);
            const lng = parseFloat(document.getElementById('lngInput').value);

            if (isNaN(lat) || isNaN(lng)) {
                showMessage('请输入有效的经纬度', 'error');
                return;
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                showMessage('经纬度范围无效', 'error');
                return;
            }

            // 更新地图位置
            map.setCenter([lng, lat]);
            map.setZoom(16);

            // 更新当前位置
            currentLocation = {
                latitude: lat,
                longitude: lng
            };

            // 更新位置标记
            updateLocationMarker();

            // 获取地址信息
            getAddressFromCoords(lat, lng);

            showMessage('定位成功', 'success');
        }

        // 刷新位置
        function refreshLocation() {
            document.getElementById('submitLocationBtn').disabled = true;
            getCurrentLocation();
        }

        // 添加到搜索历史
        function addToHistory(location) {
            // 检查是否已存在
            const exists = searchHistory.find(item =>
                Math.abs(item.lat - location.lat) < 0.0001 &&
                Math.abs(item.lng - location.lng) < 0.0001
            );

            if (!exists) {
                searchHistory.unshift(location);
                // 限制历史记录数量
                if (searchHistory.length > 20) {
                    searchHistory = searchHistory.slice(0, 20);
                }

                saveToLocalStorage('searchHistory', searchHistory);
                updateHistoryDisplay();
            }
        }

        // 添加到收藏
        function addToFavorites(location) {
            // 检查是否已存在
            const exists = favoriteLocations.find(item =>
                Math.abs(item.lat - location.lat) < 0.0001 &&
                Math.abs(item.lng - location.lng) < 0.0001
            );

            if (!exists) {
                favoriteLocations.unshift(location);
                saveToLocalStorage('favoriteLocations', favoriteLocations);
                updateFavoritesDisplay();
                showMessage('已添加到收藏', 'success');
            } else {
                showMessage('该位置已在收藏中', 'info');
            }
        }

        // 收藏当前位置
        function favoriteCurrentLocation() {
            if (!currentLocation) {
                showMessage('请先获取位置信息', 'error');
                return;
            }

            const address = document.getElementById('locationAddress').textContent;
            const location = {
                name: '当前位置',
                address: address,
                lat: currentLocation.latitude,
                lng: currentLocation.longitude,
                timestamp: new Date().toISOString()
            };

            addToFavorites(location);
        }

        // 提交打卡
        async function submitLocation() {
            if (!currentLocation) {
                showMessage('请先获取位置信息', 'error');
                return;
            }

            const realName = document.getElementById('realName').value.trim();
            if (!realName) {
                showMessage('请输入真实姓名', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitLocationBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';

            try {
                const response = await fetch('/api/submit-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        realName: realName,
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    showMessage('打卡成功！', 'success');
                    submitBtn.textContent = '✅ 打卡成功';

                    // 3秒后恢复按钮状态
                    setTimeout(() => {
                        submitBtn.textContent = '✅ 提交打卡';
                        submitBtn.disabled = false;
                    }, 3000);
                } else {
                    const error = await response.json();
                    throw new Error(error.message || '提交失败');
                }
            } catch (error) {
                console.error('提交打卡出错:', error);
                showMessage('打卡失败: ' + error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '✅ 提交打卡';
            }
        }

        // 更新历史记录显示
        function updateHistoryDisplay() {
            const historyList = document.getElementById('historyList');

            if (searchHistory.length === 0) {
                historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无搜索历史</div>';
                return;
            }

            historyList.innerHTML = searchHistory.map((item, index) => \`
                <div class="history-item">
                    <div class="item-text" title="\${item.name} - \${item.address}">
                        <strong>\${item.name}</strong><br>
                        <small>\${item.address}</small>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn favorite-btn" onclick="addToFavorites(searchHistory[\${index}])" title="收藏">⭐</button>
                        <button class="action-btn goto-btn" onclick="gotoLocation(\${item.lat}, \${item.lng})" title="定位">📍</button>
                        <button class="action-btn remove-btn" onclick="removeFromHistory(\${index})" title="删除">×</button>
                    </div>
                </div>
            \`).join('');
        }

        // 更新收藏显示
        function updateFavoritesDisplay() {
            const favoriteList = document.getElementById('favoriteList');

            if (favoriteLocations.length === 0) {
                favoriteList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无收藏地点</div>';
                return;
            }

            favoriteList.innerHTML = favoriteLocations.map((item, index) => \`
                <div class="favorite-item">
                    <div class="item-text" title="\${item.name} - \${item.address}">
                        <strong>\${item.name}</strong><br>
                        <small>\${item.address}</small>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn goto-btn" onclick="gotoLocation(\${item.lat}, \${item.lng})" title="定位">📍</button>
                        <button class="action-btn remove-btn" onclick="removeFromFavorites(\${index})" title="删除">×</button>
                    </div>
                </div>
            \`).join('');
        }

        // 跳转到指定位置
        function gotoLocation(lat, lng) {
            // 更新地图位置
            map.setCenter([lng, lat]);
            map.setZoom(16);

            // 更新当前位置
            currentLocation = {
                latitude: lat,
                longitude: lng
            };

            // 更新位置标记
            updateLocationMarker();

            // 获取地址信息
            getAddressFromCoords(lat, lng);

            showMessage('已定位到指定位置', 'success');
        }

        // 从历史记录中删除
        function removeFromHistory(index) {
            searchHistory.splice(index, 1);
            saveToLocalStorage('searchHistory', searchHistory);
            updateHistoryDisplay();
        }

        // 从收藏中删除
        function removeFromFavorites(index) {
            favoriteLocations.splice(index, 1);
            saveToLocalStorage('favoriteLocations', favoriteLocations);
            updateFavoritesDisplay();
        }

        // 清空历史记录
        function clearHistory() {
            if (confirm('确定要清空所有搜索历史吗？')) {
                searchHistory = [];
                saveToLocalStorage('searchHistory', searchHistory);
                updateHistoryDisplay();
                showMessage('历史记录已清空', 'success');
            }
        }

        // 清空收藏
        function clearFavorites() {
            if (confirm('确定要清空所有收藏地点吗？')) {
                favoriteLocations = [];
                saveToLocalStorage('favoriteLocations', favoriteLocations);
                updateFavoritesDisplay();
                showMessage('收藏已清空', 'success');
            }
        }

        // 保存到本地存储
        function saveToLocalStorage(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
                console.error('保存到本地存储失败:', error);
            }
        }

        // 显示状态消息
        function showMessage(message, type = 'info') {
            const messageDiv = document.getElementById('statusMessage');
            messageDiv.textContent = message;
            messageDiv.className = \`status-message status-\${type}\`;
            messageDiv.style.display = 'block';

            // 3秒后自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            }
        }

        // 退出登录
        async function logout() {
            if (confirm('确定要退出登录吗？')) {
                try {
                    const response = await fetch('/api/logout', { method: 'POST' });
                    if (response.ok) {
                        window.location.href = '/login';
                    } else {
                        showMessage('退出登录失败', 'error');
                    }
                } catch (error) {
                    console.error('退出登录出错:', error);
                    showMessage('退出登录出错', 'error');
                }
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