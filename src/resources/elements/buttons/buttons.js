import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Buttons {
    buttons = [
        {
            'direction': 'up',
            'symbol': '⇧'
        },
        {
            'direction': 'right',
            'symbol': '⇨'
        },
        {
            'direction': 'left',
            'symbol': '⇦'
        },
        {
            'direction': 'down',
            'symbol': '⇩'
        }
    ];
    flash = false;

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => this._flashButtons());
    }

    detached() {
        this._gameStartSubscription.dispose();
    }

    _flashButtons() {
        this.flash = true;
        setTimeout(_ => this.flash = false, 300);
    }

    move(direction) {
        this._eventAggregator.publish('moveKeyPressed', direction);
    }
}
