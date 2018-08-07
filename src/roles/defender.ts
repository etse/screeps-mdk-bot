import {BaseMemory, BaseRole} from "./baserole";

export interface DefenderMemory extends BaseMemory {
    idleLocation: RoomPosition | null;
}

export class Defender extends BaseRole<DefenderMemory> {
    init() {
        this.creep.memory.idleLocation = this.getIdleLocation();
    }

    private getEnemy(): Creep | null {
        return this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    }

    private getIdleLocation(): RoomPosition {
        const constructionSite = this.creep.pos.findClosestByPath<ConstructionSite>(FIND_CONSTRUCTION_SITES);
        if (constructionSite != null) {
            return constructionSite.pos;
        }
        const road = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (structure: AnyStructure) => structure.structureType === STRUCTURE_ROAD});
        if (road != null) {
            return road.pos;
        }
        return this.creep.pos;
    }

    static getBody(energy: number): BodyPartConstant[] {
        const body: BodyPartConstant[] = [ATTACK, MOVE];
        const extraWorkParts = Math.min(Math.floor((energy - 130) / 200), 3);
        for (let i = 0; i < extraWorkParts; i++) {
            body.push(MOVE, RANGED_ATTACK);
        }
        return body;
    }

    protected doRun() {
        this.creep.say("⚔", true);
        const enemy = this.getEnemy();

        if (enemy != null) {
            this.creep.memory.idleLocation = null;
            this.creep.moveTo(enemy);
            this.creep.rangedAttack(enemy);
            this.creep.attack(enemy);
        } else {
            if (this.creep.memory.idleLocation == null) {
                this.creep.memory.idleLocation = this.getIdleLocation();
            }
            this.creep.moveTo(this.creep.memory.idleLocation);
        }
    }

}
