/**
 * 前端资源完整性验证脚本
 * 检查 public 目录中的前端资源是否完整
 */

const fs = require('fs');
const path = require('path');

// 必需的前端文件
const REQUIRED_FILES = [
  {
    path: 'public/index.html',
    description: '主页面',
    checks: [
      { pattern: /<title>考勤系统<\/title>/, description: '页面标题' },
      { pattern: /高德地图 API/, description: '高德地图API引用' },
      { pattern: /function.*getCurrentLocation/, description: '定位功能' },
      { pattern: /function.*submitLocation/, description: '提交功能' },
      { pattern: /\/api\/user/, description: '用户API调用' },
      { pattern: /\/api\/submit-location/, description: '提交API调用' }
    ]
  },
  {
    path: 'public/login.html',
    description: '登录页面',
    checks: [
      { pattern: /<title>考勤系统 - 登录<\/title>/, description: '登录页面标题' },
      { pattern: /github-login/, description: 'GitHub登录按钮' },
      { pattern: /gitee-login/, description: 'Gitee登录按钮' },
      { pattern: /\/oauth\/login/, description: 'GitHub OAuth链接' },
      { pattern: /\/oauth\/gitee/, description: 'Gitee OAuth链接' }
    ]
  }
];

// 可选的资源文件
const OPTIONAL_FILES = [
  'public/favicon.ico',
  'public/manifest.json',
  'public/robots.txt',
  'public/css/style.css',
  'public/js/app.js'
];

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件内容或null
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return null;
  }
}

/**
 * 验证文件内容
 * @param {string} content - 文件内容
 * @param {Array} checks - 检查项目
 * @returns {Object} 验证结果
 */
function validateContent(content, checks) {
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const check of checks) {
    const passed = check.pattern.test(content);
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    results.details.push({
      description: check.description,
      pattern: check.pattern.toString(),
      passed
    });
  }

  return results;
}

/**
 * 验证前端资源完整性
 * @returns {Object} 验证结果
 */
function validateFrontendResources() {
  const results = {
    valid: true,
    summary: {
      requiredFiles: 0,
      missingFiles: 0,
      contentChecks: 0,
      failedChecks: 0
    },
    files: [],
    optionalFiles: []
  };

  console.log('🔍 开始验证前端资源完整性...\n');

  // 检查必需文件
  for (const fileConfig of REQUIRED_FILES) {
    const fileResult = {
      path: fileConfig.path,
      description: fileConfig.description,
      exists: false,
      content: null,
      validation: null
    };

    results.summary.requiredFiles++;

    // 检查文件是否存在
    if (fileExists(fileConfig.path)) {
      fileResult.exists = true;
      console.log(`✅ ${fileConfig.path} - 文件存在`);

      // 读取并验证文件内容
      const content = readFile(fileConfig.path);
      if (content) {
        fileResult.content = content.length;
        fileResult.validation = validateContent(content, fileConfig.checks);
        
        results.summary.contentChecks += fileConfig.checks.length;
        results.summary.failedChecks += fileResult.validation.failed;

        if (fileResult.validation.failed > 0) {
          console.log(`⚠️  ${fileConfig.path} - 内容检查失败 ${fileResult.validation.failed}/${fileConfig.checks.length}`);
          results.valid = false;
        } else {
          console.log(`✅ ${fileConfig.path} - 内容检查通过 ${fileResult.validation.passed}/${fileConfig.checks.length}`);
        }
      } else {
        console.log(`❌ ${fileConfig.path} - 无法读取文件内容`);
        results.valid = false;
      }
    } else {
      fileResult.exists = false;
      results.summary.missingFiles++;
      console.log(`❌ ${fileConfig.path} - 文件不存在`);
      results.valid = false;
    }

    results.files.push(fileResult);
  }

  // 检查可选文件
  console.log('\n📋 检查可选文件:');
  for (const optionalFile of OPTIONAL_FILES) {
    const exists = fileExists(optionalFile);
    results.optionalFiles.push({
      path: optionalFile,
      exists
    });
    
    if (exists) {
      console.log(`✅ ${optionalFile} - 存在`);
    } else {
      console.log(`ℹ️  ${optionalFile} - 不存在（可选）`);
    }
  }

  return results;
}

/**
 * 打印验证结果
 * @param {Object} results - 验证结果
 */
function printResults(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 前端资源验证结果');
  console.log('='.repeat(50));

  if (results.valid) {
    console.log('✅ 所有必需的前端资源都已正确配置！');
  } else {
    console.log('❌ 前端资源配置不完整或有错误');
  }

  console.log(`\n📈 统计信息:`);
  console.log(`   必需文件: ${results.summary.requiredFiles}`);
  console.log(`   缺失文件: ${results.summary.missingFiles}`);
  console.log(`   内容检查: ${results.summary.contentChecks}`);
  console.log(`   失败检查: ${results.summary.failedChecks}`);

  // 显示详细的失败信息
  if (!results.valid) {
    console.log('\n❌ 详细错误信息:');
    
    for (const file of results.files) {
      if (!file.exists) {
        console.log(`   - 缺失文件: ${file.path}`);
      } else if (file.validation && file.validation.failed > 0) {
        console.log(`   - ${file.path} 内容检查失败:`);
        for (const detail of file.validation.details) {
          if (!detail.passed) {
            console.log(`     * ${detail.description}`);
          }
        }
      }
    }

    console.log('\n🔧 修复建议:');
    console.log('   1. 确保所有必需文件都存在于 public 目录中');
    console.log('   2. 检查文件内容是否包含必要的功能代码');
    console.log('   3. 参考原始 Deno 项目的前端文件');
    console.log('   4. 运行 npm run build 重新构建前端资源');
  }

  console.log('\n');
}

// 如果作为脚本运行
if (require.main === module) {
  const results = validateFrontendResources();
  printResults(results);
  
  if (!results.valid) {
    process.exit(1);
  }
}

module.exports = {
  validateFrontendResources,
  printResults,
  REQUIRED_FILES,
  OPTIONAL_FILES
};
