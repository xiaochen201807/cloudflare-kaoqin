# Cloudflare Pages 部署指南

本文档提供了如何将考勤系统部署到 Cloudflare Pages 的详细步骤。

## 前提条件

- 已有 Cloudflare 账号
- 已在 GitHub 上注册应用并获取 OAuth 凭据
- 已在 Gitee 上注册应用并获取 OAuth 凭据

## 1. 创建 Cloudflare KV 命名空间

会话数据需要存储在 Cloudflare KV 中：

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 点击 "KV" 选项卡
4. 创建一个新的命名空间，命名为 "SESSIONS"

## 2. 修改 OAuth 配置

### GitHub OAuth 配置

1. 登录 GitHub，进入 Settings -> Developer settings -> OAuth Apps
2. 找到你的应用，点击编辑
3. 将 "Authorization callback URL" 修改为 `https://你的域名/oauth/callback`
4. 保存更改

### Gitee OAuth 配置

1. 登录 Gitee，进入 设置 -> 第三方应用 -> 应用管理
2. 找到你的应用，点击编辑
3. 将 "回调地址" 修改为 `https://你的域名/oauth/callback`
4. 保存更改

## 3. 部署到 Cloudflare Pages

### 通过 GitHub 仓库部署

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 点击 "创建应用程序"
4. 选择 "Pages" 选项卡，然后点击 "连接到 Git"
5. 选择包含项目的 GitHub 仓库
6. 配置构建设置：
   - 构建命令：`npm run build`
   - 构建输出目录：`public`
7. 点击 "保存并部署"

### 手动部署

如果你不想使用 GitHub 集成，也可以手动部署：

1. 在本地构建项目：
   ```bash
   npm run build
   ```
2. 使用 Wrangler CLI 部署：
   ```bash
   npm run deploy
   ```

## 4. 绑定 KV 命名空间

部署后，需要将 KV 命名空间绑定到你的应用：

1. 在 Cloudflare Dashboard 中，进入你的 Pages 项目
2. 点击 "设置" -> "Functions"
3. 在 "KV 命名空间绑定" 部分，点击 "添加绑定"
4. 变量名填写 `SESSIONS`，选择之前创建的 KV 命名空间
5. 点击 "保存"

## 5. 配置环境变量

在 Cloudflare Dashboard 中设置必要的环境变量：

1. 进入你的 Pages 项目
2. 点击 "设置" -> "环境变量"
3. 添加以下**必需**环境变量：

### OAuth 认证配置（必需）

#### GitHub OAuth 配置
- `GITHUB_CLIENT_ID`: GitHub OAuth 应用的客户端 ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth 应用的客户端密钥
- `REDIRECT_URI`: GitHub OAuth 回调地址，例如 `https://你的域名/oauth/callback`
  > 支持多个回调地址，用逗号分隔，不要有空格
  > 例如：`https://domain1.com/oauth/callback,https://domain2.com/oauth/callback`

#### Gitee OAuth 配置
- `GITEE_CLIENT_ID`: Gitee OAuth 应用的客户端 ID
- `GITEE_CLIENT_SECRET`: Gitee OAuth 应用的客户端密钥
- `GITEE_REDIRECT_URI`: Gitee OAuth 回调地址，例如 `https://你的域名/oauth/callback`
  > Gitee 只支持单个回调地址，请配置主要的生产环境地址

### JWT 配置（必需，选择一种算法）

#### 选项1: 使用 HS256 算法（较简单）
- `JWT_ALGORITHM`: 设置为 "HS256"
- `JWT_SECRET`: 用于签名 JWT 的密钥，应该是一个强随机字符串（至少32字符）
  > 示例：`your_very_strong_secret_key_at_least_32_chars_long`

#### 选项2: 使用 RS256 算法（更安全，推荐用于生产环境）
- `JWT_ALGORITHM`: 设置为 "RS256"
- `JWT_PRIVATE_KEY`: RSA 私钥，用于签名 JWT（完整的 PEM 格式，包括头部和尾部）
- `JWT_PUBLIC_KEY`: RSA 公钥，用于验证 JWT（完整的 PEM 格式，包括头部和尾部）

> **注意**: 使用 RS256 算法时，私钥和公钥必须是完整的 PEM 格式，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----` 等头尾标记。
>
> 可以使用以下命令生成 RSA 密钥对:
> ```bash
> # 生成私钥
> openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
>
> # 从私钥提取公钥
> openssl rsa -pubout -in private_key.pem -out public_key.pem
> ```

### API 端点配置（必需）
- `N8N_API_ENDPOINT`: n8n webhook 端点，用于普通打卡
  > 示例：`https://n8n.201807.xyz/webhook-test/getdkxx`
- `N8N_API_CONFIRM_ENDPOINT`: n8n 确认打卡 webhook 端点
  > 示例：`https://n8n.201807.xyz/webhook-test/getdkxx`

