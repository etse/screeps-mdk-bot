import { Builder } from "./builder";

export class Settler extends Builder {
    static getBody(energy: number){
        return [MOVE, MOVE, MOVE, CARRY, CARRY, WORK];
    }

    protected doRun() {
        const targetFlag = Game.flags.Settle;
        if (targetFlag != null && this.creep.pos.roomName !== targetFlag.pos.roomName) {
            this.creep.say("🏇", true);
            this.creep.moveTo(targetFlag);
        } else {
            super.doRun();
            if (this.creep.room.find(FIND_MY_SPAWNS).length > 0 && targetFlag != null) {
                targetFlag.remove();
            }
        }
    }
}
