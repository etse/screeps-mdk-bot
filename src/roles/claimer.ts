import {BaseMemory, BaseRole} from "./baserole";

export interface ClaimerMemory extends BaseMemory {

}

export class Claimer extends BaseRole<ClaimerMemory> {
    init() {
        // do nothing yet
    }

    static getBody(energy: number): BodyPartConstant[] {
        return [MOVE, MOVE, MOVE, CLAIM];
    }


    protected doRun() {
        this.creep.say("🏇", true);
        const targetFlag = Game.flags.NextBase;
        if (targetFlag != null) {
            if (this.creep.pos.roomName === targetFlag.pos.roomName) {
                const controller = this.creep.room.controller;
                if (controller != null) {
                    const retClaim = this.creep.claimController(controller);
                    if (retClaim === ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(controller);
                    } else if(retClaim === ERR_GCL_NOT_ENOUGH) {
                        this.creep.reserveController(controller);
                    } else if (retClaim === OK) {
                        targetFlag.remove();
                    }
                }
            } else {
                this.creep.moveTo(targetFlag, { reusePath: 20 });
            }
        }
    }

}
