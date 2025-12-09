

export class Player {
    static __descriptor = {
        name: "Player",
        fullName: "pokeworld.player.cs.Player",
    }

    #entityInfo;

    /** @type {EntityInfo} */
    get entityInfo() {
        return this.#entityInfo;
    }
    
    /** @param {EntityInfo} value */
    set entityInfo(value) {
        this.#entityInfo = value;
    }

    // 略......

    toJSON() {
        return {
            entity_info: this.entityInfo,
        };
    }
}

class __GetPlayersResponse_Result {
    static __descriptor = {
        name: "Result",
        fullName: "pokeworld.player.cs.GetPlayersResponse.Result",
    }

    #success;
    #player;
    
    /** @type {boolean} */
    get success() {
        return this.#success;
    }
    
    /** @param {boolean} value */
    set success(value) {
        this.#success = value;
    }

    /** @type {Player} */
    get player() {
        return this.#player;
    }
    
    /** @param {Player} value */
    set player(value) {
        this.#player = value;
    }

    // 略......

    toJSON() {
        return {
            success: this.success,
            player: this.player,
        };
    }
}

export class GetPlayersResponse {
    static __descriptor = {
        name: "GetPlayersResponse",
        fullName: "pokeworld.player.cs.GetPlayersResponse",
    }

    #results;

    /** @type {__GetPlayersResponse_Result[]} */
    get results() {
        return this.#results;
    }
    
    /** @param {__GetPlayersResponse_Result[]} value */
    set results(value) {
        this.#results = value;
    }

    toJSON() {
        return {
            results: this.results,
        };
    }

    static Result = __GetPlayersResponse_Result;
}

const resp = new GetPlayersResponse();
resp.results = [
    new GetPlayersResponse.Result(),
    new GetPlayersResponse.Result(),
];

resp.results[0].success = true;
resp.results[0].player = new Player();
resp.results[0].player.entityInfo = {
    id: 1,
    name: "test",
    kind: 1,
};

console.log(JSON.stringify(resp));