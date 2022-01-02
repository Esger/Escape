import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, Element, StateService)
export class BoardCustomElement {

    constructor(eventAggregator, element, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this.blockSize = this._stateService.getBlockSize();
    }

    attached() {
        this._setBlockSize();
        this._addGameStartSubscription();
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => {
            this._removeBricks();
            this._addGameStartSubscription();
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this._getBricks(true);
        });
        this._giveUpSubscristion = this._eventAggregator.subscribe('giveUp', _ => {
            this._removeBricks();
            this._addGameStartSubscription();
        });
    }

    _setBlockSize() {
        this.blockSize = this._stateService.getBlockSize();
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
    }

    _addGameStartSubscription() {
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._gameStartSubscription.dispose();
            this._getBricks();
            this._getPushers();
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._giveUpSubscristion.dispose();
        this._retrySubscription.dispose();
        this._isTouchDeviceSubscription.dispose();
    }

    _removeBricks() {
        this.bricks?.forEach(brick => {
            setTimeout(() => {
                brick.removed = true;
            }, Math.random() * 300)
        })
    }

    _getBricks(retry = false) {
        setTimeout(_ => {
            // wacht tot bricks bepaald zijn en pusher geplaatst is.
            this.bricks = this._stateService.getBricks(retry);
        });
    }

    _getPushers() {
        this.pushers = this._stateService.getPushers();
    }

}
