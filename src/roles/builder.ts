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
        const extraWorkParts = Math.floor((energy - 200) / 200);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, CARRY, MOVE);
        }
        return body;
    }

    private getEnergySource(): Source | AnyStructure {
        const sources = this.creep.room.find(FIND_SOURCES_ACTIVE);
        return sources[randomInRange(0, sources.length)];
    }

    private getObjectToBuild(): ConstructionSite | null {
        const constructionSites = this.creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
            return constructionSites[randomInRange(0, constructionSites.length)];
        }
        return null;
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

    protected doRun() {
        if (this.creep.memory.state == WorkState.COLLECT_RESOURCE) {
            this.creep.say("⛽", true);
            if (this.creep.memory.energySource == null) {
                this.creep.memory.buildTarget = null;
                this.creep.memory.energySource = this.getEnergySource().id;
            }

            if (this.creep.memory.energySource != null) {
                const target = Game.getObjectById<Source>(this.creep.memory.energySource)!;
                if (this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(target);
                }
            }

            if (this.creep.carry.energy === this.creep.carryCapacity) {
                this.setNewWorkTarget();
            }
        } else {
            this.creep.say("🛠", true);
            if (this.creep.memory.buildTarget == null) {
                this.setNewWorkTarget();
            }

            if (this.creep.memory.buildTarget != null) {
                const target = Game.getObjectById<ConstructionSite | Structure>(this.creep.memory.buildTarget);
                if (target == null) {
                    this.setNewWorkTarget();
                } else if (this.creep.memory.state === WorkState.BUILD) {
                    const buildTarget = target as ConstructionSite;
                    if(this.creep.build(buildTarget) == ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(target);
                    }
                } else {
                    const repairTarget = target as Structure;
                    if(this.creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(target);
                    }
                    if (repairTarget.hits === repairTarget.hitsMax) {
                        this.setNewWorkTarget();
                    }
                }
            }

            if (this.creep.carry.energy == 0) {
                this.creep.memory.buildTarget = null;
                this.creep.memory.state = WorkState.COLLECT_RESOURCE;
            }
        }
    }

}
