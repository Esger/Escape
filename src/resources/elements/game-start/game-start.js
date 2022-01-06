import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class GameStart {
    gameStartVisible = true;
    animating = false;
    title = 'Escape';

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this.howToPlay = this._isMobile ? 'Tap the exits to move' : 'Move with arrow keys';
        this.howToStart = this._isMobile ? 'Tap to play' : 'Click to play';
    }

    attached() {
        this._winSubscribtion = this._eventAggregator.subscribe('win', _ => this._showWinScreen());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', message => this._showStuckScreen(message));
        this._addStartSubscription();
        this._flashHint();
    }

    _flashHint() {
        setTimeout(() => {
            const keysHint = document.querySelectorAll('.keysHint')[0];
            keysHint.classList.add('flash', 'flash--in');
            setTimeout(() => {
                keysHint.classList.remove('flash', 'flash--in');
            }, 200);
        }, 300);
    }

    detached() {
        this._winSubscribtion.dispose();
        this._giveUpSubscription.dispose();
        this._startSubscription && this._startSubscription.dispose();
    }

    _showWinScreen() {
        this.gameStartVisible = true;
        this.title = 'Escaped';
        this._addStartSubscription();
        this._flashHint();
    }

    _showStuckScreen(message = 'Stuck') {
        this.gameStartVisible = true;
        this.title = message;
        this._addStartSubscription();
        this._flashHint();
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
