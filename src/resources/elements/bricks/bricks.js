import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';
import { MazeWorkerService } from 'services/maze-worker-service';

@inject(EventAggregator, StateService, HelperService, MazeWorkerService)
export class BricksCustomElement {

    bricks = [];

    constructor(eventAggregator, stateService, helperService, mazeWorkerService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helpers = helperService;
        this._mazeWorkerService = mazeWorkerService;
    }

    attached() {
        this.showBricks = false;
        this.blockSize = this._stateService.getBlockSize();
        this._boardSize = this._stateService.getBoardSize();
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => {
            setTimeout(_ => this._cleanMap(), 500);
        });
        this._beforeExitsReadySubscription = this._eventAggregator.subscribe('exitsReady', data => {
            this._beforeExits = data.beforeExits;
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
            setTimeout(_ => this._cleanMap(), 500);
        });
    }

    _addRetrySubscription() {
        this._retrySubscription = this._eventAggregator.subscribeOnce('retry', _ => {
            this._cleanMap();
            this._resetBricks();
        });
    }

    _removeBrick(brick) {
        if (brick) {
            this._mapBrick(bricks, false);
            this.bricks.splice(brick.index, 1);
            this._reIndexBricks(this.bricks);
        }
    }

    _newBrick(i, metrics) {
        const brick = {
            index: i,
            position: metrics.position,
            direction: metrics.direction,
            content: '',
            blocks: [[0, 0], this._helpers.direction2vector(metrics.direction)]
        }
        return brick;
    }

    _brickSpaceIsFree(position, direction) { // [x,y], 0..3
        const position2 = this._helpers.getBlockPosition(position, direction);
        const isFree = [position, position2].every(pos => {
            if (this._stateService._withinBounds(pos)) {
                return this._blocks[pos[1]][pos[0]] == false;
            }
        });
        return isFree;
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
            direction = this._helpers.randomNumberWithin(4);
            position.push(this._helpers.randomNumberWithin(this._boardSize));
            position.push(this._helpers.randomNumberWithin(this._boardSize));
            positionFound = this._brickSpaceIsFree(position, direction);
            count++;
        } while (!positionFound && count < maxPositions); // TODO geen goede check
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

    _deepCopy(bricks) {
        return JSON.parse(JSON.stringify(bricks));
    }

    _resetBricks() {
        this.showBricks = false;
        this.bricks = this._deepCopy(this._originalBricks);
        this._mapBricks(this.bricks);
        setTimeout(_ => {
            this.showBricks = true;
        });
    }

    _cleanMap() {
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
    }

    _mapBricks() {
        this.bricks.forEach(brick => this._mapBrick(brick, brick.index));
    }

    _mapBrick(brick, occupied) {
        for (const block of brick.blocks) {
            const position = this._helpers.sumVectors(brick.position, block);
            if (this._stateService._withinBounds(position)) {
                const value = occupied ? brick.index : false;
                this._blocks[position[1]][position[0]] = value;
            }
        }
    }

    _setBricks() {
        this.bricks = [];
        this._cleanMap();
        this._fillRandom();
        this._cleanBeforeExits();
        this._cleanCenter();
        // this._closeThroughs();
        this._mapBricks(this.bricks);
        this._originalBricks = this._deepCopy(this.bricks);
        this._stateService.setMap(this._blocks);
        this._stateService.setBricks(this.bricks);
        this._eventAggregator.publish('bricksReady');
    }

    _fillRandom() {
        // find random places for bricks
        this._bricksCount = this._stateService.getBricksCount();
        for (let i = 0; i < this._bricksCount; i++) {
            const metrics = this._findPosition();
            if (metrics) {
                const brick = this._newBrick(i, metrics);
                this._mapBrick(brick, true);
                this.bricks.push(brick);
            }
        }
    }

    _reIndexBricks(oldBricks) {
        this.bricks = oldBricks.map((brick, i) => {
            brick.index = i;
            return brick;
        });
    }

    _cleanCenter() {
        const c = Math.round(this._boardSize / 2);
        const center = [c - 1, c, c + 1];
        const newBricks = this.bricks.filter(brick => {
            const isInCenter = brick.blocks.some(block => {
                const position = this._helpers.sumVectors(block, brick.position);
                return position.every(value => center.includes(value));
            });
            return !isInCenter
        });
        this._reIndexBricks(newBricks);
    };

    _getExits() {
        return new Promise((resolve, reject) => {
            this._eventAggregator.subscribeOnce('exitsReady', data => resolve(data.beforeExits));
        });
    }

    async _cleanBeforeExits() {
        const exits = await this._getExits();
        const exitsFlat = exits.flat();
        const beforeExit = brick => {
            const beforeExit = brick.blocks.some(block => {
                const position = this._helpers.sumVectors(block, brick.position);
                const beforeExit = exitsFlat.some(exit => this._helpers.areEqual([exit, position]));
                return beforeExit;
            });
            return beforeExit;
        }
        const newBricks = this.bricks.filter(brick => !beforeExit(brick));
        this._reIndexBricks(newBricks);
    }

    async _closeThroughs() {
        // block the throughs
        const center = Math.round(this._boardSize / 2);
        const playerPosition = [center, center];
        let throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        while (throughs && throughs.length) {
            const position = throughs[0];
            const direction = this._findDirection(position);
            if (direction !== false) {
                const metrics = { direction: direction, position: position }
                const brick = this._newBrick(this.bricks.length + 1, metrics);
                this._mapBrick(brick);
                this.bricks.push(brick);
            }
            throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        }
    }

}
