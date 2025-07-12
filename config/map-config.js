// 地图配置文件
const MAP_CONFIG = {
    // 高德地图API Key
    // 请在高德开放平台申请：https://console.amap.com/dev/key
    AMAP_KEY: 'a7a90e05a37d3f6bf76d4a9032fc9129', // 临时测试Key，请替换为你自己的Key
    
    // 地图版本
    AMAP_VERSION: '1.4.15',
    
    // 地图默认配置
    DEFAULT_CONFIG: {
        zoom: 15,
        center: [116.397428, 39.90923], // 北京天安门
        mapStyle: 'amap://styles/normal',
        viewMode: '2D'
    },
    
    // 搜索配置
    SEARCH_CONFIG: {
        pageSize: 10,
        pageIndex: 1,
        city: '全国'
    },
    
    // 地理编码配置
    GEOCODER_CONFIG: {
        city: '全国',
        radius: 1000
    },
    
    // 定位配置
    GEOLOCATION_CONFIG: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    }
};

// 导出配置（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAP_CONFIG;
}

// 全局配置（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    window.MAP_CONFIG = MAP_CONFIG;
}
