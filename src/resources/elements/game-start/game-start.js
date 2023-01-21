import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, StateService, HelperService)
export class GameStart {
    gameStartVisible = true;
    animating = false;
    title = 'Escape';

    constructor(eventAggregator, stateService, helperService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helperService = helperService;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this.howToPlay = this._isMobile ? '<b>Swipe</b> to move' : 'Move with arrow keys';
        this.howToStart = this._isMobile ? '<b>Tap</b> to play' : '<b>Enter</b> to play';
    }

    attached() {
        this._helperService.flashElements('.keysHint');
        this._gameStartSubscription = this._eventAggregator.subscribe('start', event => {
            if (this._stateService.getIsPlaying()) return;
            this.startGame();
        });
        this._winSubscribtion = this._eventAggregator.subscribe('win', _ => {
            this._showEndScreen('Escaped');
        });
        this._caughtSubscribtion = this._eventAggregator.subscribe('caught', _ => {
            this._showEndScreen('Caught');
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._showEndScreen('Stuck');
        });
    }

    detached() {
        this._winSubscribtion.dispose();
        this._caughtSubscribtion.dispose();
        this._giveUpSubscription.dispose();
        this._startSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _showEndScreen(title) {
        this.gameStartVisible = true;
        this.title = title;
        this._helperService.flashElements('.keysHint');
    }

    startGame() {
        this.animating = true;
        setTimeout(_ => {
            this.gameStartVisible = false;
            this._eventAggregator.publish('gameStart');
            this.animating = false;
        }, 500);
    }
}
