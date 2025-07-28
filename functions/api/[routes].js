import * as jose from 'jose';

// 统一错误响应格式
function createErrorResponse(message, statusCode = 500, details = null) {
  const errorResponse = {
    success: false,
    error: {
      message,
      code: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    errorResponse.error.details = details;
  }

  return new Response(
    JSON.stringify(errorResponse),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 统一成功响应格式
function createSuccessResponse(data, statusCode = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 验证必需的环境变量
function validateRequiredEnvVars(env, requiredVars) {
  const missing = [];

  for (const varName of requiredVars) {
    if (!env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

// 验证JWT配置
function validateJWTConfig(env) {
  const algorithm = env.JWT_ALGORITHM || "HS256";
  const errors = [];

  if (!["HS256", "RS256"].includes(algorithm)) {
    errors.push("JWT_ALGORITHM must be either 'HS256' or 'RS256'");
  }

  if (algorithm === "HS256") {
    if (!env.JWT_SECRET) {
      errors.push("JWT_SECRET is required when using HS256 algorithm");
    } else if (env.JWT_SECRET.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters long for security");
    }
  } else if (algorithm === "RS256") {
    if (!env.JWT_PRIVATE_KEY) {
      errors.push("JWT_PRIVATE_KEY is required when using RS256 algorithm");
    }
    if (!env.JWT_PUBLIC_KEY) {
      errors.push("JWT_PUBLIC_KEY is required when using RS256 algorithm");
    }

    // 验证密钥格式
    if (env.JWT_PRIVATE_KEY && !env.JWT_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")) {
      errors.push("JWT_PRIVATE_KEY must be in valid PEM format");
    }
    if (env.JWT_PUBLIC_KEY && !env.JWT_PUBLIC_KEY.includes("-----BEGIN PUBLIC KEY-----")) {
      errors.push("JWT_PUBLIC_KEY must be in valid PEM format");
    }
  }

  return errors;
}

// 验证关键环境变量
function validateCriticalEnvVars(env) {
  const criticalVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'REDIRECT_URI',
    'GITEE_CLIENT_ID',
    'GITEE_CLIENT_SECRET',
    'GITEE_REDIRECT_URI'
  ];

  const missing = validateRequiredEnvVars(env, criticalVars);
  if (missing.length > 0) {
    return createErrorResponse(
      "Critical environment variables are missing. Please configure all required OAuth settings.",
      503,
      {
        missing: missing,
        hint: "Check your Cloudflare Dashboard environment variables configuration",
        documentation: "See setup-env.md for detailed configuration instructions"
      }
    );
  }

  // 验证JWT配置
  const jwtErrors = validateJWTConfig(env);
  if (jwtErrors.length > 0) {
    return createErrorResponse(
      "JWT configuration is invalid",
      503,
      {
        errors: jwtErrors,
        hint: "Check your JWT_ALGORITHM and corresponding keys configuration",
        documentation: "See setup-env.md for JWT configuration instructions"
      }
    );
  }

  return null; // 验证通过
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 在处理请求前验证关键环境变量（除了健康检查端点）
  if (path !== "/api/health" && path !== "/api/debug") {
    const validationError = validateCriticalEnvVars(env);
    if (validationError) {
      return validationError;
    }
  }
  
  // 获取会话
  const session = await getUserSession(context);
  
  // 处理用户信息API
  if (path === "/api/user") {
    return handleUserInfo(context, session);
  }
  
  // 处理配置API
  if (path === "/api/config") {
    return handleConfig(context);
  }
  
  // 处理提交位置数据的API
  if (path === "/api/submit-location" && request.method === "POST") {
    return handleSubmitLocation(context, session);
  }
  
  // 处理token刷新
  if (path === "/api/refresh-token") {
    return handleTokenRefresh(context, session);
  }
  
  // 处理登出
  if (path === "/api/logout") {
    return handleLogout(context);
  }

  // 处理健康检查
  if (path === "/api/health") {
    return handleHealthCheck(context);
  }
  
  // 处理调试信息
  if (path === "/api/debug") {
    return handleDebug(context, session);
  }

  // 处理地理编码API（获取地址信息）
  if (path === "/api/geocode" && request.method === "GET") {
    return handleGeocode(context);
  }

  // 处理测试地理编码API
  if (path === "/api/test-geocode" && request.method === "GET") {
    return handleTestGeocode(context);
  }

  // 处理签到API（兼容旧版本）
  if (path === "/api/checkin" && request.method === "POST") {
    return handleSubmitLocation(context, session);
  }

  // 如果API路径不存在，返回404
  return createErrorResponse("API endpoint not found", 404);
}

// 获取用户会话
async function getUserSession(context) {
  const { request, env } = context;
  
  // 从cookie中获取会话ID
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [name, ...value] = c.split("=");
      return [name, value.join("=")];
    })
  );
  
  const sessionId = cookies.session_id;
  if (!sessionId) return null;
  
  // 从KV存储中获取会话
  const sessionData = await env.SESSIONS.get(sessionId);
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    
    // 检查会话是否过期
    if (session.expiresAt < Date.now()) {
      await env.SESSIONS.delete(sessionId);
      return null;
    }
    
    return session;
  } catch (e) {
    return null;
  }
}

// 处理用户信息API
function handleUserInfo(context, session) {
  if (!session) {
    return new Response(
      JSON.stringify({ success: false, message: "未授权访问" }),
      { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  return new Response(
    JSON.stringify({ success: true, user: session.user }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 处理配置API
function handleConfig(context) {
  const { env } = context;

  // 返回前端需要的配置信息
  return new Response(
    JSON.stringify({
      success: true,
      config: {
        apiEndpoints: {
          submitLocation: "/api/submit-location",
          refreshToken: "/api/refresh-token"
        },
        map: {
          amapKey: env.AMAP_KEY || "79a85def4762b3e9024547ee3b8b0e38",
          amapSecurityCode: env.AMAP_SECURITY_CODE || "630874c2ba395431d05a471a4b4caaa5"
        }
      }
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 处理提交位置数据
async function handleSubmitLocation(context, session) {
  const { request, env } = context;

  try {
    const requestData = await request.json();
    console.log('收到的表单数据:', JSON.stringify(requestData, null, 2));

    // 提取所有相关数据，包括确认数据
    const {
      'form-lng': formLng,
      'form-lat': formLat,
      longitude: reqLongitude,
      latitude: reqLatitude,
      'form-clock-coordinates': formClockCoordinates,
      'form-address': formAddress,
      'form-clock-address': formClockAddress,
      address: reqAddress,
      'form-province-code': formProvinceCode,
      CLOCK_PROVINCE_CODE: reqProvinceCode,
      'form-province-short': formProvinceShort,
      CLOCK_PROVINCE_SHORT: reqProvinceShort,
      'form-city-code': formCityCode,
      CLOCK_CITY_CODE: reqCityCode,
      'form-city-name': formCityName,
      CLOCK_CITY_NAME: reqCityName,
      realName,
      confirmed,
      confirmData,
      type: requestType // 'checkin' or 'confirm'
    } = requestData;

    // 从表单数据中提取坐标信息
    const longitude = parseFloat(formLng || reqLongitude);
    const latitude = parseFloat(formLat || reqLatitude);
    
    // 构建符合n8n期望格式的数据
    const currentDate = new Date().toISOString().split('T')[0]; // 格式: 2025-07-11
    const coordinates = formClockCoordinates || `${longitude},${latitude}`;

    // 获取地址信息
    let address = formAddress || formClockAddress || reqAddress || '位置信息获取中...';
    let provinceCode = formProvinceCode || reqProvinceCode || '';
    let provinceShort = formProvinceShort || reqProvinceShort || '';
    let cityCode = formCityCode || reqCityCode || '';
    let cityName = formCityName || reqCityName || '';

    // 如果表单数据中已经包含了所有必要信息，则不需要再调用高德地图API
    const hasCompleteAddressInfo = address && provinceCode && provinceShort && cityCode && cityName;
    
    // 尝试通过高德地图API获取完整的地理信息（包括行政区划）
    // 只有在缺少必要信息时才调用API
    if (!hasCompleteAddressInfo) {
      try {
          const amapKey = env.AMAP_KEY || "caa6c37d36bdac64cf8d3e624fec3323";
          const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&extensions=all&batch=false&roadlevel=0`;

          console.log('调用高德地图API:', amapUrl);
          console.log('使用的API Key:', amapKey.substring(0, 8) + '...');

          const geoResponse = await fetch(amapUrl);

          if (!geoResponse.ok) {
            console.error('高德地图API HTTP错误:', geoResponse.status, geoResponse.statusText);
            throw new Error(`HTTP ${geoResponse.status}: ${geoResponse.statusText}`);
          }

          const geoData = await geoResponse.json();

          console.log('高德地图API响应状态:', geoData.status);
          console.log('高德地图API完整响应:', JSON.stringify(geoData, null, 2));

          if (geoData.status === "1" && geoData.regeocode) {
            console.log('高德地图API调用成功');

            // 如果表单没有提供地址，使用API返回的地址
            if (!address || address === '位置信息获取中...') {
              address = geoData.regeocode.formatted_address;
              console.log('使用API返回的地址:', address);
            } else {
              console.log('使用表单提供的地址:', address);
            }

            const addressComponent = geoData.regeocode.addressComponent;
            console.log('地址组件:', JSON.stringify(addressComponent, null, 2));

            if (addressComponent) {
              console.log('开始处理地址组件...');

              // 省份代码映射（简化版本，可以根据需要扩展）
              const provinceCodeMap = {
                '北京市': '110000', '天津市': '120000', '河北省': '130000', '山西省': '140000',
                '内蒙古自治区': '150000', '辽宁省': '210000', '吉林省': '220000', '黑龙江省': '230000',
                '上海市': '310000', '江苏省': '320000', '浙江省': '330000', '安徽省': '340000',
                '福建省': '350000', '江西省': '360000', '山东省': '370000', '河南省': '410000',
                '湖北省': '420000', '湖南省': '430000', '广东省': '440000', '广西壮族自治区': '450000',
                '海南省': '460000', '重庆市': '500000', '四川省': '510000', '贵州省': '520000',
                '云南省': '530000', '西藏自治区': '540000', '陕西省': '610000', '甘肃省': '620000',
                '青海省': '630000', '宁夏回族自治区': '640000', '新疆维吾尔自治区': '650000'
              };

              const provinceShortMap = {
                '北京市': '京', '天津市': '津', '河北省': '冀', '山西省': '晋',
                '内蒙古自治区': '蒙', '辽宁省': '辽', '吉林省': '吉', '黑龙江省': '黑',
                '上海市': '沪', '江苏省': '苏', '浙江省': '浙', '安徽省': '皖',
                '福建省': '闽', '江西省': '赣', '山东省': '鲁', '河南省': '豫',
                '湖北省': '鄂', '湖南省': '湘', '广东省': '粤', '广西壮族自治区': '桂',
                '海南省': '琼', '重庆市': '渝', '四川省': '川', '贵州省': '黔',
                '云南省': '滇', '西藏自治区': '藏', '陕西省': '陕', '甘肃省': '甘',
                '青海省': '青', '宁夏回族自治区': '宁', '新疆维吾尔自治区': '新'
              };

              // 获取省份信息
              const province = addressComponent.province || '';
              console.log('省份:', province);

              if (!provinceCode) {
                provinceCode = provinceCodeMap[province] || '';
              }
              
              if (!provinceShort) {
                provinceShort = provinceShortMap[province] || '';
              }

              console.log('省份代码:', provinceCode, '省份简称:', provinceShort);

              // 获取城市信息
              if (!cityCode && addressComponent.citycode) {
                cityCode = addressComponent.citycode;
              }
              
              if (!cityName) {
                cityName = addressComponent.city || addressComponent.district || '';
              }

              console.log('城市代码:', cityCode, '城市名称:', cityName);
            } else {
              console.log('地址组件为空');
            }
          } else {
            console.log('高德地图API返回错误或无数据:');
            console.log('- status:', geoData.status);
            console.log('- info:', geoData.info);
            console.log('- infocode:', geoData.infocode);

            if (geoData.status === "0") {
              console.error('高德地图API错误:', geoData.info || '未知错误');
              if (geoData.infocode === "INVALID_USER_SCODE") {
                console.error('API Key无效或安全码错误');
              }
            }
          }
      } catch (geoError) {
          console.error('获取地址信息失败:', geoError);
          // 如果获取地址失败，使用坐标作为地址（如果没有提供地址的话）
          if (!address || address === '位置信息获取中...') {
            address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }
      }
    } else {
      console.log('表单已包含完整地址信息，跳过高德地图API调用');
    }

    // 构建符合n8n期望的数据格式
    let data = {
      name: realName || session?.user?.name || '未知用户',
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      address: address,
      type: requestType, // 使用从请求中获取的 type
      timestamp: currentDate,
      CLOCK_COORDINATES: coordinates,
      CLOCK_ADDRESS: address,
      CLOCK_PROVINCE_CODE: provinceCode,
      CLOCK_PROVINCE_SHORT: provinceShort,
      CLOCK_CITY_CODE: cityCode,
      CLOCK_CITY_NAME: cityName,
      userId: session?.user?.id || 0,
      username: session?.user?.login || 'unknown'
    };

    // 选择合适的API端点
    let n8nEndpoint = env.N8N_API_ENDPOINT;

    // 如果是确认打卡模式，使用确认打卡API端点
    if (confirmed === true) {
      n8nEndpoint = env.N8N_API_CONFIRM_ENDPOINT;
      data.confirmed = true;
    }

    console.log('最终提交给n8n的数据:', JSON.stringify(data, null, 2));

    // 生成JWT令牌用于认证
    const jwtAlgorithm = env.JWT_ALGORITHM || "HS256";
    const jwtPayload = {
      iss: "kaoqin-system",
      exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5分钟过期
      data: data
    };

    let jwt;

    if (jwtAlgorithm === "RS256") {
      // 使用RS256算法和私钥签名
      try {
        const privateKey = env.JWT_PRIVATE_KEY;
        if (!privateKey) {
          throw new Error("RS256算法需要配置JWT_PRIVATE_KEY");
        }

        // 导入私钥
        const privateKeyImported = await jose.importPKCS8(privateKey, jwtAlgorithm);

        // 使用jose库创建JWT
        jwt = await new jose.SignJWT(jwtPayload)
          .setProtectedHeader({ alg: jwtAlgorithm })
          .sign(privateKeyImported);
      } catch (error) {
        console.error("RS256签名失败:", error);
        return new Response(
          JSON.stringify({ success: false, message: "令牌生成失败: " + error.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    } else {
      // 使用HS256算法和密钥签名（默认）
      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        return createErrorResponse(
          "JWT configuration error: JWT_SECRET is required when using HS256 algorithm",
          500,
          { algorithm: "HS256", missing: ["JWT_SECRET"] }
        );
      }

      if (jwtSecret.length < 32) {
        return createErrorResponse(
          "JWT configuration error: JWT_SECRET must be at least 32 characters long for security",
          500,
          { algorithm: "HS256", secretLength: jwtSecret.length, minimumLength: 32 }
        );
      }

      const secret = new TextEncoder().encode(jwtSecret);

      // 使用jose库创建JWT
      jwt = await new jose.SignJWT(jwtPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
    }

    // 提交数据到n8n
    const n8nResponse = await fetch(n8nEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify(data)
    });

    // 处理n8n响应
    const responseText = await n8nResponse.text();
    let n8nResult;

    try {
      // 尝试将文本解析为JSON
      n8nResult = JSON.parse(responseText);
    } catch (error) {
      // 处理非JSON响应
      console.error("n8n返回非JSON响应:", responseText);
      return new Response(
        JSON.stringify({
          success: false,
          message: `n8n认证失败: ${responseText}`,
          status: n8nResponse.status
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 检查是否包含cxjg字段，如果有则可能需要确认
    if (n8nResult.cxjg) {
      try {
        // 尝试解析cxjg字段（可能是JSON字符串）
        let cxjgData;
        if (typeof n8nResult.cxjg === 'string') {
          cxjgData = JSON.parse(n8nResult.cxjg);
        } else {
          cxjgData = n8nResult.cxjg;
        }
        
        // 如果包含msg字段，则返回需要确认的信息
        if (cxjgData.msg) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: cxjgData.msg,
              data: n8nResult,
              needConfirm: true,
              confirmData: cxjgData
            }),
            { 
              status: 200, // 使用200状态码，但success为false
              headers: {
                "Content-Type": "application/json",
              }
            }
          );
        }
      } catch (parseError) {
        console.error("解析cxjg失败:", parseError);
      }
    }

    // 检查n8n返回的结果是否包含错误信息
    if (n8nResult.code && n8nResult.code !== 200) {
      // n8n返回了错误状态码
      return new Response(
        JSON.stringify({
          success: false,
          message: n8nResult.message || "n8n处理失败",
          hint: n8nResult.hint,
          code: n8nResult.code
        }),
        {
          status: n8nResult.code,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 成功处理
    return new Response(
      JSON.stringify({
        success: true,
        message: "打卡成功",
        result: n8nResult
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("处理提交位置数据失败:", error);
    return new Response(
      JSON.stringify({ success: false, message: `处理失败: ${error.message}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// 处理token刷新
async function handleTokenRefresh(context, session) {
  const { env } = context;

  if (!session) {
    return new Response(
      JSON.stringify({ success: false, message: "未授权访问" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // 获取JWT配置
  const jwtAlgorithm = env.JWT_ALGORITHM || "HS256";
  const jwtPayload = {
    iss: "kaoqin-system",
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5分钟过期
    data: session.user
  };

  let jwt;

  if (jwtAlgorithm === "RS256") {
    // 使用RS256算法和私钥签名
    try {
      const privateKey = env.JWT_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("RS256算法需要配置JWT_PRIVATE_KEY");
      }

      // 导入私钥
      const privateKeyImported = await jose.importPKCS8(privateKey, jwtAlgorithm);

      // 使用jose库创建JWT
      jwt = await new jose.SignJWT(jwtPayload)
        .setProtectedHeader({ alg: jwtAlgorithm })
        .sign(privateKeyImported);
    } catch (error) {
      console.error("RS256签名失败:", error);
      return new Response(
        JSON.stringify({ success: false, message: "令牌生成失败: " + error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } else {
    // 使用HS256算法和密钥签名（默认）
    try {
      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        return createErrorResponse(
          "JWT configuration error: JWT_SECRET is required when using HS256 algorithm",
          500,
          { algorithm: "HS256", missing: ["JWT_SECRET"] }
        );
      }

      if (jwtSecret.length < 32) {
        return createErrorResponse(
          "JWT configuration error: JWT_SECRET must be at least 32 characters long for security",
          500,
          { algorithm: "HS256", secretLength: jwtSecret.length, minimumLength: 32 }
        );
      }

      const secret = new TextEncoder().encode(jwtSecret);

      // 使用jose库创建JWT
      jwt = await new jose.SignJWT(jwtPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
    } catch (error) {
      console.error("HS256签名失败:", error);
      return createErrorResponse(
        "JWT token generation failed",
        500,
        { algorithm: "HS256", error: error.message }
      );
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      token: jwt,
      expiresAt: jwtPayload.exp * 1000, // 转换为毫秒
      algorithm: jwtAlgorithm // 返回使用的算法
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 处理登出
function handleLogout(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const secureCookie = isLocalhost ? "" : "Secure; ";
  
  console.log("执行登出操作:", {
    url: url.toString(),
    isLocalhost: isLocalhost,
    secureCookie: secureCookie
  });

  // 获取会话ID
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [name, ...value] = c.split("=");
      return [name, value.join("=")];
    })
  );
  
  const sessionId = cookies.session_id;
  console.log("当前会话ID:", sessionId || "无会话");
  
  // 如果有会话ID，从KV存储中删除
  if (sessionId) {
    // 尝试从KV存储中删除会话
    // 这是一个异步操作，但我们不需要等待它完成
    env.SESSIONS.delete(sessionId).catch(error => {
      console.error("删除会话失败:", error);
    });
  }

  const headers = new Headers({
    "Location": "/login.html"
  });

  // 清除会话cookie，即使没有cookie也设置过期的cookie
  const cookieValue = `session_id=; Path=/; ${secureCookie}HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  console.log("设置清除Cookie:", cookieValue);
  
  headers.append("Set-Cookie", cookieValue);
  
  // 添加额外的响应头，防止缓存
  headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.append("Pragma", "no-cache");
  headers.append("Expires", "0");

  return new Response("", {
    status: 302,
    headers
  });
}

// 处理健康检查
function handleHealthCheck(context) {
  const { env } = context;
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {}
  };

  // 检查必需的环境变量
  const requiredEnvVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'REDIRECT_URI',
    'GITEE_CLIENT_ID',
    'GITEE_CLIENT_SECRET',
    'GITEE_REDIRECT_URI',
    'N8N_API_ENDPOINT',
    'N8N_API_CONFIRM_ENDPOINT'
  ];

  const missingEnvVars = validateRequiredEnvVars(env, requiredEnvVars);
  healthStatus.checks.environment = {
    status: missingEnvVars.length === 0 ? "pass" : "fail",
    missing: missingEnvVars,
    total: requiredEnvVars.length,
    configured: requiredEnvVars.length - missingEnvVars.length
  };

  // 检查JWT配置
  const jwtErrors = validateJWTConfig(env);
  healthStatus.checks.jwt = {
    status: jwtErrors.length === 0 ? "pass" : "fail",
    algorithm: env.JWT_ALGORITHM || "HS256",
    errors: jwtErrors
  };

  // 检查OAuth配置
  const oauthChecks = {
    github: {
      clientId: !!env.GITHUB_CLIENT_ID,
      clientSecret: !!env.GITHUB_CLIENT_SECRET,
      redirectUri: !!env.REDIRECT_URI && (env.REDIRECT_URI.startsWith('http://') || env.REDIRECT_URI.startsWith('https://'))
    },
    gitee: {
      clientId: !!env.GITEE_CLIENT_ID,
      clientSecret: !!env.GITEE_CLIENT_SECRET,
      redirectUri: !!env.GITEE_REDIRECT_URI && (env.GITEE_REDIRECT_URI.startsWith('http://') || env.GITEE_REDIRECT_URI.startsWith('https://'))
    }
  };

  const oauthStatus = Object.values(oauthChecks.github).every(Boolean) && Object.values(oauthChecks.gitee).every(Boolean);
  healthStatus.checks.oauth = {
    status: oauthStatus ? "pass" : "fail",
    providers: oauthChecks
  };

  // 检查API端点配置
  const apiEndpointsValid = env.N8N_API_ENDPOINT && env.N8N_API_ENDPOINT.startsWith('https://') &&
                           env.N8N_API_CONFIRM_ENDPOINT && env.N8N_API_CONFIRM_ENDPOINT.startsWith('https://');
  healthStatus.checks.apiEndpoints = {
    status: apiEndpointsValid ? "pass" : "fail",
    endpoints: {
      n8nApi: !!env.N8N_API_ENDPOINT,
      n8nConfirm: !!env.N8N_API_CONFIRM_ENDPOINT
    }
  };

  // 总体健康状态
  const allChecksPass = Object.values(healthStatus.checks).every(check => check.status === "pass");
  healthStatus.status = allChecksPass ? "healthy" : "unhealthy";

  const statusCode = allChecksPass ? 200 : 503;

  return createSuccessResponse(healthStatus, statusCode);
}

// 处理测试地理编码API
async function handleTestGeocode(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 使用固定的武汉坐标进行测试
  const testLat = url.searchParams.get('lat') || '30.597264';
  const testLng = url.searchParams.get('lng') || '114.300951';

  try {
    const amapKey = env.AMAP_KEY || "caa6c37d36bdac64cf8d3e624fec3323";
    const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${testLng},${testLat}&extensions=all&batch=false&roadlevel=0`;

    console.log('测试地理编码URL:', amapUrl);

    const response = await fetch(amapUrl);
    const data = await response.json();

    console.log('高德地图API完整响应:', JSON.stringify(data, null, 2));

    return createSuccessResponse({
      testCoordinates: { lat: testLat, lng: testLng },
      amapUrl: amapUrl,
      amapResponse: data,
      analysis: {
        status: data.status,
        hasRegeocode: !!data.regeocode,
        hasAddressComponent: !!(data.regeocode && data.regeocode.addressComponent),
        addressComponent: data.regeocode ? data.regeocode.addressComponent : null
      }
    });
  } catch (error) {
    console.error('测试地理编码失败:', error);
    return createErrorResponse("测试地理编码失败: " + error.message, 500);
  }
}

// 处理地理编码API（获取地址信息）
async function handleGeocode(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 获取查询参数
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!lat || !lng) {
    return createErrorResponse("缺少必需的参数: lat 和 lng", 400);
  }

  // 验证坐标格式
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return createErrorResponse("无效的坐标格式", 400);
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return createErrorResponse("坐标超出有效范围", 400);
  }

  try {
    // 使用高德地图逆地理编码API
    const amapKey = env.AMAP_KEY || "79a85def4762b3e9024547ee3b8b0e38";
    const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&poitype=&radius=1000&extensions=base&batch=false&roadlevel=0`;

    const response = await fetch(amapUrl);
    const data = await response.json();

    if (data.status === "1" && data.regeocode) {
      // 成功获取地址信息
      const address = data.regeocode.formatted_address ||
                     `${data.regeocode.addressComponent?.province || ''}${data.regeocode.addressComponent?.city || ''}${data.regeocode.addressComponent?.district || ''}`;

      return createSuccessResponse({
        address: address,
        detail: data.regeocode.addressComponent,
        location: {
          latitude: latitude,
          longitude: longitude
        }
      });
    } else {
      // 高德API返回错误
      console.error("高德地图API错误:", data);
      return createSuccessResponse({
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        location: {
          latitude: latitude,
          longitude: longitude
        },
        error: "无法获取详细地址信息"
      });
    }
  } catch (error) {
    console.error("地理编码请求失败:", error);
    // 即使API失败，也返回坐标信息
    return createSuccessResponse({
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      location: {
        latitude: latitude,
        longitude: longitude
      },
      error: "地理编码服务暂时不可用"
    });
  }
}

// 处理搜索API
async function handleSearch(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 获取查询参数
  const keyword = url.searchParams.get('keyword');

  if (!keyword || keyword.trim() === '') {
    return createErrorResponse("缺少必需的参数: keyword", 400);
  }

  try {
    // 使用高德地图搜索API
    const amapKey = env.AMAP_KEY || "79a85def4762b3e9024547ee3b8b0e38";
    const searchUrl = `https://restapi.amap.com/v3/place/text?key=${amapKey}&keywords=${encodeURIComponent(keyword.trim())}&city=全国&output=json&offset=10&page=1&extensions=base`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === "1" && data.pois && data.pois.length > 0) {
      // 成功获取搜索结果
      const results = data.pois.map(poi => {
        const [lng, lat] = poi.location.split(',').map(parseFloat);
        return {
          name: poi.name,
          address: poi.address,
          location: {
            lat: lat,
            lng: lng
          },
          type: poi.type,
          typecode: poi.typecode
        };
      });

      return createSuccessResponse({
        results: results,
        total: data.count || results.length
      });
    } else {
      // 高德API返回错误或无结果
      console.error("高德地图搜索API错误:", data);
      return createSuccessResponse({
        results: [],
        total: 0,
        error: "未找到相关位置"
      });
    }
  } catch (error) {
    console.error("搜索请求失败:", error);
    return createErrorResponse("搜索服务暂时不可用", 500);
  }
}

// 处理调试信息
function handleDebug(context, session) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 获取所有cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [name, ...value] = c.split("=");
      return [name, value.join("=")];
    })
  );

  // 获取环境变量配置状态（不显示实际值，只显示是否已设置）
  const envStatus = {
    GITHUB_CLIENT_ID: !!env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: !!env.GITHUB_CLIENT_SECRET,
    REDIRECT_URI: env.REDIRECT_URI ? env.REDIRECT_URI.split(",").map(uri => uri.trim()) : null,
    GITEE_CLIENT_ID: !!env.GITEE_CLIENT_ID,
    GITEE_CLIENT_SECRET: !!env.GITEE_CLIENT_SECRET,
    GITEE_REDIRECT_URI: !!env.GITEE_REDIRECT_URI,
    JWT_ALGORITHM: env.JWT_ALGORITHM || "HS256",
    JWT_SECRET: !!env.JWT_SECRET,
    JWT_PRIVATE_KEY: !!env.JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY: !!env.JWT_PUBLIC_KEY
  };

  // 创建调试信息
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {
      url: url.toString(),
      path: url.pathname,
      method: request.method,
      headers: Object.fromEntries([...request.headers.entries()].filter(([key]) => !key.toLowerCase().includes("secret") && !key.toLowerCase().includes("authorization"))),
      cookies: cookies
    },
    session: session ? {
      user: {
        id: session.user.id,
        login: session.user.login,
        name: session.user.name,
        provider: session.user.provider
      },
      expiresAt: new Date(session.expiresAt).toISOString()
    } : null,
    environment: envStatus
  };

  // 返回调试信息
  return new Response(
    JSON.stringify(debugInfo, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

// 验证JWT令牌
async function verifyJWT(token, context) {
  const { env } = context;
  const jwtAlgorithm = env.JWT_ALGORITHM || "HS256";

  try {
    if (jwtAlgorithm === "RS256") {
      // 使用RS256算法和公钥验证
      const publicKey = env.JWT_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("RS256算法需要配置JWT_PUBLIC_KEY");
      }

      // 导入公钥
      const publicKeyImported = await jose.importSPKI(publicKey, jwtAlgorithm);

      // 验证JWT
      const { payload } = await jose.jwtVerify(token, publicKeyImported);
      return payload;
    } else {
      // 使用HS256算法和密钥验证（默认）
      const jwtSecret = env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is required when using HS256 algorithm");
      }

      if (jwtSecret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long for security");
      }

      const secret = new TextEncoder().encode(jwtSecret);

      // 验证JWT
      const { payload } = await jose.jwtVerify(token, secret);
      return payload;
    }
  } catch (error) {
    console.error("JWT验证失败:", error);
    return null;
  }
}
