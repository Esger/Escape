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
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            setTimeout(_ => {
                window.requestAnimationFrame(_ => this._hideBrick());
            }, Math.random() * 500);
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this.gameOver = false;
        });
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this.gameOver = true;
        });
        setTimeout(_ => {
            this.visible = true;
        }, Math.random() * 1000);
    }

    detached() {
        this._winSubscription.dispose();
        this._gameStartSubscription.dispose();
        this._giveUpSubscription.dispose();
    }

    _hideBrick() {
        this.gameOver = true;
    }

    isOdd(num) {
        return num % 2
    }

}
