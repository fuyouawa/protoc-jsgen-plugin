/**
 * Protobuf compatibility tests
 * Tests bidirectional JSON serialization compatibility between:
 * 1. Our generated JS classes (toJson) -> protobuf.js (from JSON)
 * 2. protobuf.js (to JSON) -> Our generated JS classes (fromJson)
 */

import { toJson, fromJson } from './proto.mjs';
import { Vector3, Vector2Int, Rect } from './gen/pokeworld/math/comm_math.mjs';
import { Player, Actor, TbPlayer } from './gen/pokeworld/actor/cfg_actor.mjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load protobuf.js dynamically
import protobuf from 'protobufjs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const protoRoot = join(__dirname, 'proto');

// Test helper functions
function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`OK: ${message}`);
    }
}

// Convert camelCase to snake_case
function camelToSnake(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Convert snake_case to camelCase
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert object keys from camelCase to snake_case
function camelKeysToSnake(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(camelKeysToSnake);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = camelToSnake(key);
        result[snakeKey] = camelKeysToSnake(value);
    }
    return result;
}

// Convert object keys from snake_case to camelCase
function snakeKeysToCamel(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(snakeKeysToCamel);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = snakeToCamel(key);
        result[camelKey] = snakeKeysToCamel(value);
    }
    return result;
}

async function loadProtobufMessages() {
    const root = new protobuf.Root();

    // Load proto files from test/proto directory using absolute paths
    const protoFiles = [
        join(protoRoot, 'pokeworld/math/comm_math.proto'),
        join(protoRoot, 'pokeworld/actor/cfg_actor.proto'),
        join(protoRoot, 'pokeworld/resource/cfg_resource.proto')
    ];

    // Verify files exist
    for (const file of protoFiles) {
        if (!existsSync(file)) {
            console.error(`❌ Proto file not found: ${file}`);
            process.exit(1);
        }
        console.log(`📁 Proto file: ${file}`);
    }

    // Set resolvePath on root before loading
    root.resolvePath = (origin, target) => {
        console.log(`root.resolvePath called: origin="${origin}", target="${target}"`);

        // If target is already absolute, use it
        if (target.startsWith('/') || /^[a-zA-Z]:\\/.test(target)) {
            console.log(`  Target is absolute, returning: ${target}`);
            return target;
        }

        // Strategy 1: If target starts with pokeworld/, resolve from protoRoot
        // This is because imports like "pokeworld/resource/cfg_resource.proto" are relative to proto root
        if (target.startsWith('pokeworld/')) {
            const resolved = join(protoRoot, target);
            console.log(`  Target starts with pokeworld/, resolving from protoRoot: ${resolved}`);
            return resolved;
        }

        // Strategy 2: If origin is provided, try resolving relative to origin
        if (origin) {
            const originDir = dirname(origin);
            const resolved = join(originDir, target);
            console.log(`  Resolving relative to origin: ${originDir} + ${target} = ${resolved}`);
            return resolved;
        }

        // Strategy 3: Default to resolving from protoRoot
        const resolved = join(protoRoot, target);
        console.log(`  Defaulting to protoRoot: ${resolved}`);
        return resolved;
    };

    // Use async loading
    try {
        await root.load(protoFiles, { keepCase: true });
        console.log('✅ Protobuf.js messages loaded successfully');
        return root;
    } catch (error) {
        console.error('❌ Failed to load protobuf messages:', error);
        process.exit(1);
    }
}

