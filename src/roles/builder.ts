import {BaseMemory, BaseRole} from "./baserole";
import {randomInRange} from "../utils/Utils";

export interface BuilderMemory extends BaseMemory {
    energySource: string | null;
    buildTarget: string | null;
    collectingEnergy: boolean;
}

export class Builder extends BaseRole<BuilderMemory> {
    init() {
        this.creep.memory.energySource = null;
        this.creep.memory.buildTarget = null;
        this.creep.memory.collectingEnergy = true;
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

    private getObjectToBuild(): ConstructionSite | Structure | null {
        const damagedStructures = this.creep.room.find<Structure>(FIND_STRUCTURES, {
            filter: structure => (structure.hits / structure.hitsMax) < 0.75 && structure.structureType !== STRUCTURE_SPAWN
        });

        if (damagedStructures.length > 0) {
            return damagedStructures[randomInRange(0, damagedStructures.length)];
        }

        const constructionSites = this.creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
            return constructionSites[randomInRange(0, constructionSites.length)];
        }
        return null;
    }

    protected doRun() {
        if (this.creep.memory.collectingEnergy != false) {
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
                this.creep.memory.collectingEnergy = false;
            }
        } else {
            this.creep.say("🛠", true);
            if (this.creep.memory.buildTarget == null) {
                this.creep.memory.energySource = null;
                const objectToBuild = this.getObjectToBuild();
                this.creep.memory.buildTarget = objectToBuild == null ? null : objectToBuild.id;
            }

            if (this.creep.memory.buildTarget != null) {
                const target = Game.getObjectById<ConstructionSite>(this.creep.memory.buildTarget);
                if (target == null) {
                    this.creep.memory.buildTarget = null;
                } else if (this.creep.build(target) === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(target);
                }
            }

            if (this.creep.carry.energy == 0) {
                this.creep.memory.collectingEnergy = true;
            }
        }
    }

}
