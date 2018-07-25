import {ErrorMapper} from "utils/ErrorMapper";
import {BaseMemory, CreepWithRole, RoleType} from "./roles/baserole";
import {Miner} from "./roles/miner";
import {getRoleForCreep} from "./roles/rolefactory";
import {Builder} from "./roles/builder";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    // Automatically delete memory of missing creeps
    if (Game.time % 5 === 0) {
        console.log(`Current game tick is ${Game.time}`);
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    const allCreeps = Object.keys(Game.creeps).map(creepName => Game.creeps[creepName] as CreepWithRole<BaseMemory>);

    if (Game.time % 5 === 0) {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            if (spawn.energy >= 250) {
                const creepsInRoom = allCreeps.filter(creep => creep.pos.roomName === spawn.pos.roomName);

                if (shouldSpawnMiners(creepsInRoom)) {
                    spawnCreep(spawn, Miner.getBody(spawn.room.energyAvailable), "miner", RoleType.ROLE_MINER);
                } else if (shouldSpawnBuilders(creepsInRoom)) {
                    spawnCreep(spawn, Builder.getBody(spawn.room.energyAvailable), "builder", RoleType.ROLE_BUILDER);
                }
            }
        }
    }

    allCreeps.forEach(function(creep) {
        getRoleForCreep(creep).run();
    });

    function shouldSpawnMiners(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numMiners = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_MINER).length;
        return numMiners < 4;
    }

    function shouldSpawnBuilders(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numMiners = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_BUILDER).length;
        return numMiners < 5;
    }

    function spawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], name: string, role: RoleType) {
        return spawn.spawnCreep(body, `${name}-${Game.time}`, { memory: { role } });
    }
});
