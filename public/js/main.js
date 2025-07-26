/**
 * 主业务逻辑模块
 * 负责页面初始化、用户交互、数据提交、历史记录、收藏功能等主要业务逻辑
 */

class MainApp {
    constructor() {
        this.isSubmitting = false;
        this.messageTimeout = null;
        this.isMobile = window.innerWidth <= 768;
        
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
        
        // 初始化移动端功能
        this.initMobileFeatures();
        
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
        
        // 监听窗口大小变化，更新移动端状态
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            // 如果移动状态发生变化，重新初始化移动端功能
            if (wasMobile !== this.isMobile) {
                this.initMobileFeatures();
            }
        });
    }

    /**
     * 初始化移动端功能
     */
    initMobileFeatures() {
        if (!this.isMobile) return;
        
        console.log('初始化移动端功能...');
        
        // 初始化折叠面板
        this.initCollapsiblePanels();
        
        // 初始化视图切换
        this.initViewToggle();
        
        // 同步移动端底部提交按钮状态
        this.syncMobileSubmitButton();
        
        // 添加调试功能（开发环境）
        if (window.location.hostname === 'localhost' || 
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('192.168.') ||
            window.location.hostname.includes('.local')) {
            this.addMobileDebugTools();
        }
    }
    
    /**
     * 添加移动端调试工具
     */
    addMobileDebugTools() {
        console.log('添加移动端调试工具...');
        
        // 创建调试按钮
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '调试';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '140px';
        debugBtn.style.right = '20px';
        debugBtn.style.zIndex = '2000';
        debugBtn.style.background = '#ff9800';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '50%';
        debugBtn.style.width = '50px';
        debugBtn.style.height = '50px';
        debugBtn.style.fontSize = '14px';
        debugBtn.style.cursor = 'pointer';
        debugBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        // 添加点击事件
        debugBtn.addEventListener('click', () => {
            // 检查地址编辑元素
            const addressInput = document.getElementById('locationAddress');
            const editBtn = document.getElementById('editAddressBtn');
            const mainContainer = document.querySelector('.main-container');
            const checkinPanel = document.querySelector('.checkin-panel');
            
            // 显示调试信息
            const debugInfo = `
地址输入框: ${addressInput ? '存在' : '不存在'}
编辑按钮: ${editBtn ? '存在' : '不存在'}
输入框禁用: ${addressInput ? addressInput.disabled : 'N/A'}
视图模式: ${mainContainer.classList.contains('fullscreen-map') ? '全屏地图' : 
           mainContainer.classList.contains('fullscreen-panel') ? '全屏面板' : '分屏'}
面板显示: ${checkinPanel.style.display === 'none' ? '隐藏' : '显示'}
移动端模式: ${this.isMobile ? '是' : '否'}
屏幕宽度: ${window.innerWidth}px
`;
            
            alert(debugInfo);
            console.log('移动端调试信息:', debugInfo);
            
            // 如果地址编辑元素不存在，尝试修复
            if (!addressInput || !editBtn) {
                if (confirm('地址编辑元素缺失，是否尝试修复？')) {
                    // 切换到面板视图
                    mainContainer.classList.remove('fullscreen-map');
                    mainContainer.classList.add('fullscreen-panel');
                    
                    // 确保面板显示
                    checkinPanel.style.display = 'flex';
                    
                    // 刷新页面
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            }
        });
        
        // 添加到文档
        document.body.appendChild(debugBtn);
    }
    
    /**
     * 初始化折叠面板
     */
    initCollapsiblePanels() {
        const collapsibles = document.querySelectorAll('.collapsible-section');
        collapsibles.forEach(section => {
            const header = section.querySelector('.collapsible-header');
            const content = section.querySelector('.collapsible-content');
            
            // 默认收起
            if (content && !content.style.maxHeight) {
                content.style.maxHeight = '0px';
            }
        });
    }
    
    /**
     * 初始化视图切换
     */
    initViewToggle() {
        const viewToggleBtn = document.getElementById('viewToggleBtn');
        if (!viewToggleBtn) return;
        
        // 重置视图状态
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.classList.remove('fullscreen-map', 'fullscreen-panel');
        }
        
        // 重置按钮状态
        viewToggleBtn.innerHTML = '🗺️';
        viewToggleBtn.title = '切换到地图视图';
    }
    
    /**
     * 同步移动端底部提交按钮状态
     */
    syncMobileSubmitButton() {
        const mainSubmitBtn = document.getElementById('submitLocationBtn');
        const mobileSubmitBtn = document.getElementById('mobileSubmitBtn');
        
        if (mainSubmitBtn && mobileSubmitBtn) {
            mobileSubmitBtn.disabled = mainSubmitBtn.disabled;
        }
    }
    
    /**
     * 切换折叠面板
     */
    toggleCollapsible(header) {
        const section = header.parentElement;
        const content = section.querySelector('.collapsible-content');
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (content.style.maxHeight === '0px') {
            content.style.maxHeight = '150px';
            content.classList.add('expanded');
            toggleIcon.textContent = '▲';
        } else {
            content.style.maxHeight = '0px';
            content.classList.remove('expanded');
            toggleIcon.textContent = '▼';
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
        // 直接调用全局searchLocation函数，现在它已经修复不会导致循环调用
        window.searchLocation();
    }

    /**
     * 提交位置数据
     */
    async submitLocation() {
        console.log('提交位置数据...');
        if (this.isSubmitting) {
            return;
        }

        try {
            this.isSubmitting = true;
            this.updateSubmitButton(true);
            
            // 显示加载动画
            document.getElementById('loading-spinner').style.display = 'flex';
            
            // 获取用户真实姓名
            const realName = window.getUserRealName ? window.getUserRealName() : '';
            if (!realName || !realName.trim()) {
                this.showMessage('请输入您的真实姓名', 'error');
                document.getElementById('loading-spinner').style.display = 'none';
                return;
            }

            // 获取当前位置数据 - 使用新的getLocationData函数获取正确格式的表单数据
            const locationData = window.getLocationData ? window.getLocationData() : null;
            if (!locationData) {
                this.showMessage('请先选择一个位置', 'error');
                document.getElementById('loading-spinner').style.display = 'none';
                return;
            }

            // 准备提交数据
            const submitData = {
                realName: realName.trim(),
                ...locationData,  // 直接使用表单格式的数据
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

            // 隐藏加载动画
            document.getElementById('loading-spinner').style.display = 'none';

            // 使用类中的showResultOverlay方法，而不是全局函数
            this.showResultOverlay(result);

        } catch (error) {
            console.error('提交位置数据失败:', error);
            this.showMessage('提交失败: ' + error.message, 'error');
            
            // 隐藏加载动画
            document.getElementById('loading-spinner').style.display = 'none';
            
            // 使用类中的showResultOverlay方法，而不是全局函数
            this.showResultOverlay({
                success: false,
                message: '提交失败',
                error: error.message
            });
            
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
        
        // 同步更新移动端底部提交按钮
        const mobileSubmitBtn = document.getElementById('mobileSubmitBtn');
        if (mobileSubmitBtn) {
            mobileSubmitBtn.disabled = isSubmitting;
            mobileSubmitBtn.textContent = isSubmitting ? '提交中...' : '✅ 提交打卡';
        }
    }

    /**
     * 验证表单
     */
    validateForm() {
        const realNameInput = document.getElementById('realName');
        const submitBtn = document.getElementById('submitLocationBtn');
        const mobileSubmitBtn = document.getElementById('mobileSubmitBtn');
        
        if (realNameInput) {
            const hasName = realNameInput.value.trim().length > 0;
            const hasLocation = window.mapManager && window.mapManager.currentLocation;
            const isDisabled = !hasName || !hasLocation;
            
            // 更新主提交按钮
            if (submitBtn) {
                submitBtn.disabled = isDisabled;
            }
            
            // 更新移动端提交按钮
            if (mobileSubmitBtn) {
                mobileSubmitBtn.disabled = isDisabled;
            }
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

    /**
     * 显示结果罩层
     */
    showResultOverlay(data) {
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = '';
        
        console.log("显示结果:", data);
        
        // 根据成功或失败显示不同的消息和样式
        const statusMsg = document.createElement('div');
        if (data.success) {
            statusMsg.className = 'result-success';
            statusMsg.textContent = data.message || '打卡成功！';
        } else {
            // 如果是需要确认的错误（如早退打卡确认）
            if (data.needConfirm) {
                statusMsg.className = 'warning-message';
            } else {
                statusMsg.className = 'result-error';
            }
            statusMsg.textContent = data.message || '打卡失败！';
        }
        resultContent.appendChild(statusMsg);
        
        // 如果有提示信息，显示提示
        if (data.hint) {
            const hintItem = document.createElement('div');
            hintItem.className = 'result-item';
            hintItem.innerHTML = `<span class="result-label">提示：</span> ${data.hint}`;
            resultContent.appendChild(hintItem);
        }
        
        // 格式化日期时间
        const formatDateTime = (timestamp) => {
            if (!timestamp) return '无数据';
            if (typeof timestamp === 'string') return timestamp;
            const date = new Date(timestamp);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };
        
        // 添加主要信息
        const addResultItem = (label, value) => {
            if (value === undefined || value === null) return;
            
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `<span class="result-label">${label}：</span> ${value}`;
            resultContent.appendChild(item);
        };
        
        // 处理需要确认的情况
        if (data.needConfirm && data.confirmData) {
            console.log("需要确认，显示确认按钮");
            
            // 显示确认按钮
            const confirmButtons = document.createElement('div');
            confirmButtons.className = 'confirm-buttons';
            
            // 确认按钮
            const confirmYesBtn = document.createElement('button');
            confirmYesBtn.className = 'confirm-btn confirm-yes';
            confirmYesBtn.textContent = '确认继续打卡';
            confirmYesBtn.onclick = () => {
                // 关闭当前结果显示
                document.getElementById('result-overlay').style.display = 'none';
                
                // 显示加载动画
                document.getElementById('loading-spinner').style.display = 'flex';
                
                // 获取表单数据
                const realName = window.getUserRealName ? window.getUserRealName() : '';
                const locationData = window.getLocationData ? window.getLocationData() : {};
                
                // 准备提交数据
                const formData = {
                    realName: realName.trim(),
                    ...locationData,
                    type: 'confirm', // 修复：将类型更改为 'confirm'
                    timestamp: new Date().toISOString(),
                    // 添加确认信息
                    confirmed: true,
                    confirmData: data.confirmData
                };
                
                console.log("发送确认请求:", formData);
                
                // 重新提交请求
                fetch('/api/submit-location', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                })
                .then(response => response.json())
                .then(newData => {
                    // 隐藏加载动画
                    document.getElementById('loading-spinner').style.display = 'none';
                    
                    // 显示新结果
                    this.showResultOverlay(newData);
                })
                .catch(error => {
                    // 隐藏加载动画
                    document.getElementById('loading-spinner').style.display = 'none';
                    
                    // 显示错误信息
                    this.showResultOverlay({
                        success: false,
                        message: '提交失败',
                        error: error.message
                    });
                });
            };
            
            // 取消按钮
            const confirmNoBtn = document.createElement('button');
            confirmNoBtn.className = 'confirm-btn confirm-no';
            confirmNoBtn.textContent = '取消打卡';
            confirmNoBtn.onclick = function() {
                // 关闭当前结果显示
                document.getElementById('result-overlay').style.display = 'none';
            };
            
            confirmButtons.appendChild(confirmYesBtn);
            confirmButtons.appendChild(confirmNoBtn);
            resultContent.appendChild(confirmButtons);
            
            // 显示确认数据的详细信息
            if (data.confirmData) {
                const detailsTitle = document.createElement('div');
                detailsTitle.style.fontWeight = 'bold';
                detailsTitle.style.margin = '15px 0 10px 0';
                detailsTitle.textContent = '打卡详情';
                resultContent.appendChild(detailsTitle);
                
                // 显示关键确认信息
                const confirmData = data.confirmData;
                if (confirmData.dkrq) addResultItem('打卡日期', confirmData.dkrq);
                if (confirmData.dksj) addResultItem('打卡时间', confirmData.dksj);
                if (confirmData.jzsj) addResultItem('截止时间', confirmData.jzsj);
                if (confirmData.dklx) addResultItem('打卡类型', confirmData.dklx === "1" ? "上班" : "下班");
                if (confirmData.dkzt) addResultItem('打卡状态', this.getDkztText(confirmData.dkzt));
                
                // 显示原始消息
                if (confirmData.msg) addResultItem('系统提示', confirmData.msg);
            }
        } else {
            // 只有在成功时才显示详细结果
            if (data.success) {
                // 获取正确的结果数据
                const resultData = data.result || data;
                const results = resultData.results || [];
                
                // 如果有返回结果，显示详细信息
                if (results && results.length > 0) {
                    // 添加打卡记录标题
                    const recordsTitle = document.createElement('div');
                    recordsTitle.style.fontWeight = 'bold';
                    recordsTitle.style.margin = '15px 0 10px 0';
                    recordsTitle.textContent = `打卡记录 (共${results.length}条)`;
                    resultContent.appendChild(recordsTitle);
                    
                    // 过滤有效的打卡记录
                    const validRecords = results.filter(record => 
                        record.dx_29_dxzt !== "15" // 15表示"无效"
                    );
                    
                    // 按时间排序（最新的在前）
                    validRecords.sort((a, b) => b.dx_29_dksj - a.dx_29_dksj);
                    
                    // 分类为上班和下班记录
                    const clockInRecords = validRecords.filter(record => record.dx_29_dxlx === "1");
                    const clockOutRecords = validRecords.filter(record => record.dx_29_dxlx === "2");
                    
                    // 如果没有有效记录
                    if (validRecords.length === 0) {
                        addResultItem('提示', '没有有效的打卡记录');
                    } else {
                        // 显示上班记录
                        if (clockInRecords.length > 0) {
                            const clockInTitle = document.createElement('div');
                            clockInTitle.style.fontWeight = 'bold';
                            clockInTitle.style.margin = '10px 0 5px 0';
                            clockInTitle.style.color = '#4285f4';
                            clockInTitle.textContent = '上班打卡';
                            resultContent.appendChild(clockInTitle);
                            
                            clockInRecords.forEach(record => {
                                const recordDiv = document.createElement('div');
                                recordDiv.className = 'result-record';
                                
                                const recordContent = `
                                    <div><span class="result-label">打卡时间：</span>${formatDateTime(record.dx_29_dksj)}</div>
                                    <div><span class="result-label">打卡地点：</span>${record.dx_29_dkwz || '未知'}</div>
                                    <div><span class="result-label">打卡状态：</span>${record.dx_29_dxztmc || '未知'}</div>
                                    <div><span class="result-label">流水号：</span>${record.dx_29_ywlsh || '未知'}</div>
                                `;
                                
                                recordDiv.innerHTML = recordContent;
                                resultContent.appendChild(recordDiv);
                            });
                        }
                        
                        // 显示下班记录
                        if (clockOutRecords.length > 0) {
                            const clockOutTitle = document.createElement('div');
                            clockOutTitle.style.fontWeight = 'bold';
                            clockOutTitle.style.margin = '10px 0 5px 0';
                            clockOutTitle.style.color = '#0f9d58';
                            clockOutTitle.textContent = '下班打卡';
                            resultContent.appendChild(clockOutTitle);
                            
                            clockOutRecords.forEach(record => {
                                const recordDiv = document.createElement('div');
                                recordDiv.className = 'result-record';
                                
                                const recordContent = `
                                    <div><span class="result-label">打卡时间：</span>${formatDateTime(record.dx_29_dksj)}</div>
                                    <div><span class="result-label">打卡地点：</span>${record.dx_29_dkwz || '未知'}</div>
                                    <div><span class="result-label">打卡状态：</span>${record.dx_29_dxztmc || '未知'}</div>
                                    <div><span class="result-label">流水号：</span>${record.dx_29_ywlsh || '未知'}</div>
                                `;
                                
                                recordDiv.innerHTML = recordContent;
                                resultContent.appendChild(recordDiv);
                            });
                        }
                    }
                } else {
                    // 如果没有详细结果，只显示简单信息
                    addResultItem('消息', resultData.msg || '操作成功');
                }
            } else if (data.error) {
                // 显示错误详情
                addResultItem('错误详情', data.error);
            }
        }
        
        // 显示罩层
        document.getElementById('result-overlay').style.display = 'flex';
    }

    /**
     * 获取打卡状态文本
     */
    getDkztText(dkzt) {
        const statusMap = {
            "1": "正常",
            "2": "迟到",
            "3": "严重迟到",
            "4": "早退",
            "5": "旷工",
            "6": "未打卡",
            "7": "休息日",
            "8": "节假日",
            "9": "外勤",
            "10": "出差"
        };
        return statusMap[dkzt] || dkzt;
    }
}

// 全局应用实例
window.mainApp = null;

// 全局函数
window.refreshLocation = function() {
    if (window.mapManager) {
        // 使用新的方法，不再自动定位
        window.mapManager.refreshCurrentLocation();
    }
    
    if (window.mainApp) {
        window.mainApp.showMessage('请选择打卡位置', 'info');
    }
};

window.searchLocation = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.mapManager) {
        const keyword = searchInput.value.trim();
        window.mapManager.searchLocation(keyword);
    } else {
        console.error('搜索输入框或地图管理器未初始化');
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
        // 修复：将 lng 和 lat 包装在数组中传递
        window.mapManager.getAddressByCoords([lng, lat], true, name);
        window.mapManager.map.setCenter([lng, lat]);
        window.mapManager.hasUserSelectedLocation = true;
        console.log('用户从历史记录选择了位置，已设置标志位');
        if (window.mainApp) {
            window.mainApp.validateForm();
        }
    }
};

window.selectFavoriteLocation = function(lng, lat, name) {
    if (window.mapManager) {
        // 修复：将 lng 和 lat 包装在数组中传递
        window.mapManager.getAddressByCoords([lng, lat], true, name);
        window.mapManager.map.setCenter([lng, lat]);
        window.mapManager.hasUserSelectedLocation = true;
        console.log('用户从收藏选择了位置，已设置标志位');
        if (window.mainApp) {
            window.mainApp.validateForm();
        }
    }
};

window.showMessage = function(message, type) {
    if (window.mainApp) {
        window.mainApp.showMessage(message, type);
    }
};

// 添加全局结果显示函数
window.showResultOverlay = function(data) {
    if (window.mainApp) {
        window.mainApp.showResultOverlay(data);
    } else {
        console.error('mainApp实例不存在，无法显示结果');
        alert('系统错误：无法显示结果，请刷新页面重试');
    }
};

// 添加全局关闭结果罩层函数
window.closeResultOverlay = function() {
    document.getElementById('result-overlay').style.display = 'none';
};

// 添加折叠面板切换函数
window.toggleCollapsible = function(header) {
    if (window.mainApp) {
        window.mainApp.toggleCollapsible(header);
    } else {
        // 如果mainApp不存在，使用简单的切换逻辑
        const section = header.parentElement;
        const content = section.querySelector('.collapsible-content');
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (content.style.maxHeight === '0px') {
            content.style.maxHeight = '150px';
            content.classList.add('expanded');
            toggleIcon.textContent = '▲';
        } else {
            content.style.maxHeight = '0px';
            content.classList.remove('expanded');
            toggleIcon.textContent = '▼';
        }
    }
};

// 在文档加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
});