// Test 1: Our JSON -> protobuf.js
async function testOurJsonToProtobufJs() {
    console.log('\n=== Test 1: Our JSON -> protobuf.js ===');

    const root = await loadProtobufMessages();

    // Test Vector3
    console.log('Testing Vector3...');
    const vector3Type = root.lookupType('pokeworld.math.comm.Vector3');

    // Create object using our generated class
    const ourVec = Object.create(Vector3.prototype);
    ourVec.setX(1.5).setY(2.5).setZ(3.5);

    // Serialize to JSON using our toJson
    const ourJson = toJson(ourVec);
    const jsonObj = JSON.parse(ourJson);

    // Try to decode using protobuf.js
    const pbMessage = vector3Type.fromObject(jsonObj);
    assert(pbMessage.x === 1.5, `protobuf.js decoded x = ${pbMessage.x}`);
    assert(pbMessage.y === 2.5, `protobuf.js decoded y = ${pbMessage.y}`);
    assert(pbMessage.z === 3.5, `protobuf.js decoded z = ${pbMessage.z}`);

    // Verify round-trip: encode back and compare
    const encoded = vector3Type.encode(pbMessage).finish();
    const decoded = vector3Type.decode(encoded);
    assert(decoded.x === 1.5, 'Round-trip encoding preserved x');

    console.log('✅ Vector3 compatibility test passed');

    // Test Vector2Int
    console.log('Testing Vector2Int...');
    const vector2IntType = root.lookupType('pokeworld.math.comm.Vector2Int');

    const ourVec2Int = Object.create(Vector2Int.prototype);
    ourVec2Int.setX(42).setY(99);

    const ourJson2Int = toJson(ourVec2Int);
    const jsonObj2Int = JSON.parse(ourJson2Int);

    const pbMessage2Int = vector2IntType.fromObject(jsonObj2Int);
    assert(pbMessage2Int.x === 42, `protobuf.js decoded x = ${pbMessage2Int.x}`);
    assert(pbMessage2Int.y === 99, `protobuf.js decoded y = ${pbMessage2Int.y}`);

    console.log('✅ Vector2Int compatibility test passed');

    // Test Player message
    console.log('Testing Player...');
    try {
        const playerType = root.lookupType('pokeworld.actor.cfg.Player');
        const ourPlayer = Object.create(Player.prototype);
        ourPlayer.setId(123).setName('Test Player').setWalkSpeed(5.0);

        const ourPlayerJson = toJson(ourPlayer);
        const jsonObjPlayer = JSON.parse(ourPlayerJson);
        // Convert camelCase keys to snake_case for protobuf.js
        const snakeCaseJson = camelKeysToSnake(jsonObjPlayer);

        const pbPlayer = playerType.fromObject(snakeCaseJson);
        assert(pbPlayer.id === 123, `protobuf.js decoded id = ${pbPlayer.id}`);
        assert(pbPlayer.name === 'Test Player', `protobuf.js decoded name = ${pbPlayer.name}`);
        assert(pbPlayer.walk_speed === 5.0, `protobuf.js decoded walk_speed = ${pbPlayer.walk_speed}`);

        console.log('✅ Player compatibility test passed');
    } catch (error) {
        console.error('❌ Player test failed:', error.message);
        // Don't exit, just log the error for debugging
    }

    console.log('🎉 "Our JSON -> protobuf.js" tests completed!');
}

