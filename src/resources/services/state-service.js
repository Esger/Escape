import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { MazeWorkerService } from 'services/maze-worker-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";
import { VectorToDirectionValueConverter } from "resources/value-converters/vector-to-direction-value-converter";

@inject(EventAggregator, MazeWorkerService, DirectionToVectorValueConverter, VectorToDirectionValueConverter)
export class StateService {

    _initialBricksCount = 80;
    _maxBricksCount = 120;
    _bricksCount = this._initialBricksCount;
    _bricksIncrement = 2;
    _blockSize = 4;
    _level = 0;
    _boardSize = Math.round(80 / this._blockSize);

    constructor(eventAggregator, mazeWorkerService, directionToVectorValueConverter, vectorToDirectionValueConverter) {
        this._eventAggregator = eventAggregator;
        this._mazeWorkerService = mazeWorkerService
        this._cleanGame();
        this._directionToVector = directionToVectorValueConverter;
        this._vectorToDirection = vectorToDirectionValueConverter;
        this._setExits();
        this._winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + this._bricksIncrement, this._maxBricksCount);
            this._level++;
            console.log(this._bricksCount);
        });
        this._giveUpSubscriber = this._eventAggregator.subscribe('giveUp', _ => {
            this._bricksCount = this._initialBricksCount;
            this._level = 0;
        });
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => this._adjustSizes());
    }

    detached() {
        this._winSubscriber.dispose();
        this._giveUpSubscriber.dispose();
        this._isTouchDeviceSubscription.dispose();
    }

    _adjustSizes() {
        this._blockSize = 5;
        this._boardSize = Math.round(100 / this._blockSize);
        this._cleanGame();
    }

    _cleanGame() {
        this._bricks = [];
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
        this._pusher = {
            position: [Math.round(this._boardSize / 2), Math.round(this._boardSize / 2)]
        };
    }

    _setPusherArea(value) {
        const maxLeft = this._pusher.position[0] + 1;
        const maxTop = this._pusher.position[1] + 1;
        let left = this._pusher.position[0] - 1;
        for (; left <= maxLeft; left++) {
            let top = this._pusher.position[1] - 1;
            for (; top <= maxTop; top++) {
                this._registerBlock([left, top], value);
            }
        }
    }

    _calcLevelForOffset() {
        const halfLevel = Math.floor(this._level / 2);
        const theLevel = halfLevel > 9 ? halfLevel % 10 - 19 : halfLevel;
        return theLevel;
    }

    _setExits() {
        const full = this._boardSize;
        const half = Math.floor(full / 2);
        const offset = this._calcLevelForOffset();
        this._exits = [
            [[full, half - offset], [full, half - offset - 1]],
            [[half + offset, full], [half + offset - 1, full]],
            [[-1, half + offset], [-1, half + offset - 1]],
            [[half - offset, -1], [half - offset - 1, -1]]
        ];
        this._beforeExits = [
            [[full - 1, half - offset], [full - 1, half - offset - 1]],
            [[half + offset, full - 1], [half + offset - 1, full - 1]],
            [[0, half + offset], [0, half + offset - 1]],
            [[half - offset, 0], [half - offset - 1, 0]]
        ];
        console.log(this._exits);
        console.log(this._beforeExits);
    }

    getExitOffsets() {
        const level = this._calcLevelForOffset();
        const factor = level * this._blockSize;
        const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(vector => this._multiplyVector(vector, factor));
        console.log(offsets);
        return offsets;
    }

    throughExit(position) {
        const exited = this._exits.some((exit) => exit.some((e) => e[0] == position[0] && e[1] == position[1]));
        return exited;
    }

    getBricks(retry) {
        this._cleanGame();
        if (retry) {
            this._bricks = JSON.parse(JSON.stringify(this._originalBricks)); // deep copy
            this._registerBricks(this._bricks);
        } else {
            this._setExits();
            this._initializeBricks();
            setTimeout(_ => { // wacht tot bricks blocks hebben
                this._registerBricks(this._bricks);
                this._originalBricks = JSON.parse(JSON.stringify(this._bricks)); // deep copy
            });
        }
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
                this._registerBothBlocks(brick, false);
                brick.position = this.sumVectors(brick.position, vector);
                this._registerBothBlocks(brick, true);
                return true;
            } else {
                if (brick.bumpedIn && hasBolts) {
                    this._throwBolt(position);
                } else {
                    brick.bumpedIn = true;
                }
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
        this._registerBothBlocks(brick, false);
        this._bricks.splice(index, 1);
        setTimeout(() => {
            this._bricks.forEach((brick, i) => brick.index = i); // re-index
        }, 300);
    }

    _registerBlock(position, occupied) {
        if (this._withinBounds(position)) {
            this._blocks[position[1]][position[0]] = occupied;
        }
    }

    _registerBothBlocks(brick, occupied) {
        brick.blocks.forEach(block => {
            const position = this.sumVectors(brick.position, block);
            this._registerBlock(position, occupied);
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
        const isBlockingExit = positions.some((pos) => this._beforeExits.some((exit) => exit.some(ePos => this._areEqual([ePos, pos]))));
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

    _findDirection(position) {
        for (let direction = 0; direction < 4; direction++) {
            if (this._brickSpaceIsFree(position, direction)) {
                return direction;
            }
        }
        return false;
    }

    _registerBricks(bricks) {
        bricks.forEach(brick => this._registerBothBlocks(brick, true));
    }

    _newBrick(i) {
        const brick = {
            index: i,
            position: [],
            direction: undefined,
            content: ''
        }
        return brick;
    }

    async _initializeBricks() {
        this._setPusherArea(true);
        // find random places for bricks
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = this._newBrick(i);
            if (this._findAndSetPosition(brick)) {
                this._registerBlock(brick.position, true);
                this._registerBlock(this._getBlockPosition(brick.position, brick.direction), true);
                this._bricks.push(brick);
            }
        }
        this._setPusherArea(false);
        // block the throughs
        let throughs = [];
        throughs = await this._mazeWorkerService.findThrough(this._blocks, this._pusher.position, this._beforeExits);
        while (throughs && throughs.length) {
            const brick = this._newBrick(this._bricks.length + 1);
            brick.position = throughs[0];
            const direction = this._findDirection(brick.position);
            if (direction !== false) {
                brick.direction = direction;
                this._registerBlock(brick.position, true);
                this._registerBlock(this._getBlockPosition(brick.position, brick.direction), true);
                this._bricks.push(brick);
            }
            throughs = [];
            throughs = await this._mazeWorkerService.findThrough(this._blocks, this._pusher.position, this._beforeExits);
        }
    }
}
