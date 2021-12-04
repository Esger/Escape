import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { KeyInputService } from "services/key-input-service";

@inject(EventAggregator, KeyInputService)
export class App {

    constructor(eventAggregator, keyInputService) {
        this._keyInputService = keyInputService;
        this._eventAggregator = eventAggregator;
    }

    attached() {
        setTimeout(() => this.detectTouchDevice(), 100);
    }

    detectTouchDevice() {
        const isTouchDevice =
            (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
        const isSmallScreen = Math.min(window.innerHeight, window.innerWidth) < 800;
        isTouchDevice && isSmallScreen && console.log('isTouchDevice');
        isTouchDevice && isSmallScreen && this._eventAggregator.publish('isTouchDevice');
    }

}
