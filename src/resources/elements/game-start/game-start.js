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
        this._winSubscribtion = this._eventAggregator.subscribe('win', _ => this._showEndScreen('Escaped'));
        this._caughtSubscribtion = this._eventAggregator.subscribe('caught', _ => this._showEndScreen('Caught'));
        this._addStartSubscription();
        this._flashHint();
    }

    _flashHint() {
        setTimeout(_ => {
            const keysHint = document.querySelectorAll('.keysHint')[0];
            keysHint.classList.add('flash', 'flash--in');
            setTimeout(_ => {
                keysHint.classList.remove('flash', 'flash--in');
            }, 200);
        }, 300);
    }

    detached() {
        this._winSubscribtion.dispose();
        this._caughtSubscribtion.dispose();
        this._giveUpSubscription?.dispose();
        this._startSubscription?.dispose();
    }

    _showEndScreen(title) {
        this.gameStartVisible = true;
        this.title = title;
        this._addStartSubscription();
        this._flashHint();
    }

    _addStartSubscription() {
        this._startSubscription = this._eventAggregator.subscribeOnce('start', _ => {
            this.startGame();
        })
    }

    _addGameEndSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._showEndScreen('Stuck');
        });
    }

    startGame() {
        this.animating = true;
        setTimeout(_ => {
            this._addGameEndSubscription();
            this.gameStartVisible = false;
            this._eventAggregator.publish('gameStart');
            this.animating = false;
        }, 500);
    }
}
