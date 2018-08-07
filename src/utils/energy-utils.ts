type GeneralStorage = STRUCTURE_CONTAINER | STRUCTURE_STORAGE;
type EnergyStorage = STRUCTURE_EXTENSION | STRUCTURE_SPAWN;

export function getEnergyInStructure(structure: AnyStructure): number {
    switch(structure.structureType) {
        case STRUCTURE_CONTAINER:
        case STRUCTURE_STORAGE:
            return structure.store[RESOURCE_ENERGY];
        case STRUCTURE_EXTENSION:
        case STRUCTURE_SPAWN:
            return structure.energy;
        default:
            return 0;
    }
}

export function getMaxEnergyForStructure(structure: AnyStructure): number {
    switch(structure.structureType) {
        case STRUCTURE_CONTAINER:
        case STRUCTURE_STORAGE:
            return structure.storeCapacity;
        case STRUCTURE_EXTENSION:
        case STRUCTURE_SPAWN:
            return structure.energyCapacity;
        default:
            return 0;
    }
}

export function withdrawEnergy(creep: Creep, structure: AnyStructure | Source): ScreepsReturnCode {
    if (structure.hasOwnProperty("structureType")) {
        const struc = structure as AnyStructure;
        const roomLeft = creep.carryCapacity - creep.carry[RESOURCE_ENERGY];
        const amount = Math.min(roomLeft, getEnergyInStructure(struc));
        return creep.withdraw(struc, RESOURCE_ENERGY, amount);
    }
    return creep.harvest(structure as Source);
}

export function depositEnergy(creep: Creep, structure: AnyStructure): ScreepsReturnCode {
    if (structure.structureType === STRUCTURE_CONTROLLER) {
        return creep.upgradeController(structure);
    } else {
        const amountNeeded = getMaxEnergyForStructure(structure) - getEnergyInStructure(structure);
        const amountToTransfer = Math.min(amountNeeded, creep.carry[RESOURCE_ENERGY]);
        return creep.transfer(structure, RESOURCE_ENERGY, amountToTransfer);
    }
}

export function withdrawEnergyOrMove(creep: Creep, structure: AnyStructure): ScreepsReturnCode {
    const retVal = withdrawEnergy(creep, structure);
    if (retVal === ERR_NOT_IN_RANGE) {
        return creep.moveTo(structure);
    }
    return retVal;
}

export function depositEnergyOrMove(creep: Creep, structure: AnyStructure): ScreepsReturnCode {
    const retVal = depositEnergy(creep, structure);
    if (retVal === ERR_NOT_IN_RANGE) {
        return creep.moveTo(structure);
    }
    return retVal;
}
