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
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => this._setBricks());
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());
        this._removeSubscription = this._eventAggregator.subscribe('removeBricks', indices => {
            const bricksToRemove = this.bricks.filter(brick => indices.includes(brick.index));
            bricksToRemove.forEach(brick => {
                brick.content = '💥';
                brick.remove = true;
            })
            setTimeout(_ => this._removeMarkedBricks(), 300);
        });
    }

    detached() {
        this._winSubscristion.dispose();
        this._giveUpSubscription.dispose();
        this._caughtSubscription.dispose();
        this._beforeExitsReadySubscription.dispose();
        this._removeSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _gameEnd() {
        setTimeout(_ => {
            this.showBricks = false;
        }, 600);
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
        const spaceIsFree = [position, position2].every(pos => {
            if (!this._stateService.withinBounds(pos)) return false;
            if (this._stateService.isBeforeExit(pos)) return false;
            if (this._stateService.isInCenterArea(pos)) return false;
            return this._blocks[pos[1]][pos[0]] === false;
        });
        return spaceIsFree;
    }

    _findDirection(position) {
        for (let direction = 0; direction < 4; direction++) {
            if (this._brickSpaceIsFree(position, direction)) {
                return direction;
            }
        }
        return false;
    }

    _cleanMap() {
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
    }

    _mapBricks() {
        this._cleanMap();
        this.bricks.forEach(brick => this._mapBrick(brick, brick.index));
        this._stateService.setMap(this._blocks);
        this._stateService.setBricks(this.bricks);
    }

    _mapBrick(brick, occupied) {
        for (const block of brick.blocks) {
            const position = this._helpers.sumVectors(brick.position, block);
            if (this._stateService.withinBounds(position)) {
                const index = occupied !== false ? brick.index : false;
                this._blocks[position[1]][position[0]] = index;
            }
        }
    }

    _removeMarkedBricks() {
        const remainingBricks = this.bricks.filter(brick => brick.remove !== true);
        this.bricks = remainingBricks;
        this._reIndexBricks();
        this._mapBricks();
    }

    _setBricks() {
        this.bricks = [];
        this._cleanMap();
        this._fillRandom();
        this._closeThroughs().then(_ => {
            this._mapBricks();
            this.showBricks = true;
            this._eventAggregator.publish('bricksReady');
        });
    }

    _findPosition() {
        let positionFound, direction, position;
        const maxAttempts = 50;
        const metrics = {};
        for (let count = 0; count < maxAttempts; count++) {
            position = [this._helpers.randomNumberWithin(this._boardSize), this._helpers.randomNumberWithin(this._boardSize)];
            direction = this._helpers.randomNumberWithin(4);
            positionFound = this._brickSpaceIsFree(position, direction);
            if (positionFound) {
                metrics.position = position;
                metrics.direction = direction;
                return metrics;
            }
        }
        return false;
    }

    _fillRandom() {
        // find random places for bricks
        this._bricksCount = this._stateService.getBricksCount();
        for (let i = 0; i < this._bricksCount; i++) {
            const metrics = this._findPosition();
            if (metrics) {
                const brick = this._newBrick(this.bricks.length, metrics);
                this.bricks.push(brick);
                this._mapBrick(brick, true);
            } else {
                console.log('No position found');
            }
        }
    }

    _reIndexBricks() {
        this.bricks.forEach((brick, i) => brick.index = i);
    }

    async _closeThroughs() {
        // block the throughs
        const center = this._stateService.getCenter();
        const playerPosition = [center, center];
        this._beforeExits = this._stateService.getBeforeExits();
        let throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        while (throughs && throughs.length) {
            const position = throughs[0];
            const direction = this._findDirection(position);
            if (direction !== false) {
                const metrics = { direction: direction, position: position }
                const brick = this._newBrick(this.bricks.length, metrics);
                this.bricks.push(brick);
                this._mapBrick(brick);
            }
            throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        }
    }

}
