export function getRandomObjectOfType(room: Room, type: FindConstant): Structure | null {
    const objs = room.find(type);
    if (objs.length > 0) {
        const num = Math.floor(Math.random() * objs.length);
        return objs[num] as Structure;
    }
    return null;
}

export function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max-min)) + min;
}

export const moveOpts: MoveToOpts = {
    visualizePathStyle: { lineStyle: "dotted" }
};
