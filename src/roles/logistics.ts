import {BaseMemory, BaseRole} from "./baserole";
import {randomInRange} from "../utils/Utils";

enum LogisticsState {
    IDLE,
    CONTAINER_TO_STORAGE,
    STORAGE_TO_EXTENSIONS
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
        const extraWorkParts = Math.floor((energy - 150) / 150);
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

    private assignNewTask() {
        const container = this.findTargetContainer();
        this.creep.memory.target = null;
        this.creep.memory.isDelivering = this.creep.carry[RESOURCE_ENERGY] > 50;
        if (container != null) {
            this.creep.memory.target = container.id;
            this.creep.memory.state = LogisticsState.CONTAINER_TO_STORAGE;
        } else {
            const extension = this.findTargetExtension();
            if (extension != null) {
                this.creep.memory.target = extension.id;
                this.creep.memory.state = LogisticsState.STORAGE_TO_EXTENSIONS;
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
                const withdrawResult = this.creep.withdraw(container, RESOURCE_ENERGY, this.creep.carryCapacity);
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

    private storageToExtensions() {
        if (this.creep.memory.isDelivering) {
            const extension = Game.getObjectById<StructureExtension>(this.creep.memory.target!);
            if (extension == null || extension.energy == extension.energyCapacity) {
                this.creep.memory.state = LogisticsState.IDLE;
            } else if (this.creep.transfer(extension, RESOURCE_ENERGY, this.creep.carry.energy) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(extension);
            }
            if (this.creep.carry[RESOURCE_ENERGY] === 0) {
                this.creep.memory.state = LogisticsState.IDLE;
            }
        } else {
            const storage = this.creep.room.storage;
            if (storage == null || storage.store[RESOURCE_ENERGY] === 0) {
                this.creep.memory.state = LogisticsState.IDLE;
                return;
            }
            const amountToWithdraw = Math.min(this.creep.carryCapacity, storage.store[RESOURCE_ENERGY]);
            const withdrawResult = this.creep.withdraw(storage, RESOURCE_ENERGY, amountToWithdraw);
            if (withdrawResult === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(storage);
            } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
                this.creep.memory.state = LogisticsState.IDLE;
            } else if (withdrawResult === OK) {
                this.creep.memory.isDelivering = true;
            }
        }
    }

    protected doRun() {
        switch (this.creep.memory.state) {
            case LogisticsState.CONTAINER_TO_STORAGE:
                this.creep.say("⛴", true);
                return this.containerToStorage();
            case LogisticsState.STORAGE_TO_EXTENSIONS:
                this.creep.say("⛴", true);
                return this.storageToExtensions();
            case LogisticsState.IDLE:
                this.creep.say("⛴💤", true);
                return this.assignNewTask();
        }
    }

}
