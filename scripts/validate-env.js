/**
 * 环境变量验证脚本
 * 用于验证 Cloudflare Pages 部署所需的环境变量是否正确配置
 */

// 必需的环境变量列表
const REQUIRED_ENV_VARS = {
  // OAuth 配置
  'GITHUB_CLIENT_ID': {
    description: 'GitHub OAuth 客户端 ID',
    validation: (value) => value && value.length > 10,
    example: 'Ov23li97lrhrHJ5hSNR9'
  },
  'GITHUB_CLIENT_SECRET': {
    description: 'GitHub OAuth 客户端密钥',
    validation: (value) => value && value.length > 20,
    example: 'fe820026478c0125cb9b833954210895a5ec3950'
  },
  'REDIRECT_URI': {
    description: 'GitHub OAuth 回调地址',
    validation: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
    example: 'https://your-domain.pages.dev/oauth/callback'
  },
  'GITEE_CLIENT_ID': {
    description: 'Gitee OAuth 客户端 ID',
    validation: (value) => value && value.length > 10,
    example: 'e2be03fbffa0eb4d19157fdd734fcac0107c05f9f3dd1c6b987da7d266bbf1f0'
  },
  'GITEE_CLIENT_SECRET': {
    description: 'Gitee OAuth 客户端密钥',
    validation: (value) => value && value.length > 20,
    example: '4d178422cac6072e2062698ce6c4ee4782c1eb3bf33c2aa55750b5b05ee41821'
  },
  'GITEE_REDIRECT_URI': {
    description: 'Gitee OAuth 回调地址',
    validation: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
    example: 'https://your-domain.pages.dev/oauth/callback'
  },
  
  // JWT 配置
  'JWT_ALGORITHM': {
    description: 'JWT 算法',
    validation: (value) => value && ['HS256', 'RS256'].includes(value),
    example: 'HS256'
  },
  
  // API 端点配置
  'N8N_API_ENDPOINT': {
    description: 'n8n API 端点',
    validation: (value) => value && value.startsWith('https://'),
    example: 'https://n8n.201807.xyz/webhook-test/getdkxx'
  },
  'N8N_API_CONFIRM_ENDPOINT': {
    description: 'n8n 确认打卡 API 端点',
    validation: (value) => value && value.startsWith('https://'),
    example: 'https://n8n.201807.xyz/webhook-test/getdkxx'
  }
};

// 条件性必需的环境变量
const CONDITIONAL_ENV_VARS = {
  'JWT_SECRET': {
    description: 'JWT 密钥 (HS256 算法时必需)',
    condition: (env) => env.JWT_ALGORITHM === 'HS256',
    validation: (value) => value && value.length >= 32,
    example: 'your_very_strong_secret_key_at_least_32_chars_long'
  },
  'JWT_PRIVATE_KEY': {
    description: 'JWT 私钥 (RS256 算法时必需)',
    condition: (env) => env.JWT_ALGORITHM === 'RS256',
    validation: (value) => value && value.includes('-----BEGIN PRIVATE KEY-----'),
    example: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----'
  },
  'JWT_PUBLIC_KEY': {
    description: 'JWT 公钥 (RS256 算法时必需)',
    condition: (env) => env.JWT_ALGORITHM === 'RS256',
    validation: (value) => value && value.includes('-----BEGIN PUBLIC KEY-----'),
    example: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtGvU...\n-----END PUBLIC KEY-----'
  }
};

/**
 * 验证环境变量配置
 * @param {Object} env - 环境变量对象
 * @returns {Object} 验证结果
 */
function validateEnvironmentVariables(env) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    summary: {}
  };

  // 检查必需的环境变量
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = env[key];
    
    if (!value) {
      results.missing.push({
        key,
        description: config.description,
        example: config.example
      });
      results.valid = false;
    } else if (!config.validation(value)) {
      results.errors.push({
        key,
        description: config.description,
        issue: '格式或长度不正确',
        example: config.example
      });
      results.valid = false;
    }
  }

  // 检查条件性必需的环境变量
  for (const [key, config] of Object.entries(CONDITIONAL_ENV_VARS)) {
    if (config.condition(env)) {
      const value = env[key];
      
      if (!value) {
        results.missing.push({
          key,
          description: config.description,
          example: config.example
        });
        results.valid = false;
      } else if (!config.validation(value)) {
        results.errors.push({
          key,
          description: config.description,
          issue: '格式不正确',
          example: config.example
        });
        results.valid = false;
      }
    }
  }

  // 生成摘要
  results.summary = {
    total: Object.keys(REQUIRED_ENV_VARS).length + Object.keys(CONDITIONAL_ENV_VARS).filter(key => 
      CONDITIONAL_ENV_VARS[key].condition(env)
    ).length,
    configured: results.summary.total - results.missing.length,
    missing: results.missing.length,
    errors: results.errors.length
  };

  return results;
}

