#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 综合检查所有配置和资源的完整性
 */

const fs = require('fs');
const path = require('path');

// 导入其他验证模块
const { validateEnvironmentVariables, REQUIRED_ENV_VARS, CONDITIONAL_ENV_VARS } = require('./validate-env');
const { validateFrontendResources } = require('./validate-frontend');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * 检查 wrangler.toml 配置
 */
function checkWranglerConfig() {
  console.log(colorize('🔧 检查 wrangler.toml 配置...', 'blue'));
  
  const results = {
    valid: true,
    issues: []
  };
  
  const wranglerPath = 'wrangler.toml';
  
  if (!fs.existsSync(wranglerPath)) {
    results.valid = false;
    results.issues.push('wrangler.toml 文件不存在');
    return results;
  }
  
  try {
    const content = fs.readFileSync(wranglerPath, 'utf8');
    
    // 检查必要的配置项
    const requiredConfigs = [
      { key: 'name', pattern: /name\s*=\s*"[^"]+"/},
      { key: 'compatibility_date', pattern: /compatibility_date\s*=\s*"[^"]+"/},
      { key: 'KV binding', pattern: /\[\[kv_namespaces\]\]/},
      { key: 'SESSIONS binding', pattern: /binding\s*=\s*"SESSIONS"/}
    ];
    
    for (const config of requiredConfigs) {
      if (!config.pattern.test(content)) {
        results.valid = false;
        results.issues.push(`缺少 ${config.key} 配置`);
      }
    }
    
    // 检查是否还有占位符
    if (content.includes('your_kv_namespace_id')) {
      results.issues.push('KV 命名空间 ID 仍然是占位符，需要替换为实际 ID');
      // 这不是致命错误，因为可以在 Dashboard 中配置
    }
    
    console.log(colorize('✅ wrangler.toml 检查完成', 'green'));
    
  } catch (error) {
    results.valid = false;
    results.issues.push(`读取 wrangler.toml 失败: ${error.message}`);
  }
  
  return results;
}

/**
 * 检查 package.json 和依赖
 */
function checkPackageConfig() {
  console.log(colorize('📦 检查 package.json 和依赖...', 'blue'));
  
  const results = {
    valid: true,
    issues: []
  };
  
  const packagePath = 'package.json';
  
  if (!fs.existsSync(packagePath)) {
    results.valid = false;
    results.issues.push('package.json 文件不存在');
    return results;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // 检查必要的脚本
    const requiredScripts = ['dev', 'build', 'deploy'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        results.issues.push(`缺少 ${script} 脚本`);
      }
    }
    
    // 检查必要的依赖
    const requiredDeps = ['jose'];
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        results.valid = false;
        results.issues.push(`缺少必要依赖: ${dep}`);
      }
    }
    
    // 检查 node_modules
    if (!fs.existsSync('node_modules')) {
      results.valid = false;
      results.issues.push('node_modules 目录不存在，请运行 npm install');
    }
    
    console.log(colorize('✅ package.json 检查完成', 'green'));
    
  } catch (error) {
    results.valid = false;
    results.issues.push(`读取 package.json 失败: ${error.message}`);
  }
  
  return results;
}

/**
 * 检查函数文件
 */
function checkFunctionFiles() {
  console.log(colorize('⚡ 检查 Cloudflare Functions...', 'blue'));
  
  const results = {
    valid: true,
    issues: []
  };
  
  const requiredFunctions = [
    'functions/api/[routes].js',
    'functions/oauth/callback.js',
    'functions/login.js'
  ];
  
  for (const funcPath of requiredFunctions) {
    if (!fs.existsSync(funcPath)) {
      results.valid = false;
      results.issues.push(`缺少函数文件: ${funcPath}`);
    } else {
      // 检查文件是否为空
      const content = fs.readFileSync(funcPath, 'utf8');
      if (content.trim().length === 0) {
        results.valid = false;
        results.issues.push(`函数文件为空: ${funcPath}`);
      }
    }
  }
  
  console.log(colorize('✅ Functions 检查完成', 'green'));
  
  return results;
}

/**
 * 检查文档文件
 */
function checkDocumentation() {
  console.log(colorize('📚 检查文档文件...', 'blue'));
  
  const results = {
    valid: true,
    issues: []
  };
  
  const requiredDocs = [
    'README.md',
    'DEPLOYMENT.md',
    'setup-env.md',
    'KV-SETUP.md'
  ];
  
  for (const docPath of requiredDocs) {
    if (!fs.existsSync(docPath)) {
      results.issues.push(`缺少文档文件: ${docPath}`);
    }
  }
  
  console.log(colorize('✅ 文档检查完成', 'green'));
  
  return results;
}

