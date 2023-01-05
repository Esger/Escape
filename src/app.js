import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { KeyInputService } from "services/key-input-service";
import $ from 'jquery';

@inject(EventAggregator, KeyInputService)
export class App {

    constructor(eventAggregator, keyInputService) {
        this._keyInputService = keyInputService;
        this._eventAggregator = eventAggregator;
        this._detectTouchDevice();
    }

    _detectTouchDevice() {
        const isTouchDevice =
            (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
        const isSmallScreen = Math.min(window.innerHeight, window.innerWidth) < 800;
        const isMobile = isTouchDevice && isSmallScreen;
        sessionStorage.setItem('isMobile', isMobile);
        if (isMobile) {
            document.body.style.setProperty('--maxWidth', 100 + "vmin");
            document.body.classList.add('isMobile');
        }
    }

}
