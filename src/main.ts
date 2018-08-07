// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = () => {
    // Automatically delete memory of missing creeps
    if (Game.time % 5 === 0) {
        console.log(`Current game tick is ${Game.time}`);
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    const allCreeps = Object.keys(Game.creeps).map(creepName => Game.creeps[creepName]);
    const allRooms = Object.keys(Game.rooms).map(room => Game.rooms[room]);
};
