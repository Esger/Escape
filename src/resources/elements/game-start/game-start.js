import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    constructor(eventAggregator) {
        this._eventAgregator = eventAggregator;
    }
    startGame() {
        this.gameStartVisible = false;
        this._eventAgregator.publish('gameStart');
    }
}
