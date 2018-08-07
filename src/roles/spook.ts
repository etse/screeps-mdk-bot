import {BaseMemory, BaseRole} from "./baserole";
import { randomInRange } from "utils/Utils";

export interface SpookMemory extends BaseMemory {
    nextRoomExit: RoomPosition | null;
    currentRoom: String | null;
    harassObject: string | null
}

export class Spook extends BaseRole<SpookMemory> {
    init() {
        this.creep.memory.nextRoomExit = null;
        this.creep.memory.harassObject = null;
    }

    static getBody(energy: number): BodyPartConstant[] {
        return [MOVE];
    }

    private getNextRoomExit(): RoomPosition {
        const exits = this.creep.room.find<FIND_EXIT>(FIND_EXIT);
        return exits[randomInRange(0, exits.length)];
    }

    private getObjectToStomp(): ConstructionSite | null {
        return this.creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES); 
    }

    private controllerNotSignedByMe(): boolean {
        if (this.creep.room.controller == null) {
            return false;
        }
        if (this.creep.room.controller.sign == null ) {
            return true;
        }
        return this.creep.room.controller.sign.username !== this.creep.owner.username;
    }

    private shouldStompConstructionSites(): boolean {
        if (this.creep.room.controller && this.creep.room.controller.my) {
            return false;
        }
        const sites = this.creep.room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
        return sites.length > 0;
    }

    private signController(): ScreepsReturnCode {
        const username = this.creep.owner;
        const retVal = this.creep.signController(this.creep.room.controller!, `${username} was here!`)
        if (retVal === ERR_NOT_IN_RANGE) {
            return this.creep.moveTo(this.creep.room.controller!);
        }
        return retVal;
    }

    private stompConstructionSites(): ScreepsReturnCode {
        if (this.creep.memory.harassObject != null) {
            const site = Game.getObjectById<ConstructionSite>(this.creep.memory.harassObject);
            if (site == null) {
                const nextObject = this.getObjectToStomp();
                this.creep.memory.harassObject = nextObject == null ? null : nextObject.id;
            } else {
                const retVal = this.creep.moveTo(site);
                if (retVal != OK || this.creep.pos.isEqualTo(site.pos)) {
                    const nextObject = this.getObjectToStomp();
                    this.creep.memory.harassObject = nextObject == null ? null : nextObject.id;
                }
                return retVal;
            }
        }
        return ERR_INVALID_TARGET;
    }

    private moveToNextRoom(): ScreepsReturnCode {
        if (this.creep.memory.currentRoom !== this.creep.room.name) {
            this.creep.memory.currentRoom = this.creep.room.name;
            this.creep.memory.nextRoomExit = this.getNextRoomExit();
        }
        if (this.creep.memory.nextRoomExit != null) {
            return this.creep.moveTo(this.creep.memory.nextRoomExit);
        }
        return ERR_NOT_FOUND;
    }

    protected doRun() {
        this.creep.say("👻", true);

        if (this.controllerNotSignedByMe()) {
            this.signController();
        } else if (this.shouldStompConstructionSites()) {
            this.stompConstructionSites();
        } else {
            this.moveToNextRoom();
        }
    }

}
