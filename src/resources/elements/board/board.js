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
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
        this._addGameStartSubscription();
        this._winSubscristion = this._eventAggregator.subscribe('win', _ => {
            this._removeBricks();
            this._addGameStartSubscription();
        });
        this._giveUpSubscristion = this._eventAggregator.subscribe('giveUp', _ => {
            this._removeBricks();
            this._addGameStartSubscription();
        });
    }

    _addGameStartSubscription() {
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._gameStartSubscription.dispose();
            this._getBricks();
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._giveUpSubscristion.dispose();
    }

    _removeBricks() {
        this.bricks.forEach(brick => {
            setTimeout(() => {
                brick.removed = true;
            }, Math.random() * 300)
        })
    }

    _getBricks() {
        setTimeout(() => {
            // wacht tot bricks bepaald zijn en pusher geplaatst is.
            this.bricks = this._stateService.getBricks();
            console.log(this.bricks.length);
        });
    }

}
