import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, HelperService)
export class GameStart {
    gameStartVisible = true;
    animating = false;
    title = 'Escape';

    constructor(eventAggregator, helperService) {
        this._eventAggregator = eventAggregator;
        this._helperService = helperService;
        this._isMobile = sessionStorage.getItem('isMobile') == 'true';
        this.howToPlay = this._isMobile ? '<b>Swipe</b> to move' : 'Move with arrow keys';
        this.howToStart = this._isMobile ? '<b>Tap</b> to play' : '<b>Enter</b> to play';
    }

    attached() {
        this._addStartSubscription();
        this._helperService.flashElements('.keysHint');
    }

    detached() {
        this._winSubscribtion?.dispose();
        this._caughtSubscribtion?.dispose();
        this._giveUpSubscription?.dispose();
        this._startSubscription?.dispose();
    }

    _showEndScreen(title) {
        this.gameStartVisible = true;
        this.title = title;
        this._addStartSubscription();
        this._helperService.flashElements('.keysHint');
    }

    _addStartSubscription() {
        this._startSubscription = this._eventAggregator.subscribeOnce('start', _ => {
            this.startGame();
        })
    }

    _addWinSubscription() {
        this._winSubscribtion = this._eventAggregator.subscribeOnce('win', _ => {
            this._caughtSubscribtion.dispose();
            this._giveUpSubscription.dispose();
            this._showEndScreen('Escaped');
        });
    }

    _addCaughtSubscription() {
        this._caughtSubscribtion = this._eventAggregator.subscribeOnce('caught', _ => {
            this._winSubscribtion.dispose();
            this._giveUpSubscription.dispose();
            this._showEndScreen('Caught');
        });
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._winSubscribtion.dispose();
            this._caughtSubscribtion.dispose();
            this._showEndScreen('Stuck');
        });
    }

    startGame() {
        this.animating = true;
        setTimeout(_ => {
            this._addGiveUpSubscription();
            this._addWinSubscription();
            this._addCaughtSubscription();
            this.gameStartVisible = false;
            this._eventAggregator.publish('gameStart');
            this.animating = false;
        }, 500);
    }
}
