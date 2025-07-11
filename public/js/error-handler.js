/**
 * 前端错误处理系统
 * 提供统一的错误处理、用户友好的错误提示和错误恢复机制
 */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.isOnline = navigator.onLine;
    
    this.init();
  }
  
  init() {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNetworkStatus('网络连接已恢复', 'success');
      this.retryFailedRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNetworkStatus('网络连接已断开', 'error');
    });
    
    // 全局错误捕获
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, event.filename, event.lineno);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseRejection(event.reason);
    });
  }
  
  // 处理API响应错误
  async handleApiError(response, requestInfo = {}) {
    const { url, method = 'GET', retryCount = 0 } = requestInfo;
    
    try {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() || '未知错误' };
      }
      
      const error = {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || errorData.error?.message || '请求失败',
        code: errorData.error?.code || response.status,
        type: errorData.error?.type || 'API_ERROR',
        details: errorData.error?.details || {},
        url,
        method,
        timestamp: new Date().toISOString(),
        retryCount
      };
      
      return this.processError(error, requestInfo);
    } catch (parseError) {
      return this.processError({
        status: response.status,
        statusText: response.statusText,
        message: '响应解析失败',
        type: 'PARSE_ERROR',
        url,
        method,
        timestamp: new Date().toISOString(),
        retryCount
      }, requestInfo);
    }
  }
  
  // 处理网络错误
  handleNetworkError(error, requestInfo = {}) {
    const { url, method = 'GET', retryCount = 0 } = requestInfo;
    
    const networkError = {
      status: 0,
      statusText: 'Network Error',
      message: this.isOnline ? '网络请求失败' : '网络连接已断开',
      type: 'NETWORK_ERROR',
      url,
      method,
      timestamp: new Date().toISOString(),
      retryCount,
      originalError: error.message
    };
    
    return this.processError(networkError, requestInfo);
  }
  
  // 处理全局JavaScript错误
  handleGlobalError(error, filename, lineno) {
    console.error('Global error:', error, filename, lineno);
    
    this.showErrorMessage('页面发生错误，请刷新页面重试', 'error', {
      persistent: true,
      actions: [
        {
          text: '刷新页面',
          action: () => window.location.reload()
        }
      ]
    });
  }
  
  // 处理Promise拒绝
  handlePromiseRejection(reason) {
    console.error('Unhandled promise rejection:', reason);
    
    if (reason && reason.name === 'AbortError') {
      // 忽略取消的请求
      return;
    }
    
    this.showErrorMessage('操作失败，请重试', 'error');
  }
  
  // 处理错误的核心逻辑
  processError(error, requestInfo = {}) {
    console.error('Processing error:', error);
    
    // 根据错误类型和状态码决定处理策略
    switch (error.status) {
      case 401:
        return this.handleUnauthorized(error);
      case 403:
        return this.handleForbidden(error);
      case 404:
        return this.handleNotFound(error);
      case 429:
        return this.handleRateLimit(error, requestInfo);
      case 500:
      case 502:
      case 503:
      case 504:
        return this.handleServerError(error, requestInfo);
      default:
        return this.handleGenericError(error, requestInfo);
    }
  }
  
  // 处理401未授权错误
  handleUnauthorized(error) {
    this.showErrorMessage('登录已过期，请重新登录', 'warning', {
      persistent: true,
      actions: [
        {
          text: '重新登录',
          action: () => window.location.href = '/login.html'
        }
      ]
    });
    
    return { shouldRetry: false, handled: true };
  }
  
  // 处理403禁止访问错误
  handleForbidden(error) {
    this.showErrorMessage('没有权限执行此操作', 'error');
    return { shouldRetry: false, handled: true };
  }
  
  // 处理404未找到错误
  handleNotFound(error) {
    this.showErrorMessage('请求的资源不存在', 'error');
    return { shouldRetry: false, handled: true };
  }
  
  // 处理429速率限制错误
  handleRateLimit(error, requestInfo) {
    const retryAfter = error.details?.retryAfter || 60;
    
    this.showErrorMessage(`请求过于频繁，请${retryAfter}秒后重试`, 'warning', {
      duration: retryAfter * 1000
    });
    
    // 自动重试
    if (requestInfo.autoRetry !== false) {
      setTimeout(() => {
        this.retryRequest(requestInfo);
      }, retryAfter * 1000);
      
      return { shouldRetry: true, retryAfter: retryAfter * 1000, handled: true };
    }
    
    return { shouldRetry: false, handled: true };
  }
  
  // 处理服务器错误
  handleServerError(error, requestInfo) {
    const canRetry = requestInfo.retryCount < this.maxRetries;
    
    if (canRetry && requestInfo.autoRetry !== false) {
      this.showErrorMessage('服务器暂时不可用，正在重试...', 'warning');
      
      const delay = this.retryDelay * Math.pow(2, requestInfo.retryCount);
      setTimeout(() => {
        this.retryRequest(requestInfo);
      }, delay);
      
      return { shouldRetry: true, retryAfter: delay, handled: true };
    } else {
      this.showErrorMessage('服务器错误，请稍后重试', 'error', {
        actions: [
          {
            text: '重试',
            action: () => this.retryRequest({ ...requestInfo, retryCount: 0 })
          }
        ]
      });
      
      return { shouldRetry: false, handled: true };
    }
  }
  
  // 处理通用错误
  handleGenericError(error, requestInfo) {
    const message = error.message || '操作失败，请重试';
    
    this.showErrorMessage(message, 'error', {
      actions: [
        {
          text: '重试',
          action: () => this.retryRequest({ ...requestInfo, retryCount: 0 })
        }
      ]
    });
    
    return { shouldRetry: false, handled: true };
  }
  
  // 重试请求
  async retryRequest(requestInfo) {
    if (!requestInfo.retryFunction) {
      console.warn('No retry function provided');
      return;
    }
    
    try {
      await requestInfo.retryFunction();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }
  
  // 重试所有失败的请求
  async retryFailedRequests() {
    const failedRequests = [...this.errorQueue];
    this.errorQueue = [];
    
    for (const request of failedRequests) {
      try {
        await this.retryRequest(request);
      } catch (error) {
        console.error('Failed to retry request:', error);
      }
    }
  }
  
  // 显示错误消息
  showErrorMessage(message, type = 'error', options = {}) {
    const {
      duration = 5000,
      persistent = false,
      actions = []
    } = options;
    
    // 移除现有的错误消息
    this.hideErrorMessage();
    
    // 创建错误消息元素
    const errorElement = document.createElement('div');
    errorElement.id = 'error-message';
    errorElement.className = `error-message error-${type}`;
    
    const iconMap = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };
    
    errorElement.innerHTML = `
      <div class="error-content">
        <div class="error-icon">${iconMap[type] || '❌'}</div>
        <div class="error-text">${message}</div>
        <div class="error-actions">
          ${actions.map(action => 
            `<button class="error-action-btn" onclick="this.parentElement.parentElement.parentElement.remove(); (${action.action.toString()})()">${action.text}</button>`
          ).join('')}
          <button class="error-close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
      </div>
    `;
    
    // 添加样式
    this.addErrorStyles();
    
    // 添加到页面
    document.body.appendChild(errorElement);
    
    // 自动隐藏（如果不是持久的）
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.hideErrorMessage();
      }, duration);
    }
  }
  
  // 显示网络状态
  showNetworkStatus(message, type) {
    this.showErrorMessage(message, type, { duration: 3000 });
  }
  
  // 隐藏错误消息
  hideErrorMessage() {
    const existingError = document.getElementById('error-message');
    if (existingError) {
      existingError.remove();
    }
  }
  
  // 添加错误样式
  addErrorStyles() {
    if (document.getElementById('error-handler-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'error-handler-styles';
    styles.textContent = `
      .error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      }
      
      .error-error { border-left: 4px solid #e74c3c; }
      .error-warning { border-left: 4px solid #f39c12; }
      .error-success { border-left: 4px solid #27ae60; }
      .error-info { border-left: 4px solid #3498db; }
      
      .error-content {
        display: flex;
        align-items: flex-start;
        padding: 16px;
        gap: 12px;
      }
      
      .error-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      
      .error-text {
        flex: 1;
        color: #333;
        line-height: 1.4;
      }
      
      .error-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .error-action-btn {
        padding: 4px 8px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .error-action-btn:hover {
        background: #2980b9;
      }
      
      .error-close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .error-close-btn:hover {
        color: #333;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// API客户端类，集成错误处理
class ApiClient {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.baseURL = '';
    this.defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  async request(url, options = {}) {
    const requestInfo = {
      url,
      method: options.method || 'GET',
      retryCount: options.retryCount || 0,
      autoRetry: options.autoRetry !== false,
      retryFunction: () => this.request(url, { ...options, retryCount: (options.retryCount || 0) + 1 })
    };

    try {
      const response = await fetch(url, {
        ...this.defaultOptions,
        ...options
      });

      if (!response.ok) {
        const errorResult = await this.errorHandler.handleApiError(response, requestInfo);

        if (errorResult.shouldRetry) {
          // 错误处理器会自动重试
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              this.request(url, { ...options, retryCount: requestInfo.retryCount + 1 })
                .then(resolve)
                .catch(reject);
            }, errorResult.retryAfter || 1000);
          });
        }

        throw new Error(errorResult.message || '请求失败');
      }

      return response;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // 网络错误
        const errorResult = this.errorHandler.handleNetworkError(error, requestInfo);

        if (errorResult.shouldRetry) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              this.request(url, { ...options, retryCount: requestInfo.retryCount + 1 })
                .then(resolve)
                .catch(reject);
            }, errorResult.retryAfter || 1000);
          });
        }
      }

      throw error;
    }
  }

  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();
const apiClient = new ApiClient(errorHandler);

// 导出给其他模块使用
if (typeof window !== 'undefined') {
  window.errorHandler = errorHandler;
  window.apiClient = apiClient;
}
