/**
 * API 速率限制中间件
 * 使用 Cloudflare KV 存储实现分布式速率限制
 */

// 速率限制配置
const RATE_LIMIT_CONFIG = {
  // 通用API限制
  default: {
    windowMs: 60 * 1000, // 1分钟窗口
    maxRequests: 60, // 每分钟最多60次请求
    message: "请求过于频繁，请稍后再试"
  },
  
  // 登录相关API限制（更严格）
  auth: {
    windowMs: 15 * 60 * 1000, // 15分钟窗口
    maxRequests: 10, // 每15分钟最多10次登录尝试
    message: "登录尝试过于频繁，请15分钟后再试"
  },
  
  // 打卡API限制
  checkin: {
    windowMs: 60 * 1000, // 1分钟窗口
    maxRequests: 5, // 每分钟最多5次打卡请求
    message: "打卡请求过于频繁，请稍后再试"
  },
  
  // 健康检查API限制（较宽松）
  health: {
    windowMs: 60 * 1000, // 1分钟窗口
    maxRequests: 120, // 每分钟最多120次请求
    message: "健康检查请求过于频繁"
  }
};

/**
 * 获取客户端IP地址
 */
function getClientIP(request) {
  // Cloudflare 提供的真实IP头
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // 其他常见的IP头
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) return xRealIP;
  
  // 回退到默认值
  return 'unknown';
}

/**
 * 获取用户标识符（IP + User-Agent 的哈希）
 */
async function getUserIdentifier(request) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // 创建唯一标识符
  const identifier = `${ip}:${userAgent.substring(0, 100)}`;
  
  // 使用简单的哈希函数
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.substring(0, 16); // 使用前16位作为标识符
}

/**
 * 根据路径获取速率限制配置
 */
function getRateLimitConfig(path) {
  if (path.includes('/oauth/') || path.includes('/login')) {
    return RATE_LIMIT_CONFIG.auth;
  }
  
  if (path.includes('/api/submit-location')) {
    return RATE_LIMIT_CONFIG.checkin;
  }
  
  if (path.includes('/api/health')) {
    return RATE_LIMIT_CONFIG.health;
  }
  
  return RATE_LIMIT_CONFIG.default;
}

/**
 * 检查速率限制
 */
async function checkRateLimit(context, path) {
  const { request, env } = context;
  
  // 如果没有KV存储，跳过速率限制
  if (!env.SESSIONS) {
    console.warn('Rate limiting disabled: KV storage not available');
    return { allowed: true };
  }
  
  try {
    const config = getRateLimitConfig(path);
    const userIdentifier = await getUserIdentifier(request);
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    
    // KV键格式: rate_limit:{identifier}:{window}
    const key = `rate_limit:${userIdentifier}:${windowStart}`;
    
    // 获取当前窗口的请求计数
    const currentCountStr = await env.SESSIONS.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
    
    if (currentCount >= config.maxRequests) {
      // 记录速率限制事件
      console.warn('Rate limit exceeded', {
        identifier: userIdentifier,
        path: path,
        count: currentCount,
        limit: config.maxRequests,
        window: config.windowMs,
        ip: getClientIP(request),
        userAgent: request.headers.get('User-Agent')
      });
      
      return {
        allowed: false,
        message: config.message,
        retryAfter: Math.ceil((windowStart + config.windowMs - now) / 1000),
        limit: config.maxRequests,
        remaining: 0,
        reset: windowStart + config.windowMs
      };
    }
    
    // 增加计数
    const newCount = currentCount + 1;
    const ttl = Math.ceil((windowStart + config.windowMs - now) / 1000);
    
    await env.SESSIONS.put(key, newCount.toString(), {
      expirationTtl: ttl
    });
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount,
      reset: windowStart + config.windowMs
    };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // 出错时允许请求通过，但记录错误
    return { allowed: true, error: error.message };
  }
}

/**
 * 创建速率限制响应
 */
function createRateLimitResponse(rateLimitResult) {
  const headers = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '0',
    'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
    'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '0'
  };
  
  if (rateLimitResult.retryAfter) {
    headers['Retry-After'] = rateLimitResult.retryAfter.toString();
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: rateLimitResult.message || '请求过于频繁',
        code: 429,
        type: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }
    }),
    {
      status: 429,
      headers
    }
  );
}

/**
 * 添加速率限制头到响应
 */
function addRateLimitHeaders(response, rateLimitResult) {
  if (!rateLimitResult.limit) return response;
  
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  newResponse.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  newResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining?.toString() || '0');
  newResponse.headers.set('X-RateLimit-Reset', rateLimitResult.reset?.toString() || '0');
  
  return newResponse;
}

/**
 * 速率限制中间件
 */
async function rateLimitMiddleware(context, next) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 检查速率限制
  const rateLimitResult = await checkRateLimit(context, path);
  
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }
  
  // 继续处理请求
  const response = await next();
  
  // 添加速率限制头
  return addRateLimitHeaders(response, rateLimitResult);
}

/**
 * 清理过期的速率限制记录（可选的维护函数）
 */
async function cleanupRateLimitRecords(env) {
  if (!env.SESSIONS) return;
  
  try {
    // 这个函数可以通过定时任务调用
    // Cloudflare KV 会自动清理过期的键，所以通常不需要手动清理
    console.log('Rate limit cleanup completed');
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}

export {
  rateLimitMiddleware,
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  cleanupRateLimitRecords,
  RATE_LIMIT_CONFIG
};
