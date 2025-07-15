/**
 * 简单的模板渲染工具
 * 支持变量替换和模板加载
 */

/**
 * 渲染模板字符串，替换变量
 * @param {string} template - 模板字符串
 * @param {object} variables - 变量对象
 * @returns {string} 渲染后的字符串
 */
export function renderTemplate(template, variables = {}) {
  let rendered = template;
  
  // 替换 {{variable}} 格式的变量
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  
  return rendered;
}

/**
 * 内置模板存储
 * 由于Cloudflare Pages环境的限制，我们将模板内容内嵌在代码中
 */
const TEMPLATES = {
  'login.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 考勤系统</title>
    <link rel="stylesheet" href="/css/login.css">
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
                <svg class="gitee-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24" style="margin-right: 12px;">
                    <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z"/>
                </svg>
                使用 Gitee 登录
            </a>
        </div>
    </div>
</body>
</html>`,

  'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>考勤打卡系统</title>
    <!-- 高德地图安全配置 -->
    <script type="text/javascript">
        window._AMapSecurityConfig = {
            securityJsCode: "{{AMAP_SECURITY_CODE}}",
            serviceHost: '/_AMapService'
        };
    </script>
    <script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key={{AMAP_KEY}}&plugin=AMap.PlaceSearch,AMap.ToolBar,AMap.Scale,AMap.Geocoder,AMap.Geolocation"></script>
    <link rel="stylesheet" href="/css/index.css">
    <style>
        .user-info {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-left: 10px;
        }
        
        .logout-btn {
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
            transition: background 0.3s;
        }
        
        .logout-btn:hover {
            background: #d32f2f;
        }
        
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .panel-header h1 {
            margin-right: 10px;
            white-space: nowrap;
        }
        
        /* 优化面板高度，避免滚动条 */
        .checkin-panel {
            max-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .panel-content {
            flex: 1;
        }
        
        .search-section {
            max-height: calc(100vh - 280px);
            overflow-y: auto;
        }
        
        /* 移动端视图切换按钮 */
        .view-toggle-btn {
            display: none;
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #667eea;
            color: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-size: 20px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .view-toggle-btn:hover {
            background: #5a67d8;
        }
        
        /* 折叠面板样式 */
        .collapsible-section {
            margin-top: 15px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .collapsible-header {
            font-size: 0.9em;
            font-weight: 600;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 5px;
            border-bottom: 1px solid #e0e0e0;
            cursor: pointer;
        }
        
        .collapsible-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        
        .collapsible-content.expanded {
            max-height: 150px;
            overflow-y: auto;
        }
        
        /* 底部固定操作栏 */
        .mobile-action-bar {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: white;
            padding: 10px 15px;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            
            .checkin-panel {
                width: 100%;
                height: 50vh;
                order: -1;
                padding-bottom: 70px; /* 为底部操作栏留出空间 */
            }
            
            .map-container {
                height: 50vh;
            }
            
            .panel-header {
                flex-wrap: wrap;
            }
            
            .search-section {
                max-height: calc(100vh - 320px);
            }
            
            .btn-primary {
                margin-top: 10px;
            }
            
            /* 显示移动端特有元素 */
            .view-toggle-btn {
                display: block;
            }
            
            .mobile-action-bar {
                display: block;
            }
            
            /* 全屏模式类 */
            .fullscreen-map .map-container {
                height: 100vh;
                z-index: 900;
            }
            
            .fullscreen-map .checkin-panel {
                display: none;
            }
            
            .fullscreen-panel .checkin-panel {
                height: 100vh;
                z-index: 900;
            }
            
            .fullscreen-panel .map-container {
                display: none;
            }
            
            /* 优化触摸元素尺寸 */
            .search-btn, .action-btn, .clear-btn {
                min-width: 44px;
                min-height: 44px;
                padding: 10px;
            }
            
            .search-input {
                height: 44px;
                font-size: 16px;
            }
            
            /* 增加按钮间距 */
            .item-actions {
                gap: 10px;
            }
        }
        
        /* 小屏幕设备额外优化 */
        @media (max-width: 480px) {
            .panel-header h1 {
                font-size: 1.2em;
            }
            
            .collapsible-section {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- 添加加载动画 -->
        <div id="loading-spinner" class="loading-spinner">
            <div class="spinner"></div>
        </div>
        
        <!-- 添加结果显示罩层 -->
        <div id="result-overlay" class="result-overlay">
            <div class="result-container">
                <div class="result-header">
                    <div class="result-title">打卡结果</div>
                    <button class="result-close" onclick="closeResultOverlay()">&times;</button>
                </div>
                <div id="result-content" class="result-content"></div>
                <button class="btn btn-primary" onclick="closeResultOverlay()">确定</button>
            </div>
        </div>
        
        <!-- 地图容器 -->
        <div class="map-container">
            <div id="mapContainer"></div>
        </div>

        <!-- 右侧打卡面板 -->
        <div class="checkin-panel">
            <!-- 面板头部 -->
            <div class="panel-header">
                <h1>📍 考勤打卡</h1>
                <div class="user-info">
                    <span class="user-name" id="userDisplayName">加载中...</span>
                    <button class="logout-btn" onclick="logout()" title="退出登录">退出</button>
                </div>
            </div>

            <!-- 搜索区域 -->
            <div class="search-section">
                <div class="search-container">
                    <input type="text" id="searchInput" class="search-input" placeholder="搜索地点..." />
                    <button class="search-btn" onclick="searchLocation()">🔍</button>
                </div>

                <!-- 当前位置坐标显示 -->
                <div class="coord-section">
                    <div class="section-title">
                        📍 当前位置坐标
                    </div>
                    <div class="current-coords" id="currentCoords">
                        <small>请先搜索位置或获取当前位置</small>
                    </div>
                </div>

                <!-- 搜索历史 - 改为可折叠面板 -->
                <div class="collapsible-section">
                    <div class="collapsible-header" onclick="toggleCollapsible(this)">
                        🕒 搜索历史
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="collapsible-content">
                        <div class="section-actions">
                            <button class="clear-btn" onclick="clearHistory()">清空</button>
                        </div>
                        <div class="history-list" id="historyList">
                            <div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无搜索历史</div>
                        </div>
                    </div>
                </div>

                <!-- 收藏地点 - 改为可折叠面板 -->
                <div class="collapsible-section">
                    <div class="collapsible-header" onclick="toggleCollapsible(this)">
                        ⭐ 收藏地点
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="collapsible-content">
                        <div class="section-actions">
                            <button class="clear-btn" onclick="clearFavorites()">清空</button>
                        </div>
                        <div class="favorite-list" id="favoriteList">
                            <div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无收藏地点</div>
                        </div>
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

                <button class="btn btn-primary" id="submitLocationBtn" onclick="submitLocation()" disabled>
                    ✅ 提交打卡
                </button>
            </div>
        </div>
        
        <!-- 移动端视图切换按钮 -->
        <button class="view-toggle-btn" id="viewToggleBtn" title="切换视图">
            🗺️
        </button>
        
        <!-- 移动端底部操作栏 -->
        <div class="mobile-action-bar">
            <button class="btn btn-primary" id="mobileSubmitBtn" onclick="submitLocation()" disabled>
                ✅ 提交打卡
            </button>
        </div>
    </div>

    <script src="/js/map.js"></script>
    <script src="/js/auth.js"></script>
    <script src="/js/main.js"></script>
    <script>
        // 移动端优化脚本
        document.addEventListener('DOMContentLoaded', function() {
            // 检查是否为移动设备
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // 视图切换按钮
                const viewToggleBtn = document.getElementById('viewToggleBtn');
                if (!viewToggleBtn) return;
                
                let currentView = 'split'; // 'split', 'map', 'panel'
                
                viewToggleBtn.addEventListener('click', function() {
                    const mainContainer = document.querySelector('.main-container');
                    
                    if (currentView === 'split') {
                        // 切换到全屏地图
                        mainContainer.classList.add('fullscreen-map');
                        mainContainer.classList.remove('fullscreen-panel');
                        viewToggleBtn.innerHTML = '📋';
                        viewToggleBtn.title = '切换到面板视图';
                        currentView = 'map';
                    } else if (currentView === 'map') {
                        // 切换到全屏面板
                        mainContainer.classList.remove('fullscreen-map');
                        mainContainer.classList.add('fullscreen-panel');
                        viewToggleBtn.innerHTML = '🔄';
                        viewToggleBtn.title = '切换到分屏视图';
                        currentView = 'panel';
                    } else {
                        // 切换回分屏
                        mainContainer.classList.remove('fullscreen-map');
                        mainContainer.classList.remove('fullscreen-panel');
                        viewToggleBtn.innerHTML = '🗺️';
                        viewToggleBtn.title = '切换到地图视图';
                        currentView = 'split';
                    }
                });
            }
        });
    </script>
</body>
</html>`
};

