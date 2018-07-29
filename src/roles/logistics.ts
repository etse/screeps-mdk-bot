import {BaseMemory, BaseRole} from "./baserole";
import {randomInRange} from "../utils/Utils";

enum LogisticsState {
    IDLE,
    CONTAINER_TO_STORAGE,
    STORAGE_TO_STRUCTURE,
}

export interface LogisticsMemory extends BaseMemory {
    target: string | null;
    state: LogisticsState;
    isDelivering: boolean;
}

export class Logistics extends BaseRole<LogisticsMemory> {
    init() {
        this.creep.memory.target = null;
        this.creep.memory.state = LogisticsState.IDLE;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, CARRY, CARRY];
        const extraWorkParts = Math.min(Math.floor((energy - 150) / 150), 3);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(MOVE, CARRY, CARRY);
        }
        return body;
    }

    private findTargetContainer(): StructureContainer | null {
        const isContainer = (structure: StructureContainer) => structure.structureType === STRUCTURE_CONTAINER;
        const isNearlyFull = (container: StructureContainer) => container.store.energy > container.storeCapacity * 0.5;
        const isNearlyFullContainer = (structure: StructureContainer) => isContainer(structure) && isNearlyFull(structure);
        return this.creep.pos.findClosestByPath<StructureContainer>(FIND_STRUCTURES, { filter: isNearlyFullContainer });
    }

    private findTargetExtension(): StructureExtension | null {
        const isExtension = (structure: AnyStructure) => structure.structureType === STRUCTURE_EXTENSION;
        const isEmpty = (extension: StructureExtension) => extension.energy === 0;
        const isEmptyExtension = (structure: StructureExtension) => isExtension(structure) && isEmpty(structure);
        return this.creep.pos.findClosestByPath<StructureExtension>(FIND_STRUCTURES, { filter: isEmptyExtension });
    }

    private findTargetTower(): StructureTower | null {
        const isTower = (structure: AnyStructure) => structure.structureType === STRUCTURE_TOWER;
        const needsEnergy = (tower: StructureTower) => tower.energy < tower.energyCapacity - 100;
        const isTowerThatNeedsEnergy = (structure: StructureTower) => isTower(structure) && needsEnergy(structure);
        return this.creep.pos.findClosestByPath<StructureTower>(FIND_STRUCTURES, { filter: isTowerThatNeedsEnergy });
    }

    private findStructureThatNeedsEnergy(): StructureTower | StructureExtension | null {
        const tower = this.findTargetTower();
        if (tower == null) {
            return this.findTargetExtension();
        }
        return tower;
    }

    private putEnergyInStructure() {
        const structure = Game.getObjectById<StructureExtension | StructureTower>(this.creep.memory.target!);
        if (structure == null || structure.energy === structure.energyCapacity) {
            this.creep.memory.state = LogisticsState.IDLE;
        } else {
            const amountToTransfer = Math.min(this.creep.carry[RESOURCE_ENERGY], structure.energyCapacity - structure.energy)
            const transferResult = this.creep.transfer(structure, RESOURCE_ENERGY, amountToTransfer);
            switch (transferResult) {
                case ERR_NOT_IN_RANGE:
                    this.creep.moveTo(structure);
                    break;
                case ERR_FULL:
                    const newTarget = this.findStructureThatNeedsEnergy();
                    if (newTarget == null) {
                        this.creep.memory.state = LogisticsState.IDLE;
                    } else {
                        this.creep.memory.target = newTarget.id;
                    }
                    break;
                default:
                    this.creep.memory.state = LogisticsState.IDLE;
                    break;
            }
        }
        if (this.creep.carry[RESOURCE_ENERGY] === 0) {
            this.creep.memory.state = LogisticsState.IDLE;
        }
    }

    private getEnergyFromStorage() {
        const storage = this.creep.room.storage;
        if (storage == null || storage.store[RESOURCE_ENERGY] === 0) {
            this.creep.memory.state = LogisticsState.IDLE;
            return;
        }
        const amountToWithdraw = Math.min(this.creep.carryCapacity - this.creep.carry[RESOURCE_ENERGY], storage.store[RESOURCE_ENERGY]);
        const withdrawResult = this.creep.withdraw(storage, RESOURCE_ENERGY, amountToWithdraw);
        if (withdrawResult === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(storage);
        } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
            this.creep.memory.state = LogisticsState.IDLE;
        } else if (withdrawResult === OK) {
            this.creep.memory.isDelivering = true;
        }
    }

    private assignNewTask() {
        const container = this.findTargetContainer();
        this.creep.memory.target = null;
        this.creep.memory.isDelivering = this.creep.carry[RESOURCE_ENERGY] >= 50;
        if (container != null && !(this.creep.room.energyAvailable < 500 && this.creep.room.storage!.store[RESOURCE_ENERGY] > 500 && randomInRange(0, 10) < 0.5)) {
            this.creep.memory.target = container.id;
            this.creep.memory.state = LogisticsState.CONTAINER_TO_STORAGE;
        } else {
            const structure = this.findStructureThatNeedsEnergy();
            if (structure != null) {
                this.creep.memory.target = structure.id;
                this.creep.memory.state = LogisticsState.STORAGE_TO_STRUCTURE;
            }
        }
    }

    private containerToStorage() {
        if (this.creep.memory.isDelivering) {
            const storage = this.creep.room.storage;
            if (storage == null || storage.store[RESOURCE_ENERGY] == storage.storeCapacity) {
                this.creep.memory.state = LogisticsState.IDLE;
            } else if (this.creep.transfer(storage, RESOURCE_ENERGY, this.creep.carry.energy) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(storage);
            }
            if (this.creep.carry.energy === 0) {
                this.creep.memory.state = LogisticsState.IDLE;
            }
        } else {
            const container = Game.getObjectById<StructureContainer>(this.creep.memory.target!);
            if (container == null || container.store[RESOURCE_ENERGY] === 0) {
                this.creep.memory.state = LogisticsState.IDLE;
            } else {
                const amountToWidthdraw = Math.min(this.creep.carryCapacity - this.creep.carry[RESOURCE_ENERGY], container.store[RESOURCE_ENERGY]);
                const withdrawResult = this.creep.withdraw(container, RESOURCE_ENERGY, amountToWidthdraw);
                if (withdrawResult === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(container);
                } else if (withdrawResult == ERR_NOT_ENOUGH_RESOURCES) {
                    this.creep.memory.state = LogisticsState.IDLE;
                } else if (withdrawResult === OK) {
                    this.creep.memory.isDelivering = true;
                }
            }
        }
    }

    private storageToStructure() {
        if (this.creep.memory.isDelivering) {
            this.putEnergyInStructure();
        } else {
            this.getEnergyFromStorage();
        }
    }

    protected doRun() {
        switch (this.creep.memory.state) {
            case LogisticsState.CONTAINER_TO_STORAGE:
                this.creep.say("⛴", true);
                return this.containerToStorage();
            case LogisticsState.STORAGE_TO_STRUCTURE:
                this.creep.say("⛴", true);
                return this.storageToStructure();
            case LogisticsState.IDLE:
                this.creep.say("⛴💤", true);
                return this.assignNewTask();
        }
    }

}
