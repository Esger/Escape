import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, StateService)
export class Score {
    bolts = 0;
    level = 0;
    lives = 0;
    score = 0;

    constructor(eventAggregator, stateService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this.score = 0;
        this.level = 0;
        this._boltsUsed = 0;
        this._boltCost = 5;
        this._boltScore = -50;
        this._winScore = 25;
        this._levelScore = 5;
        this._moveScore = 1;
        this._goldScore = 50;
        this._allGoldScore = 250;
        this._resetScore = true;
        this._getHighScore();
    }

    attached() {
        this._stateService.setBolts(this._getSymbolCount('bolts'));

        this._gameStartSubscrption = this._eventAggregator.subscribe('gameStart', _ => {
            if (this._resetScore) {
                this.score = 0;
                this.level = 0;
                this.symbols = [];
                this._resetScore = false;
                this._stateService.setBolts(this._getSymbolCount('bolts'));
            }
        });

        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this.score += this._winScore + this.level * this._levelScore;
            this._saveScores();
            this.level++;
            this._add1Life();
        });

        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());

        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());

        this._moveSubscription = this._eventAggregator.subscribe('move', pusher => {
            this.score -= (pusher.type == 'player') ? this._moveScore : 0;
        });

        this._consumeSubscription = this._eventAggregator.subscribe('consume', powerUp => {
            this.score += (powerUp.type == 'gold') ? this._goldScore : 0;
            (powerUp.type == 'heart') && this._add1Life();
        });

        this._allGoldConsumedSubscription = this._eventAggregator.subscribe('allGoldConsumed', _ => {
            this.score += this._allGoldScore;
        });

        this._boltThrownSubscription = this._eventAggregator.subscribe('removeBricks', _ => {
            this._boltsUsed++;
            this.score += this._boltScore;
            this._removeKey('bolt');
        });

        this._killSubscription = this._eventAggregator.subscribe('kill', _ => {
            this._boltsUsed++;
            this.score += this._boltScore;
            this._removeKey('bolt');
        });
    }

    detached() {
        this._gameStartSubscrption.dispose();
        this._giveUpSubscription.dispose();
        this._caughtSubscription.dispose();
        this._winSubscription.dispose();
        this._moveSubscription.dispose();
        this._boltThrownSubscription.dispose();
        this._consumeSubscription.dispose();
        this._allGoldConsumedSubscription.dispose();
        this._killSubscription.dispose();
    }

    resetHigh() {
        this.highScore = 0;
        localStorage.setItem('escape-score', this.highScore);
    }

    _add1Life() {
        this.symbols.push('heart');
        const lives = this._getSymbolCount('heart');
        if (lives >= this._boltCost) {
            for (let i = 0; i < this._boltCost; i++) {
                this._removeKey('heart');
            }
            setTimeout(_ => {
                this.symbols.unshift('bolt');
                this._stateService.setBolts(this._getSymbolCount('bolt'));
            }, 750);
        }
    }

    _removeKey(key) {
        const firstKey = this.symbols.indexOf(key);
        this.symbols.splice(firstKey, 1);
        const keyCount = this._getSymbolCount(key);
        switch (key) {
            case 'bolt':
                this._stateService.setBolts(keyCount);
                break;

            default:
                break;
        }

    }

    _getSymbolCount(key) {
        const keySymbols = this.symbols?.filter(s => s === key) || 0;
        return keySymbols.length;
    }

    _gameEnd() {
        this._resetScore = true;
        this._saveScores();
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
