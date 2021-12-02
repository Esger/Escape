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
        this._startSubscription = this._eventAgregator.subscribe('start', _ => {
            this.startGame();
        })
    }
    detached() {
        this._winSubscribtion.dispose();
        this._startSubscription.dispose();
    }
    startGame() {
        this.gameStartVisible = false;
        this._eventAgregator.publish('gameStart');
    }
}
