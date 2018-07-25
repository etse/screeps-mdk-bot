import {BaseMemory, BaseRole, CreepWithRole, RoleType} from "./baserole";
import {Miner, MinerMemory} from "./miner";
import {Builder, BuilderMemory} from "./builder";

export function getRoleForCreep(creep: Creep): BaseRole<BaseMemory> {
    const type: RoleType = (creep.memory as BaseMemory).role;
    switch (type) {
        case RoleType.ROLE_MINER:
            return new Miner(creep as CreepWithRole<MinerMemory>);
        case RoleType.ROLE_BUILDER:
            return new Builder(creep as CreepWithRole<BuilderMemory>);
        default:
            return new Miner(creep as CreepWithRole<MinerMemory>);
    }
}
