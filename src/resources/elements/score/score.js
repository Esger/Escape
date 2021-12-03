import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class Score {
    score = 0;
    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }
    attached() {
        this._scoreSubscription = this._eventAggregator.subscribe('move', amount => this.score += amount);
    }

}
