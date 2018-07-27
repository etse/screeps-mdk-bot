import {Baseroom} from "./baseroom";
import {maxExtensions, maxSpawns, maxTowers} from "../utils/structures";
import {Tower} from "../roles/tower";
import {Miner} from "../roles/miner";
import {BaseMemory, CreepWithRole, RoleType} from "../roles/baserole";
import {Builder} from "../roles/builder";

interface Cell {
    x: number;
    y: number;
}

interface StandardRoomMemory extends CreepMemory {
    roads: Cell[];
    extensions: Cell[];
    towers: Cell[];
    spawns: Cell[];
    initialized: boolean;
}

export class StandardRoom {
    private room: Baseroom<StandardRoomMemory>;

    constructor(room: Room) {
        this.room = room as Baseroom<StandardRoomMemory>;
    }

    private getControllerLevel(): number {
        if (this.room.controller != null && this.room.controller.my) {
            return this.room.controller.level;
        }
        return 0;
    }

    private buildRoads() {
        if (this.room.memory.roads.length === 0) {
            // assign road-locations
        }
        this.room.memory.roads
            .map(roadLocation => this.room.getPositionAt(roadLocation.x, roadLocation.y)!)
            .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
    }

    private buildExtensions() {
        if (this.room.memory.extensions.length < maxExtensions(this.getControllerLevel())) {
            // Assign extension-locations
        }
        this.room.memory.roads
            .map(roadLocation => this.room.getPositionAt(roadLocation.x, roadLocation.y)!)
            .forEach(pos => pos.createConstructionSite(STRUCTURE_EXTENSION));
    }

    private buildTowers() {
        if (this.room.memory.towers.length < maxTowers(this.getControllerLevel())) {
            // Assign tower locations
        }
        this.room.memory.roads
            .map(roadLocation => this.room.getPositionAt(roadLocation.x, roadLocation.y)!)
            .forEach(pos => pos.createConstructionSite(STRUCTURE_TOWER));
    }

    private buildSpawns() {
        if (this.room.memory.spawns.length < maxSpawns(this.getControllerLevel())) {
            // Assign spawn-location;
        }
        this.room.memory.roads
            .map(roadLocation => this.room.getPositionAt(roadLocation.x, roadLocation.y)!)
            .forEach(pos => pos.createConstructionSite(STRUCTURE_SPAWN, `${this.room.name}-${Game.time}`));
    }

    private constructBuildings() {
        this.buildSpawns();
        this.buildRoads();
        this.buildExtensions();
        this.buildTowers();
    }

    private shouldSpawnMiners(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numMiners = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_MINER).length;
        return numMiners < 8;
    }

    private shouldSpawnBuilders(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numMiners = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_BUILDER).length;
        return numMiners < 6;
    }

    private spawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], name: string, role: RoleType) {
        return spawn.spawnCreep(body, `${name}-${Game.time}`, { memory: { role } });
    }

    private spawnCreeps() {
        if (Game.time % 5 === 0) {
            const allCreeps = this.room.find<FIND_MY_CREEPS>(FIND_MY_CREEPS).map(creep => creep as CreepWithRole<BaseMemory>);
            const spawns = this.room.find<FIND_MY_SPAWNS>(FIND_MY_SPAWNS);

            for (const spawn of spawns) {
                if (this.room.energyAvailable >= 250) {
                    if (this.shouldSpawnMiners(allCreeps)) {
                        this.spawnCreep(spawn, Miner.getBody(this.room.energyAvailable), "miner", RoleType.ROLE_MINER);
                    } else if (this.shouldSpawnBuilders(allCreeps)) {
                        this.spawnCreep(spawn, Builder.getBody(this.room.energyAvailable), "builder", RoleType.ROLE_BUILDER);
                    }
                }
            }
        }
    }

    private updateTowers() {
        const isTower = (structure: AnyStructure) => structure.structureType === STRUCTURE_TOWER;
        const allTowers: Tower[] = this.room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: isTower })
            .map(tower => new Tower(tower));

        allTowers.forEach(tower => tower.loop());
    }

    private init() {
        this.room.memory.spawns = [];
        this.room.memory.towers = [];
        this.room.memory.extensions = [];
        this.room.memory.roads = [];
        this.room.memory.initialized = true;
    }

    loop() {
        if (this.room.memory.initialized !== true) {
            this.init();
        }

        if (this.room.controller!.my) {
            this.constructBuildings();
            this.spawnCreeps();
            this.updateTowers();
        }
    }
}