/**
 * 从内置模板存储加载模板
 * @param {string} templatePath - 模板文件路径
 * @returns {Promise<string>} 模板内容
 */
export async function loadTemplate(templatePath) {
  const template = TEMPLATES[templatePath];

  if (!template) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return template;
}

/**
 * 渲染模板文件
 * @param {string} templatePath - 模板文件路径
 * @param {object} variables - 变量对象
 * @param {object} context - Cloudflare Functions 上下文（可选）
 * @returns {Promise<string>} 渲染后的HTML
 */
export async function renderTemplateFile(templatePath, variables = {}, context = null) {
  try {
    const template = await loadTemplate(templatePath);

    // 如果提供了context，合并默认变量
    if (context) {
      const defaultVars = getDefaultTemplateVariables(context);
      variables = { ...defaultVars, ...variables };
    }

    return renderTemplate(template, variables);
  } catch (error) {
    console.error('Template rendering error:', error);

    // 返回错误页面
    return createErrorTemplate(
      '模板加载失败',
      `无法加载模板文件: ${templatePath}`,
      error.message
    );
  }
}

/**
 * 创建错误页面模板
 * @param {string} title - 错误标题
 * @param {string} message - 错误消息
 * @param {string} details - 错误详情
 * @returns {string} 错误页面HTML
 */
export function createErrorTemplate(title, message, details = '') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 考勤系统</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .error-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        h1 {
            color: #e74c3c;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        .message {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.9em;
            color: #666;
            text-align: left;
        }
        .actions {
            margin-top: 30px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 0 10px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #5a67d8;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>${title}</h1>
        <div class="message">${message}</div>
        ${details ? `<div class="details">${details}</div>` : ''}
        <div class="actions">
            <a href="/login" class="btn">返回登录</a>
            <a href="/api/health" class="btn">系统状态</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * 获取默认模板变量
 * @param {object} context - Cloudflare Functions 上下文
 * @returns {object} 默认变量对象
 */
export function getDefaultTemplateVariables(context) {
  const { env } = context;
  
  return {
    AMAP_KEY: env.AMAP_KEY || 'caa6c37d36bdac64cf8d3e624fec3323',
    AMAP_SECURITY_CODE: env.AMAP_SECURITY_CODE || 'f1a08e21c881331769a88b1d52ed85a0',
    TIMESTAMP: new Date().toISOString(),
    VERSION: '1.0.0'
  };
}
