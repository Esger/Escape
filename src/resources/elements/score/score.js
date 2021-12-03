import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class Score {
    score = 0;
    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.winScore = 20;
        this.moveScore = -1;
    }

    attached() {
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this.score += this.moveScore);
        this._winSubscription = this._eventAggregator.subscribe('win', _ => this.score += this.winScore);
    }

    detached() {
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }

}