/**
 * 打印验证结果
 * @param {Object} results - 验证结果
 */
function printValidationResults(results) {
  console.log('\n=== 环境变量配置验证结果 ===\n');

  if (results.valid) {
    console.log('✅ 所有必需的环境变量都已正确配置！');
  } else {
    console.log('❌ 环境变量配置不完整或有错误');
  }

  console.log(`\n📊 配置摘要:`);
  console.log(`   总计: ${results.summary.total}`);
  console.log(`   已配置: ${results.summary.configured}`);
  console.log(`   缺失: ${results.summary.missing}`);
  console.log(`   错误: ${results.summary.errors}`);

  if (results.missing.length > 0) {
    console.log('\n❌ 缺失的环境变量:');
    results.missing.forEach(item => {
      console.log(`   - ${item.key}: ${item.description}`);
      console.log(`     示例: ${item.example}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  配置错误的环境变量:');
    results.errors.forEach(item => {
      console.log(`   - ${item.key}: ${item.description}`);
      console.log(`     问题: ${item.issue}`);
      console.log(`     示例: ${item.example}`);
    });
  }

  if (!results.valid) {
    console.log('\n📝 修复建议:');
    console.log('   1. 在 Cloudflare Dashboard 中进入你的 Pages 项目');
    console.log('   2. 点击 "设置" -> "环境变量"');
    console.log('   3. 添加或修正上述缺失/错误的环境变量');
    console.log('   4. 重新部署项目');
  }

  console.log('\n');
}

/**
 * 读取 .dev.vars 文件
 */
function loadDevVars() {
  const fs = require('fs');
  const path = require('path');

  const devVarsPath = path.join(process.cwd(), '.dev.vars');

  if (!fs.existsSync(devVarsPath)) {
    console.log('⚠️  .dev.vars 文件不存在，使用系统环境变量');
    return process.env;
  }

  try {
    const content = fs.readFileSync(devVarsPath, 'utf8');
    const envVars = { ...process.env }; // 从系统环境变量开始

    const lines = content.split('\n');
    let currentKey = null;
    let currentValue = '';
    let inMultilineValue = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // 跳过空行和注释（但不在多行值中时）
      if (!inMultilineValue && (!line || line.startsWith('#'))) {
        continue;
      }

      if (!inMultilineValue) {
        // 解析 KEY=VALUE 格式
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          continue;
        }

        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();

        if (!key) continue;

        // 检查是否是多行值的开始（如 JWT 密钥）
        if (value.startsWith('-----BEGIN')) {
          currentKey = key;
          currentValue = value;
          inMultilineValue = true;
        } else {
          envVars[key] = value;
        }
      } else {
        // 在多行值中
        currentValue += '\n' + line;

        // 检查是否是多行值的结束
        if (line.includes('-----END')) {
          envVars[currentKey] = currentValue;
          currentKey = null;
          currentValue = '';
          inMultilineValue = false;
        }
      }
    }

    // 计算实际的环境变量数量（排除系统变量）
    const devVarsCount = Object.keys(envVars).length - Object.keys(process.env).length;
    console.log(`✅ 已加载 .dev.vars 文件 (${devVarsCount} 个新变量)`);
    return envVars;
  } catch (error) {
    console.error('❌ 读取 .dev.vars 文件失败:', error.message);
    return process.env;
  }
}

// 如果作为脚本运行
if (require.main === module) {
  const envVars = loadDevVars();
  const results = validateEnvironmentVariables(envVars);
  printValidationResults(results);

  if (!results.valid) {
    process.exit(1);
  }
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEnvironmentVariables,
    printValidationResults,
    REQUIRED_ENV_VARS,
    CONDITIONAL_ENV_VARS
  };
}
