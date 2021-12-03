import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class Score {
    score = 0;
    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._winScore = 25;
        this._levelScore = 5;
        this._moveScore = -1;
        this._level = 1;
        this._resetScore = false;
    }

    attached() {
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => {
            this._resetScore && (this.score = 0);
            this._resetScore = false;
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._resetScore = true);
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this.score += this._moveScore);
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.score += this._winScore + this._level * this._levelScore;
            this._level++;
        });
    }

    detached() {
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }

}
