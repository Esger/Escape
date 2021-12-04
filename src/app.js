import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { KeyInputService } from "services/key-input-service";

@inject(EventAggregator, KeyInputService)
export class App {

    constructor(eventAggregator, keyInputService) {
        this._keyInputService = keyInputService;
        this._eventAggregator = eventAggregator;
    }

    isTouchDevice() {
        this._eventAggregator.publish('isTouchDevice');
    }

}
