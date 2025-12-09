#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const config = {
  // proto文件目录（相对于脚本目录）
  protoDir: join(__dirname, 'proto'),
  // 输出目录
  outputDir: join(__dirname, 'dist'),
  // protoc插件路径（相对于脚本目录）
  pluginPath: resolve(__dirname, '../build/bin/Release/protoc-gen-js-plugin.exe'),
  // 要处理的proto文件
  protoFiles: [
    'entity.proto',
    'entity2.proto',
    'player.proto',
    'core/math.proto'
  ]
};

// 确保输出目录存在
function ensureOutputDir() {
  if (!existsSync(config.outputDir)) {
    console.log(`创建输出目录: ${config.outputDir}`);
    mkdirSync(config.outputDir, { recursive: true });
  }
}

// 构建protoc命令
function buildProtocCommand() {
  const plugin = `--plugin=protoc-gen-js-mjs="${config.pluginPath}"`;
  const output = `--js-mjs_out=${config.outputDir}`;
  const include = `-I ${config.protoDir}`;

  // 构建完整的proto文件路径
  const protoFilePaths = config.protoFiles.map(file =>
    join(config.protoDir, file)
  );

  const command = [
    'protoc',
    plugin,
    output,
    include,
    ...protoFilePaths
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

  // 检查proto目录是否存在
  if (!existsSync(config.protoDir)) {
    console.error(`❌ Proto目录不存在: ${config.protoDir}`);
    process.exit(1);
  }

  // 检查proto文件是否存在
  for (const file of config.protoFiles) {
    const filePath = join(config.protoDir, file);
    if (!existsSync(filePath)) {
      console.error(`❌ Proto文件不存在: ${filePath}`);
      process.exit(1);
    }
  }

  // 确保输出目录存在
  ensureOutputDir();

  // 构建并执行命令
  const command = buildProtocCommand();
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

// 执行主函数
main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});