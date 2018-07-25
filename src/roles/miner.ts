import {BaseMemory, BaseRole} from "./baserole";
import {getRandomObjectOfType} from "../utils/Utils";

export interface MinerMemory extends BaseMemory {
    source: string;
    isMining: boolean;
    deposit: string;
}

export class Miner extends BaseRole<MinerMemory> {
    init() {
        const shouldFillSpawn = Math.floor(Math.random() * 10) < 5;
        if (shouldFillSpawn) {
            this.creep.memory.deposit = Game.spawns.FirstSpawn.id;
        } else {
            this.creep.memory.deposit = this.creep.room.controller!.id;
        }

        this.creep.memory.source = getRandomObjectOfType(this.creep.room, FIND_SOURCES)!.id;
        this.creep.memory.isMining = true;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, MOVE, WORK, CARRY];
        const extraWorkParts = Math.floor((energy - 250) / 150);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, MOVE);
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
