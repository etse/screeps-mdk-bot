import {BaseMemory, BaseRole} from "./baserole";

export interface BuilderMemory extends BaseMemory {
    energySource: string | null;
    buildTarget: string | null;
}

export class Builder extends BaseRole<BuilderMemory> {
    init() {
        this.creep.memory.energySource = null;
        this.creep.memory.buildTarget = null;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, MOVE, WORK, CARRY];
        const extraWorkParts = Math.floor((energy - 250) / 250);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(WORK, CARRY, MOVE, MOVE);
        }
        return body;
    }

    protected doRun() {
        if (this.creep.carry.energy === 0) {
            this.creep.say("⛽", true);
            if (this.creep.memory.energySource == null) {

            }
        } else {
            this.creep.say("🛠", true);
        }
    }

}
