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
        return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
    }

    protected doRun() {
        return;
    }

}
