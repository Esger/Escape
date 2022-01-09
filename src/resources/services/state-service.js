import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";
import { VectorToDirectionValueConverter } from "resources/value-converters/vector-to-direction-value-converter";

@inject(EventAggregator, DirectionToVectorValueConverter, VectorToDirectionValueConverter)
export class StateService {

    _initialBricksCount = 80;
    _maxBricksCount = 120;
    _bricksCount = this._initialBricksCount;
    _bricksIncrement = 2;
    _level = 0;

    constructor(eventAggregator, directionToVectorValueConverter, vectorToDirectionValueConverter) {
        this._eventAggregator = eventAggregator;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this._realBoardSize = this._isMobile ? 100 : 80;
        this._blockSize = this._isMobile ? 5 : 4;
        this._boardSize = Math.round(this._realBoardSize / this._blockSize);
        this._cleanGame();
        this._directionToVector = directionToVectorValueConverter;
        this._vectorToDirection = vectorToDirectionValueConverter;
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + this._bricksIncrement, this._maxBricksCount);
            this._level++;
            this._cleanGame();
            console.log(this._bricksCount);
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._bricksCount = this._initialBricksCount;
            this._level = 0;
            this._cleanGame();
        });
        this._boltsCountSubscription = this._eventAggregator.subscribe('boltsCount', bolts => {
            this._bolts = bolts;
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', message => {
            this._pushers[message.index] = message.position;
        });
    }

    detached() {
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._boltsCountSubscription.dispose();
    }

    _cleanGame() {
        this._bricks = [];
        this._cleanBlocks();
        this._pushers = [];
    }

    _cleanBlocks() {
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
    }

    getBricksCount() {
        return this._bricksCount;
    }

    getLevel() {
        return this._level;
    }

    getBoardSize() {
        return this._boardSize;
    }

    getBlockSize() {
        return this._blockSize;
    }

    getBolts() {
        return this._bolts;
    }

    getBlocks() {
        return this._blocks;
    }

    getPlayerPosition() {
        return this._playerPosition;
    }

    setPlayerPosition(position) {
        this._playerPosition = position;
    }

    moveBrick(position, vector, hasBolts = false) {
        const brick = this._findBrickAt(position);
        if (brick) {
            const vectorDirection = this._vectorToDirection.toView(vector);
            const moveLongitudonal = vectorDirection == brick.direction || vectorDirection == (brick.direction + 2) % 4;
            let spaceBehindBrickIsFree;
            if (moveLongitudonal) {
                const doubleVector = this.multiplyVector(vector, 2);
                const spaceBehindBrick = this.sumVectors(position, doubleVector);
                spaceBehindBrickIsFree = this.isFree(spaceBehindBrick, false);
            } else {
                const spacesBehindBrick = brick.blocks.map(block => this.sumVectors([brick.position[0], brick.position[1]], block, vector));
                spaceBehindBrickIsFree = spacesBehindBrick.every(space => this.isFree(space, false));
            }
            if (spaceBehindBrickIsFree) {
                this.registerBothBlocks(brick, false);
                brick.position = this.sumVectors(brick.position, vector);
                this.registerBothBlocks(brick, true);
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
            const blockPosition = this.getBlockPosition(brick.position, block);
            return blockPosition[0] == position[0] && blockPosition[1] == position[1];
        }));
        return brick;
    }

    registerPusherArea(value) {
        if (this._pushers.length) {
            const maxLeft = this._pushers[0].position[0] + 1;
            const maxTop = this._pushers[0].position[1] + 1;
            let left = this._pushers[0].position[0] - 1;
            for (; left <= maxLeft; left++) {
                let top = this._pushers[0].position[1] - 1;
                for (; top <= maxTop; top++) {
                    this._registerBlock([left, top], value);
                }
            }
        } else {
            setTimeout(_ => {
                this.registerPusherArea(value); // TODO: is dit nodig ???
            }, 50);
        }
    }

    registerBricks(bricks) {
        this._bricks = bricks;
        this._cleanBlocks();
        bricks?.forEach(brick => this.registerBothBlocks(brick, true));
    }

    _registerBlock(position, occupied) {
        if (this._withinBounds(position)) {
            this._blocks[position[1]][position[0]] = occupied;
        }
    }

    registerBothBlocks(brick, occupied) {
        brick.blocks.forEach(block => {
            const position = this.sumVectors(brick.position, block);
            this._registerBlock(position, occupied);
        });
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

    areEqual(vectors) { // array of positions [x,y]
        const areEqual = vectors.every(position => {
            if (vectors[0]) {
                const areEqual = position[0] == vectors[0][0] && position[1] == vectors[0][1];
                return areEqual;
            } else return false;
        });
        return areEqual;
    }

    randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

    getBlockPosition(position, direction) {
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
        const withinBounds = position.every(coordinate => coordinate >= 0 && coordinate < this._boardSize);
        return withinBounds;
    }

    isFree(position, ignorePusher = true) {
        if (this._withinBounds(position)) {
            const brickAtPosition = this._blocks[position[1]][position[0]];
            const playerAtPosition = !ignorePusher && this._pushers.some(pusher => this.areEqual([position, pusher.position]));
            return !brickAtPosition && !playerAtPosition;
        }
        return false;
    }

    isBlockingExit(positions) {  // array of positions [x,y]
        const isBlockingExit = positions.some((pos) => this._beforeExits.some((exit) => exit.some(ePos => this.areEqual([ePos, pos]))));
        return isBlockingExit;
    }

}
