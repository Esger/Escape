import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    title = 'Escape';

    constructor(eventAggregator) {
        this._eventAgregator = eventAggregator;
    }

    attached() {
        this._winSubscribtion = this._eventAgregator.subscribe('win', _ => this._showWinScreen());
        this._addStartSubscription();
    }

    _showWinScreen() {
        this.gameStartVisible = true;
        this.title = 'Escaped!'
        this._addStartSubscription();
    }

    _addStartSubscription() {
        this._startSubscription = this._eventAgregator.subscribe('start', _ => {
            this._startSubscription.dispose();
            this.startGame();
        })
    }

    detached() {
        this._winSubscribtion.dispose();
        this._startSubscription && this._startSubscription.dispose();
    }

    startGame() {
        this.gameStartVisible = false;
        this._eventAgregator.publish('gameStart');
    }
}
