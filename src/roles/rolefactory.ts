import {BaseMemory, BaseRole, CreepWithRole, RoleType} from "./baserole";
import {Miner, MinerMemory} from "./miner";
import {Builder, BuilderMemory} from "./builder";
import {Upgrader, UpgraderMemory} from "./upgrader";
import {Logistics, LogisticsMemory} from "./logistics";
import { Claimer, ClaimerMemory } from "./claimer";
import { Settler } from "./settler";
import { Defender, DefenderMemory } from "./defender";
import { Spook, SpookMemory } from "./spook";

export function getRoleForCreep(creep: Creep): BaseRole<BaseMemory> {
    const type: RoleType = (creep.memory as BaseMemory).role;
    switch (type) {
        case RoleType.ROLE_MINER:
            return new Miner(creep as CreepWithRole<MinerMemory>);
        case RoleType.ROLE_DEFENDER:
            return new Defender(creep as CreepWithRole<DefenderMemory>);
        case RoleType.ROLE_BUILDER:
            return new Builder(creep as CreepWithRole<BuilderMemory>);
        case RoleType.ROLE_UPGRADER:
            return new Upgrader(creep as CreepWithRole<UpgraderMemory>);
        case RoleType.ROLE_LOGISTICS:
            return new Logistics(creep as CreepWithRole<LogisticsMemory>);
        case RoleType.ROLE_CLAIMER:
            return new Claimer(creep as CreepWithRole<ClaimerMemory>);
        case RoleType.ROLE_SETTLER:
            return new Settler(creep as CreepWithRole<BuilderMemory>);
        case RoleType.ROLE_SPOOK:
            return new Spook(creep as CreepWithRole<SpookMemory>);
        default:
            return new Miner(creep as CreepWithRole<MinerMemory>);
    }
}
