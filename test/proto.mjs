/**
 * 将Protobuf消息实例序列化为JSON字符串
 * @param {Object} message - Protobuf消息实例
 * @param {number|string} [space] - JSON格式化空格数或字符串
 * @returns {string} JSON字符串
 * @throws {Error} 如果消息无效或序列化失败
 */
export function toJson(message, space) {
    if (message === null || message === undefined) {
        throw new Error('message cannot be null or undefined');
    }

    try {
        return JSON.stringify(message, null, space);
    } catch (error) {
        throw new Error(`Failed to serialize message to JSON: ${error.message}`);
    }
}

/**
 * 将JSON数据反序列化为Protobuf消息实例
 * @param {Function} messageCls - Protobuf消息类（必须包含__descriptor）
 * @param {Object|string} json - JSON对象或JSON字符串
 * @returns {Object} 消息实例
 * @throws {Error} 如果参数无效或JSON解析失败
 */
export function fromJson(messageCls, json) {
    // 参数验证
    if (typeof messageCls !== 'function') {
        throw new Error('messageCls must be a function (message class)');
    }

    if (json === undefined || json === null) {
        throw new Error('json cannot be null or undefined');
    }

    // 如果json是字符串，解析它
    if (typeof json === 'string') {
        try {
            json = JSON.parse(json);
        } catch (error) {
            throw new Error(`Failed to parse JSON string: ${error.message}`);
        }
    }

    // 检查消息类是否有描述符
    const desc = messageCls.__descriptor;
    if (!desc) {
        throw new Error(`Invalid message type '${messageCls.name}' (missing __descriptor)`);
    }

    // 创建消息实例（不调用构造函数，直接设置原型链）
    const instance = Object.create(messageCls.prototype);

    // 遍历字段并设置值
    for (const field of desc.fields) {
        const fieldName = field.name; // camelCase in __descriptor
        // Try camelCase first, then snake_case for compatibility
        let jsonValue = json[fieldName];
        if (jsonValue === undefined) {
            // Try converting camelCase to snake_case
            const snakeCaseName = camelToSnake(fieldName);
            jsonValue = json[snakeCaseName];
        }

        // 如果JSON中没有该字段，跳过（可能是可选字段）
        if (jsonValue === undefined) {
            continue;
        }

        // 根据字段类型处理值
        const processedValue = processFieldValue(field, jsonValue);
        instance[fieldName] = processedValue;
    }

    return instance;
}

function processFieldValue(field, value) {
    const { label, name } = field;

    // 处理重复字段（数组）
    if (label === 'LABEL_REPEATED') {
        // 如果值为null，返回空数组
        if (value === null) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new Error(`Expected array for repeated field '${name}', got ${typeof value}`);
        }
        return value.map(item => processSingleFieldValue(field, item));
    }

    // 处理单个字段
    return processSingleFieldValue(field, value);
}

// Convert camelCase to snake_case
function camelToSnake(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Convert snake_case to camelCase
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function processSingleFieldValue(field, value) {
    const { type, clrType, name } = field;

    // 处理null值（可选字段可能为null）
    if (value === null) {
        return null;
    }

    // 如果是消息类型，递归处理
    if (type === 'TYPE_MESSAGE') {
        if (!clrType) {
            throw new Error(`Missing clrType for message field '${name}'`);
        }
        if (typeof clrType !== 'function') {
            throw new Error(`Invalid clrType for message field '${name}' (expected function, got ${typeof clrType})`);
        }
        // 递归调用fromJson处理嵌套消息
        return fromJson(clrType, value);
    }

    // 处理枚举类型（如果存在）
    if (type === 'TYPE_ENUM') {
        // 枚举值在JSON中通常是数字或字符串
        // 直接返回，因为JavaScript中没有对应的枚举类型
        return value;
    }

    // 基本类型直接返回（JSON解析已经处理了数字、布尔值等）
    // 注意：对于大整数类型（如TYPE_UINT64），JSON可能无法精确表示
    // 但在JavaScript中，数字类型可以处理2^53以内的整数
    return value;
}