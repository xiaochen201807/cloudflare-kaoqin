# 部署检查清单

本清单确保考勤系统的所有功能和优化都已正确配置和部署。

## 📋 部署前检查

### 1. 环境配置 ✅

#### 必需的环境变量
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth 客户端 ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth 客户端密钥
- [ ] `REDIRECT_URI` - GitHub OAuth 回调地址
- [ ] `GITEE_CLIENT_ID` - Gitee OAuth 客户端 ID
- [ ] `GITEE_CLIENT_SECRET` - Gitee OAuth 客户端密钥
- [ ] `GITEE_REDIRECT_URI` - Gitee OAuth 回调地址
- [ ] `JWT_ALGORITHM` - JWT 算法 (HS256 或 RS256)
- [ ] `JWT_SECRET` (HS256) 或 `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` (RS256)
- [ ] `N8N_API_ENDPOINT` - n8n API 端点
- [ ] `N8N_API_CONFIRM_ENDPOINT` - n8n 确认打卡 API 端点

#### 环境变量验证
```bash
npm run check:env
```

### 2. KV 命名空间配置 ✅

- [ ] 已创建 `SESSIONS` KV 命名空间
- [ ] 已获取命名空间 ID
- [ ] 已更新 `wrangler.toml` 中的命名空间 ID
- [ ] 已绑定到项目

### 3. 前端资源检查 ✅

- [ ] `public/index.html` - 主页面
- [ ] `public/login.html` - 登录页面
- [ ] `public/js/session-manager.js` - 会话管理器
- [ ] `public/js/error-handler.js` - 错误处理器

#### 前端资源验证
```bash
npm run check:frontend
```

### 4. 函数文件检查 ✅

- [ ] `functions/api/[...route].js` - API 路由处理
- [ ] `functions/oauth/callback.js` - OAuth 回调处理
- [ ] `functions/middleware/rate-limiter.js` - 速率限制中间件
- [ ] `functions/utils/logger.js` - 日志记录系统

### 5. 综合检查 ✅

```bash
npm run check
```

## 🚀 部署步骤

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试功能
# - 访问 http://localhost:8788
# - 测试登录功能
# - 测试打卡功能
# - 检查错误处理
```

### 2. 部署到 Cloudflare Pages

```bash
# 部署（会自动运行预检查）
npm run deploy
```

### 3. 配置生产环境

1. **在 Cloudflare Dashboard 中配置环境变量**
   - 进入 Pages 项目设置
   - 添加所有必需的环境变量
   - 为生产环境和预览环境分别配置

2. **绑定 KV 命名空间**
   - 确认 KV 命名空间已正确绑定
   - 测试 KV 存储功能

## ✅ 部署后验证

### 1. 基础功能测试

- [ ] 访问主页 (`https://your-domain.pages.dev`)
- [ ] 健康检查 (`https://your-domain.pages.dev/api/health`)
- [ ] GitHub 登录 (`https://your-domain.pages.dev/oauth/login`)
- [ ] Gitee 登录 (`https://your-domain.pages.dev/oauth/gitee`)

### 2. 安全功能测试

#### 速率限制测试
```bash
# 测试 API 速率限制
for i in {1..70}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.pages.dev/api/health
done
# 应该看到一些 429 响应
```

#### JWT 安全测试
- [ ] 确认没有默认密钥
- [ ] 测试无效 JWT 令牌被拒绝
- [ ] 验证会话过期处理

### 3. 会话管理测试

- [ ] 登录后会话正常工作
- [ ] 会话自动刷新功能
- [ ] 会话过期警告显示
- [ ] 会话过期后自动跳转登录

### 4. 错误处理测试

#### 前端错误处理
- [ ] 网络断开时显示错误提示
- [ ] API 错误时显示友好提示
- [ ] 自动重试机制工作正常
- [ ] 速率限制时显示倒计时

#### 后端错误处理
- [ ] 无效请求返回正确错误码
- [ ] 错误响应格式统一
- [ ] 详细错误日志记录

### 5. 性能和监控测试

- [ ] API 响应时间正常 (< 1秒)
- [ ] 会话检查不影响用户体验
- [ ] 错误恢复机制工作正常
- [ ] 日志记录详细且结构化

## 📊 监控和维护

### 1. 日志监控

在 Cloudflare Dashboard 中监控以下日志：

- **安全事件**: 搜索 `"type":"security"`
- **认证失败**: 搜索 `"type":"auth"` 和 `"success":false`
- **API 错误**: 搜索 `"level":"ERROR"`
- **速率限制**: 搜索 `"rateLimitExceeded":true`

### 2. 性能监控

- **API 响应时间**: 监控 `duration` 字段
- **错误率**: 监控 4xx 和 5xx 状态码
- **会话刷新成功率**: 监控会话相关日志

### 3. 告警设置

建议设置以下告警：

- 5xx 错误率 > 5%
- 速率限制触发频率异常
- 会话刷新失败率 > 10%
- API 响应时间 > 3秒

## 🔧 故障排除

### 常见问题

1. **健康检查失败**
   - 检查环境变量配置
   - 验证 KV 命名空间绑定
   - 查看函数日志

2. **登录失败**
   - 检查 OAuth 应用配置
   - 验证回调地址设置
   - 查看认证相关日志

3. **速率限制问题**
   - 检查 KV 存储状态
   - 调整速率限制配置
   - 查看速率限制日志

4. **会话问题**
   - 检查 JWT 配置
   - 验证会话存储
   - 查看会话相关日志

### 调试工具

```bash
# 查看详细日志
wrangler pages deployment tail

# 测试 KV 存储
wrangler kv:key list --binding=SESSIONS

# 验证环境变量
npm run check:env
```

## 📈 性能优化建议

### 短期优化
- 根据实际使用情况调整速率限制参数
- 优化会话检查频率
- 添加更多性能监控指标

### 长期优化
- 实现缓存策略
- 添加 CDN 优化
- 考虑多地域部署

## ✨ 部署成功标志

当以下所有项目都通过时，部署即为成功：

- ✅ 健康检查返回 200 状态
- ✅ 所有环境变量配置正确
- ✅ OAuth 登录流程正常
- ✅ 打卡功能正常工作
- ✅ 速率限制正常生效
- ✅ 错误处理优雅工作
- ✅ 会话管理自动运行
- ✅ 日志记录详细完整

🎉 **恭喜！您的考勤系统已成功部署并具备生产级别的稳定性和安全性！**
