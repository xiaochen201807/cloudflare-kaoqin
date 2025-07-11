# 环境变量配置指南

本指南将帮助您完整配置考勤系统所需的所有环境变量。

## 快速配置检查清单

### 1. OAuth 应用注册

#### GitHub OAuth 应用
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: `考勤系统`
   - Homepage URL: `https://your-domain.pages.dev`
   - Authorization callback URL: `https://your-domain.pages.dev/oauth/callback`
4. 记录 `Client ID` 和 `Client Secret`

#### Gitee OAuth 应用
1. 访问 [Gitee 第三方应用](https://gitee.com/oauth/applications)
2. 点击 "创建应用"
3. 填写应用信息：
   - 应用名称: `考勤系统`
   - 应用主页: `https://your-domain.pages.dev`
   - 应用回调地址: `https://your-domain.pages.dev/oauth/callback`
4. 记录 `Client ID` 和 `Client Secret`

### 2. 生成 JWT 密钥

#### 选项1: HS256 算法（推荐用于开发环境）
```bash
# 生成32字符的随机密钥
openssl rand -base64 32
```

#### 选项2: RS256 算法（推荐用于生产环境）
```bash
# 生成私钥
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 从私钥提取公钥
openssl rsa -pubout -in private_key.pem -out public_key.pem

# 查看私钥内容（复制完整内容包括头尾）
cat private_key.pem

# 查看公钥内容（复制完整内容包括头尾）
cat public_key.pem
```

### 3. 创建 KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages"
3. 点击 "KV" 选项卡
4. 创建命名空间：
   - 名称: `SESSIONS`
   - 记录命名空间 ID

### 4. 配置环境变量

#### 开发环境配置
1. 复制 `.dev.vars.example` 为 `.dev.vars`
2. 填入实际值：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 文件，填入实际的配置值
```

#### 生产环境配置
在 Cloudflare Dashboard 中配置以下环境变量：

**必需变量：**
- `GITHUB_CLIENT_ID`: GitHub OAuth 客户端 ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth 客户端密钥
- `REDIRECT_URI`: GitHub OAuth 回调地址
- `GITEE_CLIENT_ID`: Gitee OAuth 客户端 ID
- `GITEE_CLIENT_SECRET`: Gitee OAuth 客户端密钥
- `GITEE_REDIRECT_URI`: Gitee OAuth 回调地址
- `JWT_ALGORITHM`: JWT 算法 (HS256 或 RS256)
- `JWT_SECRET`: JWT 密钥 (HS256) 或 `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` (RS256)
- `N8N_API_ENDPOINT`: n8n API 端点
- `N8N_API_CONFIRM_ENDPOINT`: n8n 确认打卡 API 端点

### 5. 验证配置

部署后访问以下端点验证配置：
- `/oauth/login` - GitHub 登录
- `/oauth/gitee` - Gitee 登录
- `/api/health` - 健康检查

## 常见问题

### Q: OAuth 认证失败
A: 检查以下项目：
1. 回调地址是否正确配置
2. Client ID 和 Secret 是否正确
3. 域名是否匹配

### Q: JWT 令牌验证失败
A: 检查以下项目：
1. JWT_ALGORITHM 配置是否正确
2. 密钥格式是否正确（RS256 需要完整的 PEM 格式）
3. 密钥是否匹配

### Q: KV 存储错误
A: 检查以下项目：
1. KV 命名空间是否已创建
2. wrangler.toml 中的 KV 绑定是否正确
3. 命名空间 ID 是否正确

## 安全建议

1. **定期轮换密钥**: 建议每3-6个月轮换一次 JWT 密钥
2. **使用强密钥**: JWT 密钥应至少32字符，包含字母、数字和特殊字符
3. **环境隔离**: 开发、测试、生产环境使用不同的密钥
4. **访问控制**: 限制对环境变量的访问权限
5. **监控日志**: 定期检查认证失败日志
