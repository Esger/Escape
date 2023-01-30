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
        this._center = Math.round(this._boardSize / 2);
        this._blockSize = Math.round(this._realBoardSize / this._boardSize);
        this._bricks = [];
        this._map = [];
        this._pushers = [];
        this._startOffset = 9; // center (9)
        this._exitOffset = this._startOffset;
        this._clockwise = true; // true
        this._exits = [
            {
                angle: 2,
                inset: -3,
                before: [[0, 0], [1, 0], [19, 0], [19, 1], [19, 19], [18, 19], [0, 19], [0, 18]],
                behind: [[0, -1], [1, -1], [20, 0], [20, 1], [19, 20], [18, 20], [-1, 19], [-1, 18]]
            },
            {
                angle: 5,
                inset: -2,
                before: [[1, 0], [2, 0], [19, 1], [19, 2], [18, 19], [17, 19], [0, 18], [0, 17]],
                behind: [[1, -1], [2, -1], [20, 1], [20, 2], [18, 20], [17, 20], [-1, 18], [-1, 17]]
            },
            {
                angle: 7.5,
                inset: 0,
                before: [[2, 0], [3, 0], [19, 2], [19, 3], [17, 19], [16, 19], [0, 17], [0, 16]],
                behind: [[2, -1], [3, -1], [19, 1], [19, 2], [17, 20], [16, 20], [-1, 17], [-1, 16]]
            },
            {
                angle: 11.5,
                inset: 1.5,
                before: [[3, 0], [4, 0], [19, 3], [19, 4], [16, 19], [15, 19], [0, 16], [0, 15]],
                behind: [[3, -1], [4, -1], [20, 3], [20, 4], [16, 20], [15, 20], [-1, 16], [-1, 15]]
            },
            {
                angle: 16,
                inset: 3,
                before: [[4, 0], [5, 0], [19, 4], [19, 5], [15, 19], [14, 19], [0, 15], [0, 14]],
                behind: [[4, -1], [5, -1], [20, 4], [20, 5], [15, 20], [14, 20], [-1, 15], [-1, 14]]
            },
            {
                angle: 21,
                inset: 4,
                before: [[5, 0], [6, 0], [19, 5], [19, 6], [14, 19], [13, 19], [0, 14], [0, 13]],
                behind: [[5, -1], [6, -1], [20, 5], [20, 6], [14, 20], [13, 20], [-1, 14], [-1, 13]]
            },
            {
                angle: 26.5,
                inset: 5,
                before: [[6, 0], [7, 0], [19, 6], [19, 7], [13, 19], [12, 19], [0, 13], [0, 12]],
                behind: [[6, -1], [7, -1], [20, 6], [20, 7], [13, 20], [12, 20], [-1, 13], [-1, 12]]
            },
            {
                angle: 32.5,
                inset: 6,
                before: [[7, 0], [8, 0], [19, 7], [19, 8], [12, 19], [11, 19], [0, 12], [0, 11]],
                behind: [[7, -1], [8, -1], [20, 7], [20, 8], [12, 20], [11, 20], [-1, 12], [-1, 11]]
            },
            {
                angle: 38.5,
                inset: 6.5,
                before: [[8, 0], [9, 0], [19, 8], [19, 9], [11, 19], [10, 19], [0, 11], [0, 10]],
                behind: [[8, -1], [9, -1], [20, 8], [20, 9], [11, 20], [10, 20], [-1, 11], [-1, 10]]
            },
            {
                angle: 45,
                inset: 6.5,
                before: [[9, 0], [10, 0], [19, 9], [19, 10], [10, 19], [9, 19], [0, 10], [0, 9]],
                behind: [[9, -1], [10, -1], [20, 9], [20, 10], [10, 20], [9, 20], [-1, 10], [-1, 9]]
            },
            {
                angle: 51.5,
                inset: 6.5,
                before: [[10, 0], [11, 0], [19, 10], [19, 11], [9, 19], [8, 19], [0, 9], [0, 8]],
                behind: [[10, -1], [11, -1], [20, 10], [20, 11], [9, 20], [8, 20], [-1, 9], [-1, 8]]
            },
            {
                angle: 57.5,
                inset: 6,
                before: [[11, 0], [12, 0], [19, 11], [19, 12], [8, 19], [7, 19], [0, 8], [0, 7]],
                behind: [[11, -1], [12, -1], [20, 11], [20, 12], [8, 20], [7, 20], [-1, 8], [-1, 7]]
            },
            {
                angle: 63.5,
                inset: 5,
                before: [[12, 0], [13, 0], [19, 12], [19, 13], [7, 19], [6, 19], [0, 7], [0, 6]],
                behind: [[12, -1], [13, -1], [20, 12], [20, 13], [7, 20], [6, 20], [-1, 7], [-1, 6]]
            },
            {
                angle: 69,
                inset: 4,
                before: [[13, 0], [14, 0], [19, 13], [19, 14], [6, 19], [5, 19], [0, 6], [0, 5]],
                behind: [[13, -1], [14, -1], [20, 13], [20, 14], [6, 20], [5, 20], [-1, 6], [-1, 5]]
            },
            {
                angle: 74,
                inset: 3,
                before: [[14, 0], [15, 0], [19, 14], [19, 15], [5, 19], [4, 19], [0, 5], [0, 4]],
                behind: [[14, -1], [15, -1], [20, 14], [20, 15], [5, 20], [4, 20], [-1, 5], [-1, 4]]
            },
            {
                angle: 78.5,
                inset: 1.5,
                before: [[15, 0], [16, 0], [19, 15], [19, 16], [4, 19], [3, 19], [0, 4], [0, 3]],
                behind: [[15, -1], [16, -1], [20, 15], [20, 16], [4, 20], [3, 20], [-1, 4], [-1, 3]]
            },
            {
                angle: 82.5,
                inset: 0,
                before: [[16, 0], [17, 0], [19, 16], [19, 17], [3, 19], [2, 19], [0, 3], [0, 2]],
                behind: [[16, -1], [17, -1], [20, 16], [20, 17], [3, 20], [2, 20], [-1, 3], [-1, 2]]
            },
            {
                angle: 85,
                inset: -2,
                before: [[17, 0], [18, 0], [19, 17], [19, 18], [2, 19], [1, 19], [0, 2], [0, 1]],
                behind: [[17, -1], [18, -1], [20, 17], [20, 18], [2, 20], [1, 20], [-1, 2], [-1, 1]]
            },
            {
                angle: 88,
                inset: -3,
                before: [[18, 0], [19, 0], [19, 18], [19, 19], [1, 19], [0, 19], [0, 1], [0, 0]],
                behind: [[18, -1], [19, -1], [20, 18], [20, 19], [10, 20], [0, 20], [-1, 1], [-1, 0]]
            }
        ];
        this._disableSomeExits();

        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._isPlaying = true;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._bricksCount = Math.min(this._bricksCount + this._bricksIncrement, this._maxBricksCount);
            this._level++;
            this._calcExitOffset();
            this._disableSomeExits();
            this._isPlaying = false;
            console.info(this._bricksCount, 'bricks');
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', pusher => {
            this._pushers[pusher.index].position = pusher.position;
        });
        this._centerArea = [];
        for (let x = -2; x < 2; x++) {
            for (let y = -2; y < 2; y++) {
                this._centerArea.push([this._center + x, this._center + y]);
            }
        }
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._caughtSubscription.dispose();
        this._moveSubscription.dispose();
    }

    _disableSomeExits() {
        const getMaxExits = level => {
            switch (true) {
                case level > 16: return 1;
                case level > 8: return 2;
                case level > 4: return 3;
                default: return 4;
            }
        }
        const randomBooleans = trueElements => {
            const boolArray = [];
            let trueCount = 0;
            while (boolArray.length < trueElements) {
                boolArray.push(true);
            }
            while (boolArray.length < 4) {
                const randBool = Math.random() >= 0.5;
                boolArray.push(randBool);
            }
            return boolArray.sort(_ => Math.random() - 0.5);
        }
        const enabledExitsCount = getMaxExits(this._level);
        const enabledExitsMap = randomBooleans(enabledExitsCount);

        const exits = this._exits[this._exitOffset];
        exits.enabledExits = [];
        enabledExitsMap.forEach(bool => exits.enabledExits.push(bool, bool));
    }

    _calcExitOffset() {
        const max = this._exits.length - 1;
        const min = 0;
        if (this._level > 0) {
            if (this._clockwise) {
                if (this._exitOffset < max) {
                    this._exitOffset++;
                } else {
                    this._clockwise = !this._clockwise;
                    this._exitOffset--;
                }
            } else {
                if (this._exitOffset > min) {
                    this._exitOffset--;
                } else {
                    this._clockwise = !this._clockwise;
                    this._exitOffset++;
                }
            }
        }
    }

    _gameEnd() {
        this._bricksCount = this._initialBricksCount;
        this._level = 0;
        this._exitOffset = this._startOffset;
        this._clockwise = true;
        this._isPlaying = false;
    }

    getIsPlaying() {
        return this._isPlaying;
    }

    getCenter() {
        return this._center;
    }

    getExits() {
        return this._exits[this._exitOffset];
    }

    getBehindExits() {
        return this._exits[this._exitOffset].behind;
    }

    getBeforeExits() {
        return this._exits[this._exitOffset].before;
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
        this._player = this._pushers.find(pusher => pusher.type === 'player')
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
            const areaBehindBrick = this._helperService.sumVectors(position, doubleVector);
            spaceBehindBrickIsFree = this.isFree(areaBehindBrick, false) === true;
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
        const brickIndex = this._map[position[1]][position[0]];
        if (brickIndex !== false) {
            return this._bricks[brickIndex];
        }
    }

    setMap(blocks) {
        this._map = blocks;
    }

    mapBrick(brick, occupied) {
        brick.blocks?.forEach(block => {
            const position = this._helperService.sumVectors(brick.position, block);
            if (this.withinBounds(position)) {
                const value = occupied ? brick.index : false;
                this._map[position[1]][position[0]] = value;
            };
        });
    }

    withinBounds(position) {
        const withinBounds = position.every(coordinate => coordinate >= 0 && coordinate < this._boardSize);
        return withinBounds;
    }

    isBeforeExit(position) {
        const beforeExits = this._exits[this._exitOffset].before;
        const isBeforeExit = beforeExits?.some(coordinate => this._helperService.areEqual([coordinate, position]));
        return isBeforeExit;
    }

    isInCenterArea(position) {
        const isInCenter = this._centerArea?.some(coordinate => this._helperService.areEqual([coordinate, position]));
        return isInCenter;
    }

    isOnFaassen() {
        this._player.position;
        const faassen = this._pushers.find(pusher => pusher.type === 'faassen' && this._helperService.areEqual([pusher.position, this._player.position]));// || this._helperService.areEqual([pusher.previousPosition, this._player.position]));
        return faassen;
    }

    _isOnBrick(position) {
        if (!this._map.length) return false;
        return this._map[position[1]][position[0]] !== false;
    }

    _isOnPowerUp(position) {
        if (!this._powerUps.length) return false;
        return this._powerUps.some(powerup => this._helperService.areEqual([powerup.position, position]));
    }

    isFreeForPowerUp(position) {
        if (this.isInCenterArea(position)) return false;
        if (this._isOnPowerUp(position)) return false;
        return !this._isOnBrick(position);
    }

    isFree(position, ignorePusher = true) {
        if (!this.withinBounds(position)) return false;
        if (!this._map.length) return false;

        const brickAtPosition = this._isOnBrick(position);
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
