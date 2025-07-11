# KV 命名空间设置指南

## 什么是 KV 命名空间

Cloudflare KV 是一个全球分布式键值存储服务，用于存储会话数据和其他持久化信息。在考勤系统中，KV 用于存储用户会话信息。

## 创建 KV 命名空间

### 步骤 1: 登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 使用您的 Cloudflare 账号登录

### 步骤 2: 创建 KV 命名空间

1. 在左侧导航栏中，点击 **"Workers & Pages"**
2. 点击 **"KV"** 选项卡
3. 点击 **"Create a namespace"** 按钮
4. 输入命名空间名称：`SESSIONS`
5. 点击 **"Add"** 按钮

### 步骤 3: 获取命名空间 ID

1. 在 KV 命名空间列表中，找到刚创建的 `SESSIONS` 命名空间
2. 复制命名空间 ID（格式类似：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）

### 步骤 4: 创建预览环境命名空间（可选）

如果您需要预览环境，重复步骤 2-3，创建名为 `SESSIONS_PREVIEW` 的命名空间。

## 配置 wrangler.toml

### 更新配置文件

编辑 `wrangler.toml` 文件，将占位符替换为实际的命名空间 ID：

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your_actual_kv_namespace_id"  # 替换为步骤3中获取的ID
preview_id = "your_preview_kv_namespace_id"  # 如果有预览环境，替换为预览环境的ID
```

### 示例配置

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
preview_id = "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7"
```

## 验证配置

### 方法 1: 使用健康检查 API

部署后访问 `/api/health` 端点，检查 KV 配置状态：

```bash
curl https://your-domain.pages.dev/api/health
```

### 方法 2: 使用 Wrangler CLI

```bash
# 检查 KV 命名空间
wrangler kv:namespace list

# 测试 KV 操作
wrangler kv:key put --binding=SESSIONS "test-key" "test-value"
wrangler kv:key get --binding=SESSIONS "test-key"
```

## 常见问题

### Q: 找不到 KV 选项卡
A: 确保您的 Cloudflare 账号有 Workers 权限。免费账号也可以使用 KV，但有使用限制。

### Q: 命名空间 ID 格式错误
A: 命名空间 ID 应该是 32 位的十六进制字符串。如果复制的 ID 格式不正确，请重新复制。

### Q: 部署后会话功能不工作
A: 检查以下项目：
1. KV 命名空间是否已创建
2. wrangler.toml 中的 ID 是否正确
3. 绑定名称是否为 "SESSIONS"

### Q: 预览环境是否必需
A: 预览环境不是必需的。如果不使用预览功能，可以省略 `preview_id` 配置。

## KV 使用限制

### 免费账号限制
- 每天 100,000 次读取操作
- 每天 1,000 次写入操作
- 1 GB 存储空间

### 付费账号限制
- 每月前 10M 次读取操作免费
- 每月前 1M 次写入操作免费
- 每 GB 存储空间 $0.50/月

## 数据管理

### 查看存储的数据

1. 在 Cloudflare Dashboard 中进入 KV 命名空间
2. 点击命名空间名称查看存储的键值对
3. 可以手动添加、编辑或删除数据

### 清理过期会话

系统会自动清理过期的会话数据。如需手动清理：

```bash
# 使用 Wrangler CLI 删除特定键
wrangler kv:key delete --binding=SESSIONS "session-key"

# 批量删除（需要脚本）
wrangler kv:key list --binding=SESSIONS | jq -r '.[] | .name' | xargs -I {} wrangler kv:key delete --binding=SESSIONS {}
```

## 安全注意事项

1. **访问控制**: KV 数据只能通过 Workers/Pages 函数访问，不能直接从客户端访问
2. **数据加密**: Cloudflare 自动加密存储的数据
3. **会话安全**: 确保会话 ID 是随机生成的，并设置合适的过期时间
4. **监控**: 定期检查 KV 使用情况，防止异常访问

## 故障排除

如果遇到 KV 相关问题：

1. 检查 Cloudflare Dashboard 中的 KV 命名空间状态
2. 验证 wrangler.toml 配置是否正确
3. 查看 Pages 函数日志中的错误信息
4. 使用健康检查 API 验证配置
5. 联系 Cloudflare 支持（如果是平台问题）

通过正确配置 KV 命名空间，您的考勤系统将能够可靠地存储和管理用户会话数据。
