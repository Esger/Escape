import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { MazeWorkerService } from 'services/maze-worker-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, StateService, MazeWorkerService, DirectionToVectorValueConverter)
export class BricksCustomElement {

    bricks = [];

    constructor(eventAggregator, stateService, mazeWorkerService, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._mazeWorkerService = mazeWorkerService;
        this._dir2vector = directionToVectorValueConverter;
    }

    attached() {
        this.showBricks = false;
        this.blockSize = this._stateService.getBlockSize();
        this._boardSize = this._stateService.getBoardSize();
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => {
            setTimeout(_ => this._removeAllBricks(), 500);
        });
        this._beforeExitsReadySubscription = this._eventAggregator.subscribe('beforeExitsReady', beforeExits => {
            this._beforeExits = beforeExits;
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._setBricks();
            this._addGiveUpSubscription();
            this._addRetrySubscription();
            this.showBricks = true;
        });
        this._removeSubscription = this._eventAggregator.subscribe('removeBricks', indices => {
            this.bricks.find(brick => {
                if (indices.includes(brick.index)) {
                    brick.content = '💥';
                    setTimeout(_ => this._removeBrick(brick), 300);
                }
            });
        });
    }

    detached() {
        this._winSubscristion.dispose();
        this._giveUpSubscription.dispose();
        this._retrySubscription.dispose();
        this._beforeExitsReadySubscription.dispose();
        this._removeSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._giveUpSubscription?.dispose();
            setTimeout(_ => this._removeAllBricks(), 500);
        });
    }

    _addRetrySubscription() {
        this._retrySubscription = this._eventAggregator.subscribeOnce('retry', _ => {
            this._removeAllBricks();
            this._resetBricks();
        });
    }

    _removeBrick(brick) {
        if (brick) {
            this.bricks.splice(brick.index, 1);
            this.bricks.forEach((brick, i) => {
                brick.index = i;
                brick.content = i;
            });
            this._stateService.registerBricks(this.bricks);
        }
    }

    _removeAllBricks() {
        this.bricks = [];
        this._stateService.registerBricks(this.bricks);
        // this.showBricks = false;
    }

    _newBrick(i, metrics) {
        const brick = {
            index: i,
            position: metrics.position,
            direction: metrics.direction,
            content: i, // ''
            blocks: [[0, 0], this._dir2vector.toView(metrics.direction)]
        }
        return brick;
    }

    _isBlockingExit(positions) {  // array of positions [x,y]
        const isBlockingExit = positions.some((pos) => this._beforeExits.some((exit) => exit.some(ePos => this._stateService.areEqual([ePos, pos]))));
        return isBlockingExit;
    }

    _brickSpaceIsFree(position, direction) {
        const position2 = this._stateService.getBlockPosition(position, direction);
        const isBlockingExit = this._isBlockingExit([position, position2]);
        const isFree = this._stateService.isFree(position) && this._stateService.isFree(position2);
        return !isBlockingExit && isFree;
    }

    _findDirection(position) {
        for (let direction = 0; direction < 4; direction++) {
            if (this._brickSpaceIsFree(position, direction)) {
                return direction;
            }
        }
        return false;
    }

    _findPosition() {
        let positionFound, direction, position, count = 0;
        const maxPositions = 50;
        do {
            position = [];
            direction = this._stateService.randomNumberWithin(4);
            position.push(this._stateService.randomNumberWithin(this._boardSize));
            position.push(this._stateService.randomNumberWithin(this._boardSize));
            positionFound = this._brickSpaceIsFree(position, direction);
            count++;
        } while (!positionFound && count < maxPositions); // geen goede check
        // console.log('positionsTried ', count);
        if (positionFound) {
            const metrics = {
                position: position,
                direction: direction
            }
            return metrics;
        }
        return false;
    }

    _resetBricks() {
        this.showBricks = false;
        this.bricks = JSON.parse(JSON.stringify(this._originalBricks)); // deep copy
        setTimeout(_ => {
            this._stateService.registerBricks(this.bricks);
            this.showBricks = true;
        });
    }

    _setBricks() {
        this.bricks = [];
        this._stateService.registerBricks(this.bricks);
        this._fillRandom();
        this._cleanCenter();
        this._cleanBeforeExits();
        this._stateService.registerBricks(this.bricks);
        this._closeThroughs();
        this._stateService.registerBricks(this.bricks);
        this._originalBricks = JSON.parse(JSON.stringify(this.bricks)); // deep copy
        this._eventAggregator.publish('bricksReady');
    }

    _fillRandom() {
        // find random places for bricks
        this._bricksCount = this._stateService.getBricksCount();
        for (let i = 0; i < this._bricksCount; i++) {
            const metrics = this._findPosition();
            if (metrics) {
                const brick = this._newBrick(i, metrics);
                this._stateService.registerBrick(brick, true);
                this.bricks.push(brick);
            }
        }
    }

    _cleanCenter() {
        const c = Math.round(this._boardSize / 2);
        const center = [c - 1, c, c + 1];
        const newBricks = this.bricks.filter(brick => {
            const isInCenter = brick.blocks.some(block => {
                const position = this._stateService.sumVectors(block, brick.position);
                return position.every(value => center.includes(value));
            });
            return !isInCenter
        });
        this.bricks = newBricks.map((brick, i) => {
            brick.index = i;
            brick.content = i;
            return brick;
        });
    };

    _getExits() {
        return new Promise((resolve, reject) => {
            this._eventAggregator.subscribeOnce('exitsReady', exits => resolve(exits));
        });
    }

    async _cleanBeforeExits() {
        const exits = await this._getExits();
        exits.forEach(exit => exit.forEach(position => {
            const brickIndex = this._stateService.registerBlock(position, false);
            brickIndex && this._removeBrick(this.bricks[brickIndex]);
        }));
    };

    async _closeThroughs() {
        // block the throughs
        const center = Math.round(this._boardSize / 2);
        const playerPosition = [center, center];
        const blocks = this._stateService.getBlocks();
        let throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, this._beforeExits);
        while (throughs && throughs.length) {
            const position = throughs[0];
            const direction = this._findDirection(position);
            if (direction !== false) {
                const metrics = { direction: direction, position: position }
                const brick = this._newBrick(this.bricks.length + 1, metrics);
                this._stateService.registerBrick(brick);
                this.bricks.push(brick);
            }
            const blocks = this._stateService.getBlocks();
            throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, this._beforeExits);
        }
    }

}
