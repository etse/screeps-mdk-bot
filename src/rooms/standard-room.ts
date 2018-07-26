import {Baseroom} from "./baseroom";

interface Cell {
    x: number;
    y: number;
}

interface StandardRoomMemory extends Memory {
    roads: Cell[];
    extensions: Cell[];
    tower: Cell[];
    initialized: boolean;
}

class StandardRoom {
    private room: Baseroom<StandardRoomMemory>;

    constructor(room: Room) {
        this.room = room as Baseroom<StandardRoomMemory>;
    }

    private constructRoads() {

    }

    private constructExpanders() {

    }

    private spawnCreeps() {

    }

    init() {

        this.room.memory.initialized = true;
    }

    loop() {
        if (this.room.memory.initialized !== true) {
            this.init();
        }

        if (this.room.controller!.my) {
            this.constructRoads();
            this.constructExpanders();
            this.spawnCreeps();
        }
    }
}
