import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";
import { VectorToDirectionValueConverter } from "resources/value-converters/vector-to-direction-value-converter";

@inject(EventAggregator, DirectionToVectorValueConverter, VectorToDirectionValueConverter)
export class StateService {

    _initialBricksCount = 100;
    _maxBricksCount = 125;
    _bricksCount = this._initialBricksCount;
    _blockSize = 4;
    _boardSize = Math.round(80 / this._blockSize);

    constructor(eventAggregator, directionToVectorValueConverter, vectorToDirectionValueConverter) {
        this._eventAggregator = eventAggregator;
        this._cleanGame();
        this._directionToVector = directionToVectorValueConverter;
        this._vectorToDirection = vectorToDirectionValueConverter;
        this._setExits();
        this.winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + 1, this._maxBricksCount);
        });
        this.giveUpSubscriber = this._eventAggregator.subscribe('giveUp', _ => {
            this._bricksCount = this._initialBricksCount;
        });
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => this._adjustSizes());
    }

    _adjustSizes() {
        this._blockSize = 4.5;
        this._boardSize = Math.round(90 / this._blockSize);
        this._cleanGame();
    }

    _cleanGame() {
        this._bricks = [];
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
        this._pusher = {
            position: [Math.round(this._boardSize / 2), Math.round(this._boardSize / 2)]
        };
        this._setPusherArea(true);
    }

    _setPusherArea(value) {
        const maxLeft = this._pusher.position[0] + 1;
        const maxTop = this._pusher.position[1] + 1;
        let left = this._pusher.position[0] - 1;
        for (; left <= maxLeft; left++) {
            let top = this._pusher.position[1] - 1;
            for (; top <= maxTop; top++) {
                this._setBlock([left, top], value);
            }
        }
    }

    _setExits() {
        const full = this._boardSize;
        const half = Math.floor(full / 2);
        const extra = half + 1;
        this._exits = [
            [[full, half], [full, half - 1]],
            [[half, full], [half - 1, full]],
            [[-1, half], [-1, half - 1]],
            [[half, -1], [half - 1, -1]]
        ];
        this._beforeExits = [
            [full - 1, half], [full - 1, half - 1],
            [half, full - 1], [half - 1, full - 1],
            [0, half], [0, half - 1],
            [half, 0], [half - 1, 0]
        ];
    }

    throughExit(position) {
        const exited = this._exits.some((exit) => exit.some((e) => e[0] == position[0] && e[1] == position[1]));
        return exited;
    }

    getBricks() {
        this._initialize();
        return this._bricks;
    }

    getBlockSize() { return this._blockSize; }

    getPusherPosition() {
        return this._pusher.position;
    }

    moveBrick(position, vector, hasBolts = false) {
        const brick = this._findBrickAt(position);
        if (brick) {
            const vectorDirection = this._vectorToDirection.toView(vector);
            const moveLongitudonal = vectorDirection == brick.direction || vectorDirection == (brick.direction + 2) % 4;
            let spaceBehindBrickIsFree;
            if (moveLongitudonal) {
                const doubleVector = this._multiplyVector(vector, 2);
                const spaceBehindBrick = this.sumVectors(position, doubleVector);
                spaceBehindBrickIsFree = this.isFree(spaceBehindBrick);
            } else {
                const spacesBehindBrick = brick.blocks.map(block => this.sumVectors([brick.position[0], brick.position[1]], block, vector));
                spaceBehindBrickIsFree = spacesBehindBrick.every(space => this.isFree(space));
            }
            if (spaceBehindBrickIsFree) {
                this._setBothBlocks(brick, false);
                brick.position = this.sumVectors(brick.position, vector);
                this._setBothBlocks(brick, true);
                return true;
            } else {
                hasBolts && this._throwBolt(position);
            }
        }
        return false;
    }

    _throwBolt(position) {
        const offsets = [ // 'X'
            [-1, -1], [1, -1],
            [0, 0],
            [-1, 1], [1, 1]
        ];
        const positions = offsets.map(offset => this.sumVectors(position, offset));
        const bricks = [];
        positions.forEach(position => {
            const brick = this._findBrickAt(position);
            brick && bricks.push(brick.index);
        });
        this._eventAggregator.publish('removeBricks', bricks);
    }

    _findBrickAt(position) {
        const brick = this._bricks.find(brick => brick.blocks.some(block => {
            const blockPosition = this._getBlockPosition(brick.position, block);
            return blockPosition[0] == position[0] && blockPosition[1] == position[1];
        }));
        return brick;
    }

    removeBrick(index) {
        const brick = this._bricks.find(brick => brick.index == index);
        this._setBothBlocks(brick, false);
        this._bricks.splice(index, 1);
        this._bricks.forEach((brick, i) => brick.index = i); // re-index
    }

    _setBlock(position, occupied) {
        this._blocks[position[1]][position[0]] = occupied;
    }

    _setBothBlocks(brick, occupied) {
        brick.blocks.forEach(block => {
            const position = this.sumVectors(brick.position, block);
            this._setBlock(position, occupied);
        });
    }

    _multiplyVector(vector, factor) {
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
        const position2 = this.sumVectors(position, directionVector);
        return position2;
    }

    _withinBounds(position) {
        const withinBounds =
            position[0] >= 0 && position[0] < this._boardSize &&
            position[1] >= 0 && position[1] < this._boardSize;
        return withinBounds;
    }

    isFree(position) {
        if (this._withinBounds(position)) {
            const isFree = !this._blocks[position[1]][position[0]];
            return isFree;
        }
        return false;
    }

    _areEqual(positions) { // array of positions [x,y]
        const areEqual = positions.every(position => {
            const areEqual = position[0] == positions[0][0] && position[1] == positions[0][1];
            return areEqual;
        });
        return areEqual;
    }

    _isBlockingExit(positions) {  // array of positions [x,y]
        const isBlockingExit = positions.some((pos) => this._beforeExits.some((e) => this._areEqual([e, pos])));
        return isBlockingExit;
    }

    _brickSpaceIsFree(position, direction) {
        const position2 = this._getBlockPosition(position, direction);
        const isBlockingExit = this._isBlockingExit([position, position2]);
        const isFree = this.isFree(position) && this.isFree(position2);
        return !isBlockingExit && isFree;
    }

    _findAndSetPosition(brick) {
        let positionFound, count = 0;
        const maxPositions = 50;
        let position = [];
        let direction;
        do {
            count++;
            direction = this._randomNumberWithin(4);
            position = [];
            position.push(this._randomNumberWithin(this._boardSize));
            position.push(this._randomNumberWithin(this._boardSize));
            positionFound = this._brickSpaceIsFree(position, direction);
            !positionFound && count++;
        } while (!positionFound && count < maxPositions); // geen goede check
        if (positionFound) {
            brick.position = position;
            brick.direction = direction;
        }
        return positionFound;
    }

    _initialize() {
        this._cleanGame();
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = {
                index: i,
                position: [],
                direction: undefined,
                content: ''
            }
            if (this._findAndSetPosition(brick)) {
                this._setBlock(brick.position, true);
                this._setBlock(this._getBlockPosition(brick.position, brick.direction), true);
                this._bricks.push(brick);
            };
        }
        this._setPusherArea(false);
    }
}
