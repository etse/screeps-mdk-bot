import {BaseMemory, BaseRole} from "./baserole";

export interface BuilderMemory extends BaseMemory {
    energySource: string;
    buildTarget: string;
}

export class Builder extends BaseRole<BuilderMemory> {
    init() {
        return;
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
        return;
    }

}
