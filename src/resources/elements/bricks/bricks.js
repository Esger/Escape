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
            this._addBeforeExitsReadySubscription();
        });
        this._addBeforeExitsReadySubscription();
        this._addGameStartSubscription();
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
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
        this._giveUpSubscription?.dispose();
        this._caughtSubscription.dispose();
        this._beforeExitsReadySubscription.dispose();
        this._removeSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _addGameStartSubscription() {
        this._gameStartSubscription = this._eventAggregator.subscribeOnce('gameStart', _ => {
            this._initialize();
        });
    }

    _addBeforeExitsReadySubscription() {
        this._beforeExitsReadySubscription = this._eventAggregator.subscribeOnce('exitsReady', _ => {
            this._initialize();
        });
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => this._gameEnd());
    }

    _gameEnd() {
        this._giveUpSubscription?.dispose();
        setTimeout(_ => {
            this._addBeforeExitsReadySubscription();
            this._addGameStartSubscription();
        }, 500);
    }

    _initialize() {
        this._setBricks();
        this._addGiveUpSubscription();
        this.showBricks = true;
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

    _removeBrick(brick) {
        if (brick) {
            this._mapBrick(brick, false);
            this.bricks.splice(brick.index, 1);
            this._reIndexBricks(this.bricks);
        }
    }

    _brickSpaceIsFree(position, direction) { // [x,y], 0..3
        const position2 = this._helpers.getBlockPosition(position, direction);
        const isFree = [position, position2].every(pos => {
            if (this._stateService.withinBounds(pos)) {
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

    _cleanMap() {
        this._blocks = Array.from(Array(this._boardSize), () => Array(this._boardSize).fill(false));
    }

    _mapBricks() {
        this._cleanMap();
        this.bricks.forEach(brick => this._mapBrick(brick, brick.index));
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
        const newBricks = this.bricks.filter(brick => brick.remove !== true);
        this.bricks = newBricks;
    }

    _setBricks() {
        this.bricks = [];
        this._cleanMap();
        this._fillRandom();
        this._markExitBricks();
        this._markCenterBricks();
        this._removeMarkedBricks();
        this._reIndexBricks();
        this._mapBricks();
        this._closeThroughs();
        this._mapBricks();
        this._stateService.setMap(this._blocks);
        this._stateService.setBricks(this.bricks);
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

    _markCenterBricks() {
        const c = Math.round(this._boardSize / 2);
        const min = c - 1;
        const max = c + 1;
        for (let y = min; y <= max; y++) {
            for (let x = min; x <= max; x++) {
                const index = this._blocks[y][x];
                if (index !== false) {
                    this.bricks[index].remove = true;
                }
            }
        }
    }

    _markExitBricks() {
        const exits = this._stateService.getBeforeExits();
        console.log(exits);
        const exitsFlat = exits.flat();
        exitsFlat.forEach(position => {
            if (position) {
                const index = this._blocks[position[1]][position[0]];
                if (index !== false) {
                    this.bricks[index].remove = true;
                }
            }
        })
    }

    async _closeThroughs() {
        // block the throughs
        const center = Math.round(this._boardSize / 2);
        const playerPosition = [center, center];
        this._beforeExits = this._stateService.getBeforeExits();
        let throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        while (throughs && throughs.length) {
            const position = throughs[0];
            const direction = this._findDirection(position);
            if (direction !== false) {
                const metrics = { direction: direction, position: position }
                const brick = this._newBrick(this.bricks.length, metrics);
                this._mapBrick(brick);
                this.bricks.push(brick);
            }
            throughs = await this._mazeWorkerService.findThrough(this._blocks, playerPosition, this._beforeExits);
        }
    }

}
