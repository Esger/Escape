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
        this._beforeExitsReadySubscription = this._eventAggregator.subscribe('beforeExitsReady', beforeExits => {
            this._beforeExits = beforeExits;
        });
        this._pushersReadySubscription = this._eventAggregator.subscribe('pushersReady', _ => {
            this._setBricks();
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
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
        this._giveUpSubscription?.dispose();
        this._retrySubscription.dispose();
        this._beforeExitsReadySubscription.dispose();
        this._pushersReadySubscription.dispose();
        this._removeSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._giveUpSubscription?.dispose();
            this._removeBricks();
        });
    }

    _addRetrySubscription() {
        this._retrySubscription = this._eventAggregator.subscribeOnce('retry', _ => {
            this._removeBricks();
            this._resetBricks();
        });
    }

    _removeBrick(brick) {
        this._stateService.registerBothBlocks(brick, false);
        this.bricks.splice(index, 1);
        this.bricks.forEach((brick, i) => brick.index = i);
    }

    _removeBricks() {
        this.bricks = [];
        this._stateService.registerBricks(this.bricks);
        // this.showBricks = false;
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
        this._initializeBricks();
        setTimeout(_ => { // wacht tot bricks blocks hebben
            this._stateService.registerBricks(this.bricks);
            this._originalBricks = JSON.parse(JSON.stringify(this.bricks)); // deep copy
        });
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

    _initializeBricks() {
        this._fillRandom();
        this._eventAggregator.publish('bricksReady');
        setTimeout(_ => this._closeThroughs()); // wacht tot player 'unregistered' is
    }

    _fillRandom() {
        // find random places for bricks
        this._bricksCount = this._stateService.getBricksCount();
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = this._newBrick(i);
            if (this._findAndSetPosition(brick)) {
                this._stateService.registerBlock(brick.position, true);
                this._stateService.registerBlock(this._stateService.getBlockPosition(brick.position, brick.direction), true);
                this.bricks.push(brick);
            }
        }
    }

    async _closeThroughs() {
        // block the throughs
        let throughs = [];
        const playerPosition = this._stateService.getPlayerPosition();
        let blocks = this._stateService.getBlocks();
        throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, this._beforeExits);
        while (throughs && throughs.length) {
            const brick = this._newBrick(this.bricks.length + 1);
            brick.position = throughs[0];
            const direction = this._findDirection(brick.position);
            if (direction !== false) {
                brick.direction = direction;
                this._stateService.registerBlock(brick.position, true);
                this._stateService.registerBlock(this._stateService.getBlockPosition(brick.position, brick.direction), true);
                this.bricks.push(brick);
            }
            throughs = await this._mazeWorkerService.findThrough(blocks, playerPosition, this._beforeExits);
        }
    }

}
