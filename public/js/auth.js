/**
 * 用户认证模块
 * 负责用户登录状态检查、会话管理、登出功能等认证相关功能
 */

class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.sessionCheckInterval = null;
        
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    async init() {
        console.log('初始化用户认证管理器...');
        
        try {
            // 检查用户登录状态
            await this.checkAuthStatus();
            
            // 启动定期会话检查
            this.startSessionCheck();
            
            console.log('用户认证管理器初始化完成');
            
        } catch (error) {
            console.error('认证管理器初始化失败:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * 检查用户认证状态
     */
    async checkAuthStatus() {
        try {
            console.log('检查用户认证状态...');
            
            const response = await fetch('/api/user', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.user) {
                    this.user = data.user;
                    this.isAuthenticated = true;
                    this.updateUserDisplay();
                    console.log('用户已登录:', this.user);
                } else {
                    this.handleUnauthenticated();
                }
            } else if (response.status === 401) {
                this.handleUnauthenticated();
            } else {
                throw new Error(`认证检查失败: ${response.status}`);
            }
            
        } catch (error) {
            console.error('检查认证状态失败:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * 处理未认证状态
     */
    handleUnauthenticated() {
        console.log('用户未登录，重定向到登录页面');
        this.isAuthenticated = false;
        this.user = null;
        
        // 重定向到登录页面
        window.location.href = '/login';
    }

    /**
     * 处理认证错误
     */
    handleAuthError(error) {
        console.error('认证错误:', error);
        this.isAuthenticated = false;
        this.user = null;
        
        if (window.showMessage) {
            window.showMessage('认证失败: ' + error.message, 'error');
        }
        
        // 延迟重定向，给用户时间看到错误信息
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }

    /**
     * 更新用户显示信息
     */
    updateUserDisplay() {
        const userDisplayName = document.getElementById('userDisplayName');
        if (userDisplayName && this.user) {
            // 显示用户名，优先显示真实姓名，其次显示用户名
            const displayName = this.user.realName || this.user.name || this.user.login || '用户';
            userDisplayName.textContent = displayName;
        }
        
        // 如果有真实姓名输入框，预填充用户信息
        const realNameInput = document.getElementById('realName');
        if (realNameInput && this.user) {
            if (this.user.realName) {
                realNameInput.value = this.user.realName;
            } else if (this.user.name) {
                realNameInput.value = this.user.name;
            }
        }
    }

    /**
     * 启动定期会话检查
     */
    startSessionCheck() {
        // 每5分钟检查一次会话状态
        this.sessionCheckInterval = setInterval(() => {
            this.checkAuthStatus();
        }, 5 * 60 * 1000);
    }

    /**
     * 停止会话检查
     */
    stopSessionCheck() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }

    /**
     * 用户登出
     */
    async logout() {
        try {
            console.log('用户登出...');
            
            // 停止会话检查
            this.stopSessionCheck();
            
            // 调用登出API
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 无论API调用是否成功，都清除本地状态
            this.isAuthenticated = false;
            this.user = null;
            
            // 清除本地存储
            this.clearLocalStorage();
            
            if (window.showMessage) {
                window.showMessage('已成功登出', 'success');
            }
            
            // 重定向到登录页面
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            
        } catch (error) {
            console.error('登出失败:', error);
            
            // 即使登出API失败，也要清除本地状态并重定向
            this.isAuthenticated = false;
            this.user = null;
            this.clearLocalStorage();
            
            if (window.showMessage) {
                window.showMessage('登出过程中出现错误，但已清除本地会话', 'warning');
            }
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }

    /**
     * 清除本地存储
     */
    clearLocalStorage() {
        try {
            // 清除认证相关的本地存储
            const keysToRemove = [
                'userSession',
                'authToken',
                'lastAuthCheck'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('本地存储已清除');
            
        } catch (error) {
            console.error('清除本地存储失败:', error);
        }
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * 检查是否已认证
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * 获取用户真实姓名
     */
    getUserRealName() {
        if (!this.user) return '';
        
        const realNameInput = document.getElementById('realName');
        if (realNameInput && realNameInput.value.trim()) {
            return realNameInput.value.trim();
        }
        
        return this.user.realName || this.user.name || this.user.login || '';
    }

    /**
     * 刷新用户信息
     */
    async refreshUserInfo() {
        await this.checkAuthStatus();
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // 页面变为可见时，检查认证状态
            this.checkAuthStatus();
        }
    }
}

// 全局认证管理器实例
window.authManager = null;

// 认证相关的全局函数
window.initAuth = function() {
    window.authManager = new AuthManager();
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (window.authManager) {
            window.authManager.handleVisibilityChange();
        }
    });
};

window.logout = function() {
    if (window.authManager) {
        window.authManager.logout();
    }
};

window.getCurrentUser = function() {
    return window.authManager ? window.authManager.getCurrentUser() : null;
};

window.getUserRealName = function() {
    return window.authManager ? window.authManager.getUserRealName() : '';
};

window.isUserAuthenticated = function() {
    return window.authManager ? window.authManager.isUserAuthenticated() : false;
};

// 页面加载完成后自动初始化认证
document.addEventListener('DOMContentLoaded', () => {
    window.initAuth();
});
