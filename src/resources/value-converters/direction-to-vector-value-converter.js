export class DirectionToVectorValueConverter {
    toView(value) {
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1], [0, 0]];
        return directions[value];
    }
}
