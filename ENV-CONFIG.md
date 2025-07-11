# 环境变量配置完善指南

## 问题描述

原始问题：
1. **wrangler.toml 配置不完善**：只配置了 API 端点相关变量，缺少 OAuth 配置
2. **环境变量缺失**：原始 Deno 项目使用了大量环境变量，如果没有在 Cloudflare Dashboard 配置，会导致认证失败

## 解决方案概览

### 1. 完善的环境变量配置

我们已经创建了完整的环境变量配置体系：

- **`.dev.vars.example`**: 开发环境变量示例文件
- **`wrangler.toml`**: 更新了配置，包含 KV 绑定和变量说明
- **`setup-env.md`**: 详细的环境变量配置指南
- **`scripts/validate-env.js`**: 环境变量验证脚本

### 2. 必需的环境变量清单

#### OAuth 认证配置
```
GITHUB_CLIENT_ID          # GitHub OAuth 客户端 ID
GITHUB_CLIENT_SECRET      # GitHub OAuth 客户端密钥
REDIRECT_URI              # GitHub OAuth 回调地址
GITEE_CLIENT_ID           # Gitee OAuth 客户端 ID
GITEE_CLIENT_SECRET       # Gitee OAuth 客户端密钥
GITEE_REDIRECT_URI        # Gitee OAuth 回调地址
```

#### JWT 配置
```
JWT_ALGORITHM             # JWT 算法 (HS256 或 RS256)

# HS256 算法时需要：
JWT_SECRET                # JWT 密钥

# RS256 算法时需要：
JWT_PRIVATE_KEY           # RSA 私钥
JWT_PUBLIC_KEY            # RSA 公钥
```

#### API 端点配置
```
N8N_API_ENDPOINT          # n8n webhook 端点
N8N_API_CONFIRM_ENDPOINT  # n8n 确认打卡 webhook 端点
```

### 3. 配置步骤

#### 开发环境
1. 复制环境变量示例文件：
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. 编辑 `.dev.vars` 文件，填入实际值

3. 运行验证脚本：
   ```bash
   node scripts/validate-env.js
   ```

#### 生产环境
1. 在 Cloudflare Dashboard 中配置所有必需的环境变量
2. 确保为生产环境和预览环境分别配置
3. 使用强密钥和正确的回调地址

### 4. 常见配置错误及解决方案

#### 错误1: OAuth 认证失败
**原因**: 缺少 OAuth 配置或回调地址不匹配
**解决**: 
- 确保所有 OAuth 环境变量都已配置
- 验证回调地址与 OAuth 应用配置一致

#### 错误2: JWT 令牌无效
**原因**: JWT 配置缺失或格式错误
**解决**:
- 确认 JWT_ALGORITHM 配置正确
- 检查密钥格式（RS256 需要完整 PEM 格式）

#### 错误3: API 调用失败
**原因**: API 端点配置错误
**解决**:
- 验证 N8N_API_ENDPOINT 配置
- 测试 API 端点可访问性

### 5. 安全最佳实践

1. **密钥管理**:
   - 使用强随机密钥（至少32字符）
   - 定期轮换密钥
   - 不要在代码中硬编码密钥

2. **环境隔离**:
   - 开发、测试、生产环境使用不同密钥
   - 限制环境变量访问权限

3. **监控和日志**:
   - 监控认证失败日志
   - 设置异常告警

### 6. 验证工具

使用提供的验证脚本检查配置：

```bash
# 验证当前环境变量配置
node scripts/validate-env.js

# 输出示例：
# ✅ 所有必需的环境变量都已正确配置！
# 📊 配置摘要:
#    总计: 9
#    已配置: 9
#    缺失: 0
#    错误: 0
```

### 7. 部署检查清单

部署前请确认：

- [ ] 所有必需的环境变量已在 Cloudflare Dashboard 配置
- [ ] OAuth 应用回调地址已更新为生产域名
- [ ] KV 命名空间已创建并绑定
- [ ] JWT 密钥已正确配置
- [ ] API 端点可正常访问
- [ ] 验证脚本通过检查

### 8. 故障排除

如果部署后仍有问题：

1. 检查 Cloudflare Pages 函数日志
2. 验证环境变量是否正确设置
3. 测试各个功能模块（登录、API 调用等）
4. 参考 `DEPLOYMENT.md` 中的详细故障排除指南

## 相关文件

- `DEPLOYMENT.md`: 完整部署指南
- `setup-env.md`: 环境变量配置详细指南
- `.dev.vars.example`: 开发环境变量示例
- `wrangler.toml`: Cloudflare Pages 配置
- `scripts/validate-env.js`: 环境变量验证脚本

通过这套完整的配置体系，可以确保考勤系统在 Cloudflare Pages 上正确运行，避免因环境变量配置不当导致的认证失败问题。
