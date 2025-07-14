/**
 * 主业务逻辑模块
 * 负责页面初始化、用户交互、数据提交、历史记录、收藏功能等主要业务逻辑
 */

class MainApp {
    constructor() {
        this.isSubmitting = false;
        this.messageTimeout = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('初始化主应用...');
        
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initAfterDOMReady());
            } else {
                this.initAfterDOMReady();
            }
            
        } catch (error) {
            console.error('主应用初始化失败:', error);
            this.showMessage('应用初始化失败: ' + error.message, 'error');
        }
    }

    /**
     * DOM准备就绪后的初始化
     */
    async initAfterDOMReady() {
        // 初始化地图
        if (window.initMap) {
            window.initMap();
        }
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 更新历史记录和收藏显示
        this.updateHistoryDisplay();
        this.updateFavoritesDisplay();
        
        // 初始化搜索输入框
        this.initSearchInput();
        
        console.log('主应用初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 搜索输入框回车事件
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        // 真实姓名输入框变化事件
        const realNameInput = document.getElementById('realName');
        if (realNameInput) {
            realNameInput.addEventListener('input', () => {
                this.validateForm();
            });
        }
    }

    /**
     * 初始化搜索输入框
     */
    initSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = '搜索地点...';
            searchInput.focus();
        }
    }

    /**
     * 处理搜索
     */
    handleSearch() {
        if (window.searchLocation) {
            window.searchLocation();
        }
    }

    /**
     * 刷新位置
     */
    refreshLocation() {
        console.log('刷新位置...');
        
        if (window.getCurrentCoordinates) {
            window.getCurrentCoordinates();
        }
        
        this.showMessage('正在获取位置信息...', 'info');
    }

    /**
     * 提交位置数据
     */
    async submitLocation() {
        if (this.isSubmitting) {
            return;
        }

        try {
            this.isSubmitting = true;
            this.updateSubmitButton(true);
            
            // 获取用户真实姓名
            const realName = window.getUserRealName ? window.getUserRealName() : '';
            if (!realName || !realName.trim()) {
                this.showMessage('请输入您的真实姓名', 'error');
                return;
            }

            // 获取当前位置数据
            const locationData = window.mapManager ? window.mapManager.getCurrentLocationData() : null;
            if (!locationData) {
                this.showMessage('请先选择一个位置', 'error');
                return;
            }

            // 准备提交数据
            const submitData = {
                name: realName.trim(),
                address: locationData.address,
                longitude: locationData.longitude,
                latitude: locationData.latitude,
                type: 'checkin',
                timestamp: new Date().toISOString()
            };

            console.log('提交位置数据:', submitData);
            this.showMessage('正在提交打卡信息...', 'info');

            // 提交到服务器
            const response = await fetch('/api/submit-location', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage('打卡成功！', 'success');
                console.log('提交成功:', result);
                
                // 可以在这里添加成功后的处理逻辑
                this.handleSubmitSuccess(result);
                
            } else {
                const errorMsg = result.message || '提交失败，请重试';
                this.showMessage(errorMsg, 'error');
                console.error('提交失败:', result);
            }

        } catch (error) {
            console.error('提交位置数据失败:', error);
            this.showMessage('提交失败: ' + error.message, 'error');
            
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    /**
     * 处理提交成功
     */
    handleSubmitSuccess(result) {
        // 可以在这里添加成功后的处理逻辑
        // 比如显示提交历史、重置表单等
        
        // 清空搜索输入框
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    /**
     * 更新提交按钮状态
     */
    updateSubmitButton(isSubmitting) {
        const submitBtn = document.getElementById('submitLocationBtn');
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? '提交中...' : '✅ 提交打卡';
        }
    }

    /**
     * 验证表单
     */
    validateForm() {
        const realNameInput = document.getElementById('realName');
        const submitBtn = document.getElementById('submitLocationBtn');
        
        if (realNameInput && submitBtn) {
            const hasName = realNameInput.value.trim().length > 0;
            const hasLocation = window.mapManager && window.mapManager.currentLocation;
            
            submitBtn.disabled = !hasName || !hasLocation;
        }
    }

    /**
     * 更新历史记录显示
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        if (!historyList || !window.mapManager) return;

        const history = window.mapManager.searchHistory || [];

        if (history.length === 0) {
            historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无搜索历史</div>';
            return;
        }

        const historyHTML = history.slice(0, 10).map(item => `
            <div class="history-item" onclick="selectHistoryLocation(${item.lng}, ${item.lat}, '${this.escapeHtml(item.name)}')">
                <div class="history-name">${this.escapeHtml(item.name)}</div>
                <div class="history-address">${this.escapeHtml(item.address)}</div>
                <div class="history-time">${this.formatTime(item.timestamp)}</div>
            </div>
        `).join('');

        historyList.innerHTML = historyHTML;
    }

    /**
     * 更新收藏显示
     */
    updateFavoritesDisplay() {
        const favoriteList = document.getElementById('favoriteList');
        if (!favoriteList || !window.mapManager) return;

        const favorites = window.mapManager.favoriteLocations || [];

        if (favorites.length === 0) {
            favoriteList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 0.8em;">暂无收藏地点</div>';
            return;
        }

        const favoritesHTML = favorites.slice(0, 10).map(item => `
            <div class="favorite-item" onclick="selectFavoriteLocation(${item.lng}, ${item.lat}, '${this.escapeHtml(item.name)}')">
                <div class="favorite-name">${this.escapeHtml(item.name)}</div>
                <div class="favorite-address">${this.escapeHtml(item.address)}</div>
                <div class="favorite-time">${this.formatTime(item.timestamp)}</div>
            </div>
        `).join('');

        favoriteList.innerHTML = favoritesHTML;
    }

    /**
     * 清空搜索历史
     */
    clearHistory() {
        if (window.mapManager) {
            window.mapManager.searchHistory = [];
            window.mapManager.saveSearchHistory();
            this.updateHistoryDisplay();
            this.showMessage('搜索历史已清空', 'success');
        }
    }

    /**
     * 清空收藏
     */
    clearFavorites() {
        if (window.mapManager) {
            window.mapManager.favoriteLocations = [];
            window.mapManager.saveFavoriteLocations();
            this.updateFavoritesDisplay();
            this.showMessage('收藏地点已清空', 'success');
        }
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1分钟内
            return '刚刚';
        } else if (diff < 3600000) { // 1小时内
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) { // 24小时内
            return Math.floor(diff / 3600000) + '小时前';
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) return;

        // 清除之前的定时器
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // 设置消息样式
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        statusMessage.style.display = 'block';
        statusMessage.style.padding = '10px';
        statusMessage.style.margin = '10px 0';
        statusMessage.style.borderRadius = '4px';
        statusMessage.style.backgroundColor = colors[type] || colors.info;
        statusMessage.style.color = 'white';
        statusMessage.style.fontSize = '0.9em';
        statusMessage.textContent = message;

        // 自动隐藏消息
        this.messageTimeout = setTimeout(() => {
            statusMessage.style.display = 'none';
        }, type === 'error' ? 5000 : 3000);
    }
}

// 全局应用实例
window.mainApp = null;

// 全局函数
window.refreshLocation = function() {
    if (window.mainApp) {
        window.mainApp.refreshLocation();
    }
};

window.submitLocation = function() {
    if (window.mainApp) {
        window.mainApp.submitLocation();
    }
};

window.clearHistory = function() {
    if (window.mainApp) {
        window.mainApp.clearHistory();
    }
};

window.clearFavorites = function() {
    if (window.mainApp) {
        window.mainApp.clearFavorites();
    }
};

window.selectHistoryLocation = function(lng, lat, name) {
    if (window.mapManager) {
        window.mapManager.updateLocation(lng, lat);
        window.mapManager.map.setCenter([lng, lat]);
        window.mapManager.updateLocationInfo(name, lng, lat);
    }
};

window.selectFavoriteLocation = function(lng, lat, name) {
    if (window.mapManager) {
        window.mapManager.updateLocation(lng, lat);
        window.mapManager.map.setCenter([lng, lat]);
        window.mapManager.updateLocationInfo(name, lng, lat);
    }
};

window.showMessage = function(message, type) {
    if (window.mainApp) {
        window.mainApp.showMessage(message, type);
    }
};

// 页面加载完成后自动初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
});
