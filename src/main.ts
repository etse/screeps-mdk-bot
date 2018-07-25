import {ErrorMapper} from "utils/ErrorMapper";
import {BaseMemory, CreepWithRole, RoleType} from "./roles/baserole";
import {Miner} from "./roles/miner";
import {getRoleForCreep} from "./roles/rolefactory";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    // Automatically delete memory of missing creeps
    if (Game.time % 20 === 0) {
        console.log(`Current game tick is ${Game.time}`);
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    const allCreeps = Object.keys(Game.creeps).map(creepName => Game.creeps[creepName] as CreepWithRole<BaseMemory>);

    if (Game.time % 10 === 0) {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            if (spawn.energy >= spawn.energyCapacity) {
                const creepsInRoom = allCreeps.filter(creep => creep.pos.roomName === spawn.pos.roomName);

                if (shouldSpawnMiners(creepsInRoom)) {
                    spawnCreep(spawn, Miner.getBody(spawn.energy), "miner", RoleType.ROLE_MINER);
                }
            }
        }
    }

    allCreeps.forEach(function(creep) {
        getRoleForCreep(creep).run();
    });

    function shouldSpawnMiners(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numMiners = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_MINER).length;
        return numMiners < 6;
    }

    function spawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], name: string, role: RoleType) {
        return spawn.spawnCreep(body, `${name}-${Game.time}`, { memory: { role } });
    }
});
