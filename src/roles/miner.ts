import {BaseMemory, BaseRole} from "./baserole";
import {getRandomObjectOfType, randomInRange} from "../utils/Utils";

export interface MinerMemory extends BaseMemory {
    source: string;
    isMining: boolean;
    deposit: string | null;
}

export class Miner extends BaseRole<MinerMemory> {
    init() {
        this.creep.memory.source = getRandomObjectOfType(this.creep.room, FIND_SOURCES)!.id;
        this.creep.memory.isMining = true;
        this.creep.memory.deposit = null;
    }

    private getDeposit(): StructureSpawn | StructureExtension | StructureController {
        const shouldUpgradeController = randomInRange(0, 10) < 3;
        if (shouldUpgradeController && this.creep.room.controller) {
            return this.creep.room.controller!;
        }

        const energyContainers = this.creep.room.find<StructureExtension | StructureSpawn>(FIND_MY_STRUCTURES)
            .filter(structure => structure.energy < structure.energyCapacity);

        if (energyContainers.length > 0) {
            return energyContainers[randomInRange(0, energyContainers.length)];
        }
        return this.creep.room.controller!;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, WORK, CARRY];
        const extraWorkParts = Math.floor((energy - 200) / 200);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, CARRY, MOVE);
        }
        return body;
    }

    protected doRun() {
        if (this.creep.memory.isMining) {
            this.creep.say("⛏", true);
            const source = Game.getObjectById<Source>(this.creep.memory.source)!;
            if (this.creep.harvest(source) < 0) {
                this.creep.moveTo(source);
            }
            if (this.creep.carry.energy === this.creep.carryCapacity) {
                this.creep.memory.isMining = false;
            }
        } else {
            this.creep.say("🚢", true);
            if (this.creep.memory.deposit == null) {
                this.creep.memory.deposit = this.getDeposit().id;
            }

            if (this.creep.memory.deposit != null) {
                const deposit = Game.getObjectById<StructureExtension | StructureController>(this.creep.memory.deposit)!;
                if (deposit.structureType !== STRUCTURE_CONTROLLER && deposit.energy === deposit.energyCapacity) {
                    this.creep.memory.deposit = null;
                } else {
                    if (this.creep.transfer(deposit, RESOURCE_ENERGY) < 0) {
                        this.creep.moveTo(deposit);
                    }
                }
            }

            if (this.creep.carry.energy === 0) {
                this.creep.memory.isMining = true;
            }
        }
    }

}
