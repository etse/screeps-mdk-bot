import {BaseMemory, BaseRole} from "./baserole";
import {randomInRange} from "../utils/Utils";

enum WorkState {
    COLLECT_RESOURCE,
    REPAIR,
    BUILD
}

export interface BuilderMemory extends BaseMemory {
    energySource: string | null;
    buildTarget: string | null;
    state: WorkState;
}

export class Builder extends BaseRole<BuilderMemory> {
    init() {
        this.creep.memory.energySource = null;
        this.creep.memory.buildTarget = null;
        this.creep.memory.state = WorkState.COLLECT_RESOURCE;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, WORK, CARRY];
        const extraWorkParts = Math.min(Math.floor((energy - 200) / 200), 3);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, CARRY, MOVE);
        }
        return body;
    }

    private getEnergySource(): Source | AnyStructure | null {
        if (this.creep.room.storage != null && this.creep.room.storage.store[RESOURCE_ENERGY] > 50) {
            return this.creep.room.storage;
        }
        const source = this.creep.pos.findClosestByPath<Source>(FIND_SOURCES_ACTIVE);
        return source;
    }

    private getObjectToBuild(): ConstructionSite | null {
        return this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    }

    private getObjectToRepair(): Structure | null {
        const damagedStructures = this.creep.room.find<Structure>(FIND_STRUCTURES, {
            filter: structure => (structure.hits / structure.hitsMax) < 0.75 && structure.structureType !== STRUCTURE_SPAWN
        });

        if (damagedStructures.length > 0) {
            return damagedStructures[randomInRange(0, damagedStructures.length)];
        }
        return null;
    }

    private setNewWorkTarget() {
        this.creep.memory.energySource = null;
        this.creep.memory.buildTarget = null;
        this.creep.memory.state = WorkState.COLLECT_RESOURCE;
        const itemToRepair = this.getObjectToRepair();
        if (itemToRepair != null) {
            this.creep.memory.buildTarget = itemToRepair.id;
            this.creep.memory.state = WorkState.REPAIR;
        }

        const itemToBuild = this.getObjectToBuild();
        if (itemToBuild != null) {
            this.creep.memory.buildTarget = itemToBuild.id;
            this.creep.memory.state = WorkState.BUILD;
        }
    }

    protected collectResource() {
        const canUseStorage = this.creep.room.storage != null && this.creep.room.storage.store[RESOURCE_ENERGY] >= 50;

        if (!canUseStorage && this.creep.memory.energySource == null) {
            this.creep.memory.buildTarget = null;
            const newEnergySource = this.getEnergySource();
            this.creep.memory.energySource = newEnergySource ? newEnergySource.id : null;
        }

        if (!canUseStorage && this.creep.memory.energySource != null) {
            const target = Game.getObjectById<Source>(this.creep.memory.energySource)!;
            if (this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target);
            }
        } else if (canUseStorage) {
            const energyToWithdraw = this.creep.carryCapacity - this.creep.carry.energy;
            if (this.creep.withdraw(this.creep.room.storage!, RESOURCE_ENERGY, energyToWithdraw) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.creep.room.storage!);
            }
        }
        if (this.creep.carry[RESOURCE_ENERGY] === this.creep.carryCapacity) {
            this.setNewWorkTarget();
        }
    }

    private buildAndRepair() {
        if (this.creep.memory.buildTarget == null) {
            this.setNewWorkTarget();
        }

        if (this.creep.memory.buildTarget != null) {
            const target = Game.getObjectById<ConstructionSite | Structure>(this.creep.memory.buildTarget);
            if (target == null) {
                this.setNewWorkTarget();
            } else if (this.creep.memory.state === WorkState.BUILD) {
                const buildTarget = target as ConstructionSite;
                if (this.creep.build(buildTarget) === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(target);
                }
            } else {
                const repairTarget = target as Structure;
                if (this.creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(target);
                }
                if (repairTarget.hits === repairTarget.hitsMax) {
                    this.setNewWorkTarget();
                }
            }
        }
    }

    protected doRun() {
        this.creep.say("👷", true);
        if (this.creep.memory.state === WorkState.COLLECT_RESOURCE) {
            this.collectResource();
            if (this.creep.carry.energy === this.creep.carryCapacity) {
                this.setNewWorkTarget();
            }
        } else {
            this.buildAndRepair();
            if (this.creep.carry.energy === 0) {
                this.creep.memory.buildTarget = null;
                this.creep.memory.state = WorkState.COLLECT_RESOURCE;
            }
        }
    }

}
