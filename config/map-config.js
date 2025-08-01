// 地图配置文件
const MAP_CONFIG = {
    // 高德地图API Key
    // 请在高德开放平台申请：https://console.amap.com/dev/key
    AMAP_KEY: 'caa6c37d36bdac64cf8d3e624fec3323', // daka-cloudflare项目专用Key

    // 高德地图安全密钥
    AMAP_SECURITY_CODE: 'f1a08e21c881331769a88b1d52ed85a0', // daka-cloudflare项目安全密钥
    
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
