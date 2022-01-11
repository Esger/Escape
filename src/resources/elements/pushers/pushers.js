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
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this.isVisible = true;
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.isVisible = false;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this.isVisible = false;
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => this._initialize(true));
    }

    detached() {
        this._exitsReadySubscription.dispose();
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._retrySubscription.dispose();
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
        }
        this._stateService.setPlayerPosition(this.pushers[0].position);
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

    _addPlayer() {
        this.boardSize = this._stateService.getBoardSize();
        const position = [Math.round(this.boardSize / 2), Math.round(this.boardSize / 2)];
        const pusher = this._newPusher('player', position, 1);
        this.pushers.push(pusher);
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
