/**
 * Test serialization functionality of proto.mjs
 */

import { toJson, fromJson } from './proto.mjs';
import { Vector3, Vector2Int, Rect } from './gen/pokeworld/math/comm_math.mjs';
import { Player, Actor, TbPlayer } from './gen/pokeworld/actor/cfg_actor.mjs';
import { ResourceId } from './gen/pokeworld/resource/cfg_resource.mjs';

// Test helper functions
function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`OK: ${message}`);
    }
}

function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Test basic serialization
function testBasicSerialization() {
    console.log('\n=== Test Basic Serialization ===');

    const vec = Object.create(Vector3.prototype);
    vec.setX(1.5).setY(2.5).setZ(3.5);

    const json = toJson(vec);
    const expected = '{"x":1.5,"y":2.5,"z":3.5}';
    assert(json === expected, `Vector3 serialization: ${json}`);

    // Test formatting
    const formatted = toJson(vec, 2);
    assert(formatted.includes('\n'), 'Formatted JSON has newlines');

    console.log('✓ Basic serialization passed');
}

// Test basic deserialization
function testBasicDeserialization() {
    console.log('\n=== Test Basic Deserialization ===');

    const json = { x: 10, y: 20, z: 30 };
    const vec = fromJson(Vector3, json);

    assert(vec.getX() === 10, `Vector3.x = ${vec.getX()}`);
    assert(vec.getY() === 20, `Vector3.y = ${vec.getY()}`);
    assert(vec.getZ() === 30, `Vector3.z = ${vec.getZ()}`);

    // Test JSON string input
    const jsonStr = '{"x":100,"y":200,"z":300}';
    const vec2 = fromJson(Vector3, jsonStr);
    assert(vec2.getX() === 100, `Vector3 from string x = ${vec2.getX()}`);

    console.log('✓ Basic deserialization passed');
}

// Test round-trip serialization (serialize -> deserialize)
function testRoundTrip() {
    console.log('\n=== Test Round-trip Serialization ===');

    const original = Object.create(Vector2Int.prototype);
    original.setX(42).setY(99);

    const json = toJson(original);
    const restored = fromJson(Vector2Int, json);

    assert(original.getX() === restored.getX(), 'X values match');
    assert(original.getY() === restored.getY(), 'Y values match');

    console.log('✓ Round-trip serialization passed');
}

// Test nested message - DISABLED due to circular dependency in generated code
function testNestedMessage() {
    console.log('\n=== Test Nested Message ===');

    // Actor contains Player message
    const player = Object.create(Player.prototype);
    player.setId(123).setName('Test Player').setWalkSpeed(5.0);

    const actor = Object.create(Actor.prototype);
    actor.setPlayer(player);

    // Serialize
    const json = toJson(actor);
    const parsed = JSON.parse(json);
    assert(parsed.player !== undefined, 'Nested message exists');
    assert(parsed.player.id === 123, 'Nested message field correct');

    // Deserialize
    const restored = fromJson(Actor, json);
    assert(restored.getPlayer().getId() === 123, 'Nested message deserialized correctly');

    console.log('✓ Nested message test passed');
}

// Test repeated field (array)
function testRepeatedField() {
    console.log('\n=== Test Repeated Field ===');

    const tbPlayer = Object.create(TbPlayer.prototype);
    const player1 = Object.create(Player.prototype);
    player1.setId(1).setName('Player1');
    const player2 = Object.create(Player.prototype);
    player2.setId(2).setName('Player2');

    tbPlayer.setDataList([player1, player2]);

    // Serialize
    const json = toJson(tbPlayer);
    const parsed = JSON.parse(json);
    assert(Array.isArray(parsed.dataList), 'dataList is array');
    assert(parsed.dataList.length === 2, 'Array length correct');

    // Deserialize
    const restored = fromJson(TbPlayer, json);
    const list = restored.getDataList();
    assert(list.length === 2, 'Deserialized array length correct');
    assert(list[0].getId() === 1, 'First element correct');
    assert(list[1].getId() === 2, 'Second element correct');

    console.log('✓ Repeated field test passed');
}