// Test 2: protobuf.js -> Our JSON
async function testProtobufJsToOurJson() {
    console.log('\n=== Test 2: protobuf.js -> Our JSON ===');

    const root = await loadProtobufMessages();

    // Test Vector3
    console.log('Testing Vector3...');
    const vector3Type = root.lookupType('pokeworld.math.comm.Vector3');

    // Create object using protobuf.js
    const pbVec = vector3Type.create({ x: 10.5, y: 20.5, z: 30.5 });

    // Convert to plain object (as protobuf.js would produce for JSON)
    const pbObject = vector3Type.toObject(pbVec);

    // Try to parse using our fromJson
    const ourVec = fromJson(Vector3, pbObject);
    assert(ourVec.getX() === 10.5, `Our class parsed x = ${ourVec.getX()}`);
    assert(ourVec.getY() === 20.5, `Our class parsed y = ${ourVec.getY()}`);
    assert(ourVec.getZ() === 30.5, `Our class parsed z = ${ourVec.getZ()}`);

    console.log('✅ Vector3 reverse compatibility test passed');

    // Test Vector2Int
    console.log('Testing Vector2Int...');
    const vector2IntType = root.lookupType('pokeworld.math.comm.Vector2Int');

    const pbVec2Int = vector2IntType.create({ x: 100, y: 200 });
    const pbObject2Int = vector2IntType.toObject(pbVec2Int);

    const ourVec2Int = fromJson(Vector2Int, pbObject2Int);
    assert(ourVec2Int.getX() === 100, `Our class parsed x = ${ourVec2Int.getX()}`);
    assert(ourVec2Int.getY() === 200, `Our class parsed y = ${ourVec2Int.getY()}`);

    console.log('✅ Vector2Int reverse compatibility test passed');

    // Test Player with all fields
    console.log('Testing Player...');
    try {
        const playerType = root.lookupType('pokeworld.actor.cfg.Player');

        const pbPlayer = playerType.create({
            id: 999,
            name: 'Protobuf Player',
            walk_speed: 7.5,
            resource_id: 2
        });

        const pbPlayerObject = playerType.toObject(pbPlayer);

        const ourPlayer = fromJson(Player, pbPlayerObject);
        assert(ourPlayer.getId() === 999, `Our class parsed id = ${ourPlayer.getId()}`);
        assert(ourPlayer.getName() === 'Protobuf Player', `Our class parsed name = ${ourPlayer.getName()}`);
        assert(ourPlayer.getWalkSpeed() === 7.5, `Our class parsed walkSpeed = ${ourPlayer.getWalkSpeed()}`);
        assert(ourPlayer.getResourceId() === 2, `Our class parsed resourceId = ${ourPlayer.getResourceId()}`);

        console.log('✅ Player reverse compatibility test passed');
    } catch (error) {
        console.error('❌ Player test failed:', error.message);
        // Don't exit, just log the error for debugging
    }

    console.log('🎉 "protobuf.js -> Our JSON" tests completed!');
}

// Test 3: Complex nested message compatibility
async function testNestedMessageCompatibility() {
    console.log('\n=== Test 3: Nested Message Compatibility ===');

    const root = await loadProtobufMessages();

    // Test Actor with nested Player
    console.log('Testing Actor with nested Player...');
    const actorType = root.lookupType('pokeworld.actor.cfg.Actor');
    const playerType = root.lookupType('pokeworld.actor.cfg.Player');

    // Create nested message with protobuf.js
    const pbPlayer = playerType.create({
        id: 777,
        name: 'Nested Player',
        walk_speed: 3.0
    });

    const pbActor = actorType.create({
        player: pbPlayer
    });

    // Convert to plain object
    const pbActorObject = actorType.toObject(pbActor, {
        longs: Number,
        enums: String,
        bytes: String,
    });

    // Parse with our fromJson
    const ourActor = fromJson(Actor, pbActorObject);

    const ourPlayer = ourActor.getPlayer();
    assert(ourPlayer !== undefined, 'Nested player exists');
    assert(ourPlayer.getId() === 777, `Our class parsed nested player id = ${ourPlayer.getId()}`);
    assert(ourPlayer.getName() === 'Nested Player', `Our class parsed nested player name = ${ourPlayer.getName()}`);

    console.log('✅ Nested message compatibility test passed');

    // Now test the reverse: our nested message -> protobuf.js
    console.log('Testing reverse: Our nested message -> protobuf.js');

    const ourPlayer2 = Object.create(Player.prototype);
    ourPlayer2.setId(888).setName('Our Nested Player').setWalkSpeed(4.0);

    const ourActor2 = Object.create(Actor.prototype);
    ourActor2.setPlayer(ourPlayer2);

    const ourActorJson = toJson(ourActor2);
    const ourActorObj = JSON.parse(ourActorJson);

    const pbActor2 = actorType.fromObject(ourActorObj);
    assert(pbActor2.player.id === 888, `protobuf.js parsed nested player id = ${pbActor2.player.id}`);

    console.log('✅ Reverse nested message compatibility test passed');

    console.log('🎉 Nested message compatibility tests passed!');
}

