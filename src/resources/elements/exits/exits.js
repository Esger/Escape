import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(Element, EventAggregator)
export class Exits {

    constructor(element, eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._element = element;
        this.color = 'lime';
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._element.style.setProperty('--color', 'red');
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._element.style.setProperty('--color', 'lime');
        })
    }

    detached() {
        this._giveUpSubscription.dispose();
        this._gameStartSubscription.dispose();
    }
}
