import {Baseroom} from "./baseroom";
import {maxExtensions, maxSpawns, maxTowers} from "../utils/structures";
import {Tower} from "../roles/tower";
import {Miner} from "../roles/miner";
import {BaseMemory, CreepWithRole, RoleType} from "../roles/baserole";
import {Builder} from "../roles/builder";
import {Upgrader} from "../roles/upgrader";
import {Logistics} from "../roles/logistics";

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
    public room: Baseroom<StandardRoomMemory>;

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
        return numMiners < 3;
    }

    private getMaxNumBuilders(): number {
        const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES).length;
        if (constructionSites <= 3) {
            return 1;
        } else if (constructionSites <= 5) {
            return 2;
        } else if (constructionSites <= 10) {
            return 3;
        } else {
            return 4;
        }
    }

    private shouldSpawnBuilders(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numBuilders = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_BUILDER).length;
        return numBuilders < this.getMaxNumBuilders();
    }

    private shouldSpawnUpgrader(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numUpgraders = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_UPGRADER).length;
        return this.room.storage != null && numUpgraders < 4;
    }

    private shouldSpawnLogistics(creepsInRoom: CreepWithRole<BaseMemory>[]): boolean {
        const numLogistics = creepsInRoom.filter(creep => creep.memory.role === RoleType.ROLE_LOGISTICS).length;
        return this.room.storage != null && numLogistics < 3;
    }

    private spawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], role: RoleType) {
        return spawn.spawnCreep(body, `etse-${Game.time}`, { memory: { role } });
    }

    private spawnCreeps() {
        if (Game.time % 5 === 0) {
            const allCreeps = this.room.find<FIND_MY_CREEPS>(FIND_MY_CREEPS).map(creep => creep as CreepWithRole<BaseMemory>);
            const spawns = this.room.find<FIND_MY_SPAWNS>(FIND_MY_SPAWNS);

            for (const spawn of spawns) {
                if (this.room.energyAvailable >= 250) {
                    if (this.shouldSpawnMiners(allCreeps)) {
                        this.spawnCreep(spawn, Miner.getBody(this.room.energyAvailable), RoleType.ROLE_MINER);
                    } else if (this.shouldSpawnLogistics(allCreeps)) {
                        this.spawnCreep(spawn, Logistics.getBody(this.room.energyAvailable), RoleType.ROLE_LOGISTICS);
                    } else if (this.shouldSpawnBuilders(allCreeps)) {
                        this.spawnCreep(spawn, Builder.getBody(this.room.energyAvailable), RoleType.ROLE_BUILDER);
                    } else if (this.shouldSpawnUpgrader(allCreeps)) {
                        this.spawnCreep(spawn, Upgrader.getBody(this.room.energyAvailable), RoleType.ROLE_UPGRADER);
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

        if (this.room.controller != null && this.room.controller.my) {
            this.constructBuildings();
            this.spawnCreeps();
            this.updateTowers();
        }
    }
}