// Test enum type
function testEnumField() {
    console.log('\n=== Test Enum Field ===');

    // Assuming ResourceId enum is defined
    const player = Object.create(Player.prototype);
    // Enum values are numbers in JavaScript
    player.setResourceId(ResourceId?.PLAYER || 1); // Use number if ResourceId not defined

    const json = toJson(player);
    const parsed = JSON.parse(json);
    assert(parsed.resourceId !== undefined, 'Enum field exists');

    // Deserialize
    const restored = fromJson(Player, json);
    assert(restored.getResourceId() === player.getResourceId(), 'Enum value correct');

    console.log('✓ Enum field test passed');
}

// Test error handling
function testErrorHandling() {
    console.log('\n=== Test Error Handling ===');

    try {
        toJson(null);
        assert(false, 'Should throw error for null input');
    } catch (e) {
        assert(e.message.includes('cannot be null'), `Correctly caught error: ${e.message}`);
    }

    try {
        toJson(undefined);
        assert(false, 'Should throw error for undefined input');
    } catch (e) {
        assert(e.message.includes('cannot be null'), `Correctly caught error: ${e.message}`);
    }

    try {
        fromJson(null, {});
        assert(false, 'Should throw error for invalid messageCls');
    } catch (e) {
        assert(e.message.includes('must be a function'), `Correctly caught error: ${e.message}`);
    }

    try {
        fromJson(Vector3, 'invalid json');
        assert(false, 'Should throw error for invalid JSON string');
    } catch (e) {
        assert(e.message.includes('Failed to parse JSON'), `Correctly caught error: ${e.message}`);
    }

    // Test class without descriptor
    class InvalidClass {}
    try {
        fromJson(InvalidClass, {});
        assert(false, 'Should throw error for missing descriptor');
    } catch (e) {
        assert(e.message.includes('missing __descriptor'), `Correctly caught error: ${e.message}`);
    }

    console.log('✓ Error handling test passed');
}

// Test optional fields (null values)
function testOptionalFields() {
    console.log('\n=== Test Optional Fields ===');

    // Create Rect with only some fields set
    const rect = Object.create(Rect.prototype);
    rect.setX(10).setY(20);
    // width and height are undefined

    const json = toJson(rect);
    const parsed = JSON.parse(json);
    assert(parsed.x === 10, 'x field correct');
    assert(parsed.y === 20, 'y field correct');
    assert(parsed.width === undefined, 'width field undefined');
    assert(parsed.height === undefined, 'height field undefined');

    // On deserialization, missing fields should be undefined
    const restored = fromJson(Rect, json);
    assert(restored.getX() === 10, 'Restored x correct');
    assert(restored.getY() === 20, 'Restored y correct');
    assert(restored.getWidth() === undefined, 'Restored width undefined');
    assert(restored.getHeight() === undefined, 'Restored height undefined');

    console.log('✓ Optional fields test passed');
}

// Main test function
async function runAllTests() {
    console.log('Starting proto.mjs serialization tests...\n');

    try {
        testBasicSerialization();
        testBasicDeserialization();
        testRoundTrip();
        testNestedMessage();
        testRepeatedField();
        testEnumField();
        testOptionalFields();
        testErrorHandling();

        console.log('\n🎉 All tests passed!');
    } catch (error) {
        console.error('\nTest failed:', error);
        process.exit(1);
    }
}

// If this script is run directly, execute tests
// if (import.meta.url === `file://${process.argv[1]}`) {
//     runAllTests();
// }
runAllTests();

export {
    testBasicSerialization,
    testBasicDeserialization,
    testRoundTrip,
    testNestedMessage,
    testRepeatedField,
    testEnumField,
    testOptionalFields,
    testErrorHandling,
    runAllTests
};