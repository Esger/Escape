import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    constructor(eventAggregator) {
        this._eventAgregator = eventAggregator;
    }
    attached() {
        this._winSubscribtion = this._eventAgregator.subscribe('win', _ => {
            this.gameStartVisible = true;
        });
    }
    detached() {
        this._winSubscribtion.dispose();
    }
    startGame() {
        this.gameStartVisible = false;
        this._eventAgregator.publish('gameStart');
    }
}
