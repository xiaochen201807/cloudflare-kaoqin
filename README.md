# 考勤系统 (Cloudflare Pages 版本)

基于 Cloudflare Pages 和高德地图 API 的考勤定位系统。

## 功能特点

- 使用高德地图进行位置定位
- 支持 GitHub 和 Gitee OAuth 认证登录
- 响应式设计，适配移动端和桌面端
- 支持自定义姓名提交

## 本地开发环境配置

### 前提条件

- 安装 [Node.js](https://nodejs.org/) (v16+)
- 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- 申请 [GitHub OAuth](https://github.com/settings/developers) 应用
- 申请 [Gitee OAuth](https://gitee.com/oauth/applications) 应用
- 申请 [高德地图 API](https://lbs.amap.com/) 密钥

### 配置步骤

1. 克隆仓库
```bash
git clone <仓库地址>
cd cloudflare-kaoqin
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
# 复制环境变量示例文件
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars 文件，填入实际配置值
# 详细配置说明请参考 setup-env.md
```

**必需的环境变量**：
- OAuth 配置：`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `REDIRECT_URI`, `GITEE_CLIENT_ID`, `GITEE_CLIENT_SECRET`, `GITEE_REDIRECT_URI`
- JWT 配置：`JWT_ALGORITHM`, `JWT_SECRET` (或 `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY`)
- API 端点：`N8N_API_ENDPOINT`, `N8N_API_CONFIRM_ENDPOINT`

> 📖 **详细配置指南**：请参考 [`setup-env.md`](./setup-env.md) 获取完整的环境变量配置说明

4. 启动开发服务器
```bash
npm run dev
```

5. 访问应用
在浏览器中打开 http://localhost:8788

## 目录结构

```
cloudflare-kaoqin/
├── functions/           # Cloudflare Functions (后端API)
│   ├── api/             # API端点
│   │   └── [...].js     # 通配API处理
│   ├── oauth/           # OAuth相关函数
│   │   └── callback.js  # OAuth回调处理
│   └── login.js         # 登录处理
├── public/              # 静态资源
│   ├── index.html       # 主页面
│   └── login.html       # 登录页面
├── wrangler.toml        # Cloudflare配置
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 部署到 Cloudflare Pages

### 部署前检查

运行部署前检查确保配置正确：

```bash
npm run check
```

### 部署步骤

1. 登录 Cloudflare Dashboard
2. 创建新的 Pages 项目
3. 连接到你的 GitHub 仓库
4. 配置以下构建设置:
   - 构建命令: `npm run build`
   - 构建输出目录: `public`
5. 在环境变量中添加所有必要的配置
6. 创建并绑定 KV 命名空间
7. 部署应用

### 部署后验证

访问以下端点验证部署：
- `/api/health` - 系统健康检查
- `/oauth/login` - GitHub 登录测试
- `/oauth/gitee` - Gitee 登录测试

## 🔧 开发工具

### 验证脚本

```bash
# 综合检查
npm run check

# 环境变量检查
npm run check:env

# 前端资源检查
npm run check:frontend
```

### 健康检查

部署后访问 `/api/health` 检查系统状态和配置。

## 📚 文档

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - 完整部署指南
- [`setup-env.md`](./setup-env.md) - 环境变量配置指南
- [`ENV-CONFIG.md`](./ENV-CONFIG.md) - 环境变量问题解决方案
- [`KV-SETUP.md`](./KV-SETUP.md) - KV 命名空间设置指南
- [`SECURITY-IMPROVEMENTS.md`](./SECURITY-IMPROVEMENTS.md) - 安全性改进总结
- [`OPTIMIZATION-SUMMARY.md`](./OPTIMIZATION-SUMMARY.md) - 系统优化总结

## 🔒 安全特性

- ✅ 无默认密钥，强制配置安全密钥
- ✅ JWT 密钥长度和格式验证
- ✅ OAuth 状态验证和错误处理
- ✅ API 速率限制防止滥用攻击
- ✅ 详细的安全事件日志记录
- ✅ 智能用户标识和访问控制

## 🛡️ 稳定性特性

- ✅ 统一的错误处理格式
- ✅ 环境变量启动验证
- ✅ 健康检查 API
- ✅ 前端资源完整性验证
- ✅ 智能会话管理和自动刷新
- ✅ 网络状态感知和自动重试
- ✅ 结构化日志记录系统

## 🚀 性能优化

- ⚡ API 速率限制（防止滥用）
- 🔄 智能会话刷新（预防性刷新）
- 📊 详细的性能监控日志
- 🎯 优雅的错误处理和恢复
- 📱 用户活动感知优化
- 🌐 网络状态自适应

## 许可证

MIT