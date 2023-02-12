export class HelperService {

    constructor() {
        // right, down, left, up, none
        this._directions = [[1, 0], [0, 1], [-1, 0], [0, -1], [0, 0]];
    }

    areEqual(vectors) { // array of 2 positions [x,y]
        const v0 = JSON.stringify(vectors[0]);
        const v1 = JSON.stringify(vectors[1]);
        const areEqual = v0 === v1;
        return areEqual;
    }

    multiplyVector(vector, factor) {
        const newVector = [vector[0] * factor, vector[1] * factor];
        return newVector;
    }

    sumVectors() {
        const args = Array.prototype.slice.call(arguments);
        const sumVector = [0, 0];
        args.forEach(arg => {
            sumVector[0] += arg[0];
            sumVector[1] += arg[1];
        });
        return sumVector;
    }

    clamp(num) {
        return Math.min(Math.max(num, -1), 1);
    }

    clampVector(vector) {
        if (Math.abs(vector[0]) > Math.abs(vector[1])) {
            const dx = this.clamp(vector[0]);
            return [dx, 0];
        } else {
            const dy = this.clamp(vector[1]);
            return [0, dy];
        };
    }

    randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

    direction2vector(value) {
        return this._directions[value];
    }

    vector2direction(value) {
        const direction = this._directions.findIndex(element => this.areEqual([element, value]));
        return direction;
    }

    getBlockPosition(position, direction) {
        let directionVector;
        if (typeof direction === 'number') {
            directionVector = this.direction2vector(direction);
        } else {
            directionVector = direction;
        }
        const position2 = this.sumVectors(position, directionVector);
        return position2;
    }

    flashElements(className) {
        setTimeout(_ => {
            const $element = $(className);
            $element.addClass('flash flash--in');
            setTimeout(_ => {
                $element.removeClass('flash--in');
            }, 200);
        }, 500);
    }
}
