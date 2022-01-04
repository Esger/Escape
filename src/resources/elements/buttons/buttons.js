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
    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }
    move(direction) {
        this._eventAggregator.publish('keyPressed', direction);
    }
}