### 可选配置
- `PORT`: 服务器端口（默认：8000，Cloudflare Pages 会自动处理）

4. **重要**：为每个环境（生产环境、预览环境）分别配置这些变量
5. 点击 "保存"

### 环境变量配置检查清单

在部署前，请确保已配置以下所有必需的环境变量：

- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `REDIRECT_URI`
- [ ] `GITEE_CLIENT_ID`
- [ ] `GITEE_CLIENT_SECRET`
- [ ] `GITEE_REDIRECT_URI`
- [ ] `JWT_ALGORITHM` (HS256 或 RS256)
- [ ] `JWT_SECRET` (如果使用 HS256) 或 `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` (如果使用 RS256)
- [ ] `N8N_API_ENDPOINT`
- [ ] `N8N_API_CONFIRM_ENDPOINT`

**缺少任何一个必需的环境变量都会导致认证失败或功能异常！**

## 6. 自定义域名（可选）

如果你想使用自定义域名：

1. 在 Cloudflare Dashboard 中，进入你的 Pages 项目
2. 点击 "自定义域"
3. 输入你想使用的域名
4. 按照指示完成 DNS 配置

## 7. 测试部署

1. 访问你的 Pages 应用 URL（例如 `https://你的项目名.pages.dev`）
2. 确认登录功能正常工作
3. 测试位置打卡功能

## 8. 故障排除

### 环境变量相关问题

#### 认证失败
**症状**: 用户无法登录，OAuth 认证失败
**可能原因**:
1. OAuth 配置缺失或错误
2. 回调地址不匹配
3. Client ID 或 Secret 错误

**解决方案**:
1. 检查 Cloudflare Dashboard 中是否已配置所有必需的 OAuth 环境变量
2. 验证回调地址是否与 OAuth 应用中配置的一致
3. 确认 Client ID 和 Secret 是否正确复制（注意不要有多余的空格）

#### JWT 令牌错误
**症状**: 登录成功但 API 调用失败，提示令牌无效
**可能原因**:
1. JWT 配置缺失
2. 算法配置错误
3. 密钥格式错误

**解决方案**:
1. 确认已配置 `JWT_ALGORITHM` 环境变量
2. 如果使用 HS256，确认已配置 `JWT_SECRET`
3. 如果使用 RS256，确认已配置 `JWT_PRIVATE_KEY` 和 `JWT_PUBLIC_KEY`，且格式包含完整的 PEM 头尾

#### API 端点错误
**症状**: 打卡功能无法正常工作
**可能原因**:
1. n8n API 端点配置错误
2. 网络连接问题

**解决方案**:
1. 检查 `N8N_API_ENDPOINT` 和 `N8N_API_CONFIRM_ENDPOINT` 配置
2. 测试 API 端点是否可访问

### 通用故障排除步骤

1. **检查函数日志**: 在 Cloudflare Dashboard 中查看 Pages 项目的函数日志
2. **验证环境变量**: 确认所有必需的环境变量都已正确设置
3. **测试 OAuth 配置**: 验证 OAuth 回调 URL 是否正确配置
4. **检查 KV 绑定**: 确保 KV 命名空间已正确绑定
5. **清除缓存**: 尝试清除浏览器缓存和 Cloudflare 缓存

### 环境变量配置验证

使用以下检查清单验证配置：

**OAuth 配置**:
- [ ] `GITHUB_CLIENT_ID` 已设置
- [ ] `GITHUB_CLIENT_SECRET` 已设置
- [ ] `REDIRECT_URI` 已设置且格式正确
- [ ] `GITEE_CLIENT_ID` 已设置
- [ ] `GITEE_CLIENT_SECRET` 已设置
- [ ] `GITEE_REDIRECT_URI` 已设置且格式正确

**JWT 配置**:
- [ ] `JWT_ALGORITHM` 已设置 (HS256 或 RS256)
- [ ] 对应的密钥已设置 (`JWT_SECRET` 或 `JWT_PRIVATE_KEY`+`JWT_PUBLIC_KEY`)

**API 配置**:
- [ ] `N8N_API_ENDPOINT` 已设置
- [ ] `N8N_API_CONFIRM_ENDPOINT` 已设置

**KV 配置**:
- [ ] SESSIONS KV 命名空间已创建
- [ ] KV 命名空间已绑定到项目

## 9. 更新部署

当你需要更新应用时：

1. 提交更改到 GitHub 仓库（如果使用 GitHub 集成）
2. Cloudflare Pages 将自动重新构建和部署
3. 或者，使用 Wrangler CLI 手动部署：
   ```bash
   npm run deploy
   ```

## 10. 安全注意事项

- 确保所有敏感信息（如 OAuth 密钥）都存储在环境变量中
- 定期轮换 JWT 密钥
- 考虑启用 Cloudflare 的安全功能，如 WAF 和 Bot 管理


