import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    animating = false;
    title = 'Escape';
    howToPlay = 'Move with the arrow keys';
    howToStart = 'Click to play';

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._winSubscribtion = this._eventAggregator.subscribe('win', _ => this._showWinScreen());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._showStuckScreen());
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => this._setIsTouchDevice());
        this._addStartSubscription();
    }

    _setIsTouchDevice() {
        this.howToPlay = 'Tap the exits to move';
        this.howToStart = 'Tap to play';
    }

    detached() {
        this._winSubscribtion.dispose();
        this._giveUpSubscription.dispose();
        this._startSubscription && this._startSubscription.dispose();
        this._isTouchDeviceSubscription.dispose();
    }

    _showWinScreen() {
        this.gameStartVisible = true;
        this.title = 'Escaped'
        this._eventAggregator.publish('showMessage', 'Press Space or Enter');
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
