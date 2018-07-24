import {BaseMemory, BaseRole, CreepWithRole, RoleType} from "./baserole";
import {Miner, MinerMemory} from "./miner";

export function getRoleForCreep(creep: Creep): BaseRole<BaseMemory> {
    const type: RoleType = (creep.memory as BaseMemory).role;
    switch (type) {
        case RoleType.ROLE_MINER:
            return new Miner(creep as CreepWithRole<MinerMemory>);
        default:
            return new Miner(creep as CreepWithRole<MinerMemory>);
    }
}
