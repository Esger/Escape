import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Footer {
    _wins = 0;

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.showHint = false;
    }

    attached() {
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => this._showMessage('Tap here when stuck'));
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => this._setHint());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._showMessage('or hit enter/space');
            this._wins = 0;
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this._resetHintTimeout());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._showMessage('or hit enter/space');
            this._wins++;
        });
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription.dispose();
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }

    _setHint() {
        switch (true) {
            case this._wins % 2 == 1:
                this._showMessage('exiting is rewarded with 💚');
                break;
            case this._wins % 3 == 1:
                this._showMessage('five 💚 buys a 💥');
                break;
            case this._wins % 5 == 1:
                this._showMessage('💥 lets you destroy bricks');
                break;
            case this._wins % 7 == 1:
                this._showMessage('move into an unmoveable brick to destroy it 💥');
                this._wins = 0;
                break;
            default:
                this._showMessage('escape through the <span class="green">exits</span>');
                break;
        }
    }

    _showMessage(message) {
        const previousMessage = message;
        this.hint = message;
        this.showHint = true;
        this._hintHideTimeoutHandle = setTimeout((previousHint) => {
            this.showHint = false;
            // this.hint = previousHint;
        }, 10000);
    }

    _setHintTimeout() {
        this._hintTimeoutHandle = setTimeout(() => {
            this._showMessage('Press Escape when stuck');
        }, 10000);
    }

    _unsetHintTimeout() {
        clearTimeout(this._hintTimeoutHandle);
    }

    _resetHintTimeout() {
        this.showHint = false;
        this._unsetHintTimeout();
        this._setHintTimeout();
    }
}
