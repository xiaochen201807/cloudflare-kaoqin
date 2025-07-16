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
        this.formData = null; // 添加formData属性用于存储表单数据
        this.hasUserSelectedLocation = false; // 添加标志位，标记用户是否已选择位置
        
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
            timeout: 30000, // 直接在这里设置超时时间为30秒
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

            console.log('地图点击位置:', { lng, lat });
            this.updateLocation(lng, lat);
            this.getAddressByCoords([lng, lat], true); // 修改为自动显示信息窗口
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

        // 如果用户已经选择了位置，不再使用自动定位覆盖
        if (this.hasUserSelectedLocation) {
            console.log('用户已选择位置，跳过自动定位');
            return;
        }

        console.log('开始获取当前位置...');

        // 先检查浏览器是否支持地理位置API
if (!navigator.geolocation) {
            console.error('浏览器不支持地理位置API');
            this.showError('您的浏览器不支持地理位置功能');
            return;
        }


        // 检查权限状态
        if (navigator.permissions) {
            navigator.permissions.query({name: 'geolocation'}).then((result) => {
                console.log('地理位置权限状态:', result.state);
                if (result.state === 'denied') {
            this.showError('地理位置权限被拒绝，请在浏览器设置中允许位置访问');
                    return;
                }
            });
        }

        // 增加超时时间到30秒，解决某些网络环境下定位超时问题
        // 注意：不是所有版本的高德地图API都支持setTimeout方法
        try {
            // 尝试设置超时时间，如果不支持则忽略
            if (typeof this.geolocation.setTimeout === 'function') {
                this.geolocation.setTimeout(30000);
            } else {
                console.log('当前版本的高德地图API不支持setTimeout方法，使用默认超时时间');
                // 可以尝试使用其他方式设置超时时间，例如在创建geolocation实例时设置
            }
        } catch (error) {
            console.error('设置超时时间失败:', error);
        }
        
        this.geolocation.getCurrentPosition((status, result) => {
            console.log('高德定位回调 - 状态:', status, '结果:', result);

            if (status === 'complete') {
                const { lng, lat } = result.position;
                console.log('获取位置成功:', { lng, lat });

                this.updateLocation(lng, lat);
        this.map.setCenter([lng, lat]);
                this.getAddressByCoords([lng, lat], true); // 添加参数，表示需要自动显示信息窗口

            } else {
                console.error('定位失败:', result);

                console.error('错误详情:', {
                    message: result.message,
                    info: result.info,
                    status: status
        });

                // 提供更详细的错误信息
                let errorMessage = '定位失败';
                if (result.message) {
                    if (result.message.includes('User denied')) {
                        errorMessage = '用户拒绝了位置权限请求，请允许位置访问后重试';
                    } else if (result.message.includes('timeout')) {
                        errorMessage = '定位超时，请检查网络连接或重试';
                    } else if (result.message.includes('unavailable')) {
                        errorMessage = '位置服务不可用，请检查设备GPS设置';
                    } else {
                        errorMessage = '定位失败: ' + result.message;
                    }
        } else {
                    errorMessage = '定位失败，请确保已允许位置权限并重试';
                }

                this.showError(errorMessage);

                // 尝试使用浏览器原生定位作为备选方案
                this.tryNativeGeolocation();
            }
});
    }

               
           

    /**
               
     * 尝试使用浏览器原生地理位置API作为备选方案
     */
    tryNativeGeolocation() {
        console.log('尝试使用浏览器原生地理位置API...');

        if (!navigator.geolocation) {
            console.error('浏览器不支持原生地理位置API');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 30000, // 增加超时时间到30秒
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('原生定位成功:', position);
                const { longitude: lng, latitude: lat } = position.coords;

                this.updateLocation(lng, lat);
                this.map.setCenter([lng, lat]);
                this.getAddressByCoords([lng, lat], true); // 添加参数，表示需要自动显示信息窗口

                this.showSuccess('已使用浏览器定位获取位置'); // 修复方法调用错误
            },
            (error) => {
                console.error('原生定位也失败:', error);
                let errorMessage = '无法获取位置信息';

                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '位置权限被拒绝，请在浏览器地址栏点击位置图标允许访问';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '位置信息不可用，请检查设备GPS设置';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '获取位置超时，请重试';
                        break;
                    default:
                        errorMessage = '获取位置失败: ' + error.message;
                        break;
                }

                this.showError(errorMessage);
            },
            options
        );
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
                
                // 获取详细地址信息
                this.getAddressByCoords([lng, lat], true); // 添加参数，表示需要自动显示信息窗口
        
                // 添加到搜索历史
                this.addToSearchHistory({
                    name: poi.name,
                    address: poi.address || poi.name,
                    lng: lng,
                    lat: lat,
                    timestamp: Date.now()
                });
                
                // 设置用户已选择位置标志
                this.hasUserSelectedLocation = true;
                console.log('用户通过搜索选择了位置，已设置标志位');
                
            } else {
                console.error('搜索失败:', result);
                this.showError('搜索失败，请尝试其他关键词');
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

        // 创建新标记，支持拖拽
        this.marker = new AMap.Marker({
            position: [lng, lat],
            title: '当前位置',
            draggable: true, // 启用拖拽
            cursor: 'move'
        });

        // 添加标记拖拽事件
        this.marker.on('dragend', (e) => {
            const { lng: newLng, lat: newLat } = e.lnglat;
            console.log('标记拖拽到新位置:', { lng: newLng, lat: newLat });

            // 更新位置信息
            this.currentLocation = { lng: newLng, lat: newLat };
            this.updateCoordinatesDisplay(newLng, newLat);

            // 获取新位置的地址信息
            this.getAddressByCoords([newLng, newLat]);
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
            // 修改为设置输入框的值，而不是文本内容
            locationAddress.value = address;
        }
        
        if (locationCoords) {
            locationCoords.textContent = `坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}`;
        }
           
        
        // 启用提交按钮
        const submitBtn = document.getElementById('submitLocationBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            
            // 同步移动端按钮状态
            if (window.mainApp) {
                window.mainApp.syncMobileSubmitButton();
            }
        }
    }

    /**
     * 切换地址编辑模式
     */
    toggleAddressEdit() {
        const addressInput = document.getElementById('locationAddress');
        const editBtn = document.getElementById('editAddressBtn');
        
        console.log('切换地址编辑模式 - 输入框:', addressInput ? '存在' : '不存在', '编辑按钮:', editBtn ? '存在' : '不存在');
        
        if (!addressInput || !editBtn) {
            console.error('地址编辑元素不存在，无法切换编辑模式');
            return;
        }
        
        const isEditing = !addressInput.disabled;
        console.log('当前编辑状态:', isEditing ? '编辑中' : '未编辑', '输入框禁用状态:', addressInput.disabled);
        
        if (isEditing) {
            // 当前是编辑模式，需要保存
            console.log('保存地址编辑');
            this.saveEditedAddress();
            addressInput.disabled = true;
            editBtn.innerHTML = '✏️';
            editBtn.title = '编辑地址';
            editBtn.classList.remove('save-mode');
        } else {
            // 当前是查看模式，切换到编辑模式
            console.log('进入地址编辑模式');
            addressInput.disabled = false;
            addressInput.focus();
            editBtn.innerHTML = '💾';
            editBtn.title = '保存地址';
            editBtn.classList.add('save-mode');
        }
    }
    
    /**
     * 保存编辑后的地址
     */
    saveEditedAddress() {
        const addressInput = document.getElementById('locationAddress');
        if (!addressInput || !this.currentLocation) return;
        
        const editedAddress = addressInput.value.trim();
        if (!editedAddress) {
            this.showError('地址不能为空');
            return;
        }
        
        console.log('保存编辑后的地址:', editedAddress);
        
        // 显示加载提示
        this.showMessage('正在搜索地址位置...', 'info');
        
        // 使用高德地图搜索服务查询地址对应的位置
        if (this.placeSearch) {
            this.placeSearch.search(editedAddress, (status, result) => {
                if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                    const poi = result.poiList.pois[0];
                    const { lng, lat } = poi.location;
                    
                    console.log('地址搜索成功:', poi);
                    
                    // 更新地图位置
                    this.updateLocation(lng, lat);
                    this.map.setCenter([lng, lat]);
                    
                    // 更新表单数据
                    if (this.formData) {
                        this.formData['form-address'] = editedAddress;
                        this.formData['form-clock-address'] = editedAddress;
                        this.formData['form-lng'] = lng;
                        this.formData['form-lat'] = lat;
                        this.formData['form-clock-coordinates'] = `${lng},${lat}`;
                    }
                    
                    // 设置用户已选择位置标志
                    this.hasUserSelectedLocation = true;
                    console.log('用户通过编辑地址选择了位置，已设置标志位');
                    
                    // 显示成功消息
                    this.showSuccess('地址已更新，位置已同步');
                    
                    // 添加到搜索历史
                    this.addToSearchHistory({
                        name: editedAddress,
                        address: editedAddress,
                        lng: lng,
                        lat: lat,
                        timestamp: Date.now()
                    });
                    
                } else {
                    console.warn('地址搜索无结果:', result);
                    
                    // 仅更新地址文本，保持原有坐标
                    if (this.formData) {
                        this.formData['form-address'] = editedAddress;
                        this.formData['form-clock-address'] = editedAddress;
                    }
                    
                    this.showMessage('无法找到该地址的精确位置，仅更新地址文本', 'warning');
                }
            });
        } else {
            // 如果搜索服务不可用，仅更新地址文本
            if (this.formData) {
                this.formData['form-address'] = editedAddress;
                this.formData['form-clock-address'] = editedAddress;
            }
            
            this.showSuccess('地址已更新');
        }
    }

    /**
     * 根据坐标获取地址信息（按照原项目实现）
     */
    getAddressByCoords(position, autoShowInfoWindow = false) {
        console.log('开始根据坐标获取地址:', position);

        if (!this.geocoder) {
            console.error('地理编码器未初始化');
            this.showLocationInfo('未知位置', '地理编码器未初始化', position);
            return;
        }

        // 确保position是AMap.LngLat对象或数组格式
        let lngLatPosition;
        if (Array.isArray(position)) {
            lngLatPosition = new AMap.LngLat(position[0], position[1]);
        } else if (position.lng !== undefined && position.lat !== undefined) {
            lngLatPosition = new AMap.LngLat(position.lng, position.lat);
        } else {
            lngLatPosition = position;
        }

        this.geocoder.getAddress(lngLatPosition, (status, result) => {
            console.log('逆地理编码状态:', status, '结果:', result);

            if (status === 'complete' && result.info === 'OK') {
                const regeocode = result.regeocode;
                const address = regeocode.formattedAddress;

                // 按照原项目实现，优先获取township作为位置名称
                const addressComponent = regeocode.addressComponent;
                const name = addressComponent.township ||
                           addressComponent.district ||
                           addressComponent.city ||
                           addressComponent.province ||
                           '未知位置';

                console.log('获取地址成功:', { name, address, addressComponent });

                // 获取坐标值
                const lng = lngLatPosition.getLng ? lngLatPosition.getLng() : lngLatPosition.lng;
                const lat = lngLatPosition.getLat ? lngLatPosition.getLat() : lngLatPosition.lat;

                // 更新位置信息显示
                this.updateLocationInfo(address, lng, lat);

                // 显示信息窗口（如果需要自动显示）
                if (autoShowInfoWindow) {
                    this.showLocationInfo(name, address, [lng, lat]);
                }

                // 获取省市信息并更新表单（参考原项目）
                this.updateFormWithAddressInfo(addressComponent, lng, lat, address);
                
                // 更新表单验证状态，启用提交按钮
                if (window.mainApp) {
                    window.mainApp.validateForm();
                }

            } else {
                console.error('逆地理编码失败:', { status, result });
                const lng = lngLatPosition.getLng ? lngLatPosition.getLng() : lngLatPosition.lng;
                const lat = lngLatPosition.getLat ? lngLatPosition.getLat() : lngLatPosition.lat;
                const coords = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
                this.updateLocationInfo(`坐标位置 (${coords})`, lng, lat);
                
                // 显示信息窗口（如果需要自动显示）
                if (autoShowInfoWindow) {
                    this.showLocationInfo('未知位置', `坐标: ${coords}`, [lng, lat]);
                }
                
                // 即使获取地址失败，也更新表单验证状态
                if (window.mainApp) {
                    window.mainApp.validateForm();
                }
            }
        });
    }

    /**
     * 更新表单的地址信息（参考原项目实现）
     */
    updateFormWithAddressInfo(addressComponent, lng, lat, address) {
        try {
            // 获取省市信息
            const provinceCode = addressComponent.adcode ? addressComponent.adcode.substring(0, 2) + '0000' : '000000';
            const cityCode = addressComponent.adcode ? addressComponent.adcode.substring(0, 4) + '00' : '000000';
            const cityName = addressComponent.city || '';
            const provinceShort = this.getProvinceShort(addressComponent.province);

            // 更新隐藏表单字段（如果存在）
            const formElements = {
               
                'form-lng': lng,
                'form-lat': lat,
                'form-address': address,
                'form-clock-coordinates': `${lng},${lat}`,
                'form-clock-address': address,
                'form-province-code': provinceCode,
                'form-province-short': provinceShort,
                'form-city-code': cityCode,
                'form-city-name': cityName
            };

            Object.entries(formElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                }
            });

            // 保存到对象中，确保在提交时能够获取到这些数据
            this.formData = { ...formElements };

            console.log('表单信息已更新:', formElements);
        } catch (error) {
            console.error('更新表单信息失败:', error);
        }
    }

    /**
     * 获取省份简称（参考原项目实现）
     */
    getProvinceShort(province) {
        const provinceToShortMap = {
            "北京市": "京", "天津市": "津", "河北省": "冀", "山西省": "晋",
            "内蒙古自治区": "蒙", "辽宁省": "辽", "吉林省": "吉", "黑龙江省": "黑",
            "上海市": "沪", "江苏省": "苏", "浙江省": "浙", "安徽省": "皖",
            "福建省": "闽", "江西省": "赣", "山东省": "鲁", "河南省": "豫",
            "湖北省": "鄂", "湖南省": "湘", "广东省": "粤", "广西壮族自治区": "桂",
            "海南省": "琼", "重庆市": "渝", "四川省": "川", "贵州省": "贵",
            "云南省": "云", "西藏自治区": "藏", "陕西省": "陕", "甘肃省": "甘",
            "青海省": "青", "宁夏回族自治区": "宁", "新疆维吾尔自治区": "新",
            "香港特别行政区": "港", "澳门特别行政区": "澳", "台湾省": "台"
        };  
  
        return province && provinceToShortMap[province] ?
               provinceToShortMap[province] :
               (province ? province.substring(0, 1) : '');
    }
  
    /**
     * 显示位置信息窗口
     */
    showLocationInfo(name, address, position) {
        // 移除旧的信息窗口
        if (this.infoWindow) {
            this.infoWindow.close();
        }

        // 创建信息窗口 - 参考demo.html的简洁实现
        this.infoWindow = new AMap.InfoWindow({
            content: `<div><h3>${name}</h3><p>${address}</p></div>`,
            offset: new AMap.Pixel(0, -30)
        });

        // 确保position是正确的格式
        let lngLatPosition;
        if (Array.isArray(position)) {
            lngLatPosition = new AMap.LngLat(position[0], position[1]);
        } else {
            lngLatPosition = position;
        }

        // 在指定位置打开信息窗口
        this.infoWindow.open(this.map, lngLatPosition);
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
        
        // 获取表单中已经设置的值
        const locationAddress = document.getElementById('locationAddress');
        // 使用输入框的值作为地址
        const address = locationAddress ? locationAddress.value : '未知位置';
        
        // 优先使用保存在对象中的表单数据
        const formData = this.formData || {
            'form-address': '',
            'form-lng': this.currentLocation.lng,
            'form-lat': this.currentLocation.lat,
            'form-clock-coordinates': `${this.currentLocation.lng},${this.currentLocation.lat}`,
            'form-clock-address': '',
            'form-province-code': '',
            'form-province-short': '',
            'form-city-code': '',
            'form-city-name': ''
        };
        
        // 始终使用最新的地址
        formData['form-address'] = address;
        formData['form-clock-address'] = address;
        
        // 如果表单中有值，优先使用表单中的值
        const result = {
            'form-address': address,
            'form-lng': document.getElementById('form-lng')?.value || formData['form-lng'] || this.currentLocation.lng,
            'form-lat': document.getElementById('form-lat')?.value || formData['form-lat'] || this.currentLocation.lat,
            'form-clock-coordinates': document.getElementById('form-clock-coordinates')?.value || formData['form-clock-coordinates'] || `${this.currentLocation.lng},${this.currentLocation.lat}`,
            'form-clock-address': address,
            'form-province-code': document.getElementById('form-province-code')?.value || formData['form-province-code'] || '',
            'form-province-short': document.getElementById('form-province-short')?.value || formData['form-province-short'] || '',
            'form-city-code': document.getElementById('form-city-code')?.value || formData['form-city-code'] || '',
            'form-city-name': document.getElementById('form-city-name')?.value || formData['form-city-name'] || ''
        };
        
        console.log('提交位置数据:', result);
        
        return result;
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
    
    /**
     * 显示通用消息
     */
    showMessage(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        if (window.showMessage) {
            window.showMessage(message, type);
        }
    }

    /**
     * 重置位置选择标志
     */
    resetLocationFlag() {
        this.hasUserSelectedLocation = false;
        console.log('已重置位置选择标志，允许自动定位');
    }
    
    /**
     * 刷新当前位置（强制获取当前位置）
     */
    refreshCurrentLocation() {
        // 重置位置选择标志
        this.resetLocationFlag();
        // 获取当前位置
        this.getCurrentLocation();
    }
}

// 全局地图管理器实例
window.mapManager = null;

// 地图初始化函数
window.initMap = function() {
    window.mapManager = new MapManager();
};

// 全局函数，调用地图管理器方法
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

// 添加地址编辑切换功能
window.toggleAddressEdit = function() {
    if (window.mapManager) {
        window.mapManager.toggleAddressEdit();
    }
};

// 添加获取位置数据的全局函数，供表单提交时调用
window.getLocationData = function() {
    if (window.mapManager) {
        return window.mapManager.getCurrentLocationData();
    }
    return null;
};

// 获取用户真实姓名的全局函数
window.getUserRealName = function() {
    const realNameInput = document.getElementById('realName');
    return realNameInput ? realNameInput.value : '';
};
