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
        this._initialize();
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._initialize();
            this.isVisible = true;
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.isVisible = false;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this.isVisible = false;
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
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
