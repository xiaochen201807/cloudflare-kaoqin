/**
 * 高德地图功能模块
 * 负责地图初始化、搜索、定位、坐标显示等核心地图功能
 */

class MapManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.placeSearch = null;
        this.geocoder = null;
        this.geolocation = null;
        this.currentLocation = null;
        this.searchHistory = this.loadSearchHistory();
        this.favoriteLocations = this.loadFavoriteLocations();
        
        this.init();
    }

    /**
     * 初始化地图
     */
    async init() {
        try {
            console.log('开始初始化高德地图...');
            
            // 等待高德地图API加载完成
            if (typeof AMap === 'undefined') {
                console.error('高德地图API未加载');
                this.showError('地图API加载失败，请刷新页面重试');
                return;
            }

            // 创建地图实例
            this.map = new AMap.Map('mapContainer', {
                zoom: 15,
                center: [116.397428, 39.90923], // 默认北京天安门
                mapStyle: 'amap://styles/normal',
                viewMode: '2D'
            });

            // 初始化插件
            this.initPlugins();
            
            // 添加地图事件监听
            this.addMapEvents();
            
            // 尝试获取当前位置
            this.getCurrentLocation();
            
            console.log('高德地图初始化完成');
            
        } catch (error) {
            console.error('地图初始化失败:', error);
            this.showError('地图初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化地图插件
     */
    initPlugins() {
        // 初始化地点搜索
        this.placeSearch = new AMap.PlaceSearch({
            pageSize: 10,
            pageIndex: 1,
            city: '全国'
        });

        // 初始化地理编码
        this.geocoder = new AMap.Geocoder({
            city: '全国',
            radius: 1000
        });

        // 初始化定位
        this.geolocation = new AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            convert: true,
            showButton: false,
            showMarker: false,
            showCircle: false
        });
    }

    /**
     * 添加地图事件监听
     */
    addMapEvents() {
        // 地图点击事件
        this.map.on('click', (e) => {
            const { lng, lat } = e.lnglat;
            this.updateLocation(lng, lat);
            this.reverseGeocode(lng, lat);
        });
    }

    /**
     * 获取当前位置
     */
    getCurrentLocation() {
        if (!this.geolocation) {
            this.showError('定位服务未初始化');
            return;
        }

        console.log('开始获取当前位置...');
        
        this.geolocation.getCurrentPosition((status, result) => {
            if (status === 'complete') {
                const { lng, lat } = result.position;
                console.log('获取位置成功:', { lng, lat });
                
                this.updateLocation(lng, lat);
                this.map.setCenter([lng, lat]);
                this.reverseGeocode(lng, lat);
                
            } else {
                console.error('定位失败:', result);
                this.showError('定位失败: ' + (result.message || '未知错误'));
            }
        });
    }

    /**
     * 搜索地点
     */
    searchLocation(keyword) {
        if (!keyword || !keyword.trim()) {
            this.showError('请输入搜索关键词');
            return;
        }

        console.log('搜索地点:', keyword);
        
        this.placeSearch.search(keyword, (status, result) => {
            if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                const poi = result.poiList.pois[0];
                const { lng, lat } = poi.location;
                
                console.log('搜索成功:', poi);
                
                // 更新地图位置
                this.updateLocation(lng, lat);
                this.map.setCenter([lng, lat]);
                
                // 更新位置信息
                this.updateLocationInfo(poi.name, lng, lat);
                
                // 添加到搜索历史
                this.addToSearchHistory({
                    name: poi.name,
                    address: poi.address || poi.name,
                    lng: lng,
                    lat: lat,
                    timestamp: Date.now()
                });
                
            } else {
                console.error('搜索失败:', result);
                this.showError('搜索失败，请尝试其他关键词');
            }
        });
    }

    /**
     * 逆地理编码（根据坐标获取地址）
     */
    reverseGeocode(lng, lat) {
        this.geocoder.getAddress([lng, lat], (status, result) => {
            if (status === 'complete' && result.regeocode) {
                const address = result.regeocode.formattedAddress;
                console.log('逆地理编码成功:', address);
                this.updateLocationInfo(address, lng, lat);
            } else {
                console.error('逆地理编码失败:', result);
                this.updateLocationInfo('未知位置', lng, lat);
            }
        });
    }

    /**
     * 更新地图标记位置
     */
    updateLocation(lng, lat) {
        // 移除旧标记
        if (this.marker) {
            this.map.remove(this.marker);
        }

        // 创建新标记
        this.marker = new AMap.Marker({
            position: [lng, lat],
            title: '当前位置'
        });

        this.map.add(this.marker);
        
        // 保存当前位置
        this.currentLocation = { lng, lat };
        
        // 更新坐标显示
        this.updateCoordinatesDisplay(lng, lat);
    }

    /**
     * 更新位置信息显示
     */
    updateLocationInfo(address, lng, lat) {
        const locationAddress = document.getElementById('locationAddress');
        const locationCoords = document.getElementById('locationCoords');
        
        if (locationAddress) {
            locationAddress.textContent = address;
        }
        
        if (locationCoords) {
            locationCoords.textContent = `坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}`;
        }
        
        // 启用提交按钮
        const submitBtn = document.getElementById('submitLocationBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    /**
     * 更新坐标显示
     */
    updateCoordinatesDisplay(lng, lat) {
        const currentCoords = document.getElementById('currentCoords');
        if (currentCoords) {
            currentCoords.innerHTML = `
                <div style="font-family: monospace; font-size: 0.9em;">
                    <div>经度: ${lng.toFixed(6)}</div>
                    <div>纬度: ${lat.toFixed(6)}</div>
                </div>
            `;
        }
    }

    /**
     * 添加到搜索历史
     */
    addToSearchHistory(location) {
        // 避免重复添加
        const exists = this.searchHistory.find(item =>
            Math.abs(item.lng - location.lng) < 0.0001 &&
            Math.abs(item.lat - location.lat) < 0.0001
        );

        if (!exists) {
            this.searchHistory.unshift(location);
            // 限制历史记录数量
            if (this.searchHistory.length > 20) {
                this.searchHistory = this.searchHistory.slice(0, 20);
            }
            this.saveSearchHistory();
            this.updateHistoryDisplay();
        }
    }

    /**
     * 更新历史记录显示
     */
    updateHistoryDisplay() {
        if (window.mainApp && window.mainApp.updateHistoryDisplay) {
            window.mainApp.updateHistoryDisplay();
        }
    }

    /**
     * 添加到收藏
     */
    addToFavorites(location) {
        // 避免重复收藏
        const exists = this.favoriteLocations.find(item =>
            Math.abs(item.lng - location.lng) < 0.0001 &&
            Math.abs(item.lat - location.lat) < 0.0001
        );

        if (!exists) {
            this.favoriteLocations.unshift(location);
            this.saveFavoriteLocations();
            this.updateFavoritesDisplay();
            this.showSuccess('已添加到收藏');
        } else {
            this.showError('该位置已在收藏中');
        }
    }

    /**
     * 更新收藏显示
     */
    updateFavoritesDisplay() {
        if (window.mainApp && window.mainApp.updateFavoritesDisplay) {
            window.mainApp.updateFavoritesDisplay();
        }
    }

    /**
     * 收藏当前位置
     */
    favoriteCurrentLocation() {
        if (!this.currentLocation) {
            this.showError('请先选择一个位置');
            return;
        }
        
        const locationAddress = document.getElementById('locationAddress');
        const address = locationAddress ? locationAddress.textContent : '未知位置';
        
        this.addToFavorites({
            name: address,
            address: address,
            lng: this.currentLocation.lng,
            lat: this.currentLocation.lat,
            timestamp: Date.now()
        });
    }

    /**
     * 获取当前位置数据
     */
    getCurrentLocationData() {
        if (!this.currentLocation) {
            return null;
        }
        
        const locationAddress = document.getElementById('locationAddress');
        const address = locationAddress ? locationAddress.textContent : '未知位置';
        
        return {
            address: address,
            longitude: this.currentLocation.lng,
            latitude: this.currentLocation.lat
        };
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('searchHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            return [];
        }
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    }

    /**
     * 加载收藏位置
     */
    loadFavoriteLocations() {
        try {
            const favorites = localStorage.getItem('favoriteLocations');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('加载收藏位置失败:', error);
            return [];
        }
    }

    /**
     * 保存收藏位置
     */
    saveFavoriteLocations() {
        try {
            localStorage.setItem('favoriteLocations', JSON.stringify(this.favoriteLocations));
        } catch (error) {
            console.error('保存收藏位置失败:', error);
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        console.error(message);
        if (window.showMessage) {
            window.showMessage(message, 'error');
        }
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        console.log(message);
        if (window.showMessage) {
            window.showMessage(message, 'success');
        }
    }
}

// 全局地图管理器实例
window.mapManager = null;

// 地图相关的全局函数
window.initMap = function() {
    window.mapManager = new MapManager();
};

window.searchLocation = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.mapManager) {
        window.mapManager.searchLocation(searchInput.value);
    }
};

window.getCurrentCoordinates = function() {
    if (window.mapManager) {
        window.mapManager.getCurrentLocation();
    }
};

window.favoriteCurrentLocation = function() {
    if (window.mapManager) {
        window.mapManager.favoriteCurrentLocation();
    }
};
