/**
 * 增强的日志记录系统
 * 提供结构化日志记录，支持不同级别和类型的日志
 */

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// 日志类型
const LOG_TYPES = {
  SECURITY: 'security',
  AUTH: 'auth',
  API: 'api',
  SYSTEM: 'system',
  USER: 'user',
  PERFORMANCE: 'performance'
};

// 获取客户端信息
function getClientInfo(request) {
  if (!request) return {};
  
  return {
    ip: request.headers.get('CF-Connecting-IP') || 
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
        'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
    referer: request.headers.get('Referer') || '',
    country: request.headers.get('CF-IPCountry') || 'unknown',
    ray: request.headers.get('CF-Ray') || 'unknown'
  };
}

// 获取用户信息
function getUserInfo(session) {
  if (!session || !session.user) return {};
  
  return {
    userId: session.user.id || 'unknown',
    username: session.user.login || session.user.name || 'unknown',
    provider: session.user.provider || 'unknown'
  };
}

// 创建结构化日志条目
function createLogEntry(level, type, message, context = {}, request = null, session = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: Object.keys(LOG_LEVELS)[level],
    type,
    message,
    context,
    client: getClientInfo(request),
    user: getUserInfo(session),
    environment: {
      runtime: 'cloudflare-workers',
      version: '1.0.0'
    }
  };
  
  // 添加请求信息
  if (request) {
    const url = new URL(request.url);
    logEntry.request = {
      method: request.method,
      path: url.pathname,
      query: url.search,
      headers: {
        'content-type': request.headers.get('Content-Type'),
        'accept': request.headers.get('Accept')
      }
    };
  }
  
  return logEntry;
}

// 日志记录器类
class Logger {
  constructor(context = {}) {
    this.context = context;
    this.minLevel = LOG_LEVELS.INFO; // 默认最小日志级别
  }
  
  setMinLevel(level) {
    this.minLevel = typeof level === 'string' ? LOG_LEVELS[level.toUpperCase()] : level;
  }
  
  log(level, type, message, context = {}, request = null, session = null) {
    if (level < this.minLevel) return;
    
    const logEntry = createLogEntry(level, type, message, {
      ...this.context,
      ...context
    }, request, session);
    
    // 根据级别选择输出方法
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
      case LOG_LEVELS.INFO:
        console.log(JSON.stringify(logEntry));
        break;
      case LOG_LEVELS.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.CRITICAL:
        console.error(JSON.stringify(logEntry));
        break;
    }
    
    return logEntry;
  }
  
  // 便捷方法
  debug(message, context, request, session) {
    return this.log(LOG_LEVELS.DEBUG, LOG_TYPES.SYSTEM, message, context, request, session);
  }
  
  info(message, context, request, session) {
    return this.log(LOG_LEVELS.INFO, LOG_TYPES.SYSTEM, message, context, request, session);
  }
  
  warn(message, context, request, session) {
    return this.log(LOG_LEVELS.WARN, LOG_TYPES.SYSTEM, message, context, request, session);
  }
  
  error(message, context, request, session) {
    return this.log(LOG_LEVELS.ERROR, LOG_TYPES.SYSTEM, message, context, request, session);
  }
  
  critical(message, context, request, session) {
    return this.log(LOG_LEVELS.CRITICAL, LOG_TYPES.SYSTEM, message, context, request, session);
  }
  
  // 安全相关日志
  security(level, message, context, request, session) {
    return this.log(level, LOG_TYPES.SECURITY, message, context, request, session);
  }
  
  // 认证相关日志
  auth(level, message, context, request, session) {
    return this.log(level, LOG_TYPES.AUTH, message, context, request, session);
  }
  
  // API相关日志
  api(level, message, context, request, session) {
    return this.log(level, LOG_TYPES.API, message, context, request, session);
  }
  
  // 用户行为日志
  user(level, message, context, request, session) {
    return this.log(level, LOG_TYPES.USER, message, context, request, session);
  }
  
  // 性能日志
  performance(level, message, context, request, session) {
    return this.log(level, LOG_TYPES.PERFORMANCE, message, context, request, session);
  }
}

// 预定义的日志记录器
const systemLogger = new Logger({ component: 'system' });
const authLogger = new Logger({ component: 'auth' });
const apiLogger = new Logger({ component: 'api' });
const securityLogger = new Logger({ component: 'security' });

// 特定事件的日志记录函数
const logAuthAttempt = (success, provider, request, session, details = {}) => {
  const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
  const message = success ? 'Authentication successful' : 'Authentication failed';
  
  authLogger.auth(level, message, {
    success,
    provider,
    ...details
  }, request, session);
};

const logSecurityEvent = (eventType, severity, message, request, session, details = {}) => {
  const level = severity === 'high' ? LOG_LEVELS.CRITICAL : 
                severity === 'medium' ? LOG_LEVELS.ERROR : LOG_LEVELS.WARN;
  
  securityLogger.security(level, message, {
    eventType,
    severity,
    ...details
  }, request, session);
};

const logApiRequest = (method, path, statusCode, duration, request, session, details = {}) => {
  const level = statusCode >= 500 ? LOG_LEVELS.ERROR :
                statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  
  apiLogger.api(level, 'API request processed', {
    method,
    path,
    statusCode,
    duration,
    ...details
  }, request, session);
};

const logUserAction = (action, success, request, session, details = {}) => {
  const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
  const message = `User action: ${action}`;
  
  systemLogger.user(level, message, {
    action,
    success,
    ...details
  }, request, session);
};

const logRateLimitEvent = (exceeded, identifier, path, request, details = {}) => {
  const level = exceeded ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  const message = exceeded ? 'Rate limit exceeded' : 'Rate limit check';
  
  securityLogger.security(level, message, {
    rateLimitExceeded: exceeded,
    identifier,
    path,
    ...details
  }, request);
};

const logSessionEvent = (eventType, request, session, details = {}) => {
  const level = ['expired', 'invalid'].includes(eventType) ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  const message = `Session ${eventType}`;
  
  authLogger.auth(level, message, {
    eventType,
    ...details
  }, request, session);
};

const logPerformanceMetric = (metric, value, threshold, request, session, details = {}) => {
  const level = value > threshold ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  const message = `Performance metric: ${metric}`;
  
  systemLogger.performance(level, message, {
    metric,
    value,
    threshold,
    exceeded: value > threshold,
    ...details
  }, request, session);
};

export {
  Logger,
  LOG_LEVELS,
  LOG_TYPES,
  systemLogger,
  authLogger,
  apiLogger,
  securityLogger,
  logAuthAttempt,
  logSecurityEvent,
  logApiRequest,
  logUserAction,
  logRateLimitEvent,
  logSessionEvent,
  logPerformanceMetric,
  createLogEntry,
  getClientInfo,
  getUserInfo
};