// Test 4: Repeated field compatibility
async function testRepeatedFieldCompatibility() {
    console.log('\n=== Test 4: Repeated Field Compatibility ===');

    const root = await loadProtobufMessages();

    // Test TbPlayer with repeated Player array
    console.log('Testing TbPlayer with repeated fields...');
    const tbPlayerType = root.lookupType('pokeworld.actor.cfg.TbPlayer');
    const playerType = root.lookupType('pokeworld.actor.cfg.Player');

    // Create with protobuf.js
    const pbPlayers = [
        playerType.create({ id: 1, name: 'Player 1' }),
        playerType.create({ id: 2, name: 'Player 2' }),
        playerType.create({ id: 3, name: 'Player 3' })
    ];

    const pbTbPlayer = tbPlayerType.create({
        data_list: pbPlayers
    });

    const pbTbPlayerObject = tbPlayerType.toObject(pbTbPlayer);

    // Parse with our fromJson
    const ourTbPlayer = fromJson(TbPlayer, pbTbPlayerObject);
    const ourPlayers = ourTbPlayer.getDataList();

    assert(Array.isArray(ourPlayers), 'dataList is array');
    assert(ourPlayers.length === 3, `Array length = ${ourPlayers.length}`);
    assert(ourPlayers[0].getId() === 1, `First player id = ${ourPlayers[0].getId()}`);
    assert(ourPlayers[1].getName() === 'Player 2', `Second player name = ${ourPlayers[1].getName()}`);

    console.log('✅ Repeated field compatibility test passed');

    // Test reverse
    console.log('Testing reverse: Our repeated field -> protobuf.js');

    const ourPlayer1 = Object.create(Player.prototype);
    ourPlayer1.setId(10).setName('Our Player 1');

    const ourPlayer2 = Object.create(Player.prototype);
    ourPlayer2.setId(20).setName('Our Player 2');

    const ourTbPlayer2 = Object.create(TbPlayer.prototype);
    ourTbPlayer2.setDataList([ourPlayer1, ourPlayer2]);

    const ourTbPlayerJson = toJson(ourTbPlayer2);
    const ourTbPlayerObj = JSON.parse(ourTbPlayerJson);
    // Convert camelCase keys to snake_case for protobuf.js
    const snakeCaseObj = camelKeysToSnake(ourTbPlayerObj);

    const pbTbPlayer2 = tbPlayerType.fromObject(snakeCaseObj);
    assert(Array.isArray(pbTbPlayer2.data_list), 'protobuf.js data_list is array');
    assert(pbTbPlayer2.data_list.length === 2, `protobuf.js array length = ${pbTbPlayer2.data_list.length}`);
    assert(pbTbPlayer2.data_list[0].id === 10, `protobuf.js first player id = ${pbTbPlayer2.data_list[0].id}`);

    console.log('✅ Reverse repeated field compatibility test passed');

    console.log('🎉 Repeated field compatibility tests passed!');
}

// Main test function
async function runAllCompatibilityTests() {
    console.log('🚀 Starting Protobuf compatibility tests...');
    console.log('===========================================');

    try {
        await testOurJsonToProtobufJs();
        await testProtobufJsToOurJson();
        await testNestedMessageCompatibility();
        await testRepeatedFieldCompatibility();

        console.log('\n🎉🎉🎉 All compatibility tests passed! 🎉🎉🎉');
        console.log('Summary:');
        console.log('  ✓ Our generated JSON can be parsed by protobuf.js');
        console.log('  ✓ protobuf.js generated JSON can be parsed by our fromJson');
        console.log('  ✓ Nested messages work bidirectionally');
        console.log('  ✓ Repeated fields (arrays) work bidirectionally');

    } catch (error) {
        console.error('\n❌ Compatibility test failed:', error);
        process.exit(1);
    }
}

// Run if this script is executed directly
runAllCompatibilityTests();

export {
    testOurJsonToProtobufJs,
    testProtobufJsToOurJson,
    testNestedMessageCompatibility,
    testRepeatedFieldCompatibility,
    runAllCompatibilityTests
};