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
        this._bricks = [];
        this._pushers = [];
        this._directionToVector = directionToVectorValueConverter;
        this._vectorToDirection = vectorToDirectionValueConverter;
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => this._addGiveUpSubscription());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + this._bricksIncrement, this._maxBricksCount);
            this._level++;
            console.log(this._bricksCount);
        });
        this._boltsCountSubscription = this._eventAggregator.subscribe('boltsCount', bolts => {
            this._bolts = bolts;
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', pusher => {
            this._pushers[pusher.index].position = pusher.position;
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription?.dispose();
        this._boltsCountSubscription.dispose();
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._bricksCount = this._initialBricksCount;
            this._level = 0;
        });
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

    setPushers(pushers) {
        this._pushers = pushers;
    }

    setBricks(bricks) {
        this._bricks = bricks;
    }

    moveBrick(position, vector, hasBolts = false) {
        const brick = this.findBrickAt(position);
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
                this.mapBrick(brick, false);
                brick.position = this.sumVectors(brick.position, vector);
                this.mapBrick(brick, true);
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
            const brick = this.findBrickAt(position);
            brick && bricks.push(brick.index);
        });
        this._eventAggregator.publish('removeBricks', bricks);
    }

    findBrickAt(position) {


        const brick = this._bricks.find(brick => brick.blocks.some(block => {
            const blockPosition = this.getBlockPosition(brick.position, block);
            return this.areEqual([blockPosition, position]);
        }));
        return brick;
    }

    setMap(blocks) {
        this._blocks = blocks;
    }

    mapBrick(brick, occupied) {
        brick.blocks?.forEach(block => {
            const position = this.sumVectors(brick.position, block);
            if (this._withinBounds(position)) {
                const value = occupied ? brick.index : false;
                this._blocks[position[1]][position[0]] = value;
            };
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

    areEqual(vectors) { // array of 2 positions [x,y]
        const areEqual = JSON.stringify(vectors[0]) == JSON.stringify(vectors[1]);
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
            const brickAtPosition = this._blocks[position[1]][position[0]] !== false;
            const playerAtPosition = !ignorePusher && this._pushers.some(pusher => this.areEqual([position, pusher.position]));
            return !brickAtPosition && !playerAtPosition;
        }
        return false;
    }

}
