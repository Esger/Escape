import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { MazeWorkerService } from 'services/maze-worker-service';

@inject(EventAggregator, StateService, MazeWorkerService)
export class BricksCustomElement {

    bricks = [];

    constructor(eventAggregator, stateService, mazeWorkerService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._mazeWorkerService = mazeWorkerService
    }

    attached() {
        this.showBricks = false;
        this.blockSize = this._stateService.getBlockSize();
        this._boardSize = this._stateService.getBoardSize();
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => {
            this._removeBricks();
        });
        this._giveUpSubscristion = this._eventAggregator.subscribe('giveUp', _ => {
            this._removeBricks();
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this._setBricks(true);
        });
        this._beforeExitsReadySubscription = this._eventAggregator.subscribe('beforeExitsReady', beforeExits => {
            this._beforeExits = beforeExits;
            this._setBricks();
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => this.showBricks = true)
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
        this._giveUpSubscristion.dispose();
        this._retrySubscription.dispose();
        this._beforeExitsReadySubscription.dispose();
        this._removeSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _removeBrick(brick) {
        this._stateService.registerBothBlocks(brick, false);
        this.bricks.splice(index, 1);
        this.bricks.forEach((brick, i) => brick.index = i);
    }

    _removeBricks() {
        this.bricks = [];
        this._stateService.registerBricks(this.bricks);
        this.showBricks = false;
    }

    _setBricks(retry) {
        if (retry) {
            this.bricks = JSON.parse(JSON.stringify(this._originalBricks)); // deep copy
            this._stateService.registerBricks(this.bricks);
        } else {
            this._initializeBricks();
            setTimeout(_ => { // wacht tot bricks blocks hebben
                this._stateService.registerBricks(this.bricks);
                this._originalBricks = JSON.parse(JSON.stringify(this.bricks)); // deep copy
            });
        }
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

    _brickSpaceIsFree(position, direction) {
        const position2 = this._stateService.getBlockPosition(position, direction);
        const isBlockingExit = this._stateService.isBlockingExit([position, position2]);
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

    _findAndSetPosition(brick) {
        let positionFound, count = 0;
        const maxPositions = 50;
        let position = [];
        let direction;
        do {
            count++;
            direction = this._stateService.randomNumberWithin(4);
            position = [];
            position.push(this._stateService.randomNumberWithin(this._boardSize));
            position.push(this._stateService.randomNumberWithin(this._boardSize));
            positionFound = this._brickSpaceIsFree(position, direction);
            !positionFound && count++;
        } while (!positionFound && count < maxPositions); // geen goede check
        if (positionFound) {
            brick.position = position;
            brick.direction = direction;
        }
        return positionFound;
    }

    _fillRandom() {
        this.bricks = [];
        this._stateService.registerBricks(this.bricks);
        this._stateService.registerPusherArea(true);
        // find random places for bricks
        this._bricksCount = this._stateService.getBricksCount();
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = this._newBrick(i);
            if (this._findAndSetPosition(brick)) {
                this._stateService._registerBlock(brick.position, true);
                this._stateService._registerBlock(this._stateService.getBlockPosition(brick.position, brick.direction), true);
                this.bricks.push(brick);
            }
        }
        this._stateService.registerPusherArea(false);
    }

    async _initializeBricks() {
        this._fillRandom();
        // block the throughs
        let throughs = [];
        const playerPosition = this._stateService.getPlayerPosition();
        const beforeExits = this._stateService.getBeforeExits();
        let blocks = this._stateService.getBlocks();
        throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, beforeExits);
        while (throughs && throughs.length) {
            const brick = this._newBrick(this.bricks.length + 1);
            brick.position = throughs[0];
            const direction = this._findDirection(brick.position);
            if (direction !== false) {
                brick.direction = direction;
                this._stateService._registerBlock(brick.position, true);
                this._stateService._registerBlock(this._stateService.getBlockPosition(brick.position, brick.direction), true);
                this.bricks.push(brick);
            }
            throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, beforeExits);
            // throughs = throughs.length ? throughs : await this._mazeWorkerService.findThrough(blocks, playerPosition, beforeExits);
        }
    }

}
