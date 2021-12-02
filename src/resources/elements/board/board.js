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
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._getBricks();
        })
    }

    detached() {
        this._gameStartSubscription.dispose();
    }

    _getBricks() {
        setTimeout(() => {
            // wacht tot pusher geplaatst is.
            this.bricks = this._stateService.getBricks();
        });
    }

}
