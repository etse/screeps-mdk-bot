export function getRandomObjectOfType(room: Room, type: FindConstant): Structure | null {
    const objs = room.find(type);
    if (objs.length > 0) {
        const num = Math.floor(Math.random() * objs.length);
        return objs[num] as Structure;
    }
    return null;
}
