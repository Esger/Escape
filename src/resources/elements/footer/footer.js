import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Footer {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.hint = 'Press Escape when stuck';
        this.showHint = false;
    }

    attached() {
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => this._resetHintTimeout());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._unsetHintTimeout());
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this._resetHintTimeout());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => this._unsetHintTimeout());
        this._isTouchDeviceSubscription = this._eventAggregator.subscribe('isTouchDevice', _ => this._setTouchText());
        this._showMessageSubscription = this._eventAggregator.subscribe('showMessage', _message => this._showMessage(_message));
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription.dispose();
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }

    _showMessage(message) {
        const previousMessage = message;
        this.hint = message;
        this.showHint = true;
        this._hintHideTimeoutHandle = setTimeout((previousHint) => {
            this.showHint = false;
            this.hint = previousHint;
        }, 10000);
    }

    giveUp() {
        this._eventAggregator.publish('giveUp');
        this.showHint = false;
        this._unsetHintTimeout();
    }

    _setTouchText() {
        this._setHintTimeout();
        this.hint = 'Tap here when stuck';
    }

    _setHintTimeout() {
        this._hintTimeoutHandle = setTimeout(() => { this.showHint = true }, 10000);
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
