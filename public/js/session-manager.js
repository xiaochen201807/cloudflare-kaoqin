/**
 * 会话管理器
 * 处理会话过期检查、自动刷新和用户提醒
 */

class SessionManager {
  constructor() {
    this.checkInterval = null;
    this.warningShown = false;
    this.refreshInProgress = false;
    
    // 配置
    this.config = {
      checkIntervalMs: 30000, // 每30秒检查一次
      warningThresholdMs: 10 * 60 * 1000, // 10分钟前警告
      autoRefreshThresholdMs: 5 * 60 * 1000, // 5分钟前自动刷新
      preemptiveRefreshThresholdMs: 15 * 60 * 1000, // 15分钟前预防性刷新
      maxRetries: 3,
      retryDelayMs: 2000,
      sessionDurationMs: 7 * 24 * 60 * 60 * 1000, // 7天会话时长
      refreshCooldownMs: 60 * 1000 // 刷新冷却时间1分钟
    };

    this.lastRefreshTime = 0;
    this.refreshPromise = null;
    
    this.init();
  }
  
  init() {
    // 开始定期检查会话状态
    this.startSessionCheck();
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkSessionStatus();
      }
    });
    
    // 监听用户活动
    this.setupActivityListeners();
  }
  
  startSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, this.config.checkIntervalMs);
    
    // 立即检查一次
    this.checkSessionStatus();
  }
  
  stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  async checkSessionStatus() {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401) {
        // 会话已过期
        this.handleSessionExpired();
        return;
      }

      if (response.status === 429) {
        // 速率限制，延长检查间隔
        console.warn('Session check rate limited, extending interval');
        this.config.checkIntervalMs = Math.min(this.config.checkIntervalMs * 2, 300000); // 最多5分钟
        this.startSessionCheck();
        return;
      }

      if (!response.ok) {
        console.warn('Session check failed:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // 重置检查间隔
        this.config.checkIntervalMs = 30000;

        // 检查会话是否即将过期
        this.checkSessionExpiration(data.data);

        // 检查是否需要预防性刷新
        this.checkPreemptiveRefresh();
      }
    } catch (error) {
      console.error('Session check error:', error);
      // 网络错误时延长检查间隔
      this.config.checkIntervalMs = Math.min(this.config.checkIntervalMs * 1.5, 120000);
      this.startSessionCheck();
    }
  }
  
  checkSessionExpiration(userData) {
    const now = Date.now();
    let expiresAt;

    // 如果用户数据中包含过期时间信息
    if (userData.expiresAt) {
      expiresAt = new Date(userData.expiresAt).getTime();
    } else {
      // 如果没有过期时间，估算一个（基于会话创建时间）
      const sessionAge = now - (userData.createdAt ? new Date(userData.createdAt).getTime() : now);
      expiresAt = now + (this.config.sessionDurationMs - sessionAge);
    }

    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= this.config.autoRefreshThresholdMs) {
      // 自动刷新令牌
      this.refreshSession('auto');
    } else if (timeUntilExpiry <= this.config.warningThresholdMs && !this.warningShown) {
      // 显示即将过期警告
      this.showExpirationWarning(Math.floor(timeUntilExpiry / 60000));
    }
  }

  checkPreemptiveRefresh() {
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;

    // 如果距离上次刷新超过预防性刷新阈值，进行预防性刷新
    if (timeSinceLastRefresh >= this.config.preemptiveRefreshThresholdMs) {
      this.refreshSession('preemptive');
    }
  }
  
  async refreshSession(reason = 'manual') {
    const now = Date.now();

    // 检查冷却时间
    if (now - this.lastRefreshTime < this.config.refreshCooldownMs) {
      console.log('Session refresh skipped due to cooldown');
      return { success: false, reason: 'cooldown' };
    }

    // 如果已有刷新在进行中，等待它完成
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh(reason);
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  async _performRefresh(reason) {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount < this.config.maxRetries) {
      try {
        console.log(`Attempting session refresh (${reason}), attempt ${retryCount + 1}`);

        const response = await fetch('/api/refresh-token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.lastRefreshTime = Date.now();
            this.warningShown = false;
            this.hideExpirationWarning();

            console.log(`Session refreshed successfully (${reason}), took ${Date.now() - startTime}ms`);

            // 触发自定义事件
            this.dispatchSessionEvent('refreshed', { reason, duration: Date.now() - startTime });

            return { success: true, reason, data };
          }
        } else if (response.status === 401) {
          console.log('Session refresh failed: unauthorized');
          this.handleSessionExpired();
          return { success: false, reason: 'unauthorized' };
        } else if (response.status === 429) {
          console.log('Session refresh rate limited');
          // 速率限制时等待更长时间
          await this.delay(this.config.retryDelayMs * 3);
          retryCount++;
          continue;
        } else {
          console.warn(`Session refresh failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Session refresh attempt ${retryCount + 1} failed:`, error);
      }

      retryCount++;
      if (retryCount < this.config.maxRetries) {
        await this.delay(this.config.retryDelayMs * retryCount);
      }
    }

    console.error(`Session refresh failed after ${this.config.maxRetries} attempts`);
    this.dispatchSessionEvent('refreshFailed', { reason, attempts: retryCount });

    return { success: false, reason: 'max_retries_exceeded', attempts: retryCount };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  dispatchSessionEvent(type, detail) {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent(`session-${type}`, { detail }));
    }
  }
  
  showExpirationWarning(minutesLeft) {
    if (this.warningShown) return;
    
    this.warningShown = true;
    
    // 创建警告元素
    const warning = document.createElement('div');
    warning.id = 'session-warning';
    warning.className = 'session-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <strong>会话即将过期</strong>
          <p>您的登录会话将在 ${minutesLeft} 分钟后过期</p>
        </div>
        <div class="warning-actions">
          <button onclick="sessionManager.refreshSession()" class="btn-refresh">刷新会话</button>
          <button onclick="sessionManager.hideExpirationWarning()" class="btn-dismiss">忽略</button>
        </div>
      </div>
    `;
    
    // 添加样式
    if (!document.getElementById('session-warning-styles')) {
      const styles = document.createElement('style');
      styles.id = 'session-warning-styles';
      styles.textContent = `
        .session-warning {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          max-width: 350px;
          animation: slideIn 0.3s ease-out;
        }
        
        .warning-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .warning-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .warning-text {
          flex: 1;
        }
        
        .warning-text strong {
          color: #856404;
          display: block;
          margin-bottom: 4px;
        }
        
        .warning-text p {
          margin: 0;
          color: #856404;
          font-size: 14px;
        }
        
        .warning-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .warning-actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .btn-refresh {
          background: #007bff;
          color: white;
        }
        
        .btn-refresh:hover {
          background: #0056b3;
        }
        
        .btn-dismiss {
          background: #6c757d;
          color: white;
        }
        
        .btn-dismiss:hover {
          background: #545b62;
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
    
    document.body.appendChild(warning);
    
    // 5秒后自动隐藏
    setTimeout(() => {
      this.hideExpirationWarning();
    }, 30000);
  }
  
  hideExpirationWarning() {
    const warning = document.getElementById('session-warning');
    if (warning) {
      warning.remove();
    }
    this.warningShown = false;
  }
  
  handleSessionExpired() {
    this.stopSessionCheck();
    
    // 显示会话过期提示
    this.showSessionExpiredModal();
  }
  
  showSessionExpiredModal() {
    // 移除现有的模态框
    const existingModal = document.getElementById('session-expired-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'session-expired-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-icon">🔒</div>
          <h2>会话已过期</h2>
          <p>您的登录会话已过期，请重新登录以继续使用。</p>
          <div class="modal-actions">
            <button onclick="window.location.href='/login.html'" class="btn-login">重新登录</button>
          </div>
        </div>
      </div>
    `;
    
    // 添加模态框样式
    if (!document.getElementById('session-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'session-modal-styles';
      styles.textContent = `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 20000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .modal-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .modal-content h2 {
          color: #333;
          margin-bottom: 16px;
        }
        
        .modal-content p {
          color: #666;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        
        .btn-login {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .btn-login:hover {
          background: #0056b3;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
  }
  
  setupActivityListeners() {
    // 监听用户活动，活跃时更频繁检查
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
    
    // 根据活动状态调整检查频率
    setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      const isActive = timeSinceActivity < 5 * 60 * 1000; // 5分钟内有活动
      
      if (isActive && this.config.checkIntervalMs > 30000) {
        this.config.checkIntervalMs = 30000; // 活跃时30秒检查一次
        this.startSessionCheck();
      } else if (!isActive && this.config.checkIntervalMs < 60000) {
        this.config.checkIntervalMs = 60000; // 不活跃时1分钟检查一次
        this.startSessionCheck();
      }
    }, 60000);
  }
  
  destroy() {
    this.stopSessionCheck();
    this.hideExpirationWarning();
    
    const modal = document.getElementById('session-expired-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// 创建全局会话管理器实例
window.sessionManager = new SessionManager();
