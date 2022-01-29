import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, HelperService)
export class StateService {

    _initialBricksCount = 80;
    _maxBricksCount = 120;
    _bricksCount = this._initialBricksCount;
    _bricksIncrement = 2;
    _level = 0;

    constructor(eventAggregator, helperService) {
        this._eventAggregator = eventAggregator;
        this._helpers = helperService;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this._realBoardSize = this._isMobile ? 100 : 80;
        this._boardSize = 20;
        this._blockSize = Math.round(this._realBoardSize / this._boardSize);
        this._bricks = [];
        this._blocks = [];
        this._pushers = [];
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => this._addGameEndSubscription());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + this._bricksIncrement, this._maxBricksCount);
            this._level++;
            console.log(this._bricksCount);
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', pusher => {
            this._pushers[pusher.index].position = pusher.position;
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
        this._moveSubscription.dispose();
    }

    _addGameEndSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribeOnce('caught', _ => this._gameEnd());
    }

    _gameEnd() {
        this._bricksCount = this._initialBricksCount;
        this._level = 0;
    }

    setExits(exits) {
        this._exits = exits.exits;
        this._beforeExits = exits.beforeExits;
    }

    getExits() {
        return this._exits;
    }

    getBeforeExits() {
        return this._beforeExits;
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

    setBolts(bolts) {
        this._bolts = bolts;
    }

    getBolts() {
        return this._bolts;
    }

    setLives(lives) {
        this._lives = lives;
    }

    getLives() {
        return this._lives;
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
            const vectorDirection = this._helpers.vector2direction(vector);
            const moveLongitudonal = vectorDirection == brick.direction || vectorDirection == (brick.direction + 2) % 4;
            let spaceBehindBrickIsFree;
            if (moveLongitudonal) {
                const doubleVector = this._helpers.multiplyVector(vector, 2);
                const spaceBehindBrick = this._helpers.sumVectors(position, doubleVector);
                spaceBehindBrickIsFree = this.isFree(spaceBehindBrick, false);
            } else {
                const spacesBehindBrick = brick.blocks.map(block => this._helpers.sumVectors([brick.position[0], brick.position[1]], block, vector));
                spaceBehindBrickIsFree = spacesBehindBrick.every(space => this.isFree(space, false));
            }
            if (spaceBehindBrickIsFree) {
                this.mapBrick(brick, false);
                brick.position = this._helpers.sumVectors(brick.position, vector);
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
        const positions = offsets.map(offset => this._helpers.sumVectors(position, offset));
        const bricks = [];
        positions.forEach(position => {
            const brick = this.findBrickAt(position);
            brick && bricks.push(brick.index);
        });
        this._eventAggregator.publish('removeBricks', bricks);
    }

    findBrickAt(position) {
        if (this.withinBounds(position)) {
            const brickIndex = this._blocks[position[1]][position[0]];
            if (brickIndex !== false) {
                return this._bricks[brickIndex];
            }
        }
        return false;
    }

    setMap(blocks) {
        this._blocks = blocks;
    }

    mapBrick(brick, occupied) {
        brick.blocks?.forEach(block => {
            const position = this._helpers.sumVectors(brick.position, block);
            if (this.withinBounds(position)) {
                const value = occupied ? brick.index : false;
                this._blocks[position[1]][position[0]] = value;
            };
        });
    }

    withinBounds(position) {
        const withinBounds = position.every(coordinate => coordinate >= 0 && coordinate < this._boardSize);
        return withinBounds;
    }

    isFree(position, ignorePusher = true) {
        if (this.withinBounds(position)) {
            const brickAtPosition = this._blocks[position[1]][position[0]] !== false;
            const playerAtPosition = !ignorePusher && this._pushers.some(pusher => this._helpers.areEqual([position, pusher.position]));
            return !brickAtPosition && !playerAtPosition;
        }
        return false;
    }

}
