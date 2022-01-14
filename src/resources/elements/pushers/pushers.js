import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, StateService)

export class PushersCustomElement {
    isVisible = false;

    constructor(eventAggregator, stateService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
    }

    attached() {
        this._exitsReadySubscription = this._eventAggregator.subscribe('exitsReady', exits => {
            this.exits = exits;
            this._initialize();
        });
        this._bricksReadySubscription = this._eventAggregator.subscribe('bricksReady', _ => {
            this._registerPlayerArea(false);
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._addGiveUpSubscription();
            this._addRetrySubscription();
            this.isVisible = true;
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.isVisible = false;
        });
    }

    detached() {
        this._exitsReadySubscription.dispose();
        this._bricksReadySubscription.dispose();
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription?.dispose();
        this._retrySubscription.dispose();
    }

    _addRetrySubscription() {
        this._retrySubscription = this._eventAggregator.subscribeOnce('retry', _ => {
            this._initialize(true);
        });
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this.isVisible = false;
        });
    }

    _initialize(retry) {
        if (retry) {
            this.pushers.forEach(pusher => {
                pusher.position = [...pusher.startPosition];
                pusher.direction = pusher.startDirection;
            })
        } else {
            this.pushers = [];
            this._addPlayer();
            this._addFaassen();
            this._eventAggregator.publish('pushersReady');
        }
        this._stateService.setPushers(this.pushers);
    }

    _newPusher(type, position, direction) {
        const pusher = {
            index: this.pushers.length,
            startPosition: position,
            position: [...position],
            startDirection: direction,
            direction: direction,
            type: type
        }
        return pusher;
    }


    _registerPlayerArea(value) {
        const maxLeft = this.pushers[0].position[0] + 1;
        const maxTop = this.pushers[0].position[1] + 1;
        let left = this.pushers[0].position[0] - 1;
        for (; left <= maxLeft; left++) {
            let top = this.pushers[0].position[1] - 1;
            for (; top <= maxTop; top++) {
                this._stateService.registerBlock([left, top], value);
            }
        }
    }

    _addPlayer() {
        this.boardSize = this._stateService.getBoardSize();
        const position = [Math.round(this.boardSize / 2), Math.round(this.boardSize / 2)];
        const pusher = this._newPusher('player', position, 1);
        this.pushers.push(pusher);
        this._registerPlayerArea(true);
    }

    _addFaassen() {
        const exitNumber = this._stateService.randomNumberWithin(4); // 0..3
        // 0 -> 1
        // 1 -> 2
        // 2 -> 3
        // 3 -> 0
        const direction = [1, 2, 3, 0][exitNumber];
        const position = this.exits[exitNumber][0];
        const pusher = this._newPusher('faassen', position, direction);
        this.pushers.push(pusher);
    }

}
