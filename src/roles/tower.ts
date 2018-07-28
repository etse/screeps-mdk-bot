import {randomInRange} from "../utils/Utils";

export class Tower {
    private tower: StructureTower;

    constructor(tower: StructureTower) {
        this.tower = tower;
    }

    private attackHostileUnits(): ScreepsReturnCode {
        const hostileUnits = this.tower.room.find(FIND_HOSTILE_CREEPS);
        if (hostileUnits.length === 0) {
            return ERR_INVALID_TARGET;
        }
        return this.tower.attack(hostileUnits[randomInRange(0, hostileUnits.length)]);
    }

    private healMyUnits(): ScreepsReturnCode {
        const unitIsDamaged = (creep: Creep) => creep.hits < creep.hitsMax;
        const harmedUnit = this.tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: unitIsDamaged });
        if (harmedUnit == null) {
            return ERR_INVALID_TARGET;
        }
        return this.tower.heal(harmedUnit);
    }

    private repairStructures(): ScreepsReturnCode {
        if (this.tower.energy < this.tower.energyCapacity / 2) {
            return ERR_NOT_ENOUGH_ENERGY;
        }
        const structureIsDamaged = (structure: Structure) => structure.hits < structure.hitsMax * 0.25;
        const damagedStructure = this.tower.pos.findClosestByRange<AnyStructure>(FIND_STRUCTURES, { filter: structureIsDamaged });
        if (damagedStructure == null) {
            return ERR_INVALID_TARGET;
        }
        return this.tower.repair(damagedStructure);
    }

    public loop(): ScreepsReturnCode {
        if (this.tower.energy < 10 || !this.tower.isActive()) {
            return ERR_NOT_ENOUGH_ENERGY;
        }

        if (this.attackHostileUnits() === OK) {
            return OK;
        }

        if (this.healMyUnits() === OK) {
            return OK;
        }
        return OK;
    }
}
