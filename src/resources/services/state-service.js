import { inject } from 'aurelia-framework';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";
import { VectorToDirectionValueConverter } from "resources/value-converters/vector-to-direction-value-converter";

@inject(DirectionToVectorValueConverter, VectorToDirectionValueConverter)
export class StateService {

    _bricks = [];
    _bricksCount = 5;//125;
    _blockSize = 10;//5;
    _boardSize = Math.round(100 / this._blockSize);
    _pusher = {
        position: {
            left: Math.round(this._boardSize / 2),
            top: Math.round(this._boardSize / 2)
        }
    };

    constructor(directionToVectorValueConverter, vectorToDirectionValueConverter) {
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
        this._setBlock(this._pusher.position, true);
        this._directionToVector = directionToVectorValueConverter;
        this._vectorToDirection = vectorToDirectionValueConverter;
    }

    getBricks() { return this._bricks; }

    getBlockSize() { return this._blockSize; }

    getPusherPosition() {
        return this._pusher.position;
    }

    moveBrick(position, vector) {
        const brick = this._findBrickAt(position);
        if (brick) {
            const vectorDirection = this._vectorToDirection.toView(vector);
            const moveLongitudonal = vectorDirection == brick.direction || vectorDirection == (brick.direction + 2) % 4;
            let spaceBehindBrickIsFree;
            if (moveLongitudonal) {
                const doubleVector = this._multiplyVector(vector, 2);
                const spaceBehindBrick = this.addVectorTo(position, doubleVector);
                spaceBehindBrickIsFree = this.isFree(spaceBehindBrick);
            } else {
                const spacesBehindBrick = brick.blocks.map(block => this._sumVectors([brick.position.left, brick.position.top], block, vector));
                spaceBehindBrickIsFree = spacesBehindBrick.every(space => this.isFree(space));
            }
            console.log(spaceBehindBrickIsFree);
            if (spaceBehindBrickIsFree) {
                this._setBothBlocks(brick, false);
                brick.position = this.addVectorTo(brick.position, vector);
                this._setBothBlocks(brick, true);
                console.table(this._blocks);
                return true;
            }
        }
        return false;
    }

    _findBrickAt(position) {
        const brick = this._bricks.find(brick => brick.blocks.some(block => {
            const blockPosition = this._getBlockPosition(brick.position, block);
            return blockPosition.left == position.left && blockPosition.top == position.top;
        }));
        return brick;
    }

    _setBlock(position, occupied) {
        this._blocks[position.top][position.left] = occupied;
    }

    _setBothBlocks(brick, occupied) {
        brick.blocks.forEach(block => {
            const position = this.addVectorTo(brick.position, block);
            this._setBlock(position, occupied);
        });
    }

    _multiplyVector(vector, factor) {
        const newVector = [vector[0] * factor, vector[1] * factor];
        return newVector;
    }

    _sumVectors() {
        const args = Array.prototype.slice.call(arguments);
        const sumVector = [0, 0];
        args.forEach(arg => {
            sumVector[0] += arg[0];
            sumVector[1] += arg[1];
        });
        return sumVector;
    }

    addVectorTo(position, vector) {
        const newPosition = {
            left: position.left + vector[0],
            top: position.top + vector[1]
        }
        return newPosition;
    }

    _randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

    _getBlockPosition(position, direction) {
        let directionVector;
        if (typeof direction === 'number') {
            directionVector = this._directionToVector.toView(direction);
        } else {
            directionVector = direction;
        }
        const position2 = {
            left: position.left + directionVector[0],
            top: position.top + directionVector[1]
        };
        return position2;
    }

    _withinBounds(position) {
        const withinBounds =
            position.left >= 0 && position.left < this._boardSize &&
            position.top >= 0 && position.top < this._boardSize;
        return withinBounds;
    }

    isFree(position) {
        if (this._withinBounds(position)) {
            const isFree = !this._blocks[position.top][position.left];
            return isFree;
        }
        return false;
    }

    _brickSpaceIsFree(position, direction) {
        const position2 = this._getBlockPosition(position, direction);
        const isFree = this.isFree(position) && this.isFree(position2);
        return isFree;
    }

    _findAndSetPosition(brick) {
        let positionFound, count = 0;
        const maxPositions = Math.pow(this._boardSize, 2);
        const position = {}
        let direction;
        do {
            count++;
            direction = this._randomNumberWithin(4);
            position.left = this._randomNumberWithin(this._boardSize);
            position.top = this._randomNumberWithin(this._boardSize);
            positionFound = this._brickSpaceIsFree(position, direction);
        } while (!positionFound && count < maxPositions); // geen goede check
        if (positionFound) {
            brick.position = position;
            brick.direction = direction;
        }
        return positionFound;
    }

    initialize() {
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = {
                index: i,
                position: {},
                direction: undefined
            }
            if (this._findAndSetPosition(brick)) {
                this._bricks.push(brick);
                this._setBlock(brick.position, true);
                this._setBlock(this._getBlockPosition(brick.position, brick.direction), true);
            };
        }
        this._setBlock(this._pusher.position, false);
        console.table(this._blocks);
    }
}
