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
        setTimeout(() => {
            this._detectTouchDevice();
        }, 100);
    }

    _detectTouchDevice() {
        const isTouchDevice =
            (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
        const isSmallScreen = Math.min(window.innerHeight, window.innerWidth) < 800;
        if (isTouchDevice && isSmallScreen) {
            this._eventAggregator.publish('isTouchDevice');
            document.body.style.setProperty('--maxWidth', 100 + "vmin");
            document.body.classList.add('isMobile');
        }
    }

}
