import {BaseMemory, BaseRole} from "./baserole";

enum UpgraderState {
    COLLECTING_RESOURCE,
    DELIVERING_RESOURCE
}

export interface UpgraderMemory extends BaseMemory {
    state: UpgraderState;
}

export class Upgrader extends BaseRole<UpgraderMemory> {
    init() {
        this.creep.memory.state = UpgraderState.COLLECTING_RESOURCE;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body = [MOVE, CARRY, WORK];
        const extraWorkParts = Math.min(Math.floor((energy - 200) / 200), 4);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(MOVE, CARRY, WORK);
        }
        return body;
    }


    protected doRun() {
        this.creep.say("🏋", true);
        if (this.creep.carry.energy === 0) {
            this.creep.memory.state = UpgraderState.COLLECTING_RESOURCE;
        }
        if (this.creep.carry.energy === this.creep.carryCapacity) {
            this.creep.memory.state = UpgraderState.DELIVERING_RESOURCE;
        }

        if (this.creep.memory.state === UpgraderState.COLLECTING_RESOURCE) {
            const resourceMissing = this.creep.carryCapacity - this.creep.carry.energy;
            if (this.creep.withdraw(this.creep.room.storage!, RESOURCE_ENERGY, resourceMissing) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.creep.room.storage!);
            }
        } else if (this.creep.memory.state === UpgraderState.DELIVERING_RESOURCE) {
            if (this.creep.upgradeController(this.creep.room.controller!) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.creep.room.controller!);
            }
        }
    }

}
