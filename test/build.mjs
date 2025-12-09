import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 递归查找 proto 文件
function findProtoFiles(dir) {
  let results = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(findProtoFiles(fullPath)); // 递归
    } else if (entry.endsWith('.proto')) {
      results.push(fullPath);
    }
  }

  return results;
}

// 配置
const config = {
  protoDir: join(__dirname, 'proto'),
  outputDir: join(__dirname, 'dist'),
  pluginPath: resolve(__dirname, '../build/bin/Release/protoc-gen-js-plugin.exe'),
};

// 确保输出目录存在
function ensureOutputDir() {
  if (!existsSync(config.outputDir)) {
    console.log(`创建输出目录: ${config.outputDir}`);
    mkdirSync(config.outputDir, { recursive: true });
  }
}

// 构建protoc命令
function buildProtocCommand(protoFiles) {
  const plugin = `--plugin=protoc-gen-js-mjs="${config.pluginPath}"`;
  const output = `--js-mjs_out=${config.outputDir}`;
  const include = `-I ${config.protoDir}`;

  const command = [
    'protoc',
    plugin,
    output,
    include,
    ...protoFiles
  ].join(' ');

  return command;
}

// 主函数
async function main() {
  console.log('🚀 开始生成JavaScript模块...');
  console.log(`插件路径: ${config.pluginPath}`);
  console.log(`Proto目录: ${config.protoDir}`);
  console.log(`输出目录: ${config.outputDir}`);

  // 检查插件是否存在
  if (!existsSync(config.pluginPath)) {
    console.error(`❌ 插件不存在: ${config.pluginPath}`);
    console.error('请先构建ProtocJsGenPlugin项目');
    process.exit(1);
  }

  if (!existsSync(config.protoDir)) {
    console.error(`❌ Proto目录不存在: ${config.protoDir}`);
    process.exit(1);
  }

  // 自动扫描所有 proto 文件
  const protoFiles = findProtoFiles(config.protoDir);
  if (protoFiles.length === 0) {
    console.error(`❌ 未找到任何 .proto 文件`);
    process.exit(1);
  }

  console.log(`找到 ${protoFiles.length} 个 proto 文件`);
  protoFiles.forEach(f => console.log("  ✔ " + f));

  ensureOutputDir();

  const command = buildProtocCommand(protoFiles);
  console.log(`执行命令: ${command}`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ 生成完成!');
  } catch (error) {
    console.error('❌ 生成失败:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