/**
 * 运行所有检查
 */
async function runAllChecks() {
  console.log(colorize('🚀 开始部署前检查...', 'cyan'));
  console.log('='.repeat(60));
  
  const allResults = {
    valid: true,
    checks: {}
  };
  
  // 1. 检查环境变量（使用 .dev.vars 文件）
  console.log(colorize('\n1. 环境变量检查', 'magenta'));
  let envVars = {};
  if (fs.existsSync('.dev.vars')) {
    const envContent = fs.readFileSync('.dev.vars', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
  
  allResults.checks.environment = validateEnvironmentVariables(envVars);
  if (!allResults.checks.environment.valid) {
    allResults.valid = false;
  }
  
  // 2. 检查前端资源
  console.log(colorize('\n2. 前端资源检查', 'magenta'));
  allResults.checks.frontend = validateFrontendResources();
  if (!allResults.checks.frontend.valid) {
    allResults.valid = false;
  }
  
  // 3. 检查 wrangler.toml
  console.log(colorize('\n3. Wrangler 配置检查', 'magenta'));
  allResults.checks.wrangler = checkWranglerConfig();
  if (!allResults.checks.wrangler.valid) {
    allResults.valid = false;
  }
  
  // 4. 检查 package.json
  console.log(colorize('\n4. Package 配置检查', 'magenta'));
  allResults.checks.package = checkPackageConfig();
  if (!allResults.checks.package.valid) {
    allResults.valid = false;
  }
  
  // 5. 检查函数文件
  console.log(colorize('\n5. Functions 检查', 'magenta'));
  allResults.checks.functions = checkFunctionFiles();
  if (!allResults.checks.functions.valid) {
    allResults.valid = false;
  }
  
  // 6. 检查文档
  console.log(colorize('\n6. 文档检查', 'magenta'));
  allResults.checks.documentation = checkDocumentation();
  // 文档缺失不影响部署
  
  return allResults;
}

/**
 * 打印最终结果
 */
function printFinalResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('📋 部署前检查结果', 'cyan'));
  console.log('='.repeat(60));
  
  if (results.valid) {
    console.log(colorize('✅ 所有关键检查都通过了！项目可以部署。', 'green'));
  } else {
    console.log(colorize('❌ 发现问题，请修复后再部署。', 'red'));
  }
  
  // 显示各项检查结果
  for (const [checkName, checkResult] of Object.entries(results.checks)) {
    const status = checkResult.valid ? colorize('✅ 通过', 'green') : colorize('❌ 失败', 'red');
    console.log(`\n${checkName}: ${status}`);
    
    if (checkResult.issues && checkResult.issues.length > 0) {
      checkResult.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    if (checkResult.missing && checkResult.missing.length > 0) {
      checkResult.missing.forEach(item => {
        console.log(`  - 缺失: ${item.key} (${item.description})`);
      });
    }
    
    if (checkResult.errors && checkResult.errors.length > 0) {
      checkResult.errors.forEach(error => {
        console.log(`  - 错误: ${error.key} (${error.issue})`);
      });
    }
  }
  
  if (!results.valid) {
    console.log(colorize('\n🔧 修复建议:', 'yellow'));
    console.log('1. 检查并配置所有必需的环境变量');
    console.log('2. 确保所有前端资源文件存在且完整');
    console.log('3. 验证 wrangler.toml 配置正确');
    console.log('4. 运行 npm install 安装依赖');
    console.log('5. 参考相关文档进行配置');
    
    console.log(colorize('\n📖 相关文档:', 'blue'));
    console.log('- setup-env.md: 环境变量配置指南');
    console.log('- DEPLOYMENT.md: 完整部署指南');
    console.log('- KV-SETUP.md: KV 命名空间设置指南');
  } else {
    console.log(colorize('\n🚀 下一步:', 'green'));
    console.log('1. 运行 npm run deploy 部署到 Cloudflare Pages');
    console.log('2. 在 Cloudflare Dashboard 中配置生产环境变量');
    console.log('3. 测试部署后的应用功能');
    console.log('4. 访问 /api/health 检查系统状态');
  }
  
  console.log('\n');
}

// 主函数
async function main() {
  try {
    const results = await runAllChecks();
    printFinalResults(results);
    
    if (!results.valid) {
      process.exit(1);
    }
  } catch (error) {
    console.error(colorize('检查过程中发生错误:', 'red'), error);
    process.exit(1);
  }
}

// 如果作为脚本运行
if (require.main === module) {
  main();
}

module.exports = {
  runAllChecks,
  printFinalResults
};
