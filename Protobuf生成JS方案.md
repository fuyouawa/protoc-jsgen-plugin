# Protobuf生成JS方案

## 目的
当js作为动态语言接入一个项目的时候，就会遇到proto方面处理的一些问题。比较稳定的方案就是js中构建对象，然后传给后端解析。
目前采用的主要方案是js中将对象序列化为json，然后后端可以直接用pb序列化。
不过会有一些问题，最主要的就是js是camelCase的变量命名，而proto是snake的。

## Proto示例
```protobuf
syntax = "proto3";

package pokeworld.player.cs;

message Player {
    entity.comm.EntityInfo entity_info = 1;
    // 略......
}

message GetPlayersResponse {
    option (message_id) = MESSAGE_ID_GET_PLAYER_RESPONSE;

    message Result {
        bool success = 1;
        Player player = 3;
    }

    repeated Result results = 1;
}
```

## 方案A - 为每个类生成toJson函数
### JS示例
```javascript
export class Player {
    static __descriptor = {
        name: "Player",
        fullName: "pokeworld.player.cs.Player",
        // 略......
    }

    /** @type {EntityInfo} */
    entityInfo;
    // 略......

    toJSON() {
        return {
            entity_info: this.entityInfo,
            // 略......
        };
    }

    static fromJSON(json) {
        return {
            entityInfo: EntityInfo.fromJSON(json.entity_info),
            // 略......
        };
    }
}

class __GetPlayersResponse_Result {
    static __descriptor = {
        name: "Result",
        fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
        // 略......
    }

    /** @type {boolean} */
    success;
    /** @type {Player} */
    player;

    toJSON() {
        return {
            success: this.success,
            player: this.player,
        };
    }

    fromJSON(json) {
        return {
            success: json.success,
            player: Player.fromJSON(json.player),
        };
    }
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
        // 略......
    }

    static Result = 

    /** @type {__GetPlayersResponse_Result[]} */
    results;

    toJSON() {
        return {
            results: this.results
        };
    }

    fromJSON(json) {
        return {
            results: json.results.map(__GetPlayersResponse_Result.fromJSON),
        };
    }
}
```
### 优点
可控性高，可以很方便就能实现js中用camelCase风格的变量，然后序列化时用snake。
并且由于自定义序列化，还能支持Map的序列化（JSON库不支持Map）。

### 缺点
虽然toJSON可以由JSON.stringify自动调用，但是fromJSON需要手动调用。
fromJSON 每层很难维护，尤其有嵌套、数组、map、oneof的时候，需要确保每个子对象反序列化时都调用了fromJSON。
由于序列化和反序列化都多了一层转换，所以性能也会有损失。

## 方案B - 为每个字段生成get set函数
### JS示例
```javascript
export class Player {
    static __descriptor = {
        name: "Player",
        fullName: "pokeworld.player.cs.Player",
        // 略......
    }

    /** 
     * @return {EntityInfo} 
    */
    getEntityInfo() {
        return this.entity_info;
    }
    
    /** 
     * @param {EntityInfo} value 
     * @return {Player}
    */
    setEntityInfo(value) {
        this.entity_info = value;
        return this;
    }

    // 略......
}

class __GetPlayersResponse_Result {
    static __descriptor = {
        name: "Result",
        fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
        // 略......
    }
    
    /**
     * @return {boolean} 
    */
    getSuccess() {
        return this.success;
    }
    
    /** 
     * @param {boolean} value 
     * @return {__GetPlayersResponse_Result}
    */
    setSuccess(value) {
        this.success = value;
        return this;
    }

    // 略......
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
        // 略......
    }

    static Result = __GetPlayersResponse_Result;

    /** 
     * @return {__GetPlayersResponse_Result[]} 
    */
    getResults() {
        return this.results;
    }
    
    /** 
     * @param {__GetPlayersResponse_Result[]} value 
     * @return {GetPlayersResponse}
    */
    setResults(value) {
        this.results = value;
        return this;
    }
}
```
### 优点
支持流式调用，JSON序列化不需要多一层转换，性能好。
### 缺点
JSON序列化不支持Map，所以Map类型只能使用any，无法类型标注。

## 方案C - 方案B结合方案A
### 优点
支持流式调用，支持Map
### 缺点
性能损失

## 最终选择 - 方案B
Map说到底用的也少，没必要为了支持一个Map损失性能。
而且proto似乎会为每个map类型字段生成一个message