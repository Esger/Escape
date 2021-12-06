import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class Score {
    score = 0;
    bolts = 0;
    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._winScore = 25;
        this._levelScore = 5;
        this._moveScore = -1;
        this.level = 0;
        this._resetScore = true;
        this._getHighScore();
    }

    attached() {
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => {
            if (this._resetScore) {
                this.score = 0;
                this.level = 0;
                this.bolts = 0;
                this._resetScore = false;
            }
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._resetScore = true;
            this._saveScores();
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', _ => this.score += this._moveScore);
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.score += this._winScore + this.level * this._levelScore;
            this._saveScores();
            this.level++;
            this.bolts += this.level % 5 === 0 ? 1 : 0;
            this._eventAggregator.publish('boltsCount', this.bolts);
        });
        this._boltThrownSubscription = this._eventAggregator.subscribe('removeBricks', _ => this.bolts--)
    }

    detached() {
        this._moveSubscription.dispose();
        this._winSubscription.dispose();
    }

    resetHigh() {
        this.highScore = 0;
        localStorage.setItem('escape-score', this.highScore);
    }

    _getHighScore() {
        let highscore = localStorage.getItem('escape-score');
        if (highscore) {
            this.highScore = parseInt(highscore, 10);
        } else {
            this.highScore = 0;
        }
    }

    _saveScores() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('escape-score', this.score);
        }
    }

}
