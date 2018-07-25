import {BaseMemory, BaseRole} from "./baserole";
import {getRandomObjectOfType} from "../utils/Utils";

export interface MinerMemory extends BaseMemory {
    source: string;
    isMining: boolean;
    deposit: string;
}

export class Miner extends BaseRole<MinerMemory> {
    init() {
        const shouldFillSpawn = Math.floor(Math.random() * 10) < 2;
        if (shouldFillSpawn) {
            this.creep.memory.deposit = Game.spawns.FirstSpawn.id;
        } else {
            this.creep.memory.deposit = this.creep.room.controller!.id;
        }

        this.creep.memory.source = getRandomObjectOfType(this.creep.room, FIND_SOURCES)!.id;
        this.creep.memory.isMining = true;
    }

    static getBody(energy: number): BodyPartConstant[] {
        return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
    }

    protected doRun() {
        if (this.creep.memory.isMining) {
            const source = Game.getObjectById<Source>(this.creep.memory.source)!;
            if (this.creep.harvest(source) < 0) {
                this.creep.moveTo(source);
            }
            if (this.creep.carry.energy === this.creep.carryCapacity) {
                this.creep.memory.isMining = false;
            }
        } else {
            const deposit = Game.getObjectById<Structure>(this.creep.memory.deposit)!;
            if (this.creep.transfer(deposit, RESOURCE_ENERGY) < 0) {
                this.creep.moveTo(deposit);
            }
            if (this.creep.carry.energy === 0) {
                this.creep.memory.isMining = true;
            }
        }
    }

}
