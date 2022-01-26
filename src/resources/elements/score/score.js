import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
@inject(EventAggregator)
export class Score {
    score = 0;
    bolts = 0;
    level = 0;
    flast = false;

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._boltsUsed = 0;
        this._winScore = 25;
        this._levelScore = 5;
        this._boltScore = -50;
        this._moveScore = 1;
        this._resetScore = true;
        this._getHighScore();
    }

    attached() {
        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => {
            if (this._resetScore) {
                this.score = 0;
                this.level = 0;
                this.bolts = 0;
                this._publishBolts();
                this._resetScore = false;
            }
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this.level -= this.level > 0 ? 1 : 0;
            this._publishBolts();
        })
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.score += this._winScore + this.level * this._levelScore;
            this._saveScores();
            this.level++;
            this._publishBolts();
        });
        this._moveSubscription = this._eventAggregator.subscribe('move', message => {
            this.score -= (message.type == 'player') ? this._moveScore : 0;
        });
        this._boltThrownSubscription = this._eventAggregator.subscribe('removeBricks', _ => {
            this._boltsUsed++;
            this.score += this._boltScore;
            this._publishBolts();
        });
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribeOnce('caught', _ => this._gameEnd());
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
        this._retrySubscription.dispose();
        this._winSubscription.dispose();
        this._moveSubscription.dispose();
        this._boltThrownSubscription.dispose();
    }

    _gameEnd() {
        this._resetScore = true;
        this._saveScores();
    }

    resetHigh() {
        this.highScore = 0;
        localStorage.setItem('escape-score', this.highScore);
    }

    _publishBolts() {
        this.bolts = Math.floor(this.level / 5) - this._boltsUsed;
        this._eventAggregator.publish('boltsCount', this.bolts);
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
