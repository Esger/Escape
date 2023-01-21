import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Footer {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._messageIndex = 0;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this._messages = [
            'escape through the <span class="green">exits</span>',
            this._isMobile ? 'Tap here when stuck' : 'Press Escape when stuck',
            'each move costs 1 score',
            // 'press r to restart level',
            'exiting is rewarded with 💚',
            'push blocking bricks away',
            'five 💚 buys a 💥',
            '💥 lets you destroy bricks',
            'move into an unmoveable brick to destroy it 💥',
        ];
        this._wins = 0;
    }

    attached() {
        this._setNextHint();
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => this._setNextHint());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            (this._wins == 0) && this._messages.shift();
            this._showMessage('or hit enter/space');
            this._wins++;
        });
    }

    _gameEnd() {
        this._messageIndex = 0;
        this._showMessage('or hit enter/space');
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription.dispose();
        this._caughtSubscription.dispose();
        this._winSubscription.dispose();
    }

    giveUp() {
        this._eventAggregator.publish('giveUp');
    }

    _setNextHint() {
        this._showMessage(this._messages[this._messageIndex]);
        this._messageIndex = (this._messageIndex + 1) % this._messages.length;
    }

    _showMessage(message) {
        this.hint = message;
    }

}
