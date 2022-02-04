import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, StateService)
export class BrickCustomElement {
    @bindable brick;
    @bindable blockSize;
    visible = false;

    constructor(eventAggregator, stateService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this.gameOver = false;
    }

    attached() {
        this.left = this.brick.position[0];
        this.top = this.brick.position[1];
        this.directionClass = ['toRight', 'toBottom', 'toLeft', 'toTop'][this.brick.direction];
        this._gameStartSubscription = this._eventAggregator.subscribeOnce('gameStart', _ => {
            this.gameOver = false;
        });
        this._winSubscription = this._eventAggregator.subscribeOnce('win', _ => this._hideBrick());
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => this._hideBrick());
        this._caughtSubscription = this._eventAggregator.subscribeOnce('caught', _ => this._hideBrick());
        setTimeout(_ => {
            this.visible = true;
        }, Math.random() * 1000);
    }

    detached() {
        this._winSubscription?.dispose();
        this._gameStartSubscription?.dispose();
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
    }

    _hideBrick() {
        setTimeout(_ => {
            window.requestAnimationFrame(_ => this.gameOver = true);
        }, Math.random() * 500);
    }

    isOdd(num) {
        return num % 2
    }

}
