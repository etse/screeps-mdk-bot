import {BaseMemory, CreepWithRole, RoleType} from "./roles/baserole";
import {getRoleForCreep} from "./roles/rolefactory";
import {StandardRoom} from "./rooms/standard-room";
import { Claimer } from "roles/claimer";
import { Settler } from "roles/settler";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = () => {
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
    const allRooms = Object.keys(Game.rooms).map(room => new StandardRoom(Game.rooms[room]));

    // Spawn a claimer!
    const nextBaseFlag = Game.flags.NextBase;
    if (nextBaseFlag != null) {
        if (!allCreeps.some(creep => creep.memory.role == RoleType.ROLE_CLAIMER)) {
            const possibleSpawnsSorted = allRooms
                .map (room => room.room)
                .filter(room => room.energyAvailable > 750)
                .sort((room1, room2) =>(compareRoomDistance(room1.name, room2.name, nextBaseFlag.pos.roomName)));

            if (possibleSpawnsSorted.length > 0) {
                const roomToUse = possibleSpawnsSorted[0];
                const spawns = roomToUse.find<FIND_MY_SPAWNS>(FIND_MY_SPAWNS);
                if (spawns.length > 0) {
                    spawns[0].spawnCreep(Claimer.getBody(roomToUse.energyCapacityAvailable), `CLAIMER-${Game.time}`, { memory: { role: RoleType.ROLE_CLAIMER } })
                }
            }
        }
    }

    // Spawn settlers (builders to get base started)
    const settleFlag = Game.flags.Settle;
    if (settleFlag != null) {
        const settlers = allCreeps.filter(creep => creep.memory.role == RoleType.ROLE_SETTLER);
        if (settlers.length < 10) {
            allRooms
                .filter(room => room.room.energyAvailable > 350)
                .forEach(room => {
                    const spawns: StructureSpawn[] = room.room.find<FIND_MY_SPAWNS>(FIND_MY_SPAWNS);
                    if (spawns.length > 0) {
                        const name = `SETTLER-${room.room.name}-${Game.time}`;
                        const opts = { memory: { role: RoleType.ROLE_SETTLER } }; 
                        const body = Settler.getBody(room.room.energyAvailable);
                        spawns[0].spawnCreep(body, name, opts);
                    }
                })
        }
    }

    allCreeps.forEach(creep => getRoleForCreep(creep).run());
    allRooms.forEach(room => room.loop());
};

function compareRoomDistance(room1: string, room2: string, target: string) {
    const room1Distance = Game.map.getRoomLinearDistance(room1, target);
    const room2Distance = Game.map.getRoomLinearDistance(room2, target);
    return room2Distance - room1Distance;
}
