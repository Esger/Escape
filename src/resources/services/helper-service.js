export class HelperService {

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

    areEqual(vectors) { // array of 2 positions [x,y]
        const areEqual = JSON.stringify(vectors[0]) == JSON.stringify(vectors[1]);
        return areEqual;
    }

    randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

}
