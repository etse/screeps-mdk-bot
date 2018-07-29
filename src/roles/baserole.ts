export enum RoleType {
    ROLE_MINER,
    ROLE_BUILDER,
    ROLE_LOGISTICS,
    ROLE_UPGRADER,
    ROLE_CLAIMER,
    ROLE_SETTLER
}

export interface BaseMemory {
    role: RoleType;
    initialized: boolean;
}

export interface CreepWithRole<M extends BaseMemory> extends Creep {
    memory: M;
}

export abstract class BaseRole<M extends BaseMemory> {
    protected creep: CreepWithRole<M>;

    abstract init(): void;
    protected abstract doRun(): void;

    constructor(creep: CreepWithRole<M>) {
        this.creep = creep;
    }

    run(): void {
        if (this.creep.memory.initialized !== true) {
            this.init();
            this.creep.memory.initialized = true;
        }
        try {
            this.doRun();
        } catch (e) {
            console.log(this.creep.name, this.creep.memory.role, (e as Error).stack);
        }
    }

    static getBody(energy: number): BodyPartConstant[] {
        return [MOVE, MOVE, WORK, CARRY];
    }
}
