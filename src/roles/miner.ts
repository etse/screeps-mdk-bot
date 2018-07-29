import {BaseMemory, BaseRole} from "./baserole";
import {getRandomObjectOfType, randomInRange} from "../utils/Utils";

export interface MinerMemory extends BaseMemory {
    source: string;
    isMining: boolean;
    deposit: string | null;
}

export class Miner extends BaseRole<MinerMemory> {
    init() {
        this.creep.memory.source = getRandomObjectOfType(this.creep.room, FIND_SOURCES_ACTIVE)!.id;
        this.creep.memory.isMining = true;
        this.creep.memory.deposit = null;
    }

    private getDeposit(): Structure {
        const isContainer = (structure: StructureContainer) => structure.structureType === STRUCTURE_CONTAINER;
        const isNotFull = (structure: StructureContainer) => structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
        const isANotFullContainer = (structure: StructureContainer) => isContainer(structure) && isNotFull(structure);

        const container = this.creep.pos.findClosestByPath<StructureContainer>(FIND_STRUCTURES, { filter: isANotFullContainer});
        if (container != null) {
            return container;
        }

        const energyInRoom = this.creep.room.energyAvailable;
        if (this.creep.room.controller != null && (this.creep.room.controller.ticksToDowngrade < 19000 || energyInRoom > 200)) {
            return this.creep.room.controller;
        }

        const energyContainers = this.creep.room.find<StructureExtension | StructureSpawn>(FIND_STRUCTURES)
            .filter(structure => structure.energy < structure.energyCapacity);

        if (energyContainers.length > 0) {
            return energyContainers[randomInRange(0, energyContainers.length)];
        }

        if (this.creep.room.storage != null) {
            return this.creep.room.storage;
        }

        return this.creep.room.controller!;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, WORK, CARRY];
        const extraWorkParts = Math.min(Math.floor((energy - 200) / 200), 3);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, CARRY, MOVE);
        }
        return body;
    }

    protected doRun() {
        this.creep.say("⛏", true);
        if (this.creep.memory.isMining) {
            const source = Game.getObjectById<Source>(this.creep.memory.source)!;
            const miningResult = this.creep.harvest(source);
            if (miningResult === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(source);
            } else if (miningResult === ERR_NOT_ENOUGH_RESOURCES && randomInRange(0, 100) > 97) {
                const newSource = getRandomObjectOfType(this.creep.room, FIND_SOURCES_ACTIVE);
                if (newSource !== null) {
                    this.creep.memory.source = newSource.id;
                }
            }
            if (this.creep.carry.energy === this.creep.carryCapacity) {
                this.creep.memory.isMining = false;
            }
        } else {
            if (this.creep.memory.deposit == null) {
                this.creep.memory.deposit = this.getDeposit().id;
            }

            if (this.creep.memory.deposit != null) {
                type depositTypes = StructureExtension | StructureController | StructureContainer;
                const deposit = Game.getObjectById<depositTypes>(this.creep.memory.deposit)!;
                if (deposit.structureType === STRUCTURE_EXTENSION) {
                    const extension = deposit as StructureExtension;
                    if (extension.energy === extension.energyCapacity) {
                        this.creep.memory.deposit = null;
                        return;
                    }
                } else if (deposit.structureType === STRUCTURE_CONTAINER) { 
                    const container = deposit as StructureContainer;
                    if (container.store[RESOURCE_ENERGY] === container.storeCapacity) {
                        this.creep.memory.deposit = null;
                        return;
                    }
                }
                if (this.creep.transfer(deposit, RESOURCE_ENERGY) < 0) {
                    this.creep.moveTo(deposit);
                }
            }

            if (this.creep.carry.energy === 0) {
                this.creep.memory.isMining = true;
                this.creep.memory.deposit = null;
            }
        }
    }

}
