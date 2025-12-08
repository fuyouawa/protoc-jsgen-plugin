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
    entity.comm.ActorInfo actor_info = 2;
    entity.comm.PlayerInfo player_info = 3;
    entity.comm.EntityTransform entity_transform = 4;
    entity.comm.ActorTransform actor_transform = 5;
    entity.comm.ActorState actor_state = 6;
}

message GetPlayersResponse {
    option (message_id) = MESSAGE_ID_GET_PLAYER_RESPONSE;

    message Result {
        bool success = 1;
        uint64 entity_id = 2;
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
    }

    /** @type {EntityInfo} */
    entityInfo;
    // 略......

    toJson() {
        return {
            entity_info: this.entityInfo.toJson(),
            // 略......
        };
    }
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
    }

    static Result = class {
        static __descriptor = {
            name: "Result",
            fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
        }

        /** @type {boolean} */
        success;
        /** @type {Player} */
        player;

        toJson() {
            return {
                success: this.success,
                player: this.player.toJson(),
            };
        }

        // 略......
    }

    /** @type {Result[]} */
    results;

    toJson() {
        return {
            results: this.results.map(result => result.toJson())
        };
    }
}
```
### 优点
可控性高，可以很方便就能实现js中用camelCase风格的变量，然后序列化时用snake。

### 缺点
toJson() 每层很难维护，尤其有嵌套、数组、map、oneof的时候，需要确保每个子对象序列化时都调用了toJson。

## 方案B - 为每个字段生成getter setter属性 
### JS示例
```javascript
export class Player {
    static __descriptor = {
        name: "Player",
        fullName: "pokeworld.player.cs.Player",
    }

    /** @type {EntityInfo} */
    get entityInfo() {
        return this.entity_info;
    }
    
    /** @param {EntityInfo} value */
    set entityInfo(value) {
        this.entity_info = value;
    }

    // 略......
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
    }

    static Result = class {
        static __descriptor = {
            name: "Result",
            fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
        }
        
        /** @type {boolean} */
        get success() {
            return this.success;
        }
        
        /** @param {boolean} value */
        set success(value) {
            this.success = value;
        }

        // 略......
    }

    /** @type {Result[]} */
    get results() {
        return this.results;
    }
    
    /** @param {Result[]} value */
    set results(value) {
        this.results = value;
    }
}
```

### 优点
使用方便，可以直接使用JSON.stringify序列化，性能好。
### 缺点
如果一个proto字段在js中不需要处理，就会导致递归调用的问题（比如GetPlayersResponse的results，get是results，内部调用的也是results）。

## 方案C - 为每个字段生成get set函数
### JS示例
```javascript
export class Player {
    static __descriptor = {
        name: "Player",
        fullName: "pokeworld.player.cs.Player",
    }

    /** @return {EntityInfo} */
    getEntityInfo() {
        return this.entity_info;
    }
    
    /** @param {EntityInfo} value */
    setEntityInfo(value) {
        this.entity_info = value;
    }

    // 略......
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
    }

    static Result = class {
        static __descriptor = {
            name: "Result",
            fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
        }
        
        /** @return {boolean} */
        getSuccess() {
            return this.success;
        }
        
        /** @param {boolean} value */
        setSuccess(value) {
            this.success = value;
        }

        // 略......
    }

    /** @return {Result[]} */
    getResults() {
        return this.results;
    }
    
    /** @param {Result[]} value */
    setResults(value) {
        this.results = value;
    }
}
```
### 优点
没有方案A和方案B的缺点
### 缺点
多写几个字母

## 最终选择 - 方案C