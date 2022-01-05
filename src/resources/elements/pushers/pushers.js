import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, StateService)

export class PushersCustomElement {

    constructor(eventAggregator, stateService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
    }

    attached() {
        this._initialize();
        this._startGameSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._initialize();
        });
    }

    _initialize() {
        this.blockSize = this._stateService.getBlockSize();
        this.pushers = [];
        this._addPlayer();
        this._addFaassen();
        this._stateService.setPushers(this.pushers);
    }

    _addPlayer() {
        this.boardSize = this._stateService.getBoardSize();
        this.pushers.push({
            position: [Math.round(this.boardSize / 2), Math.round(this.boardSize / 2)],
            direction: 1,
            type: 'player'
        });
    }

    _addFaassen() {
        const exitNumber = this._stateService.randomNumberWithin(4);
        const direction = ['down', 'left', 'up', 'right'][exitNumber];
        const exits = this._stateService.getExits();
        this.pushers.push({
            position: exits[exitNumber][0],
            direction: direction,
            type: 'faassen'
        });
    }

}
