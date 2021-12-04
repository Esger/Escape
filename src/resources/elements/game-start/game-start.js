import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    title = 'Escape';
    animating = false;

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._winSubscribtion = this._eventAggregator.subscribe('win', _ => this._showWinScreen());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._showStuckScreen())
        this._addStartSubscription();
    }

    detached() {
        this._winSubscribtion.dispose();
        this._giveUpSubscription.dispose();
        this._startSubscription && this._startSubscription.dispose();
    }

    _showWinScreen() {
        this.gameStartVisible = true;
        this.title = 'Escaped'
        this._addStartSubscription();
    }

    _showStuckScreen() {
        this.gameStartVisible = true;
        this.title = 'Stuck'
        this._addStartSubscription();
    }

    _addStartSubscription() {
        this._startSubscription = this._eventAggregator.subscribe('start', _ => {
            this._startSubscription.dispose();
            this.startGame();
        })
    }

    startGame() {
        this.animating = true;
        setTimeout(() => {
            this.gameStartVisible = false;
            this._eventAggregator.publish('gameStart');
            this.animating = false;
        }, 500);
    }
}
