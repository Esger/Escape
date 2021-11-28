import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, Element, StateService)
export class BoardCustomElement {

    constructor(eventAggregator, element, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._stateService.initialize();
        this.blockSize = this._stateService.getBlockSize();
    }

    attached() {
        setTimeout(() => {
            // wacht tot pusher geplaatst is.
            this.bricks = this._stateService.getBricks();
        });
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
    }

}
