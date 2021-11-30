export class VectorToDirectionValueConverter {
    toView(value) {
        const direction = [[1, 0], [0, 1], [-1, 0], [0, -1], [0, 0]].findIndex(element => element[0] == value[0] && element[1] == value[1]);
        return direction;
    }
}
