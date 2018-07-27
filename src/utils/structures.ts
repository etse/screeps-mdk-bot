export function maxContainers(controllerLevel: number): number {
    return 5;
}

export function maxExtensions(controllerLevel: number): number {
    switch (controllerLevel) {
        case 0:
        case 1:
            return 0;
        case 2:
            return 5;
        case 3:
            return 10;
        case 4:
            return 20;
        case 5:
            return 30;
        case 6:
            return 40;
        case 7:
            return 50;
        case 8:
            return 60;
        default:
            return 60;
    }
}

export function maxSpawns(controllerLevel: number): number {
    if (controllerLevel >= 1 && controllerLevel < 7) {
        return 1;
    } else if (controllerLevel === 7) {
        return 2;
    } else if (controllerLevel === 8) {
        return 3;
    }
    return 0;
}

export function maxTowers(controllerLevel: number): number {
    if (controllerLevel >= 3 && controllerLevel < 5) {
        return 1;
    } else if (controllerLevel >= 5 && controllerLevel < 7) {
        return 2;
    } else if (controllerLevel === 7) {
        return 3;
    } else if (controllerLevel === 8) {
        return 6;
    }
    return 0;
}

export function rampartsAllowed(controllerLevel: number): boolean {
    return controllerLevel >= 2;
}

export function storageAllowed(controllerLevel: number): boolean {
    return controllerLevel >= 4;
}

export function wallsAllowed(controllerLevel: number): boolean {
    return controllerLevel >= 2;
}

export function maxLinks(controllerLevel: number): number {
    switch (controllerLevel) {
        case 5:
            return 2;
        case 6:
            return 3;
        case 7:
            return 4;
        case 8:
            return 6;
        default:
            return 0;
    }
}
