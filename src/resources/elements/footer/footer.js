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
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._resetHintTimeout());
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this._resetHintTimeout());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => this._resetHintTimeout());
    }

    _setHintTimeout() {
        this._hintTimeoutHandle = setTimeout(() => { this.showHint = true }, 10000);
    }

    _resetHintTimeout() {
        this.showHint = false;
        clearTimeout(this._hintTimeoutHandle);
        this._setHintTimeout();
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription.dispose();
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }
}
