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
        this._helperService = helperService;
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

    setExits(data) {
        this._exits = data.exits;
        this._beforeExits = data.beforeExits;
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

    setPushers(pushers) {
        this._pushers = pushers;
    }

    setBricks(bricks) {
        this._bricks = bricks;
    }

    setPowerUps(powerUps) {
        this._powerUps = powerUps;
    }

    getPowerUps() {
        return this._powerUps;
    }

    moveBrick(position, vector, hasBolts = false) {
        const brick = this.findBrickAt(position);
        if (!brick) return false;

        const vectorDirection = this._helperService.vector2direction(vector);
        const moveLongitudonal = vectorDirection == brick.direction || vectorDirection == (brick.direction + 2) % 4;
        let spaceBehindBrickIsFree;
        if (moveLongitudonal) {
            const doubleVector = this._helperService.multiplyVector(vector, 2);
            const spaceBehindBrick = this._helperService.sumVectors(position, doubleVector);
            spaceBehindBrickIsFree = this.isFree(spaceBehindBrick, false) === true;
        } else {
            const spacesBehindBrick = brick.blocks.map(block => this._helperService.sumVectors([brick.position[0], brick.position[1]], block, vector));
            spaceBehindBrickIsFree = spacesBehindBrick.every(space => this.isFree(space, false) === true);
        }
        if (spaceBehindBrickIsFree) {
            this.mapBrick(brick, false);
            brick.position = this._helperService.sumVectors(brick.position, vector);
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

    _throwBolt(position) {
        const offsets = [ // 'X'
            [-1, -1], [1, -1],
            [0, 0],
            [-1, 1], [1, 1]
        ];
        const positions = offsets.map(offset => this._helperService.sumVectors(position, offset));
        const bricks = [];
        positions.forEach(position => {
            const brick = this.findBrickAt(position);
            brick && bricks.push(brick.index);
        });
        this._eventAggregator.publish('removeBricks', bricks);
    }

    findBrickAt(position) {
        if (!this.withinBounds(position)) return false;
        const brickIndex = this._blocks[position[1]][position[0]];
        if (brickIndex !== false) {
            return this._bricks[brickIndex];
        }
    }

    setMap(blocks) {
        this._blocks = blocks;
    }

    mapBrick(brick, occupied) {
        brick.blocks?.forEach(block => {
            const position = this._helperService.sumVectors(brick.position, block);
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
        if (!this.withinBounds(position))
            return false;

        const brickAtPosition = !(this._blocks[position[1]][position[0]] === false);
        if (brickAtPosition)
            return 'brick';

        const playerAtPosition = !ignorePusher && this._pushers.some(pusher => this._helperService.areEqual([position, pusher.position]));
        if (playerAtPosition)
            return 'player';

        const powerUp = this._powerUps.find(powerUp => this._helperService.areEqual([position, powerUp.position]));
        if (powerUp)
            return powerUp;

        return true;
    }

}
