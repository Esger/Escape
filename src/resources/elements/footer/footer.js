import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Footer {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._messageIndex = 0;
        this._messages = [
            'escape through the <span class="green">exits</span>',
            'Press Escape when stuck',
            'press r to restart level',
            'exiting is rewarded with 💚',
            'push blocking bricks away',
            'five 💚 buys a 💥',
            '💥 lets you destroy bricks',
            'move into an unmoveable brick to destroy it 💥',
        ];
        this.showHint = false;
        this._wins = 0;
    }

    attached() {
        this._setNextHint();
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => {
            this._messages[1] = 'Tap here when stuck';
        });
        this._addGameStartSubscription();
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._addGameStartSubscription();
            this._messageIndex = 0;
            this._showMessage('or hit enter/space');
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._addGameStartSubscription();
            (this._wins == 0) && this._messages.shift();
            this._showMessage('or hit enter/space');
            this._wins++;
        });
    }

    _addGameStartSubscription() {
        this._gameStartSubscrption = this._eventAggregator.subscribeOnce('gameStart', _ => {
            this._setNextHint();
        });
    }

    detached() {
        this._isTouchDeviceSubscription.dispose();
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription && this._giveUpSubscription.dispose();
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
        this.showHint = true;
        clearTimeout(this._hintHideTimeoutHandle);
        this._hintHideTimeoutHandle = setTimeout(_ => {
            this.showHint = false;
        }, 10000);
    }

}
