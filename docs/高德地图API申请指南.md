# 高德地图API Key申请指南

## 🌐 申请步骤

### 1. 注册高德开放平台账号
- 访问：https://console.amap.com/dev/register
- 使用手机号或邮箱注册账号
- 完成实名认证（个人或企业）

### 2. 创建应用
1. 登录控制台：https://console.amap.com/dev/key
2. 点击"创建新应用"
3. 填写应用信息：
   - 应用名称：考勤打卡系统
   - 应用类型：Web端(JS API)

### 3. 添加Key
1. 在应用中点击"添加Key"
2. 填写Key信息：
   - Key名称：考勤系统Web端
   - 服务平台：Web端(JS API)
   - 白名单：添加你的域名
     - 开发环境：localhost:*
     - 生产环境：daka.skway.me

### 4. 配置服务
确保启用以下服务：
- ✅ Web服务API
- ✅ 地理编码
- ✅ 逆地理编码  
- ✅ 搜索POI
- ✅ 定位

## 🔧 配置说明

### 白名单设置
```
# 开发环境
localhost:*
127.0.0.1:*

# 生产环境  
daka.skway.me
*.skway.me
```

### 配额说明
- 个人开发者：每日10万次免费调用
- 企业开发者：根据套餐不同有更高配额
- 超出配额后需要付费或等待次日重置

## 🚨 常见问题

### INVALID_USER_SCODE错误
- API Key无效或已过期
- 域名不在白名单中
- 配额已用完
- 服务未开通

### 解决方法
1. 检查API Key是否正确
2. 确认域名在白名单中
3. 查看配额使用情况
4. 确认所需服务已开通

## 📝 申请完成后

获得新的API Key后，需要更新代码中的Key：

```javascript
// 在 functions/_middleware.js 中找到这行：
<script type="text/javascript" src="https://webapi.amap.com/maps?v=1.4.15&key=你的新KEY"></script>
```

## 🔗 相关链接

- 高德开放平台：https://lbs.amap.com/
- 控制台：https://console.amap.com/
- API文档：https://lbs.amap.com/api/javascript-api/summary
- 常见问题：https://lbs.amap.com/faq
