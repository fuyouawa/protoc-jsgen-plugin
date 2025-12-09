#!/usr/bin/env node

// 演示使用protobuf生成的JavaScript类进行流式调用
import { Vector3 } from './dist/core/math.mjs';
import { Entity } from './dist/entity.mjs';
import { Player, Status, GetPlayersResponse } from './dist/player.mjs';

console.log('🎯 演示流式调用功能');
console.log('======================');

// 示例1: 创建Vector3 (3D向量)
console.log('\n1. 创建3D向量:');
const position = new Vector3()
    .setX(10.5)
    .setY(20.3)
    .setZ(5.7);

console.log(`   位置: x=${position.getX()}, y=${position.getY()}, z=${position.getZ()}`);

// 示例2: 创建实体(Entity)
console.log('\n2. 创建实体:');
const entity = new Entity()
    .setName('Player001')
    .setPosition(position);  // 使用上面创建的position

console.log(`   实体名称: ${entity.getName()}`);
console.log(`   实体位置: x=${entity.getPosition().getX()}`);

// 示例3: 创建玩家(Player)
console.log('\n3. 创建玩家:');
const player = new Player()
    .setEntityInfo(entity)   // 设置实体信息
    .setPlayerState(Status.ACTIVE);  // 设置状态为活跃

console.log(`   玩家状态: ${player.getPlayerState()}`);

// 示例4: 创建嵌套消息(GetPlayersResponse)
console.log('\n4. 创建复杂消息(包含嵌套):');
const result1 = new GetPlayersResponse.Result()
    .setSuccess(true)
    .setEntityId(123456789n)
    .setPlayer(player);

const result2 = new GetPlayersResponse.Result()
    .setSuccess(false)
    .setEntityId(987654321n);

const response = new GetPlayersResponse()
    .setResults([result1, result2]);

console.log(`   响应包含 ${response.getResults().length} 个结果`);
console.log(`   第一个结果: success=${response.getResults()[0].getSuccess()}, entityId=${response.getResults()[0].getEntityId()}`);

// 示例5: 流式调用与JSON序列化
console.log('\n5. 流式调用与JSON序列化:');
// 由于使用了方案B，可以直接进行JSON序列化
const jsonData = JSON.stringify(response, (key, value) => {
    // 处理BigInt (proto中的uint64/int64在JS中可能是BigInt)
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}, 2);

console.log(`   JSON序列化结果长度: ${jsonData.length} 字符`);
console.log('   JSON片段:', jsonData.substring(0, 200) + '...');

// 示例6: 验证流式调用特性
console.log('\n6. 验证流式调用特性:');
// 证明setter方法返回this，支持链式调用
const testPlayer = new Player();
const returnedValue = testPlayer.setEntityInfo(entity).setPlayerState(Status.ACTIVE);

console.log(`   setter方法是否返回this: ${returnedValue === testPlayer ? '✅ 是' : '❌ 否'}`);
console.log(`   链式调用后实例类型: ${returnedValue.constructor.name}`);

console.log('\n🎉 流式调用演示完成!');
console.log('======================');
console.log('总结:');
console.log('- 所有setter方法都返回"this"');
console.log('- 支持链式调用（流式调用）');
console.log('- 嵌套消息也支持流式调用');
console.log('- 可以直接进行JSON序列化');
console.log('- 生成的代码遵循camelCase命名规范');